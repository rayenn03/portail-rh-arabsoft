<?php
namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    // Lister les conversations
    public function index()
    {
        $user = auth('api')->user();

        $messages = Message::where('expediteur_id', $user->id)
            ->orWhere('destinataire_id', $user->id)
            ->with(['expediteur', 'destinataire'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($messages);
    }

    // Envoyer un message
    public function store(Request $request)
    {
        $user = auth('api')->user();

        $request->validate([
            'destinataire_id' => 'required|exists:users,id',
            'contenu'         => 'required|string'
        ]);

        $message = Message::create([
            'expediteur_id'   => $user->id,
            'destinataire_id' => $request->destinataire_id,
            'contenu'         => $request->contenu,
            'lu'              => false,
        ]);

        return response()->json([
            'message' => 'Message envoyé',
            'data'    => $message->load(['expediteur', 'destinataire'])
        ], 201);
    }

    // Marquer comme lu
    public function marquerLu($id)
    {
        $user    = auth('api')->user();
        $message = Message::where('id', $id)
            ->where('destinataire_id', $user->id)
            ->firstOrFail();

        $message->update(['lu' => true]);

        return response()->json(['message' => 'Message lu']);
    }
}
