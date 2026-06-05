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
        User::where('email', 'admin@adistek.com')->delete();

        User::updateOrCreate(
            ['email' => 'ahmet@gmail.com'],
            [
                'name' => 'Ahmet',
                'password' => '12345',
                'is_admin' => true,
            ],
        );
    }
}
