<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\LevelBadge;
use App\Models\Path;
use App\Models\User;
use App\Models\UserStat;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CourseRoadmapController extends Controller
{
    public function __invoke(Request $request, Course $course)
    {
        $this->authorize('access', $course);

        /** @var User $user */
        $user = $request->user();

        /* ================= PROGRESS ================= */

        $progress = UserStat::firstOrCreate([
            'user_id' => $user->_id,
            'course_id' => $course->_id,
        ], [
            'completed_modules' => [],
            'completed_paths' => [],
            'stage' => 'fundamental',
            'selected_path_id' => null,
        ]);

        $course->load([
            'paths.modules.badge',
            'careerGroups.paths.modules.badge',
            'careerGroups.mentor',
        ]);

        /* ================= BASIC FUNDAMENTAL ================= */

        $basicCollection = $course->paths
            ->where('phase', 'basic_fundamental')
            ->sortBy('order')
            ->values();

        $basicPaths = $basicCollection->map(function ($path, $index) use ($progress, $basicCollection) {

            $pathId = (string) $path->_id;

            $isCompleted = in_array($pathId, $progress->completed_paths);

            if ($index === 0) {
                $isUnlocked = true;
            } else {
                $prev = $basicCollection[$index - 1];
                $isUnlocked = in_array((string) $prev->_id, $progress->completed_paths);
            }

            $modules = $path->modules
                ->sortBy('order')
                ->values();

            $firstModule = $modules->first();

            /** @var FilesystemAdapter $disk */
            $disk = Storage::disk('s3');
            $pathThumbnail = $path->thumbnail
                ? (str_starts_with($path->thumbnail, 'http') ? $path->thumbnail : $disk->url($path->thumbnail))
                : null;

            return [
                '_id' => $pathId,
                'name' => $path->name,
                'slug' => $path->slug,
                'description' => $path->description,
                'thumbnail' => $pathThumbnail,
                'is_unlocked' => $isUnlocked,
                'is_completed' => $isCompleted,

                // 🔥 INI YANG PALING PENTING
                'first_module_id' => $firstModule
                    ? (string) $firstModule->_id
                    : null,
                'first_module_slug' => $firstModule
                    ? $firstModule->slug
                    : null,

                'modules' => $modules->map(fn ($m) => [
                    '_id' => (string) $m->_id,
                    'title' => $m->title,
                    'slug' => $m->slug,
                    'badge' => $m->badge ? [
                        'icon' => $m->badge->icon_url,
                    ] : null,
                ]),
            ];
        });

        /* ================= CHECK BASIC DONE ================= */

        $basicIds = $basicCollection
            ->pluck('_id')
            ->map(fn ($id) => (string) $id)
            ->toArray();

        $isBasicCompleted = count(array_diff($basicIds, $progress->completed_paths)) === 0;

        /* ================= CAREER ================= */

        $selectedPath = $progress->selected_path_id ? Path::find($progress->selected_path_id) : null;
        $selectedGroupId = $selectedPath ? (string) $selectedPath->career_group_id : null;

        $careerGroups = $course->careerGroups
            ->filter(function ($group) use ($selectedGroupId) {
                return $group->status !== 'draft' || (string) $group->_id === $selectedGroupId;
            })
            ->values()
            ->map(function ($group) use ($progress, $isBasicCompleted) {

                $groupId = (string) $group->_id;
                $isGroupCompleted = in_array($groupId, $progress->completed_career_groups ?? []);

                /** @var FilesystemAdapter $disk */
                $disk = Storage::disk('s3');

                $groupThumbnail = $group->thumbnail
                    ? (str_starts_with($group->thumbnail, 'http') ? $group->thumbnail : $disk->url($group->thumbnail))
                    : null;

                $mentorAvatar = null;
                if ($group->mentor && $group->mentor->avatar) {
                    $mentorAvatar = str_starts_with($group->mentor->avatar, 'http')
                        ? $group->mentor->avatar
                        : $disk->url($group->mentor->avatar);
                }

                return [
                    '_id' => $groupId,
                    'name' => $group->name,
                    'slug' => $group->slug,
                    'description' => $group->description,
                    'is_completed' => $isGroupCompleted,
                    'thumbnail' => $groupThumbnail,
                    'mentor' => $group->mentor ? [
                        '_id' => (string) $group->mentor->_id,
                        'name' => $group->mentor->name,
                        'username' => $group->mentor->username,
                        'avatar' => $mentorAvatar,
                    ] : null,

                    'paths' => $group->paths
                        ->sortBy('order')
                        ->values()
                        ->map(function ($path, $index) use ($progress, $isBasicCompleted, $disk) {

                            $pathId = (string) $path->_id;

                            $isSelected = $progress->selected_path_id === $pathId;
                            $isCompleted = in_array($pathId, $progress->completed_paths);
                            $modules = $path->modules
                                ->sortBy('order')
                                ->values();

                            /* ❌ LOCK TOTAL JIKA BASIC BELUM SELESAI */
                            if (! $isBasicCompleted) {
                                $isUnlocked = false;
                            } elseif ($progress->selected_path_id) {
                                /* 🔒 JIKA SUDAH PILIH BRANCH */
                                $isUnlocked = $isSelected;
                            } else {
                                /* ✅ SEMUA TERBUKA UNTUK DIPILIH */
                                $isUnlocked = true;
                            }

                            $careerPathThumbnail = $path->thumbnail
                                ? (str_starts_with($path->thumbnail, 'http') ? $path->thumbnail : $disk->url($path->thumbnail))
                                : null;

                            return [
                                '_id' => $pathId,
                                'name' => $path->name,
                                'slug' => $path->slug,
                                'description' => $path->description,
                                'thumbnail' => $careerPathThumbnail,
                                'is_unlocked' => $isUnlocked,
                                'is_selected' => $isSelected,
                                'is_completed' => $isCompleted,
                                'modules' => $modules->map(fn ($m) => [
                                    '_id' => (string) $m->_id,
                                    'title' => $m->title,
                                    'slug' => $m->slug,
                                    'badge' => $m->badge ? [
                                        'icon' => $m->badge->icon_url,
                                    ] : null,
                                ]),
                            ];
                        }),
                ];
            });

        /* ================= RESPONSE ================= */

        $character = $user->character;

        return Inertia::render('Student/Roadmap', [
            'character' => $character ? [
                'name' => $character->name,
                'avatar' => $character->avatar_url,
            ] : null,
            'course' => [
                '_id' => (string) $course->_id,
                'title' => $course->title,
                'slug' => $course->slug,
                'description' => $course->description,
                'basic_paths' => $basicPaths,
                'career_groups' => $careerGroups,
            ],
            'progress' => $progress,

            'badges' => LevelBadge::orderBy('order')->get()->map(fn ($b) => [
                'order' => (int) $b->order,
                'icon' => $b->icon_url,
            ]),

            'mentors' => User::where('role', 'mentor')->get()->map(fn ($m) => [
                '_id' => (string) $m->_id,
                'name' => $m->name,
            ]),
        ]);
    }
}
