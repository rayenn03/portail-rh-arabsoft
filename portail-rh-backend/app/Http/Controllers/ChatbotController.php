<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use App\Models\Demande;
use App\Models\CongesSolde;

class ChatbotController extends Controller
{
    /**
     * Chatbot RHConnect — version résiliente
     *
     * 4 couches de résilience face aux limites Gemini :
     *   1. Prompt conditionnel (réduit les tokens consommés)
     *   2. Cache FAQ (zéro appel Gemini sur les questions génériques répétées)
     *   3. Retry exponentiel sur 429/503
     *   4. Fallback dictionnaire local quand Gemini est inaccessible
     *
     * + Mémoire conversationnelle (historique multi-tours)
     */
    public function chat(Request $request)
    {
        $request->validate([
            'message'           => 'required|string|max:1000',
            'history'           => 'sometimes|array|max:12',
            'history.*.role'    => 'required_with:history|in:user,model',
            'history.*.text'    => 'required_with:history|string',
        ]);

        $user    = auth('api')->user();
        $message = trim($request->message);
        $history = $request->input('history', []);

        // ───────────────────────────────────────────────────────────────
        // COUCHE 2 — Cache FAQ : questions génériques sans données perso
        // ───────────────────────────────────────────────────────────────
        $isPersonal = (bool) preg_match('/\b(mon|ma|mes|je|j[\' ]ai|moi)\b/iu', $message);
        $hasHistory = !empty($history);

        // FAQ cachable uniquement si pas de contexte personnel ET pas d'historique
        if (!$isPersonal && !$hasHistory) {
            $cacheKey = 'chatbot_faq_' . md5(strtolower($message));
            $cached   = Cache::get($cacheKey);
            if ($cached) {
                return response()->json(['reply' => $cached, 'cached' => true]);
            }
        }

        // ───────────────────────────────────────────────────────────────
        // COUCHE 1 — Contexte conditionnel : on n'envoie à Gemini que les
        // données pertinentes selon les mots-clés détectés dans le message
        // ───────────────────────────────────────────────────────────────
        $msgLower = mb_strtolower($message);
        $ctx      = $this->buildMinimalContext($user, $msgLower, $history);

        $systemPrompt = $this->buildSystemPrompt($user, $ctx);

        // ───────────────────────────────────────────────────────────────
        // Appel Gemini avec COUCHE 3 (retry) + COUCHE 4 (fallback)
        // ───────────────────────────────────────────────────────────────
        $reply = $this->callGeminiWithRetry($systemPrompt, $message, $history);

        // Mise en cache si FAQ
        if (!$isPersonal && !$hasHistory && $reply && !str_contains($reply, '_⚠️ Réponse hors-ligne')) {
            Cache::put($cacheKey ?? 'noop', $reply, 86400); // 24h
        }

        return response()->json(['reply' => $reply]);
    }

    // ═══════════════════════════════════════════════════════════════════
    // COUCHE 1 — Contexte minimal conditionnel
    // ═══════════════════════════════════════════════════════════════════
    private function buildMinimalContext($user, string $msgLower, array $history): array
    {
        $ctx = ['user' => $user];

        // Si l'historique contient des mots-clés, on enrichit aussi
        $combined = $msgLower;
        foreach ($history as $turn) {
            $combined .= ' ' . mb_strtolower($turn['text'] ?? '');
        }

        // Solde de congés
        if (preg_match('/cong[éeè]|solde|jour|maladie|exception/u', $combined)) {
            $ctx['soldes'] = CongesSolde::where('employee_id', $user->id)
                ->where('annee', date('Y'))
                ->first();
        }

        // Demandes
        if (preg_match('/demande|statut|approuv|refus|attente|pr[êe]t|autorisation|document|attest/u', $combined)) {
            $ctx['demandes'] = Demande::where('employee_id', $user->id)
                ->latest()
                ->take(5) // 5 au lieu de 10 → -50% tokens sur cette section
                ->get();
        }

        return $ctx;
    }

