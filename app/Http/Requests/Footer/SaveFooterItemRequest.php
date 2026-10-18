<?php

namespace App\Http\Requests\Footer;

use Illuminate\Foundation\Http\FormRequest;

class SaveFooterItemRequest extends FormRequest
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
            'category' => ['required', 'string', 'in:program,company,support'],
            'title' => ['required', 'string', 'max:100'],
            'link_type' => ['required', 'string', 'in:internal_page,external_url'],
            'external_url' => ['nullable', 'required_if:link_type,external_url', 'string', 'max:500'],
            'is_active' => ['nullable', 'boolean'],
            'subtitle' => ['nullable', 'string', 'max:300'],
            'content' => ['nullable', 'string', 'max:20000'],
            'image' => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp', 'max:4096'],
            'remove_image' => ['nullable', 'boolean'],
            'image_caption' => ['nullable', 'string', 'max:250'],
            'youtube_url' => ['nullable', 'string', 'max:500'],
            'cta_label' => ['nullable', 'string', 'max:80'],
            'cta_url' => ['nullable', 'string', 'max:500'],
            'profile_enabled' => ['nullable', 'boolean'],
            'profile_badge' => ['nullable', 'string', 'max:80'],
            'profile_name' => ['nullable', 'string', 'max:150'],
            'profile_role' => ['nullable', 'string', 'max:120'],
            'profile_bio' => ['nullable', 'string', 'max:2000'],
            'profile_avatar' => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp', 'max:4096'],
            'remove_profile_avatar' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'category.required' => 'Kategori footer (Program / Company / Support) wajib dipilih.',
            'category.in' => 'Kategori footer tidak valid.',
            'title.required' => 'Judul menu footer wajib diisi.',
            'title.max' => 'Judul menu footer maksimal 100 karakter.',
            'link_type.required' => 'Tipe tautan wajib dipilih.',
            'external_url.required_if' => 'URL tujuan wajib diisi jika memilih tipe Direct URL Link Eksternal.',
            'image.image' => 'File gambar harus berupa gambar yang valid.',
            'image.mimes' => 'Format gambar harus berupa PNG, JPG, JPEG, atau WEBP.',
            'image.max' => 'Ukuran file gambar maksimal 4MB.',
            'profile_avatar.image' => 'Foto profil harus berupa gambar yang valid.',
            'profile_avatar.max' => 'Ukuran foto profil maksimal 4MB.',
        ];
    }
}
