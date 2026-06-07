<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'ahmet123@gmail.com'],
            [
                'name' => 'Ahmet',
                'password' => '12345678',
                'is_admin' => true,
            ],
        );
    }
}
