<?php

namespace App\Models;

use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use MongoDB\Laravel\Eloquent\Model;

class DonationBanner extends Model
{
    protected $connection = 'mongodb';

    protected $collection = 'donation_banners';

    protected $fillable = [
        'title',
        'url',
        'image_path',
        'is_active',
        'updated_by',
    ];

    protected $appends = ['image_url'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function getImageUrlAttribute(): string
    {
        if (! $this->image_path) {
            return '/images/donation-banner.jpg';
        }

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('s3');

        return $disk->url($this->image_path);
    }
}
