<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    // Lister les employés (admin seulement)
    public function index()
    {
        $user = auth('api')->user();

        if ($user->role === 'admin') {
            $users = User::with('chef')->get();
        } elseif ($user->role === 'chef') {
            $users = User::where('chef_id', $user->id)->get();
        } else {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        return response()->json($users);
    }

    // Voir un utilisateur
    public function show($id)
    {
        $user = auth('api')->user();

        if ($user->role === 'employee' && $user->id != $id) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        return response()->json(User::with(['chef', 'congesSolde'])->findOrFail($id));
    }

    // Modifier un utilisateur
    public function update(Request $request, $id)
    {
        $user   = auth('api')->user();
        $target = User::findOrFail($id);

        if ($user->role !== 'admin' && $user->id != $id) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $data = $request->only([
            'nom', 'prenom', 'email', 'departement', 'poste', 'telephone', 'chef_id'
        ]);

        if ($request->filled('password')) {
            // Vérifier l'ancien mot de passe (sauf si c'est l'admin qui modifie un autre compte)
            if ($user->id == $id) {
                if (!$request->filled('current_password')) {
                    return response()->json(['message' => 'Le mot de passe actuel est requis'], 422);
                }
                if (!\Hash::check($request->current_password, $target->password)) {
                    return response()->json(['message' => 'Mot de passe actuel incorrect'], 422);
                }
            }
            $data['password'] = $request->password;
        }

        $target->update($data);

        return response()->json([
            'message' => 'Utilisateur mis à jour',
            'user'    => $target
        ]);
    }

    // Stats dashboard employé
    public function meStats()
    {
        $user = auth('api')->user();

        $demandes = \App\Models\Demande::where('employee_id', $user->id);

        $conge = \App\Models\CongesSolde::where('employee_id', $user->id)
            ->where('annee', now()->year)
            ->first();

        $recentes = \App\Models\Demande::where('employee_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(4)
            ->get(['id', 'type', 'statut', 'date_debut', 'date_fin', 'created_at']);

        return response()->json([
            'en_attente'  => (clone $demandes)->whereIn('statut', ['en_attente', 'valide_chef'])->count(),
            'approuvees'  => (clone $demandes)->whereIn('statut', ['approuvee', 'approuvee_direct'])->count(),
            'refusees'    => (clone $demandes)->where('statut', 'refusee')->count(),
            'total'       => (clone $demandes)->count(),
            'conges'      => $conge,
            'recentes'    => $recentes,
        ]);
    }

    // Supprimer (admin seulement)
    public function destroy($id)
    {
        $user = auth('api')->user();

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        User::findOrFail($id)->delete();
        return response()->json(['message' => 'Utilisateur supprimé']);
    }

    // Upload photo de profil (self-service ou admin)
    public function uploadPhoto(Request $request, $id)
    {
        $user   = auth('api')->user();
        $target = User::findOrFail($id);

        if ($user->role !== 'admin' && $user->id != $id) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        if ($target->photo && Storage::disk('public')->exists($target->photo)) {
            Storage::disk('public')->delete($target->photo);
        }

        $ext  = $request->file('photo')->getClientOriginalExtension();
        $path = $request->file('photo')->storeAs(
            'avatars',
            "{$target->id}_" . time() . ".{$ext}",
            'public'
        );

        $target->update(['photo' => $path]);
        $fresh = $target->fresh();

        return response()->json([
            'message'   => 'Photo mise à jour',
            'user'      => $fresh,
            'photo_url' => $fresh->photo_url,
        ]);
    }

    // Supprimer photo de profil
    public function deletePhoto($id)
    {
        $user   = auth('api')->user();
        $target = User::findOrFail($id);

        if ($user->role !== 'admin' && $user->id != $id) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        if ($target->photo && Storage::disk('public')->exists($target->photo)) {
            Storage::disk('public')->delete($target->photo);
        }

        $target->update(['photo' => null]);

        return response()->json([
            'message' => 'Photo supprimée',
            'user'    => $target->fresh(),
        ]);
    }

    // Dashboard stats (admin)
    public function dashboard()
    {
        $user = auth('api')->user();

        if (!in_array($user->role, ['admin', 'chef'])) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        // Pour le chef : limiter aux demandes de son équipe
        $demandeQuery = $user->role === 'chef'
            ? \App\Models\Demande::whereHas('employee', fn($q) => $q->where('chef_id', $user->id))
            : \App\Models\Demande::query();

        // ── Répartition par type ────────────────────────────────────────────
        $parType = (clone $demandeQuery)->selectRaw('type, COUNT(*) as total')
            ->groupBy('type')
            ->get()
            ->map(fn($r) => ['type' => $r->type, 'total' => (int) $r->total]);

        // ── Demandes par mois (6 derniers mois) ─────────────────────────────
        $parMois = (clone $demandeQuery)->selectRaw('
                EXTRACT(YEAR  FROM created_at)::integer AS annee,
                EXTRACT(MONTH FROM created_at)::integer AS mois,
                COUNT(*) AS total
            ')
            ->where('created_at', '>=', now()->subMonths(5)->startOfMonth())
            ->groupByRaw('EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)')
            ->orderByRaw('EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)')
            ->get()
            ->map(fn($r) => [
                'annee' => $r->annee,
                'mois'  => $r->mois,
                'total' => (int) $r->total,
            ]);

        return response()->json([
            'total_employes'       => $user->role === 'chef'
                                        ? User::where('chef_id', $user->id)->count()
                                        : User::where('role', 'employe')->count(),
            'demandes_en_attente'  => (clone $demandeQuery)->where('statut', 'en_attente')->count(),
            'demandes_approuvees'  => (clone $demandeQuery)->whereIn('statut', ['approuvee','approuvee_direct'])->count(),
            'demandes_refusees'    => (clone $demandeQuery)->where('statut', 'refusee')->count(),
            'total_demandes'       => (clone $demandeQuery)->count(),
            'par_type'             => $parType,
            'par_mois'             => $parMois,
        ]);
    }
}