    // ═══════════════════════════════════════════════════════════════════
    // Construction du system prompt — version compacte
    // ═══════════════════════════════════════════════════════════════════
    private function buildSystemPrompt($user, array $ctx): string
    {
        $roleLabel = [
            'employe' => 'Employé',
            'chef'    => 'Chef Hiérarchique',
            'admin'   => 'Administrateur RH',
        ];

        $prompt = "Tu es RHConnect, assistant RH du Portail ArabSoft. Réponds en français, sois concis et professionnel.\n\n";
        $prompt .= "Utilisateur : {$user->prenom} {$user->nom} | Rôle : " . ($roleLabel[$user->role] ?? $user->role);
        if ($user->departement) $prompt .= " | Dépt : {$user->departement}";
        $prompt .= "\n\n";

        // Soldes (si pertinent)
        if (!empty($ctx['soldes'])) {
            $s = $ctx['soldes'];
            $prompt .= "Soldes congés " . date('Y') . " : ";
            $prompt .= "Annuel " . ($s->annuel_total - $s->annuel_pris) . "/{$s->annuel_total}j restants | ";
            $prompt .= "Maladie " . ($s->maladie_total - $s->maladie_pris) . "/{$s->maladie_total}j | ";
            $prompt .= "Exceptionnel " . ($s->exceptionnel_total - $s->exceptionnel_pris) . "/{$s->exceptionnel_total}j\n\n";
        }

        // Demandes (si pertinent)
        if (!empty($ctx['demandes']) && count($ctx['demandes']) > 0) {
            $statuts = [
                'en_attente'       => 'En attente',
                'valide_chef'      => 'Validée chef',
                'approuvee'        => 'Approuvée',
                'approuvee_direct' => 'Approuvée',
                'refusee'          => 'Refusée',
            ];
            $types = [
                'conge'        => 'Congé',
                'autorisation' => 'Autorisation',
                'pret'         => 'Prêt',
                'situation'    => 'Situation',
                'document'     => 'Document',
            ];
            $prompt .= "Dernières demandes :\n";
            foreach ($ctx['demandes'] as $d) {
                $l = "- " . ($types[$d->type] ?? $d->type) . " | " . ($statuts[$d->statut] ?? $d->statut);
                $l .= " | " . $d->created_at->format('d/m/Y');
                if ($d->date_debut) $l .= " | " . $d->date_debut;
                if ($d->date_fin)   $l .= "→" . $d->date_fin;
                if ($d->motif)      $l .= " | " . mb_substr($d->motif, 0, 60);
                $prompt .= $l . "\n";
            }
            $prompt .= "\n";
        }

        $prompt .= "Règles : Réponds uniquement avec les données ci-dessus, sans inventer. Workflow demandes : chef valide d'abord, puis admin approuve. Types : congé, autorisation, prêt, situation, document.";

        return $prompt;
    }

    // ═══════════════════════════════════════════════════════════════════
    // COUCHE 3 — Appel Gemini avec retry exponentiel
    // ═══════════════════════════════════════════════════════════════════
    private function callGeminiWithRetry(string $systemPrompt, string $message, array $history): string
    {
        $apiKey = config('services.gemini.key');
        $apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}";

        // Construction du payload Gemini avec historique (format contents[])
        // System prompt en premier message "user" (Gemini ne supporte pas de role "system" dédié sur ce endpoint)
        $contents = [
            ['role' => 'user',  'parts' => [['text' => $systemPrompt]]],
            ['role' => 'model', 'parts' => [['text' => 'Compris. Je suis prêt à répondre.']]],
        ];

        // Historique conversationnel
        foreach ($history as $turn) {
            $contents[] = [
                'role'  => $turn['role'], // 'user' ou 'model'
                'parts' => [['text' => $turn['text']]],
            ];
        }

        // Question courante
        $contents[] = ['role' => 'user', 'parts' => [['text' => $message]]];

        $payload = [
            'contents'         => $contents,
            'generationConfig' => [
                'temperature'     => 0.7,
                'maxOutputTokens' => 1024, // réduit de 2048 → moins de tokens consommés
                'thinkingConfig'  => ['thinkingBudget' => 0],
            ],
        ];

        $delays = [1, 3, 8]; // secondes entre les retries

        for ($attempt = 0; $attempt < 3; $attempt++) {
            try {
                $response = Http::timeout(20)->withoutVerifying()->post($apiUrl, $payload);

                if ($response->successful()) {
                    $data         = $response->json();
                    $finishReason = $data['candidates'][0]['finishReason'] ?? null;
                    $reply        = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;

                    if ($reply) {
                        return $reply;
                    }

                    // Pas de texte mais succès → message d'erreur clair
                    Log::warning('Chatbot Gemini reply vide', ['finishReason' => $finishReason]);
                    return match ($finishReason) {
                        'MAX_TOKENS' => 'Ma réponse a été coupée (limite atteinte). Posez une question plus ciblée.',
                        'SAFETY'     => 'Cette question a été bloquée par le filtre de sécurité.',
                        'RECITATION' => 'Réponse bloquée (récitation).',
                        default      => "Je n'ai pas pu générer de réponse. Réessayez avec une question différente.",
                    };
                }

                // Échec HTTP : 429 ou 503 → retry, autre → fallback direct
                $status = $response->status();
                Log::warning("Chatbot Gemini HTTP {$status}", [
                    'attempt' => $attempt + 1,
                    'body'    => $response->json(),
                ]);

                if (in_array($status, [429, 503]) && $attempt < 2) {
                    sleep($delays[$attempt]);
                    continue;
                }

                // 4xx (hors 429) ou retries épuisés → fallback
                return $this->fallbackResponse($message);

            } catch (\Throwable $e) {
                Log::error('Chatbot Gemini exception', [
                    'attempt' => $attempt + 1,
                    'msg'     => $e->getMessage(),
                ]);

                if ($attempt < 2) {
                    sleep($delays[$attempt]);
                    continue;
                }

                return $this->fallbackResponse($message);
            }
        }

