<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'password',
        'role',
        'chef_id',
        'departement',
        'poste',
        'telephone',
        'photo',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = ['photo_url'];

    public function getPhotoUrlAttribute(): ?string
    {
        return $this->photo ? asset('storage/' . $this->photo) : null;
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    // ✅ Requis pour JWT
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }

    // ✅ Relation : employé → son chef
    public function chef()
    {
        return $this->belongsTo(User::class, 'chef_id');
    }

    // ✅ Relation : employé → ses subordonnés
    public function employes()
    {
        return $this->hasMany(User::class, 'chef_id');
    }

    // ✅ Relation : employé → son solde congés
    public function congesSolde()
    {
        return $this->hasOne(CongesSolde::class);
    }

    // ✅ Relation : employé → ses demandes
    public function demandes()
    {
        return $this->hasMany(Demande::class);
    }
}

