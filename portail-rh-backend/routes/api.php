<?php
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DemandeController;
use App\Http\Controllers\DocumentVerificationController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ChatbotController;
use App\Http\Controllers\CongesController;
use App\Http\Controllers\PasswordResetController;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

// Routes publiques
Route::post('/login',    [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Mot de passe oublié (public)
Route::post('/forgot-password',          [PasswordResetController::class, 'request']);
Route::get('/reset-password/validate',   [PasswordResetController::class, 'validateToken']);
Route::post('/reset-password',           [PasswordResetController::class, 'reset']);

// Vérification publique d'authenticité d'un document PDF (scan QR)
Route::get('/verify', [DocumentVerificationController::class, 'verify']);

// Routes protégées par JWT
Route::middleware('auth:api')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // Auth WebSocket (Reverb) pour channels privés
    Route::post('/broadcasting/auth', function (\Illuminate\Http\Request $request) {
        return Broadcast::auth($request);
    });

    // Demandes
    Route::get('/demandes',         [DemandeController::class, 'index']);
    Route::post('/demandes',        [DemandeController::class, 'store']);
    Route::get('/demandes/{id}',    [DemandeController::class, 'show']);
    Route::put('/demandes/{id}',    [DemandeController::class, 'update']);
    Route::delete('/demandes/{id}', [DemandeController::class, 'destroy']);
    Route::get('/demandes/{id}/telecharger',   [DemandeController::class, 'telecharger']);
    Route::get('/demandes/{id}/justificatif',  [DemandeController::class, 'telechargerJustificatif']);

    // Notifications
    Route::get('/notifications',         [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/lu', [NotificationController::class, 'marquerLu']);
    Route::put('/notifications/tout-lu', [NotificationController::class, 'marquerToutLu']);

    // Messages
    Route::get('/messages',                      [MessageController::class, 'index']);
    Route::get('/messages/contacts',             [MessageController::class, 'contacts']);
    Route::get('/messages/non-lus',              [MessageController::class, 'nonLus']);
    Route::get('/messages/conversation/{userId}',[MessageController::class, 'conversation']);
    Route::post('/messages',                     [MessageController::class, 'store']);
    Route::put('/messages/{id}/lu',              [MessageController::class, 'marquerLu']);

    // Soldes de congés
    Route::get('/users/{id}/conges', [CongesController::class, 'show']);
    Route::put('/users/{id}/conges', [CongesController::class, 'update']);

    // Users
    Route::get('/users',           [UserController::class, 'index']);
    Route::get('/users/dashboard', [UserController::class, 'dashboard']);
    Route::get('/me/stats',        [UserController::class, 'meStats']);
    Route::get('/users/{id}',      [UserController::class, 'show']);
    Route::put('/users/{id}',      [UserController::class, 'update']);
    Route::delete('/users/{id}',   [UserController::class, 'destroy']);
    Route::post('/users/{id}/photo',   [UserController::class, 'uploadPhoto']);
    Route::delete('/users/{id}/photo', [UserController::class, 'deletePhoto']);

    // Chatbot (rate-limited : 20 messages / minute / utilisateur pour protéger le quota Gemini)
    Route::post('/chatbot', [ChatbotController::class, 'chat'])->middleware('throttle:20,1');

    // Demandes de réinitialisation (admin)
    Route::get('/password-resets',                [PasswordResetController::class, 'adminList']);
    Route::put('/password-resets/{id}/approve',   [PasswordResetController::class, 'adminApprove']);
    Route::put('/password-resets/{id}/reject',    [PasswordResetController::class, 'adminReject']);
});