        return $this->fallbackResponse($message);
    }

    // ═══════════════════════════════════════════════════════════════════
    // COUCHE 4 — Fallback local quand Gemini est inaccessible
    // ═══════════════════════════════════════════════════════════════════
    private function fallbackResponse(string $message): string
    {
        $msg = mb_strtolower($message);

        $fallbacks = [
            '/cong[éeè]|jour de cong|solde.*cong/u' =>
                "📅 **Pour consulter votre solde de congé** : allez dans **Mon Profil** > section *Soldes de congés*.\n\n"
                . "**Pour poser une demande de congé** : **Mes Demandes** > *Nouvelle demande* > sélectionnez *Congé* > renseignez les dates et le motif.\n\n"
                . "Votre chef hiérarchique validera en premier, puis l'admin RH approuvera.",

            '/pr[êe]t|avance.*salaire/u' =>
                "💰 **Pour demander un prêt** : **Mes Demandes** > *Nouvelle demande* > *Prêt / Avance sur salaire*.\n\n"
                . "Renseignez le montant souhaité et la durée de remboursement. La demande passera par votre chef puis l'admin RH.",

            '/attestation|document.*admin|certificat/u' =>
                "📄 **Pour obtenir un document administratif** (attestation de travail, de salaire, etc.) :\n"
                . "**Mes Demandes** > *Nouvelle demande* > *Document* > sélectionnez le type voulu.",

            '/autorisation|sortie/u' =>
                "⏰ **Pour une autorisation de sortie** : **Mes Demandes** > *Nouvelle demande* > *Autorisation*.\n\n"
                . "Précisez la date, l'heure de début et l'heure de fin de votre sortie.",

            '/changement.*situation|situation.*familiale|mariage|naissance/u' =>
                "👨‍👩‍👧 **Pour signaler un changement de situation** (mariage, naissance, divorce…) :\n"
                . "**Mes Demandes** > *Nouvelle demande* > *Changement de situation*. Joignez un justificatif si possible.",

            '/statut|approuv|refus|en attente|valid/u' =>
                "📋 **Pour suivre vos demandes** : rendez-vous dans **Mes Demandes**. Chaque demande affiche son statut en couleur :\n"
                . "- 🟠 En attente (chez le chef ou l'admin)\n"
                . "- 🔵 Validée par le chef (en attente admin)\n"
                . "- 🟢 Approuvée\n"
                . "- 🔴 Refusée (un commentaire explique pourquoi)",

            '/profil|mot de passe|email|t[ée]l[ée]phone/u' =>
                "👤 **Pour modifier votre profil** : **Mon Profil** dans le menu de gauche. Vous pouvez y mettre à jour votre photo, téléphone et autres informations.",

            '/bonjour|salut|hello|coucou|bonsoir|salam/u' =>
                "Bonjour ! 👋 Je suis temporairement en mode hors-ligne, mais je peux vous orienter sur les fonctionnalités du portail RH. Posez-moi votre question !",

            '/merci|thanks/u' =>
                "Avec plaisir ! 😊 N'hésitez pas si vous avez d'autres questions.",

            '/aide|help|comment.*marche/u' =>
                "🤖 **Je peux vous aider sur** :\n"
                . "- Vos demandes (congé, prêt, autorisation, document, situation)\n"
                . "- Votre solde de congés\n"
                . "- Le suivi de vos demandes\n"
                . "- La modification de votre profil\n\n"
                . "Posez-moi simplement votre question en français !",
        ];

        foreach ($fallbacks as $pattern => $reply) {
            if (preg_match($pattern, $msg)) {
                return $reply . "\n\n_⚠️ Réponse hors-ligne (assistant IA temporairement indisponible — service de secours actif)_";
            }
        }

        return "Je suis temporairement indisponible en raison d'une forte charge sur le service IA. 🙏\n\n"
            . "Vous pouvez :\n"
            . "- **Réessayer dans quelques minutes**\n"
            . "- Consulter directement les sections **Mes Demandes**, **Mon Profil** ou le **Dashboard**\n"
            . "- Contacter le service RH d'ArabSoft pour une aide immédiate\n\n"
            . "_⚠️ Mode hors-ligne actif_";
    }
}
