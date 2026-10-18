<?php

namespace App\Models;

use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use MongoDB\Laravel\Eloquent\Model;

class ModuleContent extends Model
{
    protected $connection = 'mongodb';

    protected $collection = 'module_contents';

    protected $fillable = [
        'module_id',
        'type',
        'content',
        'order',
    ];

    protected $casts = [
        'content' => 'array',
    ];

    /**
     * Dynamically resolve file/image URLs from the stored S3 path so legacy hardcoded fls-xxxxx URLs are never exposed.
     *
     * @return array<string, mixed>
     */
    public function getContentAttribute(mixed $value): array
    {
        $data = is_string($value) ? (json_decode($value, true) ?: []) : (is_array($value) ? $value : []);

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('s3');

        if (! empty($data['path']) && is_string($data['path'])) {
            $data['url'] = $disk->url($data['path']);
        } elseif (
            ! empty($data['url'])
            && is_string($data['url'])
            && preg_match('#^https?://(?:fls-[^/]+|[^/]+\.r2\.cloudflarestorage\.com)/(?:fls-[^/]+/)?(.+)$#i', $data['url'], $matches)
        ) {
            $data['url'] = $disk->url($matches[1]);
        }

        return $data;
    }

    public function module()
    {
        return $this->belongsTo(Module::class, 'module_id', '_id');
    }
}
