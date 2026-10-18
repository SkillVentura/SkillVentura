<?php

namespace App\Http\Requests\Footer;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFooterSocialLinksRequest extends FormRequest
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
            'social_links' => ['required', 'array', 'max:12'],
            'social_links.*.id' => ['nullable', 'string', 'max:100'],
            'social_links.*.platform' => [
                'required',
                'string',
                'in:instagram,whatsapp,facebook,github,x,linkedin,youtube,tiktok,discord,website',
            ],
            'social_links.*.label' => ['required', 'string', 'max:80'],
            'social_links.*.url' => ['nullable', 'string', 'max:500'],
            'social_links.*.is_active' => ['required', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'social_links.required' => 'Daftar sosial media wajib dikirimkan.',
            'social_links.max' => 'Maksimal 12 tautan sosial media agar tampilan footer tetap proporsional.',
            'social_links.*.platform.required' => 'Platform sosial media wajib dipilih.',
            'social_links.*.platform.in' => 'Platform sosial media tidak valid.',
            'social_links.*.label.required' => 'Nama label sosial media wajib diisi.',
            'social_links.*.url.max' => 'URL sosial media maksimal 500 karakter.',
        ];
    }
}
