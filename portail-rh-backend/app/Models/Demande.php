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
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin'   => 'date',
        'montant'    => 'decimal:2',
    ];

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
