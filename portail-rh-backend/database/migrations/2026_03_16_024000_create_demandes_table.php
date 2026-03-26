<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('demandes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('chef_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('type', ['conge','autorisation','pret','situation','document']);
            $table->enum('statut', ['en_attente','valide_chef','approuvee','refusee','approuvee_direct'])
                  ->default('en_attente');
            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();
            $table->decimal('montant', 10, 2)->nullable();
            $table->string('type_document', 100)->nullable();
            $table->text('commentaire')->nullable();
            $table->text('commentaire_chef')->nullable();
            $table->text('commentaire_admin')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('demandes');
    }
};
