<?php

namespace App\Events;

use App\Models\Notification;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Notification $notification) {}

    /**
     * Channel privé par utilisateur : seul le destinataire peut écouter.
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.' . $this->notification->user_id)];
    }

    /**
     * Payload envoyé au client (Topbar).
     */
    public function broadcastWith(): array
    {
        return [
            'id'         => $this->notification->id,
            'message'    => $this->notification->message,
            'demande_id' => $this->notification->demande_id,
            'created_at' => optional($this->notification->created_at)->toISOString(),
            'lu'         => (bool) $this->notification->lu,
        ];
    }

    /**
     * Nom d'event côté client : channel.listen('.notification.created', ...)
     */
    public function broadcastAs(): string
    {
        return 'notification.created';
    }
}
