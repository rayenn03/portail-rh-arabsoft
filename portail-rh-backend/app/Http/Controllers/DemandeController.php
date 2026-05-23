<?php
namespace App\Http\Controllers;

use App\Events\NotificationCreated;
use App\Models\Demande;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use chillerlan\QRCode\Output\QRMarkupHTML;
use chillerlan\QRCode\Common\EccLevel;

class DemandeController extends Controller
{
    // Lister les demandes selon le rôle
    public function index()
    {
        $user = auth('api')->user();

        if ($user->role === 'admin') {
            // Admin voit tout SAUF les congé/autorisation encore en attente de validation chef.
            // Les congé/autorisation ne sont visibles à l'admin que si :
            //  - le chef les a validées (valide_chef)
            //  - déjà approuvées, refusées
            //  - OU l'employé n'a pas de chef assigné (chef_id null)
            $demandes = Demande::with(['employee', 'chef', 'admin'])
                ->where(function ($q) {
                    $q->whereNotIn('type', ['conge', 'autorisation'])
                      ->orWhere('statut', '!=', 'en_attente')
                      ->orWhereHas('employee', fn($sub) => $sub->whereNull('chef_id'));
                })
                ->latest()->paginate(10);

        } elseif ($user->role === 'chef') {
            // Chef voit UNIQUEMENT les congés et autorisations de son équipe
            $demandes = Demande::with(['employee'])
                ->whereHas('employee', function($q) use ($user) {
                    $q->where('chef_id', $user->id);
                })
                ->whereIn('type', ['conge', 'autorisation'])
                ->latest()->paginate(10);

        } else {
            // Employé voit uniquement ses demandes
            $demandes = Demande::with(['employee'])
                ->where('employee_id', $user->id)
                ->latest()->paginate(10);
        }

        return response()->json($demandes);
    }

    // Créer une demande
    public function store(Request $request)
    {
        $user = auth('api')->user();

        // ✅ Règle intelligente : le justificatif est obligatoire pour certains sous-types
        $justifObligatoire = false;
        if ($request->type === 'situation') {
            $justifObligatoire = true;
        }
        if ($request->type === 'conge' && in_array($request->motif, ['Congé maladie', 'Congé exceptionnel'])) {
            $justifObligatoire = true;
        }
        if ($request->type === 'pret' && $request->motif === 'Prêt personnel') {
            $justifObligatoire = true;
        }

        $request->validate([
            'type'         => 'required|in:conge,autorisation,pret,situation,document',
            'commentaire'  => 'nullable|string',
            'date_debut'   => 'required_if:type,conge,autorisation|nullable|date|after_or_equal:today',
            'date_fin'     => 'required_if:type,conge|nullable|date|after_or_equal:date_debut',
            'piece_jointe' => ($justifObligatoire ? 'required' : 'nullable') . '|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ], [
            'date_debut.after_or_equal' => 'La date de début ne peut pas être dans le passé.',
            'date_fin.after_or_equal'   => 'La date de fin doit être égale ou postérieure à la date de début.',
            'date_debut.required_if'    => 'La date de début est obligatoire pour ce type de demande.',
            'date_fin.required_if'      => 'La date de fin est obligatoire pour un congé.',
            'piece_jointe.required'     => 'Un justificatif est obligatoire pour ce type de demande.',
            'piece_jointe.mimes'        => 'Le justificatif doit être un PDF ou une image (JPG/PNG).',
            'piece_jointe.max'          => 'Le justificatif ne doit pas dépasser 5 Mo.',
            'piece_jointe.file'         => 'Le justificatif doit être un fichier valide.',
        ]);

        $demande = Demande::create([
            'employee_id'   => $user->id,
            'chef_id'       => $user->chef_id,
            'type'          => $request->type,
            'statut'        => 'en_attente',
            'date_debut'    => $request->date_debut,
            'date_fin'      => $request->date_fin,
            'montant'       => $request->montant,
            'duree'         => $request->duree,        // ✅ ajouté
            'motif'         => $request->motif,        // ✅ ajouté
            'type_document' => $request->type_document,
            'commentaire'   => $request->commentaire,
        ]);

        // ✅ Upload du justificatif après création (pour avoir l'ID dans le nom)
        if ($request->hasFile('piece_jointe')) {
            $file = $request->file('piece_jointe');
            $ext  = $file->getClientOriginalExtension();
            $path = $file->storeAs('demandes', "{$demande->id}_" . time() . ".{$ext}", 'public');
            $demande->update(['piece_jointe' => $path]);
        }

        // Congé et autorisation → notifier le chef en premier (sinon admin)
        // Prêt, situation, document → notifier directement l'admin
        $typesChef = ['conge', 'autorisation'];
        if (in_array($request->type, $typesChef) && $user->chef_id) {
            $destinataire_id = $user->chef_id;
        } else {
            $admin = \App\Models\User::where('role', 'admin')->first();
            $destinataire_id = $admin?->id;
        }

        if ($destinataire_id) {
            $notif = Notification::create([
                'user_id'    => $destinataire_id,
                'demande_id' => $demande->id,
                'message'    => "{$user->prenom} {$user->nom} a soumis une demande de {$request->type}.",
                'lu'         => false,
            ]);
            broadcast(new NotificationCreated($notif))->toOthers();
        }

        return response()->json([
            'message' => 'Demande créée avec succès',
            'demande' => $demande
        ], 201);
    }

