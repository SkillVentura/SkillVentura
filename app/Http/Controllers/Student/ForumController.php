<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseStudent;
use App\Models\ForumMessage;
use App\Models\User;
use App\Services\Admin\UserDetailService;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ForumController extends Controller
{
    /**
     * Get user profile details for modal popover on click avatar.
     */
    public function userProfile(User $user, UserDetailService $userDetailService): JsonResponse
    {
        $user->load(['character']);
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('s3');

        $details = [];
        if ($user->role === 'student') {
            $details = $userDetailService->getStudentDetails($user);
        } elseif ($user->role === 'mentor') {
            $details = $userDetailService->getMentorDetails($user);
        }

        $coursesTaken = [];
        if ($user->role === 'student' && isset($details['course_history'])) {
            $coursesTaken = collect($details['course_history'])->map(function ($ch) {
                return [
                    'name' => $ch['course_name'],
                    'thumbnail' => $ch['thumbnail_url'],
                ];
            })->all();
        } elseif ($user->role === 'mentor' && isset($details['courses'])) {
            $coursesTaken = collect($details['courses'])->map(function ($c) {
                return [
                    'name' => $c['course_name'],
                    'thumbnail' => $c['thumbnail_url'],
                ];
            })->all();
        }

        $rankName = null;
        $rankImage = null;
        if (isset($details['gamification']['rank'])) {
            $rankName = $details['gamification']['rank']['name'] ?? null;
            $rankImage = $details['gamification']['rank']['image'] ?? null;
        }

        return response()->json([
            'id' => (string) $user->_id,
            'name' => $user->name,
            'username' => $user->username,
            'avatar' => $user->avatar ? $disk->url($user->avatar) : null,
            'role' => $user->role,
            'level' => $details['gamification']['level'] ?? 1,
            'rank_name' => $rankName,
            'rank_image' => $rankImage,
            'character_name' => $user->character->name ?? null,
            'character_avatar' => $user->character->avatar_url ?? null,
            'linkedin' => $user->linkedin ?? null,
            'courses' => $coursesTaken,
            'erp' => $details['gamification']['rank']['total_score'] ?? ($details['gamification']['erp'] ?? 0),
        ]);
    }

    /**
     * Display the student forum page.
     */
    public function index(Request $request, ?Course $course = null): Response|RedirectResponse
    {
        $user = $request->user();

        // 1. Jika course dispesifikasikan secara eksplisit, validasi otorisasi dulu
        if ($course && $course->exists) {
            if ($user->isStudent()) {
                $isEnrolled = CourseStudent::where('user_id', $user->_id)
                    ->where('course_id', $course->_id)
                    ->exists();
                if (! $isEnrolled) {
                    abort(403, 'Anda tidak terdaftar di kelas ini.');
                }
            }
        }

        // 2. Ambil daftar kursus berdasarkan peran (role)
        if ($user->isStudent()) {
            $enrolledCourseIds = CourseStudent::where('user_id', $user->_id)
                ->pluck('course_id')
                ->toArray();
            $courses = Course::whereIn('_id', $enrolledCourseIds)
                ->where('status', 'published')
                ->get();
        } else {
            // Mentor dan Admin dapat mengakses seluruh kelas yang terbit
            $courses = Course::where('status', 'published')->get();
        }

        // 3. Jika tidak ada kelas sama sekali
        if ($courses->isEmpty()) {
            return Inertia::render('Student/Forum/Index', [
                'courses' => [],
                'selectedCourse' => null,
                'messages' => [],
                'pinnedMessages' => [],
            ]);
        }

        // 4. Tentukan kursus yang aktif dipilih
        if (! $course || ! $course->exists) {
            $course = $courses->first();
        }

        // 5. Map daftar kursus beserta pesan terakhir untuk Sidebar
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('s3');
        $courseList = $courses->map(function ($c) {
            $lastMessage = ForumMessage::where('course_id', $c->_id)
                ->with('sender')
                ->latest('created_at')
                ->first();

            $lastMsgData = null;
            if ($lastMessage) {
                $lastMsgData = [
                    'sender_name' => $lastMessage->sender ? $lastMessage->sender->name : 'Sistem',
                    'message' => $lastMessage->message ?? ($lastMessage->attachments ? '[Gambar]' : ''),
                    'created_at' => $lastMessage->created_at->toIso8601String(),
                ];
            }

            return [
                'id' => (string) $c->_id,
                'title' => $c->title,
                'slug' => $c->slug,
                'thumbnail' => $c->thumbnail_url,
                'last_message' => $lastMsgData,
            ];
        });

        // 6. Muat daftar pesan yang disematkan (pinned messages)
        $pinnedMessages = ForumMessage::where('course_id', $course->_id)
            ->where('is_pinned', true)
            ->with('sender')
            ->get()
            ->map(function ($msg) {
                return [
                    'id' => (string) $msg->_id,
                    'message' => $msg->message ?? ($msg->attachments ? '[Gambar]' : ''),
                    'sender_name' => $msg->sender ? $msg->sender->name : 'Sistem',
                ];
            });

        // 7. Muat riwayat pesan untuk kursus yang aktif
        $messages = ForumMessage::where('course_id', $course->_id)
            ->with(['sender', 'parent.sender'])
            ->latest('created_at')
            ->limit(100)
            ->get()
            ->reverse()
            ->values()
            ->map(function ($msg) use ($disk) {
                $avatarUrl = null;
                if ($msg->sender && $msg->sender->avatar) {
                    $avatarUrl = $disk->url($msg->sender->avatar);
                }

                $attachments = [];
                if ($msg->attachments) {
                    foreach ($msg->attachments as $attach) {
                        $attachments[] = $disk->url($attach);
                    }
                }

                $parentData = null;
                if ($msg->parent) {
                    $parentData = [
                        'id' => (string) $msg->parent->_id,
                        'message' => $msg->parent->message ?? ($msg->parent->attachments ? '[Gambar]' : ''),
                        'sender_name' => $msg->parent->sender ? $msg->parent->sender->name : 'Sistem',
                        'sender_id' => $msg->parent->sender ? (string) $msg->parent->sender->_id : null,
                    ];
                }

                return [
                    'id' => (string) $msg->_id,
                    'message' => $msg->message,
                    'attachments' => $attachments,
                    'created_at' => $msg->created_at->toIso8601String(),
                    'parent' => $parentData,
                    'reactions' => $msg->reactions ?: [],
                    'is_pinned' => (bool) $msg->is_pinned,
                    'sender' => $msg->sender ? [
                        'id' => (string) $msg->sender->_id,
                        'name' => $msg->sender->name,
                        'avatar' => $avatarUrl,
                        'role' => $msg->sender->role,
                    ] : [
                        'id' => (string) ($msg->user_id ?? 'deleted'),
                        'name' => 'Pengguna Dihapus',
                        'avatar' => null,
                        'role' => 'student',
                    ],
                ];
            });

        return Inertia::render('Student/Forum/Index', [
            'courses' => $courseList,
            'selectedCourse' => [
                'id' => (string) $course->_id,
                'title' => $course->title,
                'slug' => $course->slug,
                'thumbnail' => $course->thumbnail_url,
            ],
            'messages' => $messages,
            'pinnedMessages' => $pinnedMessages,
        ]);
    }

    /**
     * Get messages for polling.
     */
    public function getMessages(Request $request, Course $course): JsonResponse
    {
        $user = $request->user();

        // Validasi akses siswa
        if ($user->isStudent()) {
            $isEnrolled = CourseStudent::where('user_id', (string) $user->_id)
                ->where('course_id', (string) $course->_id)
                ->exists();
            if (! $isEnrolled) {
                return response()->json(['error' => 'Forbidden'], 403);
            }
        }

        $query = ForumMessage::where('course_id', (string) $course->_id);

        if ($request->filled('after_id')) {
            $query->where('_id', '>', $request->after_id);
        } else {
            $query->latest('created_at')->limit(50);
        }

        $messages = $query->with(['sender', 'parent.sender'])->get();

        if (! $request->filled('after_id')) {
            $messages = $messages->reverse()->values();
        }

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('s3');
        $data = $messages->map(function ($msg) use ($disk) {
            $avatarUrl = null;
            if ($msg->sender && $msg->sender->avatar) {
                $avatarUrl = $disk->url($msg->sender->avatar);
            }

            $attachments = [];
            if ($msg->attachments) {
                foreach ($msg->attachments as $attach) {
                    $attachments[] = $disk->url($attach);
                }
            }

            $parentData = null;
            if ($msg->parent) {
                $parentData = [
                    'id' => (string) $msg->parent->_id,
                    'message' => $msg->parent->message ?? ($msg->parent->attachments ? '[Gambar]' : ''),
                    'sender_name' => $msg->parent->sender ? $msg->parent->sender->name : 'Sistem',
                    'sender_id' => $msg->parent->sender ? (string) $msg->parent->sender->_id : null,
                ];
            }

            return [
                'id' => (string) $msg->_id,
                'message' => $msg->message,
                'attachments' => $attachments,
                'created_at' => $msg->created_at->toIso8601String(),
                'parent' => $parentData,
                'reactions' => $msg->reactions ?: [],
                'is_pinned' => (bool) $msg->is_pinned,
                'sender' => $msg->sender ? [
                    'id' => (string) $msg->sender->_id,
                    'name' => $msg->sender->name,
                    'avatar' => $avatarUrl,
                    'role' => $msg->sender->role,
                ] : [
                    'id' => (string) ($msg->user_id ?? 'deleted'),
                    'name' => 'Pengguna Dihapus',
                    'avatar' => null,
                    'role' => 'student',
                ],
            ];
        });

        return response()->json($data);
    }

    /**
     * Store a new forum message.
     */
    public function store(Request $request, Course $course): RedirectResponse|JsonResponse
    {
        $user = $request->user();

        // Validasi akses siswa
        if ($user->isStudent()) {
            $isEnrolled = CourseStudent::where('user_id', $user->_id)
                ->where('course_id', $course->_id)
                ->exists();
            if (! $isEnrolled) {
                abort(403, 'Anda tidak terdaftar di kelas ini.');
            }
        }

        $request->validate([
            'message' => 'required_without:attachment|nullable|string|max:10000',
            'attachment' => 'nullable|image|max:2048',
            'parent_id' => 'nullable|string',
        ]);

        $attachments = [];
        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('forum_attachments', 's3');
            $attachments[] = $path;
        }

        $msg = ForumMessage::create([
            'course_id' => $course->_id,
            'user_id' => $user->_id,
            'message' => $request->message,
            'attachments' => $attachments,
            'parent_id' => $request->parent_id ?: null,
            'reactions' => [],
            'is_pinned' => false,
        ]);

        if ($request->wantsJson()) {
            /** @var FilesystemAdapter $disk */
            $disk = Storage::disk('s3');
            $avatarUrl = null;
            if ($user->avatar) {
                $avatarUrl = $disk->url($user->avatar);
            }

            $attachmentUrls = [];
            foreach ($attachments as $attach) {
                $attachmentUrls[] = $disk->url($attach);
            }

            $parentData = null;
            if ($msg->parent) {
                $parentData = [
                    'id' => (string) $msg->parent->_id,
                    'message' => $msg->parent->message ?? ($msg->parent->attachments ? '[Gambar]' : ''),
                    'sender_name' => $msg->parent->sender ? $msg->parent->sender->name : 'Sistem',
                    'sender_id' => $msg->parent->sender ? (string) $msg->parent->sender->_id : null,
                ];
            }

            return response()->json([
                'id' => (string) $msg->_id,
                'message' => $msg->message,
                'attachments' => $attachmentUrls,
                'created_at' => $msg->created_at->toIso8601String(),
                'parent' => $parentData,
                'reactions' => [],
                'is_pinned' => false,
                'sender' => [
                    'id' => (string) $user->_id,
                    'name' => $user->name,
                    'avatar' => $avatarUrl,
                    'role' => $user->role,
                ],
            ]);
        }

        return back();
    }

    /**
     * Toggle a reaction on a message.
     */
    public function toggleReaction(Request $request, ForumMessage $message): RedirectResponse
    {
        $user = $request->user();

        $request->validate([
            'emoji' => 'required|string|max:10',
        ]);

        $emoji = $request->emoji;
        $reactions = $message->reactions ?: [];

        $foundIndex = -1;
        foreach ($reactions as $index => $reaction) {
            if ($reaction['user_id'] === $user->_id) {
                $foundIndex = $index;
                break;
            }
        }

        if ($foundIndex !== -1) {
            // Jika emoji sama, hapus
            if ($reactions[$foundIndex]['emoji'] === $emoji) {
                array_splice($reactions, $foundIndex, 1);
            } else {
                // Jika emoji berbeda, perbarui
                $reactions[$foundIndex]['emoji'] = $emoji;
                $reactions[$foundIndex]['user_name'] = $user->name;
            }
        } else {
            // Reaksi baru
            $reactions[] = [
                'user_id' => $user->_id,
                'user_name' => $user->name,
                'emoji' => $emoji,
            ];
        }

        $message->update(['reactions' => $reactions]);

        return back();
    }

    /**
     * Toggle pin status on a message.
     */
    public function togglePin(Request $request, ForumMessage $message): RedirectResponse
    {
        $user = $request->user();

        // Hanya mentor dan admin yang diizinkan melakukan pin
        if ($user->isStudent()) {
            abort(403, 'Hanya Mentor dan Admin yang dapat menyematkan pesan.');
        }

        $newPinStatus = ! $message->is_pinned;
        $message->update(['is_pinned' => $newPinStatus]);

        return back();
    }

    /**
     * Update the message content (Edit).
     */
    public function update(Request $request, ForumMessage $message): RedirectResponse
    {
        $user = $request->user();

        // Hanya pemilik pesan yang boleh mengedit
        if ((string) $message->user_id !== (string) $user->_id) {
            abort(403, 'Anda tidak diizinkan mengubah pesan ini.');
        }

        $request->validate([
            'message' => 'required|string',
        ]);

        $message->update([
            'message' => $request->message,
        ]);

        return back();
    }

    /**
     * Delete the message (Hapus).
     */
    public function destroy(Request $request, ForumMessage $message): RedirectResponse
    {
        $user = $request->user();

        // Pemilik pesan OR mentor/admin boleh menghapus
        $isOwner = (string) $message->user_id === (string) $user->_id;
        $isModerator = $user->isMentor() || $user->isAdmin();

        if (! $isOwner && ! $isModerator) {
            abort(403, 'Anda tidak diizinkan menghapus pesan ini.');
        }

        // Hapus attachment jika ada
        if (! empty($message->attachments)) {
            foreach ($message->attachments as $attachment) {
                $path = is_array($attachment) ? ($attachment['path'] ?? null) : $attachment;
                if ($path && is_string($path)) {
                    Storage::disk('s3')->delete($path);
                }
            }
        }

        $message->delete();

        return back();
    }

    /**
     * Download a forum attachment securely, acting as a proxy to bypass CORS.
     */
    public function downloadAttachment(Request $request)
    {
        $url = $request->query('url');

        if (! $url) {
            abort(400, 'Parameter URL diperlukan.');
        }

        if (! str_contains($url, 'forum_attachments') && ! str_contains($url, 'storage')) {
            abort(403, 'Akses ditolak.');
        }

        if (preg_match('#(?:^|/)(forum_attachments/[^?\#]+)#', (string) $url, $matches)) {
            $s3Path = ltrim($matches[1], '/');
            /** @var FilesystemAdapter $disk */
            $disk = Storage::disk('s3');

            if ($disk->exists($s3Path)) {
                return $disk->download($s3Path, basename($s3Path));
            }
        }

        try {
            $filename = basename(parse_url($url, PHP_URL_PATH)) ?: 'lampiran';

            return response()->streamDownload(function () use ($url) {
                $stream = Http::withOptions([
                    'stream' => true,
                    'verify' => false,
                ])->get($url)->getBody();

                while (! $stream->eof()) {
                    echo $stream->read(1024 * 8);
                }
            }, $filename);
        } catch (\Exception $e) {
            return redirect($url);
        }
    }
}
