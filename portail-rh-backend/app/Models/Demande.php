<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Demande extends Model
{
    protected $fillable = [
        'employee_id',
        'chef_id',
        'admin_id',
        'type',
        'statut',
        'date_debut',
        'date_fin',
        'montant',
        'duree',
        'motif',
        'type_document',
        'commentaire',
        'commentaire_chef',
        'commentaire_admin',
        'piece_jointe',
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin'   => 'date',
        'montant'    => 'decimal:2',
    ];

    // ✅ Accesseur : URL publique du justificatif (null si absent)
    protected $appends = ['piece_jointe_url'];

    public function getPieceJointeUrlAttribute()
    {
        return $this->piece_jointe
            ? asset('storage/' . $this->piece_jointe)
            : null;
    }

    // ✅ Relation : demande → employé
    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    // ✅ Relation : demande → chef
    public function chef()
    {
        return $this->belongsTo(User::class, 'chef_id');
    }

    // ✅ Relation : demande → admin
    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