    // Voir une demande
    public function show($id)
    {
        $user    = auth('api')->user();
        $demande = Demande::with(['employee', 'chef', 'admin'])->findOrFail($id);

        // Vérifier les droits
        if ($user->role === 'employee' && $demande->employee_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        return response()->json($demande);
    }

    // Mettre à jour le statut (chef ou admin)
public function update(Request $request, $id)
{
    $user    = auth('api')->user();
    $demande = Demande::findOrFail($id);

    // ✅ Employé peut modifier sa demande si encore en attente
    if ($user->role === 'employe') {
        if ($demande->employee_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }
        if ($demande->statut !== 'en_attente') {
            return response()->json(['message' => 'Impossible de modifier une demande déjà traitée'], 422);
        }

        // ✅ Validation des dates aussi lors de la modification
        $request->validate([
            'date_debut' => 'required_if:type,conge,autorisation|nullable|date|after_or_equal:today',
            'date_fin'   => 'required_if:type,conge|nullable|date|after_or_equal:date_debut',
        ], [
            'date_debut.after_or_equal' => 'La date de début ne peut pas être dans le passé.',
            'date_fin.after_or_equal'   => 'La date de fin doit être égale ou postérieure à la date de début.',
        ]);

        $demande->update($request->only([
            'date_debut', 'date_fin', 'montant',
            'duree', 'motif', 'commentaire'
        ]));
        return response()->json(['message' => 'Demande mise à jour', 'demande' => $demande]);
    }

    // Chef ou Admin valident
    $request->validate([
        'statut' => 'required|in:valide_chef,approuvee,refusee,approuvee_direct'
    ]);

    if ($user->role === 'chef') {
        // Chef peut valider UNIQUEMENT congé et autorisation en statut en_attente
        if (!in_array($demande->type, ['conge', 'autorisation'])) {
            return response()->json(['message' => 'Le chef ne peut traiter que les congés et autorisations'], 403);
        }
        if ($demande->statut !== 'en_attente') {
            return response()->json(['message' => 'Cette demande a déjà été traitée'], 422);
        }
        $demande->update([
            'statut'           => $request->statut,
            'chef_id'          => $user->id,
            'commentaire_chef' => $request->commentaire_chef,
        ]);
        // Notifier l'admin pour validation finale
        if ($request->statut === 'valide_chef') {
            $admin = \App\Models\User::where('role', 'admin')->first();
            if ($admin) {
                $notif = Notification::create([
                    'user_id'    => $admin->id,
                    'demande_id' => $demande->id,
                    'message'    => "Le chef {$user->prenom} {$user->nom} a validé une demande de {$demande->type}. En attente de votre approbation.",
                    'lu'         => false,
                ]);
                broadcast(new NotificationCreated($notif))->toOthers();
            }
        }
    }

    if ($user->role === 'admin') {
        $demande->update([
            'statut'            => $request->statut,
            'admin_id'          => $user->id,
            'commentaire_admin' => $request->commentaire_admin,
        ]);
    }

    $notifEmp = Notification::create([
        'user_id'    => $demande->employee_id,
        'demande_id' => $demande->id,
        'message'    => "Votre demande de {$demande->type} a été mise à jour.",
        'lu'         => false,
    ]);
    broadcast(new NotificationCreated($notifEmp))->toOthers();

    return response()->json(['message' => 'Demande mise à jour', 'demande' => $demande->fresh()]);
}

    // Supprimer une demande
    public function destroy($id)
    {
        $user    = auth('api')->user();
        $demande = Demande::findOrFail($id);

        if ($demande->employee_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        if ($demande->statut !== 'en_attente' && $user->role !== 'admin') {
            return response()->json(['message' => 'Impossible de supprimer une demande traitée'], 422);
        }

        // ✅ Supprimer le fichier justificatif associé
        if ($demande->piece_jointe) {
            Storage::disk('public')->delete($demande->piece_jointe);
        }

        $demande->delete();
        return response()->json(['message' => 'Demande supprimée']);
    }

    /**
     * Télécharger le justificatif d'une demande.
     * Accès : auteur (employee_id) + chef hiérarchique de l'auteur + admin.
     */
    public function telechargerJustificatif($id)
    {
        $user    = auth('api')->user();
        $demande = Demande::with('employee')->findOrFail($id);

        if (!$demande->piece_jointe) {
            return response()->json(['message' => 'Aucun justificatif disponible.'], 404);
        }

        // Vérification des droits d'accès
        $estAuteur = $demande->employee_id === $user->id;
        $estChef   = $demande->employee && $demande->employee->chef_id === $user->id;
        $estAdmin  = $user->role === 'admin';

        if (!$estAuteur && !$estChef && !$estAdmin) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $path = storage_path('app/public/' . $demande->piece_jointe);
        if (!file_exists($path)) {
            return response()->json(['message' => 'Fichier introuvable sur le serveur.'], 404);
        }

        return response()->file($path);
    }

    /**
     * Génération à la volée d'un PDF officiel pour une demande de type "document"
     * approuvée. Le PDF inclut un QR code de vérification HMAC-SHA256 permettant
     * à un tiers (banque, employeur) de vérifier l'authenticité sur la page
     * publique /verify. Validité du document : 1 mois.
     */
    public function telecharger($id)
    {
        $user    = auth('api')->user();
        $demande = Demande::with(['employee', 'chef', 'admin'])->findOrFail($id);

        // Triple contrôle de sécurité
        if ($user->role === 'employe' && $demande->employee_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }
        if ($demande->type !== 'document') {
            return response()->json(['message' => 'PDF uniquement pour documents administratifs.'], 422);
        }
        if (!in_array($demande->statut, ['approuvee', 'approuvee_direct'])) {
            return response()->json(['message' => 'PDF uniquement pour demandes approuvées.'], 422);
        }

        // Référence + signature HMAC-SHA256 (16 premiers caractères)
        $ref     = 'REF-' . $demande->id . '-' . now()->year;
        $payload = "{$demande->id}|{$demande->employee_id}|{$demande->motif}|{$demande->statut}";
        $hash    = substr(hash_hmac('sha256', $payload, config('app.key')), 0, 16);

        // URL publique scannée via le QR code
        $verifyUrl = "http://localhost:5173/verify?ref={$ref}&hash={$hash}";

        // QR code rendu comme grille HTML (div/span) — 100% compatible DomPDF, sans SVG ni GD
        $qrOptions = new QROptions([
            'outputInterface' => QRMarkupHTML::class,
            'outputBase64'    => false,
            'eccLevel'        => EccLevel::M,
            'cssClass'        => 'qr-grid',
            'markupDark'      => '#000000',
            'markupLight'     => '#ffffff',
        ]);
        $qrCode = (new QRCode($qrOptions))->render($verifyUrl);

        // Validité : 1 mois à compter de la date d'émission
        $emisLe   = now();
        $expireLe = now()->addMonth();

        $pdf = Pdf::loadView('pdf.document', [
            'demande'   => $demande,
            'ref'       => $ref,
            'qrCode'    => $qrCode,
            'verifyUrl' => $verifyUrl,
            'emisLe'    => $emisLe,
            'expireLe'  => $expireLe,
        ])->setPaper('a4', 'portrait')
          ->setOption('isRemoteEnabled', false)
          ->setOption('defaultFont', 'DejaVu Sans');

        $slug     = Str::slug($demande->motif ?: 'document');
        $filename = "ArabSoft-{$slug}-{$ref}.pdf";

        return $pdf->download($filename);
    }
}
