<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

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

    // Dashboard stats (admin)
    public function dashboard()
    {
        $user = auth('api')->user();

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        return response()->json([
            'total_employes'       => User::where('role', 'employe')->count(),
            'demandes_en_attente'  => \App\Models\Demande::where('statut', 'en_attente')->count(),
            'demandes_approuvees'  => \App\Models\Demande::where('statut', 'approuvee')->count(),
            'demandes_refusees'    => \App\Models\Demande::where('statut', 'refusee')->count(),
            'total_demandes'       => \App\Models\Demande::count(),
        ]);
    }
}
