<?php

namespace App\Services\Admin;

use App\Models\CourseStudent;
use App\Models\Path;
use App\Models\QuizResult;
use App\Models\Rank;
use App\Models\StudentSubmission;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;

class UserDetailService
{
    public function getStudentDetails(User $user): array
    {
        $user->load(['userStats', 'character', 'courseStudents.course', 'courseStudents.careerGroup', 'activeCourse.course']);

        $stat = $user->userStats()->first();

        $activeCourseData = null;
        if ($user->activeCourse && $user->activeCourse->course) {
            $activeCourseData = [
                'course_name' => $user->activeCourse->course->title ?? 'Unknown',
                'thumbnail_url' => $user->activeCourse->course->thumbnail_url ?? null,
                'career_group' => $user->activeCourse->careerGroup->name ?? 'Unknown',
                'status' => $user->activeCourse->status,
                'enrolled_at' => $user->activeCourse->enrolled_at,
            ];
        }

        $courseHistory = $user->courseStudents->map(function ($cs) {
            return [
                'course_name' => $cs->course ? $cs->course->title : 'Unknown',
                'thumbnail_url' => $cs->course ? $cs->course->thumbnail_url : null,
                'career_group' => $cs->careerGroup ? $cs->careerGroup->name : 'Unknown',
                'status' => $cs->status,
                'completed_at' => $cs->completed_at,
            ];
        });

        // Get All Submissions Detailed
        $recentSubmissions = [];
        if (class_exists(StudentSubmission::class)) {
            $recentSubmissions = StudentSubmission::where('student_id', (string) $user->_id)
                ->with(['submission.group'])
                ->latest()
                ->get()
                ->map(function ($sub) {
                    return [
                        'id' => (string) $sub->_id,
                        'title' => $sub->submission->title ?? 'Assignment',
                        'career_group' => $sub->submission->group->name ?? 'Unknown',
                        'status' => $sub->status,
                        'grade' => $sub->grade,
                        'file_path' => $sub->file_path,
                        'file_url' => $sub->file_url,
                        'link' => $sub->link,
                        'notes' => $sub->notes,
                        'feedback' => $sub->feedback,
                        'submitted_at' => $sub->created_at,
                    ];
                });
        }

        // Get All Quizzes Detailed
        $recentQuizzes = [];
        if (class_exists(QuizResult::class)) {
            $recentQuizzes = QuizResult::where('user_id', (string) $user->_id)
                ->with(['quiz.path', 'quiz.questions.answers'])
                ->latest()
                ->get()
                ->map(function ($qr) {
                    return [
                        'id' => (string) $qr->_id,
                        'path_name' => $qr->quiz->path->name ?? 'Unknown Path',
                        'score' => $qr->score,
                        'passed' => $qr->passed,
                        'answers' => $qr->answers, // Student's chosen answers
                        'questions' => $qr->quiz->questions ?? [], // Complete questions & answers key
                        'completed_at' => $qr->completed_at ?? $qr->created_at,
                    ];
                });
        }

        // Gamification Global Aggregation
        $userStats = $user->userStats;
        $totalExp = 0;
        $totalGold = 0;
        $totalErp = 0;
        $totalScore = 0;
        $highestStage = 1;
        $pathStatsBreakdown = [];

        foreach ($userStats as $stat) {
            $totalExp += $stat->total_exp;
            $totalGold += (int) $stat->gold; // In case top-level gold is used
            $totalErp += (int) $stat->erp;
            if ($stat->stage > $highestStage) {
                $highestStage = $stat->stage;
            }

            if (is_array($stat->path_stats)) {
                $pathStats = $stat->path_stats;
                if (is_string($pathStats)) {
                    $pathStats = json_decode($pathStats, true);
                } elseif (is_object($pathStats)) {
                    $pathStats = json_decode(json_encode($pathStats), true);
                }

                foreach ($pathStats as $key => $pathStat) {
                    $expVal = is_array($pathStat) ? ($pathStat['exp'] ?? 0) : 0;
                    $goldVal = is_array($pathStat) ? ($pathStat['gold'] ?? 0) : 0;
                    $quizScore = is_array($pathStat) ? ($pathStat['quiz_score'] ?? 0) : 0;
                    $pId = is_array($pathStat) ? ($pathStat['path_id'] ?? $key) : $key;

                    // Add nested gold to global total
                    $totalGold += $goldVal;
                    $totalScore += $quizScore;

                    if ($expVal > 0) {
                        $pathName = Path::where('_id', $pId)->value('name') ?? 'Path '.substr((string) $pId, 0, 5);
                        if (! isset($pathStatsBreakdown[$pathName])) {
                            $pathStatsBreakdown[$pathName] = 0;
                        }
                        $pathStatsBreakdown[$pathName] += $expVal;
                    }
                }
            }
        }

        // 1. Profile Level
        $expPerLevel = 500;
        $globalLevel = floor($totalExp / $expPerLevel) + 1;

        // 2. Rank Level (Based on Quiz Score)
        $rankData = null;
        if (class_exists(Rank::class)) {
            $ranks = Rank::orderBy('order')->get();
            if ($ranks->isNotEmpty()) {
                $step = floor($totalScore / 500);
                $tierIndex = floor($step / 3);
                $star = ($step % 3) + 1;
                $tier = $ranks[$tierIndex] ?? $ranks->last();

                $rankData = [
                    'name' => $tier->name ?? 'Unknown Rank',
                    'image' => $tier->image_url ?? null,
                    'star' => $star,
                    'total_score' => $totalScore,
                ];
            }
        }

        // Sort breakdown by highest EXP
        arsort($pathStatsBreakdown);

        return [
            'gamification' => [
                'character' => $user->character->name ?? 'None',
                'character_avatar' => $user->character->avatar_url ?? null,
                'level' => $globalLevel,
                'rank' => $rankData,
                'exp' => $totalExp,
                'gold' => $totalGold,
                'erp' => $totalErp,
                'stage' => $highestStage,
                'exp_breakdown' => $pathStatsBreakdown,
            ],
            'active_course' => $activeCourseData,
            'course_history' => $courseHistory,
            'recent_submissions' => $recentSubmissions,
            'recent_quizzes' => $recentQuizzes,
        ];
    }

