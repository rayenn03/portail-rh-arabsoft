<?php
namespace App\Http\Controllers;

use App\Models\Demande;
use Illuminate\Http\Request;

class DocumentVerificationController extends Controller
{
    /**
     * Endpoint PUBLIC de vérification d'authenticité d'un document PDF
     * émis par le Portail RH ArabSoft.
     *
     * URL : GET /api/verify?ref=REF-{id}-{année}&hash={hmac16}
     *
     * Retourne toujours 200 avec un champ `valid: boolean` et une `reason`
     * pour simplifier l'affichage côté frontend public.
     */
    public function verify(Request $request)
    {
        $ref  = $request->query('ref');
        $hash = $request->query('hash');

        // Parse référence : REF-{id}-{année}
        if (!$ref || !preg_match('/^REF-(\d+)-(\d{4})$/', $ref, $m)) {
            return response()->json(['valid' => false, 'reason' => 'format_invalide'], 200);
        }
        $demandeId = (int) $m[1];

        $demande = Demande::with('employee', 'admin')->find($demandeId);
        if (!$demande) {
            return response()->json(['valid' => false, 'reason' => 'non_trouve'], 200);
        }

        // Recalcul du hash HMAC-SHA256 (16 premiers caractères)
        $payload      = "{$demande->id}|{$demande->employee_id}|{$demande->motif}|{$demande->statut}";
        $expectedHash = substr(hash_hmac('sha256', $payload, config('app.key')), 0, 16);

        if (!$hash || !hash_equals($expectedHash, $hash)
            || $demande->type !== 'document'
            || !in_array($demande->statut, ['approuvee', 'approuvee_direct'])) {
            return response()->json(['valid' => false, 'reason' => 'hash_invalide'], 200);
        }

        // Validité : 1 mois à compter de la date d'approbation (updated_at)
        $emisLe   = $demande->updated_at->copy();
        $expireLe = $demande->updated_at->copy()->addMonth();
        $expire   = now()->greaterThan($expireLe);

        return response()->json([
            'valid'         => !$expire,
            'reason'        => $expire ? 'expire' : 'ok',
            'reference'     => $ref,
            'type_document' => $demande->motif,
            'employee'      => [
                'prenom'      => $demande->employee->prenom ?? null,
                'nom'         => $demande->employee->nom ?? null,
                'poste'       => $demande->employee->poste ?? null,
                'departement' => $demande->employee->departement ?? null,
            ],
            'emis_le'      => $emisLe->toISOString(),
            'expire_le'    => $expireLe->toISOString(),
            'approuve_par' => 'Direction RH ArabSoft',
        ], 200);
    }
}
