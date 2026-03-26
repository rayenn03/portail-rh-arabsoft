<?php
namespace App\Http\Controllers;

use App\Models\Demande;
use App\Models\Notification;
use Illuminate\Http\Request;

class DemandeController extends Controller
{
    // Lister les demandes selon le rôle
    public function index()
    {
        $user = auth('api')->user();

        if ($user->role === 'admin') {
            // Admin voit tout
            $demandes = Demande::with(['employee', 'chef', 'admin'])->latest()->get();

        } elseif ($user->role === 'chef') {
            // Chef voit les demandes de son équipe
            $demandes = Demande::with(['employee'])
                ->whereHas('employee', function($q) use ($user) {
                    $q->where('chef_id', $user->id);
                })->latest()->get();

        } else {
            // Employé voit uniquement ses demandes
            $demandes = Demande::with(['employee'])
                ->where('employee_id', $user->id)
                ->latest()->get();
        }

        return response()->json($demandes);
    }

    // Créer une demande
    public function store(Request $request)
    {
        $user = auth('api')->user();

        $request->validate([
            'type'       => 'required|in:conge,autorisation,pret,situation,document',
            'commentaire'=> 'nullable|string',
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

        // Notifier le chef si existe, sinon l'admin
        $destinataire_id = $user->chef_id;
        if (!$destinataire_id) {
            $admin = \App\Models\User::where('role', 'admin')->first();
            $destinataire_id = $admin?->id;
        }

        if ($destinataire_id) {
            Notification::create([
                'user_id'    => $destinataire_id,
                'demande_id' => $demande->id,
                'message'    => "{$user->prenom} {$user->nom} a soumis une demande de {$request->type}.",
                'lu'         => false,
            ]);
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
        $demande->update([
            'statut'           => $request->statut,
            'chef_id'          => $user->id,
            'commentaire_chef' => $request->commentaire_chef,
        ]);
    }

    if ($user->role === 'admin') {
        $demande->update([
            'statut'            => $request->statut,
            'admin_id'          => $user->id,
            'commentaire_admin' => $request->commentaire_admin,
        ]);
    }

    Notification::create([
        'user_id'    => $demande->employee_id,
        'demande_id' => $demande->id,
        'message'    => "Votre demande de {$demande->type} a été mise à jour.",
        'lu'         => false,
    ]);

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

        $demande->delete();
        return response()->json(['message' => 'Demande supprimée']);
    }
}
