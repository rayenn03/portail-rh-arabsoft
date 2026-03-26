<?php
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DemandeController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ChatbotController;
use Illuminate\Support\Facades\Route;

// Routes publiques
Route::post('/login',    [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Routes protégées par JWT
Route::middleware('auth:api')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // Demandes
    Route::get('/demandes',         [DemandeController::class, 'index']);
    Route::post('/demandes',        [DemandeController::class, 'store']);
    Route::get('/demandes/{id}',    [DemandeController::class, 'show']);
    Route::put('/demandes/{id}',    [DemandeController::class, 'update']);
    Route::delete('/demandes/{id}', [DemandeController::class, 'destroy']);

    // Notifications
    Route::get('/notifications',         [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/lu', [NotificationController::class, 'marquerLu']);
    Route::put('/notifications/tout-lu', [NotificationController::class, 'marquerToutLu']);

    // Messages
    Route::get('/messages',         [MessageController::class, 'index']);
    Route::post('/messages',        [MessageController::class, 'store']);
    Route::put('/messages/{id}/lu', [MessageController::class, 'marquerLu']);

    // Users
    Route::get('/users',           [UserController::class, 'index']);
    Route::get('/users/dashboard', [UserController::class, 'dashboard']);
    Route::get('/me/stats',        [UserController::class, 'meStats']);
    Route::get('/users/{id}',      [UserController::class, 'show']);
    Route::put('/users/{id}',      [UserController::class, 'update']);
    Route::delete('/users/{id}',   [UserController::class, 'destroy']);

    // Chatbot
    Route::post('/chatbot', [ChatbotController::class, 'chat']);
});
