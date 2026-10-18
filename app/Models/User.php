<?php

namespace App\Models;

use Illuminate\Auth\Authenticatable;
use Illuminate\Auth\MustVerifyEmail as MustVerifyEmailTrait;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Illuminate\Contracts\Auth\MustVerifyEmail as MustVerifyEmailContract;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Foundation\Auth\Access\Authorizable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Fortify\TwoFactorAuthenticatable;
use MongoDB\Laravel\Eloquent\Builder;
use MongoDB\Laravel\Eloquent\Model;

class User extends Model implements AuthenticatableContract, CanResetPasswordContract, MustVerifyEmailContract
{
    use Authenticatable, Authorizable, CanResetPassword, MustVerifyEmailTrait, Notifiable, TwoFactorAuthenticatable;

    protected $connection = 'mongodb';

    protected $collection = 'users';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'role',
        'character_id',
        'avatar',
        'signature_path',
        'profession',
        'linkedin',
        'description',
        'user_experience',
        'work_experiences',
        'educations',
        'blocked_worker_ids',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            '_id' => 'string',
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'has_completed_onboarding' => 'boolean',
            'blocked_worker_ids' => 'array',
        ];
    }

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = [
        'signature_url',
    ];

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isMentor(): bool
    {
        return $this->role === 'mentor';
    }

    public function isStudent(): bool
    {
        return $this->role === 'student';
    }

    public function isWorkerBlocked(string|User $worker): bool
    {
        $workerId = $worker instanceof User ? (string) $worker->_id : (string) $worker;
        $blocked = (array) ($this->blocked_worker_ids ?? []);

        return in_array($workerId, $blocked, true);
    }

    public function blockWorker(string|User $worker): void
    {
        $workerId = $worker instanceof User ? (string) $worker->_id : (string) $worker;
        $blocked = (array) ($this->blocked_worker_ids ?? []);

        if (! in_array($workerId, $blocked, true)) {
            $blocked[] = $workerId;
            $this->update(['blocked_worker_ids' => $blocked]);
        }
    }

    public function unblockWorker(string|User $worker): void
    {
        $workerId = $worker instanceof User ? (string) $worker->_id : (string) $worker;
        $blocked = (array) ($this->blocked_worker_ids ?? []);

        if (in_array($workerId, $blocked, true)) {
            $blocked = array_values(array_filter($blocked, fn ($id) => (string) $id !== $workerId));
            $this->update(['blocked_worker_ids' => $blocked]);
        }
    }

    public function getSignatureUrlAttribute(): ?string
    {
        if ($this->signature_path) {
            /** @var FilesystemAdapter $disk */
            $disk = Storage::disk('s3');

            return $disk->url($this->signature_path);
        }

        return null;
    }

    public function getWorkExperiencesAttribute(mixed $value): array
    {
        if (is_string($value)) {
            return json_decode($value, true) ?: [];
        }

        return is_array($value) ? $value : [];
    }

    public function getEducationsAttribute(mixed $value): array
    {
        if (is_string($value)) {
            return json_decode($value, true) ?: [];
        }

        return is_array($value) ? $value : [];
    }

    public function character()
    {
        return $this->belongsTo(Character::class, 'character_id', '_id');
    }

    public function hasCharacter(): bool
    {
        return ! is_null($this->character_id);
    }

    public function userStats()
    {
        return $this->hasMany(UserStat::class, 'user_id', '_id');
    }

    public function mentorCareerGroups()
    {
        return $this->hasMany(MentorCareerGroup::class, 'mentor_id', '_id');
    }

    public function courseStudents()
    {
        return $this->hasMany(CourseStudent::class, 'user_id', '_id');
    }

    public function activeCourse()
    {
        return $this->hasOne(CourseStudent::class, 'user_id', '_id')
            ->whereIn('status', ['in_progress', 'In_progress', 'active'])
            ->latest('updated_at');
    }

    public function notifications()
    {
        return $this->morphMany(Notification::class, 'notifiable')->latest();
    }

    public function readNotifications()
    {
        return $this->notifications()->read();
    }

    public function unreadNotifications()
    {
        return $this->notifications()->unread();
    }

    const ROLE_ADMIN = 'admin';

    const ROLE_MENTOR = 'mentor';

    const ROLE_STUDENT = 'student';

    public static function roles(): array
    {
        return [
            self::ROLE_ADMIN,
            self::ROLE_MENTOR,
            self::ROLE_STUDENT,
        ];
    }

    public function scopeFilter(Builder $query, array $filters): void
    {
        $query->when($filters['search'] ?? null, function ($q, $search) {
            $q->where(function ($sq) use ($search) {
                $sq->where('name', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        })->when($filters['role'] ?? null, function ($q, $role) {
            if (in_array($role, [self::ROLE_ADMIN, self::ROLE_MENTOR, self::ROLE_STUDENT])) {
                $q->where('role', $role);
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'username';
    }

    protected static function booted(): void
    {
        static::saving(function (User $user) {
            if (empty($user->username)) {
                $base = ! empty($user->name) ? Str::slug($user->name, '_') : explode('@', $user->email)[0];
                $user->username = Str::slug($base, '_');
            }
        });
    }

    public function resolveRouteBinding($value, $field = null)
    {
        return $this->where($field ?? 'username', $value)
            ->orWhere('_id', $value)
            ->firstOrFail();
    }
}
