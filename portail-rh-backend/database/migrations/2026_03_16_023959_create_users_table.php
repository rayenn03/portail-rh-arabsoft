<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 100);
            $table->string('prenom', 100);
            $table->string('email', 150)->unique();
            $table->string('password');
            $table->enum('role', ['employee', 'chef', 'admin']);
            $table->foreignId('chef_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->string('departement', 100)->nullable();
            $table->string('poste', 100)->nullable();
            $table->string('telephone', 20)->nullable();
            $table->timestamps();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
