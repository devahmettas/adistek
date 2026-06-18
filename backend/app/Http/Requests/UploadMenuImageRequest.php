<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadMenuImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'image' => [
                'required',
                'file',
                'max:5120',
                'mimes:jpg,jpeg,png,webp',
                'mimetypes:image/jpeg,image/jpg,image/pjpeg,image/png,image/x-png,image/webp',
            ],
            'context' => ['required', 'in:product,slide,category'],
        ];
    }

    public function messages(): array
    {
        return [
            'image.mimetypes' => 'Yalnızca JPEG, JPG, PNG veya WebP görselleri yüklenebilir.',
            'image.mimes' => 'Yalnızca JPEG, JPG, PNG veya WebP görselleri yüklenebilir.',
            'image.max' => 'Görsel boyutu en fazla 5 MB olabilir.',
        ];
    }
}
