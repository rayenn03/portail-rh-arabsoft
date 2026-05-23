<?php

namespace App\Http\Controllers;

use App\Events\NotificationCreated;
use App\Mail\ResetPasswordMail;
use App\Models\Notification;
use App\Models\PasswordReset;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    // POST /forgot-password (public)
    public function request(Request $r)
    {
        $r->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        // Anti-spam : une seule demande en attente par email
        $exists = PasswordReset::where('email', $r->email)
            ->where('statut', 'en_attente')
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Une demande est déjà en cours de traitement.',
            ], 409);
        }

        $user = User::where('email', $r->email)->first();

        PasswordReset::create([
            'user_id'    => $user->id,
            'email'      => $user->email,
            'statut'     => 'en_attente',
            'created_at' => now(),
        ]);

        // Notifier tous les admins
        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            $notif = Notification::create([
                'user_id'    => $admin->id,
                'demande_id' => null,
                'message'    => "🔑 Demande de réinitialisation : {$user->prenom} {$user->nom} ({$user->email})",
                'lu'         => false,
                'created_at' => now(),
            ]);
            broadcast(new NotificationCreated($notif))->toOthers();
        }

        return response()->json([
            'message' => 'Votre demande a été envoyée. Un administrateur va la traiter.',
        ]);
    }

    // GET /password-resets (admin)
    public function adminList(Request $r)
    {
        $auth = auth('api')->user();
        if (!$auth || $auth->role !== 'admin') {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $query = PasswordReset::with('user')->orderBy('created_at', 'desc');
        if ($r->filled('statut')) {
            $query->where('statut', $r->statut);
        }

        return response()->json($query->get());
    }

    // PUT /password-resets/{id}/approve (admin)
    public function adminApprove($id)
    {
        $auth = auth('api')->user();
        if (!$auth || $auth->role !== 'admin') {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $pr = PasswordReset::with('user')->find($id);
        if (!$pr) {
            return response()->json(['message' => 'Demande introuvable.'], 404);
        }
        if ($pr->statut !== 'en_attente') {
            return response()->json(['message' => 'Cette demande a déjà été traitée.'], 400);
        }

        $plainToken  = Str::random(64);
        $hashedToken = hash('sha256', $plainToken);

        // ⚠️ On envoie l'email D'ABORD. Si ça échoue, le statut reste 'en_attente'
        // et l'admin peut ré-essayer.
        try {
            Mail::to($pr->email)->send(new ResetPasswordMail($pr->user, $plainToken));
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Email non envoyé : ' . $e->getMessage(),
            ], 500);
        }

        // Email envoyé OK → on persiste l'approbation
        $pr->token      = $hashedToken;
        $pr->statut     = 'approuvee';
        $pr->expires_at = now()->addMinutes(15);
        $pr->save();

        $notifApproval = Notification::create([
            'user_id'    => $pr->user_id,
            'demande_id' => null,
            'message'    => '✅ Votre demande de réinitialisation a été approuvée. Consultez votre email.',
            'lu'         => false,
            'created_at' => now(),
        ]);
        broadcast(new NotificationCreated($notifApproval))->toOthers();

        return response()->json(['message' => 'Demande approuvée. Email envoyé.']);
    }

    // PUT /password-resets/{id}/reject (admin)
    public function adminReject($id)
    {
        $auth = auth('api')->user();
        if (!$auth || $auth->role !== 'admin') {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $pr = PasswordReset::find($id);
        if (!$pr) {
            return response()->json(['message' => 'Demande introuvable.'], 404);
        }
        if ($pr->statut !== 'en_attente') {
            return response()->json(['message' => 'Cette demande a déjà été traitée.'], 400);
        }

        $pr->statut = 'refusee';
        $pr->save();

        $notifReject = Notification::create([
            'user_id'    => $pr->user_id,
            'demande_id' => null,
            'message'    => '❌ Votre demande de réinitialisation a été refusée.',
            'lu'         => false,
            'created_at' => now(),
        ]);
        broadcast(new NotificationCreated($notifReject))->toOthers();

        return response()->json(['message' => 'Demande refusée.']);
    }

    // GET /reset-password/validate (public)
    public function validateToken(Request $r)
    {
        $r->validate([
            'token' => 'required|string',
            'email' => 'required|email',
        ]);

        $pr = PasswordReset::where('email', $r->email)
            ->where('token', hash('sha256', $r->token))
            ->where('statut', 'approuvee')
            ->where('expires_at', '>', now())
            ->first();

        if (!$pr) {
            return response()->json([
                'valid'   => false,
                'message' => 'Lien invalide ou expiré.',
            ]);
        }

        return response()->json(['valid' => true]);
    }

    // POST /reset-password (public)
    public function reset(Request $r)
    {
        $r->validate([
            'token'    => 'required|string',
            'email'    => 'required|email',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $pr = PasswordReset::where('email', $r->email)
            ->where('token', hash('sha256', $r->token))
            ->where('statut', 'approuvee')
            ->where('expires_at', '>', now())
            ->first();

        if (!$pr) {
            return response()->json([
                'message' => 'Lien invalide ou expiré.',
            ], 400);
        }

        $user = User::where('email', $r->email)->first();
        if (!$user) {
            return response()->json(['message' => 'Utilisateur introuvable.'], 404);
        }

        $user->password = $r->password;
        $user->save();

        $pr->statut = 'utilisee';
        $pr->save();

        return response()->json(['message' => 'Mot de passe réinitialisé avec succès.']);
    }
}
