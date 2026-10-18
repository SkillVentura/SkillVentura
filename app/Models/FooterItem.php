<?php

namespace App\Models;

use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use MongoDB\Laravel\Eloquent\Model;

class FooterItem extends Model
{
    protected $connection = 'mongodb';

    protected $collection = 'footer_items';

    protected $fillable = [
        'category',
        'title',
        'slug',
        'link_type',
        'external_url',
        'order',
        'is_active',
        'subtitle',
        'content',
        'image_path',
        'image_caption',
        'youtube_url',
        'cta_label',
        'cta_url',
        'profile_card',
        'updated_by',
    ];

    protected $appends = ['image_url'];

    protected function casts(): array
    {
        return [
            'order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image_path) {
            return null;
        }

        if (str_starts_with($this->image_path, '/') || str_starts_with($this->image_path, 'http')) {
            return $this->image_path;
        }

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('s3');

        return $disk->url($this->image_path);
    }
}
