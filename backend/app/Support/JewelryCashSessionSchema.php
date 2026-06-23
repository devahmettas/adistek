<?php

namespace App\Support;

use Illuminate\Database\QueryException;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class JewelryCashSessionSchema
{
    public static function ensure(): void
    {
        if (! Schema::hasTable('jewelry_cash_transactions')) {
            return;
        }

        if (! Schema::hasTable('jewelry_cash_sessions')) {
            self::createCashSessionsTable();
        }

        if (! Schema::hasColumn('jewelry_cash_transactions', 'cash_session_id')) {
            self::addCashSessionIdColumn();
        }
    }

    public static function isReady(): bool
    {
        return Schema::hasTable('jewelry_cash_sessions')
            && Schema::hasTable('jewelry_cash_transactions')
            && Schema::hasColumn('jewelry_cash_transactions', 'cash_session_id');
    }

    private static function createCashSessionsTable(): void
    {
        Schema::create('jewelry_cash_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('status', 16)->default('open');
            $table->date('business_date');
            $table->timestamp('opened_at');
            $table->decimal('opening_balance', 14, 2)->default(0);
            $table->text('opening_notes')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->decimal('expected_balance', 14, 2)->nullable();
            $table->decimal('counted_balance', 14, 2)->nullable();
            $table->decimal('cash_difference', 14, 2)->nullable();
            $table->decimal('session_cash_in', 14, 2)->default(0);
            $table->decimal('session_cash_out', 14, 2)->default(0);
            $table->unsignedInteger('transaction_count')->default(0);
            $table->unsignedInteger('cash_sale_count')->default(0);
            $table->decimal('cash_sale_total', 14, 2)->default(0);
            $table->unsignedInteger('cash_purchase_count')->default(0);
            $table->decimal('cash_purchase_total', 14, 2)->default(0);
            $table->text('closing_notes')->nullable();
            $table->timestamps();

            $table->index(['restaurant_id', 'status']);
            $table->index(['restaurant_id', 'business_date']);
        });

        self::refreshSchemaCache();
    }

    private static function addCashSessionIdColumn(): void
    {
        try {
            Schema::table('jewelry_cash_transactions', function (Blueprint $table) {
                $table->foreignId('cash_session_id')
                    ->nullable()
                    ->after('restaurant_id')
                    ->constrained('jewelry_cash_sessions')
                    ->nullOnDelete();
            });
        } catch (QueryException $exception) {
            if (! self::isDuplicateColumnError($exception)) {
                throw $exception;
            }
        }

        self::refreshSchemaCache();
    }

    private static function refreshSchemaCache(): void
    {
        $connection = Schema::getConnection();
        $connection->forgetRecordModificationState();

        if (method_exists($connection, 'disconnect')) {
            $connection->disconnect();
        }

        $connection->reconnect();
    }

    private static function isDuplicateColumnError(QueryException $exception): bool
    {
        $message = strtolower($exception->getMessage());

        return str_contains($message, 'duplicate column')
            || str_contains($message, 'already exists');
    }
}
