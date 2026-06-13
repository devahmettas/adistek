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
                'mimetypes:image/jpeg,image/png,image/webp,image/pjpeg,image/x-png',
            ],
            'context' => ['required', 'in:product,slide,category'],
        ];
    }

    public function messages(): array
    {
        return [
            'image.mimetypes' => 'Yalnızca JPEG, JPG, PNG veya WebP görselleri yüklenebilir.',
            'image.max' => 'Görsel boyutu en fazla 5 MB olabilir.',
        ];
    }
}