    public function getMentorDetails(User $user): array
    {
        $user->load(['mentorCareerGroups.careerGroup']);

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('s3');
        $signatureUrl = $user->signature_path && $disk->exists($user->signature_path)
            ? $disk->temporaryUrl($user->signature_path, now()->addMinutes(30))
            : null;

        $careerGroups = $user->mentorCareerGroups->map(function ($mcg) {
            return [
                'id' => (string) $mcg->_id,
                'name' => $mcg->careerGroup->name ?? 'Unknown',
            ];
        });

        // Get total students handled by this mentor (students enrolled in mentor's career groups)
        $careerGroupIds = $user->mentorCareerGroups->pluck('career_group_id')->toArray();

        // Detailed Mentored Students Stats
        $activeStudentsList = CourseStudent::whereIn('career_group_id', $careerGroupIds)
            ->whereIn('status', ['active', 'in_progress', 'In_progress'])
            ->with('user')
            ->get()
            ->map(function ($cs) {
                return [
                    'name' => $cs->user->name ?? 'Unknown',
                    'username' => $cs->user->username ?? 'Unknown',
                    'avatar' => $cs->user->avatar ?? null,
                    'enrolled_at' => $cs->enrolled_at,
                ];
            });

        $activeStudents = $activeStudentsList->count();

        $graduatedStudents = CourseStudent::whereIn('career_group_id', $careerGroupIds)
            ->whereIn('status', ['completed', 'graduated'])
            ->count();

        $totalStudents = $activeStudents + $graduatedStudents;

        // Detailed Submissions Backlog
        $pendingSubmissionsCount = 0;
        $recentPending = [];
        if (class_exists(StudentSubmission::class) && class_exists(Submission::class)) {
            $submissionIds = Submission::whereIn('group_id', $careerGroupIds)->pluck('_id')->toArray();
            if (! empty($submissionIds)) {
                $query = StudentSubmission::whereIn('submission_id', $submissionIds)
                    ->whereIn('status', ['submitted', 'pending']);

                $pendingSubmissionsCount = $query->count();

                $recentPending = $query->with(['student', 'submission.group'])
                    ->latest()
                    ->get()
                    ->map(function ($sub) {
                        return [
                            'id' => (string) $sub->_id,
                            'student_name' => $sub->student->name ?? 'Unknown',
                            'task_title' => $sub->submission->title ?? 'Task',
                            'career_group' => $sub->submission->group->name ?? 'Unknown Group',
                            'file_path' => $sub->file_path,
                            'link' => $sub->link,
                            'notes' => $sub->notes,
                            'submitted_at' => $sub->created_at,
                        ];
                    });
            }
        }

        return [
            'signature_url' => $signatureUrl,
            'career_groups' => $careerGroups,
            'stats' => [
                'total_students' => $totalStudents,
                'active_students' => $activeStudents,
                'graduated_students' => $graduatedStudents,
                'pending_submissions_count' => $pendingSubmissionsCount,
            ],
            'recent_pending_submissions' => $recentPending,
            'active_students_list' => $activeStudentsList,
        ];
    }
}
