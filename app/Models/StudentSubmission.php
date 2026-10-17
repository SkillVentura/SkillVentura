<?php

namespace App\Models;

use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use MongoDB\Laravel\Eloquent\Model;

class StudentSubmission extends Model
{
    protected $collection = 'student_submissions';

    protected $fillable = [
        'submission_id',
        'student_id',
        'slug',
        'file_path',
        'link',
        'notes',
        'status',
        'grade',
        'feedback',
        'certificate_id',
        'certificate_path',
        'graded_by',
    ];

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    protected static function booted(): void
    {
        static::saving(function (StudentSubmission $studentSubmission) {
            if (empty($studentSubmission->slug)) {
                $sub = $studentSubmission->submission ?: Submission::find($studentSubmission->submission_id);
                $student = $studentSubmission->student ?: User::find($studentSubmission->student_id);

                $subSlug = $sub?->slug ?: ($sub?->title ? Str::slug($sub->title) : 'submission');
                $userSlug = $student?->username ?: ($student?->name ? Str::slug($student->name) : 'student');

                $studentSubmission->slug = Str::slug("{$subSlug}-{$userSlug}");
            }
        });
    }

    public function resolveRouteBinding($value, $field = null)
    {
        return $this->where($field ?? 'slug', $value)
            ->orWhere('_id', $value)
            ->firstOrFail();
    }

    protected $appends = ['certificate_url', 'file_url'];

    public function getCertificateIdAttribute($value): ?string
    {
        if (! empty($value)) {
            return strtoupper((string) $value);
        }

        $docId = (string) ($this->id ?? $this->_id ?? '');
        if ($this->certificate_path && $docId !== '') {
            return strtoupper(substr(md5($docId), 0, 12));
        }

        return null;
    }

    public function getCertificateUrlAttribute(): ?string
    {
        if ($this->certificate_path) {
            $certId = $this->certificate_id;
            $timestamp = $this->updated_at ? $this->updated_at->timestamp : time();

            if ($certId) {
                return url("/certificates/{$certId}").'?v='.$timestamp;
            }

            if (str_starts_with($this->certificate_path, 'http')) {
                return $this->certificate_path;
            }

            /** @var FilesystemAdapter $disk */
            $disk = Storage::disk('s3');

            $url = $disk->url($this->certificate_path);

            return $url.'?v='.$timestamp;
        }

        return null;
    }

    public function getFileUrlAttribute(): ?string
    {
        if ($this->file_path) {
            if (str_starts_with($this->file_path, 'http')) {
                return $this->file_path;
            }

            $identifier = $this->slug ?: (string) ($this->id ?? $this->_id ?? '');
            if ($identifier !== '') {
                return url("/student-submissions/{$identifier}/file");
            }
        }

        return null;
    }

    public function submission()
    {
        return $this->belongsTo(Submission::class, 'submission_id');
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
