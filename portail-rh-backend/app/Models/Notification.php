<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    public $timestamps = false;  // ✅ désactive updated_at

    protected $fillable = [
        'user_id',
        'demande_id',
        'message',
        'lu',
    ];

    protected $casts = [
        'lu'         => 'boolean',
        'created_at' => 'datetime',  // ✅ garde created_at lisible
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function demande()
    {
        return $this->belongsTo(Demande::class);
    }
}
