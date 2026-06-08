<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('
            UPDATE table_reservations tr
            INNER JOIN restaurants r ON r.id = tr.restaurant_id
            SET tr.duration_minutes = r.reservation_duration_minutes
            WHERE tr.reserved_at >= NOW()
        ');
    }

    public function down(): void
    {
        // No safe rollback for synced values.
    }
};
