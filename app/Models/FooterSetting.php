<?php

namespace App\Models;

use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use MongoDB\Laravel\Eloquent\Model;

class FooterSetting extends Model
{
    protected $connection = 'mongodb';

    protected $collection = 'footer_settings';

    protected $fillable = [
        'brand_name',
        'brand_tagline',
        'brand_subtitle',
        'brand_description',
        'logo_path',
        'address',
        'phone',
        'copyright_text',
        'social_links',
        'items_initialized',
        'updated_by',
    ];

    protected $appends = ['logo_url'];

    protected function casts(): array
    {
        return [
            'items_initialized' => 'boolean',
        ];
    }

    public function getLogoUrlAttribute(): string
    {
        if (! $this->logo_path) {
            return '/images/logo.webp';
        }

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('s3');

        return $disk->url($this->logo_path);
    }
}
