<?php

namespace App\Http\Controllers\Mentor;

use App\Actions\Submission\CreateSubmissionAction;
use App\Actions\Submission\PublishSubmissionAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Submission\StoreSubmissionRequest;
use App\Models\CareerGroup;
use App\Models\StudentSubmission;
use App\Models\Submission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SubmissionController extends Controller
{
    public function store(
        StoreSubmissionRequest $request,
        CareerGroup $group,
        CreateSubmissionAction $action
    ): RedirectResponse {
        $this->authorize('create', [Submission::class, $group]);

        $data = $request->validated();

        if ($request->hasFile('attachment')) {
            $data['attachment'] = $request->file('attachment')
                ->store("submissions/{$group->id}/attachments", 's3');
        }

        $action->execute(
            $data,
            $group,
            Auth::User()
        );

        return back()->with('success', 'Submission created successfully.');
    }

    public function publish(
        Submission $submission,
        PublishSubmissionAction $action
    ): RedirectResponse {
        $this->authorize('publish', $submission);

        try {
            $action->execute($submission);
        } catch (\Exception $e) {
            return back()->withErrors([
                'submission' => $e->getMessage(),
            ]);
        }

        return back()->with('success', 'Submission published successfully.');
    }

    public function index(CareerGroup $group)
    {
        $submissions = Submission::where('group_id', $group->id)
            ->latest()
            ->get();

        return Inertia::render('Mentor/Submissions/Index', [
            'group' => $group,
            'submissions' => $submissions,
        ]);
    }

    public function create(CareerGroup $group)
    {
        return Inertia::render('Mentor/Submissions/Create', [
            'group' => $group,
        ]);
    }

    public function show(Submission $submission)
    {
        $studentSubmissions = StudentSubmission::with('student')
            ->where('submission_id', $submission->id)
            ->get()
            ->map(function ($sub) {
                return [
                    'id' => (string) $sub->_id,
                    'slug' => $sub->slug ?: (string) $sub->_id,
                    'student_name' => $sub->student ? $sub->student->name : 'Unknown',
                    'status' => $sub->status,
                    'submitted_at' => $sub->created_at ? $sub->created_at->toISOString() : null,
                ];
            });

        return Inertia::render('Mentor/Submissions/Show', [
            'submission' => $submission,
            'studentSubmissions' => $studentSubmissions,
        ]);
    }

    public function edit(Submission $submission)
    {
        return Inertia::render('Mentor/Submissions/Edit', [
            'submission' => $submission,
        ]);
    }

    public function update(
        StoreSubmissionRequest $request,
        Submission $submission
    ): RedirectResponse {
        $data = $request->validated();

        if ($request->hasFile('attachment')) {
            $data['attachment'] = $request->file('attachment')
                ->store("submissions/{$submission->group_id}/attachments", 's3');
        }

        $submission->update($data);

        return redirect()
            ->route('mentor.submissions.index', $submission->group_id)
            ->with('success', 'Submission updated successfully.');
    }
}
