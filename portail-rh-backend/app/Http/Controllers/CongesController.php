<?php
namespace App\Http\Controllers;

use App\Models\CongesSolde;
use App\Models\User;
use Illuminate\Http\Request;

class CongesController extends Controller
{
    // GET /users/{id}/conges → Voir le solde d'un employé (année courante)
    public function show($id)
    {
        $auth = auth('api')->user();

        // L'employé voit SON solde, l'admin voit tout
        if ($auth->role !== 'admin' && $auth->id != $id) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $user = User::findOrFail($id);
        $annee = (int) date('Y');

        // Créer le solde par défaut si inexistant
        $solde = CongesSolde::firstOrCreate(
            ['employee_id' => $user->id, 'annee' => $annee],
            [
                'annuel_total'       => 30,
                'annuel_pris'        => 0,
                'maladie_total'      => 10,
                'maladie_pris'       => 0,
                'exceptionnel_total' => 5,
                'exceptionnel_pris'  => 0,
            ]
        );

        return response()->json([
            'user'  => $user->only(['id', 'nom', 'prenom', 'email', 'departement']),
            'solde' => $solde,
        ]);
    }

    // PUT /users/{id}/conges → Modifier le solde (admin uniquement)
    public function update(Request $request, $id)
    {
        $auth = auth('api')->user();

        if ($auth->role !== 'admin') {
            return response()->json(['message' => 'Accès refusé — admin uniquement'], 403);
        }

        $request->validate([
            'annuel_total'       => 'sometimes|integer|min:0|max:365',
            'annuel_pris'        => 'sometimes|integer|min:0|max:365',
            'maladie_total'      => 'sometimes|integer|min:0|max:365',
            'maladie_pris'       => 'sometimes|integer|min:0|max:365',
            'exceptionnel_total' => 'sometimes|integer|min:0|max:365',
            'exceptionnel_pris'  => 'sometimes|integer|min:0|max:365',
            'annee'              => 'sometimes|integer|min:2020|max:2050',
        ]);

        $annee = $request->annee ?? (int) date('Y');

        $solde = CongesSolde::firstOrCreate(
            ['employee_id' => $id, 'annee' => $annee],
            [
                'annuel_total'       => 30,
                'annuel_pris'        => 0,
                'maladie_total'      => 10,
                'maladie_pris'       => 0,
                'exceptionnel_total' => 5,
                'exceptionnel_pris'  => 0,
            ]
        );

        $solde->update($request->only([
            'annuel_total', 'annuel_pris',
            'maladie_total', 'maladie_pris',
            'exceptionnel_total', 'exceptionnel_pris',
        ]));

        return response()->json([
            'message' => 'Solde mis à jour',
            'solde'   => $solde->fresh(),
        ]);
    }
}
