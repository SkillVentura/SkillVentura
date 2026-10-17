<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StudentSubmission;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubmissionController extends Controller
{
    /**
     * Display a paginated listing of student submissions for admin monitoring.
     */
    public function index(Request $request): Response
    {
        $status = $request->input('status', 'all');
        $search = $request->input('search');

        $query = StudentSubmission::with([
            'student' => fn ($q) => $q->select(['_id', 'name', 'email', 'avatar']),
            'submission' => fn ($q) => $q->select(['_id', 'group_id', 'title', 'created_by']),
            'submission.group' => fn ($q) => $q->select(['_id', 'name']),
            'submission.mentor' => fn ($q) => $q->select(['_id', 'name']),
        ])->latest();

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($search) {
            $matchingStudentIds = User::where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->get()
                ->pluck('_id')
                ->map(fn ($id) => (string) $id)
                ->toArray();

            $query->whereIn('student_id', $matchingStudentIds);
        }

        $submissions = $query->paginate(15)->withQueryString();

        $submissions->getCollection()->transform(function (StudentSubmission $sub) {
            if ($sub->student) {
                $sub->student->makeHidden(['signature_url']);
            }
            if ($sub->submission?->mentor) {
                $sub->submission->mentor->makeHidden(['signature_url']);
            }

            return [
                '_id' => (string) $sub->_id,
                'id' => (string) $sub->_id,
                'slug' => $sub->slug,
                'status' => $sub->status,
                'grade' => $sub->grade,
                'feedback' => $sub->feedback,
                'file_path' => $sub->file_path,
                'file_url' => $sub->file_url,
                'link' => $sub->link,
                'notes' => $sub->notes,
                'certificate_path' => $sub->certificate_path,
                'certificate_url' => $sub->certificate_url,
                'created_at' => $sub->created_at ? $sub->created_at->toISOString() : null,
                'created_at_formatted' => $sub->created_at ? $sub->created_at->format('d M Y, H:i') : '-',
                'student' => $sub->student ? [
                    '_id' => (string) $sub->student->_id,
                    'name' => $sub->student->name,
                    'email' => $sub->student->email,
                    'avatar' => $sub->student->avatar,
                ] : null,
                'submission' => $sub->submission ? [
                    '_id' => (string) $sub->submission->_id,
                    'title' => $sub->submission->title,
                    'group_name' => $sub->submission->group?->name ?? 'Cabang Karir',
                    'mentor_name' => $sub->submission->mentor?->name ?? 'Mentor',
                ] : null,
            ];
        });

        // 1 Single MongoDB aggregation pipeline instead of 4 sequential queries
        $rawCounts = StudentSubmission::raw(function ($collection) {
            return $collection->aggregate([
                [
                    '$group' => [
                        '_id' => '$status',
                        'count' => ['$sum' => 1],
                    ],
                ],
            ]);
        });

        $counts = [
            'all' => 0,
            'submitted' => 0,
            'graded' => 0,
            'late' => 0,
        ];

        foreach ($rawCounts as $item) {
            $st = $item->_id ?? '';
            $c = (int) ($item->count ?? 0);
            $counts['all'] += $c;
            if (isset($counts[$st])) {
                $counts[$st] = $c;
            }
        }

        return Inertia::render('Admin/Submissions/Index', [
            'submissions' => $submissions,
            'filters' => [
                'status' => $status,
                'search' => $search ?? '',
            ],
            'counts' => $counts,
        ]);
    }
}
