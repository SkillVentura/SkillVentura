<?php

namespace App\Http\Requests\Footer;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFooterSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'brand_name' => ['required', 'string', 'max:100'],
            'brand_tagline' => ['nullable', 'string', 'max:150'],
            'brand_subtitle' => ['nullable', 'string', 'max:150'],
            'brand_description' => ['nullable', 'string', 'max:500'],
            'address' => ['nullable', 'string', 'max:200'],
            'phone' => ['nullable', 'string', 'max:60'],
            'copyright_text' => ['required', 'string', 'max:200'],
            'logo' => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp,svg', 'max:2048'],
            'remove_logo' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'brand_name.required' => 'Nama brand pada footer wajib diisi.',
            'brand_name.max' => 'Nama brand maksimal 100 karakter.',
            'brand_description.max' => 'Deskripsi singkat maksimal 500 karakter agar tetap proporsional di footer.',
            'copyright_text.required' => 'Teks copyright wajib diisi.',
            'logo.image' => 'File logo harus berupa gambar yang valid.',
            'logo.mimes' => 'Format logo harus berupa PNG, JPG, JPEG, WEBP, atau SVG.',
            'logo.max' => 'Ukuran file logo maksimal 2MB.',
        ];
    }
}
