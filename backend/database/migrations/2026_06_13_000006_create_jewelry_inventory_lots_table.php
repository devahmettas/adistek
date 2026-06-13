<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('jewelry_inventory_lots')) {
            Schema::create('jewelry_inventory_lots', function (Blueprint $table) {
                $table->id();
                $table->foreignId('product_id')->constrained('jewelry_products')->cascadeOnDelete();
                $table->foreignId('purchase_item_id')->nullable()->constrained('jewelry_purchase_items')->nullOnDelete();
                $table->unsignedInteger('quantity_initial');
                $table->unsignedInteger('quantity_remaining');
                $table->decimal('unit_cost', 12, 2);
                $table->timestamp('purchased_at')->useCurrent();
                $table->timestamp('created_at')->useCurrent();

                $table->index(['product_id', 'quantity_remaining', 'purchased_at'], 'jewelry_lots_fifo_idx');
                $table->index(['purchase_item_id']);
            });
        } else {
            Schema::table('jewelry_inventory_lots', function (Blueprint $table) {
                if (! $this->indexExists('jewelry_inventory_lots', 'jewelry_lots_fifo_idx')) {
                    $table->index(['product_id', 'quantity_remaining', 'purchased_at'], 'jewelry_lots_fifo_idx');
                }
            });
        }

        Schema::table('jewelry_sale_items', function (Blueprint $table) {
            if (! Schema::hasColumn('jewelry_sale_items', 'unit_cost')) {
                $table->decimal('unit_cost', 12, 2)->default(0)->after('unit_price');
            }
            if (! Schema::hasColumn('jewelry_sale_items', 'line_cost')) {
                $table->decimal('line_cost', 12, 2)->default(0)->after('unit_cost');
            }
        });

        if (DB::table('jewelry_inventory_lots')->count() === 0) {
            $this->backfillExistingStock();
        }
    }

    public function down(): void
    {
        Schema::table('jewelry_sale_items', function (Blueprint $table) {
            if (Schema::hasColumn('jewelry_sale_items', 'line_cost')) {
                $table->dropColumn('line_cost');
            }
            if (Schema::hasColumn('jewelry_sale_items', 'unit_cost')) {
                $table->dropColumn('unit_cost');
            }
        });

        Schema::dropIfExists('jewelry_inventory_lots');
    }

    private function backfillExistingStock(): void
    {
        $products = DB::table('jewelry_products')
            ->where('stock_quantity', '>', 0)
            ->get(['id', 'stock_quantity', 'purchase_price', 'created_at']);

        $now = now();

        foreach ($products as $product) {
            DB::table('jewelry_inventory_lots')->insert([
                'product_id' => $product->id,
                'purchase_item_id' => null,
                'quantity_initial' => $product->stock_quantity,
                'quantity_remaining' => $product->stock_quantity,
                'unit_cost' => $product->purchase_price ?? 0,
                'purchased_at' => $product->created_at ?? $now,
                'created_at' => $now,
            ]);
        }
    }

    private function indexExists(string $table, string $index): bool
    {
        $connection = Schema::getConnection();
        $database = $connection->getDatabaseName();

        $result = $connection->select(
            'SELECT COUNT(*) AS count FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name = ?',
            [$database, $table, $index],
        );

        return ((int) ($result[0]->count ?? 0)) > 0;
    }
};
