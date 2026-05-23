<?php
namespace App\Http\Controllers;

use App\Events\NotificationCreated;
use App\Models\Message;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    // GET /messages → Liste des conversations (un résumé par contact)
    // Retourne : [{ contact, dernier_message, non_lus }]
    public function index()
    {
        $user = auth('api')->user();

        // Liste de tous les contacts échangés (expediteur OU destinataire)
        $conversations = Message::where('expediteur_id', $user->id)
            ->orWhere('destinataire_id', $user->id)
            ->with(['expediteur:id,nom,prenom,role,photo', 'destinataire:id,nom,prenom,role,photo'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy(function ($msg) use ($user) {
                return $msg->expediteur_id === $user->id
                    ? $msg->destinataire_id
                    : $msg->expediteur_id;
            })
            ->map(function ($msgs) use ($user) {
                $dernier = $msgs->first(); // Le plus récent (déjà trié DESC)
                $contact = $dernier->expediteur_id === $user->id
                    ? $dernier->destinataire
                    : $dernier->expediteur;

                $nonLus = $msgs->where('destinataire_id', $user->id)
                               ->where('lu', false)
                               ->count();

                return [
                    'contact'        => $contact,
                    'dernier_message'=> $dernier,
                    'non_lus'        => $nonLus,
                ];
            })
            ->values();

        return response()->json($conversations);
    }

    // GET /messages/conversation/{userId} → Messages avec un contact précis
    public function conversation($userId)
    {
        $user = auth('api')->user();

        $messages = Message::where(function ($q) use ($user, $userId) {
                $q->where('expediteur_id', $user->id)
                  ->where('destinataire_id', $userId);
            })
            ->orWhere(function ($q) use ($user, $userId) {
                $q->where('expediteur_id', $userId)
                  ->where('destinataire_id', $user->id);
            })
            ->with(['expediteur:id,nom,prenom,photo', 'destinataire:id,nom,prenom,photo'])
            ->orderBy('created_at', 'asc')
            ->get();

        // Marquer automatiquement comme lus les messages reçus
        Message::where('expediteur_id', $userId)
            ->where('destinataire_id', $user->id)
            ->where('lu', false)
            ->update(['lu' => true]);

        return response()->json($messages);
    }

    // GET /messages/contacts → Liste des utilisateurs avec qui on peut discuter
    public function contacts()
    {
        $user = auth('api')->user();

        // On retourne tous les autres utilisateurs (sauf soi-même)
        $contacts = User::where('id', '!=', $user->id)
            ->select('id', 'nom', 'prenom', 'role', 'departement', 'photo')
            ->orderBy('prenom')
            ->get();

        return response()->json($contacts);
    }

    // GET /messages/non-lus → Nombre total de messages non lus
    public function nonLus()
    {
        $user = auth('api')->user();
        $count = Message::where('destinataire_id', $user->id)
            ->where('lu', false)
            ->count();

        return response()->json(['non_lus' => $count]);
    }

    // POST /messages → Envoyer un message
    public function store(Request $request)
    {
        $user = auth('api')->user();

        $request->validate([
            'destinataire_id' => 'required|exists:users,id|different:' . $user->id,
            'contenu'         => 'required|string|max:2000',
        ]);

        $message = Message::create([
            'expediteur_id'   => $user->id,
            'destinataire_id' => $request->destinataire_id,
            'contenu'         => $request->contenu,
            'lu'              => false,
        ]);

        // Créer une notification + broadcast WebSocket pour le destinataire
        $notif = Notification::create([
            'user_id'    => $request->destinataire_id,
            'demande_id' => null,
            'message'    => "💬 {$user->prenom} {$user->nom} vous a envoyé un message.",
            'lu'         => false,
        ]);
        broadcast(new NotificationCreated($notif))->toOthers();

        return response()->json([
            'message' => 'Message envoyé',
            'data'    => $message->load(['expediteur:id,nom,prenom,photo', 'destinataire:id,nom,prenom,photo'])
        ], 201);
    }

    // PUT /messages/{id}/lu → Marquer comme lu
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
