<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CongesSolde extends Model
{
    protected $table = 'conges_soldes';

    // Pas de timestamps dans cette table
    public $timestamps = false;

    protected $fillable = [
        'employee_id',
        'annuel_total',
        'annuel_pris',
        'maladie_total',
        'maladie_pris',
        'exceptionnel_total',
        'exceptionnel_pris',
        'annee',
    ];

    protected $casts = [
        'annuel_total'       => 'integer',
        'annuel_pris'        => 'integer',
        'maladie_total'      => 'integer',
        'maladie_pris'       => 'integer',
        'exceptionnel_total' => 'integer',
        'exceptionnel_pris'  => 'integer',
        'annee'              => 'integer',
    ];

    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }
}
