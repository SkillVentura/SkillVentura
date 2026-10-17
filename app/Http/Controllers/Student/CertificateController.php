<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\StudentSubmission;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class CertificateController extends Controller
{
    public function index()
    {
        $certificates = StudentSubmission::where('student_id', Auth::User()->id)
            ->whereNotNull('certificate_path')
            ->with('submission.group')
            ->latest()
            ->get()
            ->map(function (StudentSubmission $sub) {
                $certId = $sub->certificate_id ?: strtoupper(substr(md5((string) $sub->id), 0, 12));

                return [
                    'id' => $sub->id,
                    'certificate_id' => $certId,
                    'course_name' => $sub->submission->group->name ?? 'SkillVentura Course',
                    'assignment_title' => $sub->submission->title,
                    'certificate_url' => $sub->certificate_url,
                ];
            });

        return Inertia::render('Student/Certificates/Index', [
            'certificates' => $certificates,
        ]);
    }

    /**
     * Stream certificate PDF inline using the clean 12-char certificate_id.
     */
    public function show(string $certificateId): Response
    {
        $normalizedId = strtoupper(trim($certificateId));

        $submission = StudentSubmission::where('certificate_id', $normalizedId)
            ->whereNotNull('certificate_path')
            ->with(['student', 'submission'])
            ->first();

        if (! $submission) {
            $submission = StudentSubmission::whereNotNull('certificate_path')
                ->with(['student', 'submission'])
                ->get()
                ->first(function (StudentSubmission $item) use ($normalizedId) {
                    $docId = (string) ($item->id ?? $item->_id ?? '');

                    return strtoupper(substr(md5($docId), 0, 12)) === $normalizedId;
                });

            if ($submission && empty($submission->getRawOriginal('certificate_id'))) {
                $submission->update(['certificate_id' => $normalizedId]);
            }
        }

        if (! $submission || ! $submission->certificate_path) {
            abort(404, 'Sertifikat tidak ditemukan.');
        }

        $disk = Storage::disk('s3');
        if (! $disk->exists($submission->certificate_path)) {
            abort(404, 'Berkas sertifikat tidak ditemukan di penyimpanan cloud.');
        }

        $content = $disk->get($submission->certificate_path);
        $studentSlug = Str::slug($submission->student->name ?? 'Student');
        $filename = "Certificate-{$normalizedId}-{$studentSlug}.pdf";

        return response($content, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$filename.'"',
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }
}
