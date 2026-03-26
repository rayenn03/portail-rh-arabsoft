<?php
namespace App\Http\Controllers;

use App\Models\Notification;

class NotificationController extends Controller
{
    // Lister les notifications de l'utilisateur connecté
    public function index()
    {
        $user = auth('api')->user();

        $notifications = Notification::where('user_id', $user->id)
            ->with('demande')
            ->orderBy('created_at', 'desc')
            ->get();

        $nonLues = $notifications->where('lu', false)->count();

        return response()->json([
            'notifications' => $notifications,
            'non_lues'      => $nonLues
        ]);
    }

    // Marquer une notification comme lue
    public function marquerLu($id)
    {
        $user         = auth('api')->user();
        $notification = Notification::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $notification->update(['lu' => true]);

        return response()->json(['message' => 'Notification marquée comme lue']);
    }

    // Marquer toutes comme lues
    public function marquerToutLu()
    {
        $user = auth('api')->user();

        Notification::where('user_id', $user->id)
            ->where('lu', false)
            ->update(['lu' => true]);

        return response()->json(['message' => 'Toutes les notifications sont lues']);
    }
}
