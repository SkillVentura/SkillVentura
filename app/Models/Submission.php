<?php

namespace App\Models;

use Illuminate\Support\Str;
use MongoDB\Laravel\Eloquent\Model;

class Submission extends Model
{
    protected $collection = 'submissions';

    protected $fillable = [
        'group_id',
        'title',
        'slug',
        'description',
        'submission_type',
        'attachment',
        'status',
        'created_by',
    ];

    protected $casts = [];

    protected $appends = ['attachment_url'];

    public function getAttachmentUrlAttribute(): ?string
    {
        if ($this->attachment) {
            if (str_starts_with($this->attachment, 'http')) {
                return $this->attachment;
            }

            $identifier = $this->slug ?: (string) ($this->id ?? $this->_id ?? '');
            if ($identifier !== '') {
                return url("/submissions/{$identifier}/attachment");
            }
        }

        return null;
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    protected static function booted(): void
    {
        static::saving(function (Submission $submission) {
            if (empty($submission->slug) && ! empty($submission->title)) {
                $submission->slug = Str::slug($submission->title);
            }
        });
    }

    public function resolveRouteBinding($value, $field = null)
    {
        return $this->where($field ?? 'slug', $value)
            ->orWhere('_id', $value)
            ->firstOrFail();
    }

    public function group()
    {
        return $this->belongsTo(CareerGroup::class, 'group_id');
    }

    public function mentor()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
