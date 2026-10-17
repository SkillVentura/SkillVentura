<?php

namespace App\Http\Controllers\Student;

use App\Actions\Submission\NotifyMentorOfSubmissionAction;
use App\Http\Controllers\Controller;
use App\Models\CareerGroup;
use App\Models\StudentSubmission;
use App\Models\Submission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class SubmissionController extends Controller
{
    public function index(CareerGroup $group)
    {
        // Get all published submissions for this group
        $submissions = Submission::where('group_id', (string) $group->id)
            ->where('status', 'published')
            ->latest()
            ->get();

        $submissionIds = $submissions->map(fn ($s) => (string) ($s->id ?? $s->_id))->toArray();

        // Get student's current submissions for these
        $studentSubmissions = StudentSubmission::where('student_id', (string) Auth::id())
            ->whereIn('submission_id', $submissionIds)
            ->get()
            ->keyBy(fn ($item) => (string) $item->submission_id);

        return Inertia::render('Student/Submissions/Index', [
            'group' => $group,
            'submissions' => $submissions,
            'studentSubmissions' => $studentSubmissions,
        ]);
    }

    public function show(Submission $submission)
    {
        // Ensure submission is published
        if ($submission->status !== 'published') {
            abort(404);
        }

        // Ensure we send related group and group mentor info
        $submission->load(['group.mentor']);

        // Get student's submission if exists
        $studentSubmission = StudentSubmission::where('submission_id', (string) ($submission->id ?? $submission->_id))
            ->where('student_id', (string) Auth::id())
            ->first();

        return Inertia::render('Student/Submissions/Show', [
            'submission' => $submission,
            'studentSubmission' => $studentSubmission,
        ]);
    }

    public function store(Request $request, Submission $submission)
    {
        // Validate request based on submission type
        $rules = [
            'notes' => 'nullable|string',
        ];

        if ($submission->submission_type === 'file') {
            $rules['file'] = 'required|file|max:10240'; // 10MB max
        } elseif ($submission->submission_type === 'link') {
            $rules['link'] = 'required|url';
        }

        $validated = $request->validate($rules);

        $subId = (string) ($submission->id ?? $submission->_id);
        $studentId = (string) Auth::id();

        // Cegah perubahan jika tugas sudah dinilai oleh mentor
        $existing = StudentSubmission::where('submission_id', $subId)
            ->where('student_id', $studentId)
            ->first();

        if ($existing && ($existing->status === 'graded' || $existing->grade !== null)) {
            return back()->withErrors([
                'file' => 'Tugas ini sudah dinilai oleh mentor dan tidak dapat diubah lagi.',
                'link' => 'Tugas ini sudah dinilai oleh mentor dan tidak dapat diubah lagi.',
            ]);
        }

        $data = [
            'submission_id' => $subId,
            'student_id' => $studentId,
            'notes' => $validated['notes'] ?? null,
            'status' => 'submitted',
        ];

        if ($request->hasFile('file')) {
            if ($existing && $existing->file_path && Storage::disk('s3')->exists($existing->file_path)) {
                Storage::disk('s3')->delete($existing->file_path);
            }

            $data['file_path'] = $request->file('file')->store("student_submissions/{$subId}", 's3');
        }

        if (isset($validated['link'])) {
            $data['link'] = $validated['link'];
        }

        // Update or Create
        $studentSubmission = StudentSubmission::updateOrCreate(
            [
                'submission_id' => $subId,
                'student_id' => $studentId,
            ],
            $data
        );

        // Notify Mentors
        app(NotifyMentorOfSubmissionAction::class)->execute($studentSubmission, Auth::User());

        return back()->with('success', 'Your work has been submitted successfully.');
    }

    /**
     * Stream or download the assignment attachment uploaded by the Mentor.
     */
    public function downloadAttachment(Submission $submission): Response
    {
        if (! $submission->attachment) {
            abort(404, 'Lampiran tugas tidak ditemukan.');
        }

        $disk = Storage::disk('s3');
        if (! $disk->exists($submission->attachment)) {
            if (Storage::disk('public')->exists($submission->attachment)) {
                $disk = Storage::disk('public');
            } else {
                abort(404, 'Berkas lampiran tidak ditemukan di penyimpanan cloud.');
            }
        }

        $ext = pathinfo($submission->attachment, PATHINFO_EXTENSION);
        $slugTitle = Str::slug($submission->title ?: 'Assignment');
        $filename = $ext ? "Attachment-{$slugTitle}.{$ext}" : "Attachment-{$slugTitle}";

        return $disk->response($submission->attachment, $filename);
    }

    /**
     * Stream or download the submission file uploaded by the Student.
     */
    public function downloadFile(Request $request, StudentSubmission $studentSubmission): Response
    {
        $user = $request->user();
        $isOwner = (string) ($user->id ?? $user->_id) === (string) $studentSubmission->student_id;

        if (! $isOwner && ! in_array($user->role, ['mentor', 'admin'], true)) {
            abort(403, 'Anda tidak memiliki akses ke berkas tugas ini.');
        }

        if (! $studentSubmission->file_path) {
            abort(404, 'Berkas jawaban tugas tidak ditemukan.');
        }

        $disk = Storage::disk('s3');
        if (! $disk->exists($studentSubmission->file_path)) {
            if (Storage::disk('public')->exists($studentSubmission->file_path)) {
                $disk = Storage::disk('public');
            } else {
                abort(404, 'Berkas jawaban tugas tidak ditemukan di penyimpanan cloud.');
            }
        }

        $studentSubmission->loadMissing(['student', 'submission']);
        $ext = pathinfo($studentSubmission->file_path, PATHINFO_EXTENSION);
        $studentSlug = Str::slug($studentSubmission->student->name ?? 'Student');
        $assignmentSlug = Str::slug($studentSubmission->submission->title ?? 'Submission');
        $filename = $ext
            ? "Submission-{$assignmentSlug}-{$studentSlug}.{$ext}"
            : "Submission-{$assignmentSlug}-{$studentSlug}";

        return $disk->response($studentSubmission->file_path, $filename);
    }
}
