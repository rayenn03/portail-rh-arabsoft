<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('conges_soldes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('users')->cascadeOnDelete();
            $table->integer('annuel_total')->default(30);
            $table->integer('annuel_pris')->default(0);
            $table->integer('maladie_total')->default(10);
            $table->integer('maladie_pris')->default(0);
            $table->integer('exceptionnel_total')->default(5);
            $table->integer('exceptionnel_pris')->default(0);
            $table->integer('annee');
            $table->unique(['employee_id', 'annee']);
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('conges_soldes');
    }
};
