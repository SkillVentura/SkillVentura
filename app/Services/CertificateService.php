<?php

namespace App\Services;

use App\Models\CertificateDesign;
use App\Models\StudentSubmission;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class CertificateService
{
    /**
     * Generate or regenerate certificate PDF for a student submission.
     */
    public function generateForSubmission(StudentSubmission $studentSubmission, ?User $mentor = null): string
    {
        $studentSubmission->loadMissing('student', 'submission.group');

        if (! $mentor && $studentSubmission->graded_by) {
            $mentor = User::find($studentSubmission->graded_by);
        }

        if (! $mentor) {
            $mentor = Auth::User();
        }

        $admin = User::where('role', 'admin')->first();

        $mentorSignature = $this->getSignatureBase64($mentor?->signature_path);
        $adminSignature = $this->getSignatureBase64($admin?->signature_path);

        $activeDesign = CertificateDesign::where('is_active', true)->first();
        $backgroundImage = $activeDesign ? $this->getSignatureBase64($activeDesign->background_path) : null;
        $logoImage = ($activeDesign && $activeDesign->logo_path) ? $this->getSignatureBase64($activeDesign->logo_path) : null;

        $certificateId = strtoupper(substr(md5((string) $studentSubmission->id), 0, 12));

        $pdfData = [
            'studentName' => $studentSubmission->student->name ?? 'Student',
            'assignmentTitle' => $studentSubmission->submission->title ?? 'Course Assignment',
            'groupName' => $studentSubmission->submission->group->name ?? 'SkillVentura',
            'grade' => $studentSubmission->grade ?? 100,
            'date' => now()->format('F j, Y'),
            'mentorName' => $mentor?->name ?? 'Mentor',
            'adminName' => $admin->name ?? 'Guild Master',
            'mentorSignature' => $mentorSignature,
            'adminSignature' => $adminSignature,
            'certificateId' => $certificateId,
            'backgroundImage' => $backgroundImage,
            'logoImage' => $logoImage,
        ];

        $pdf = Pdf::loadView('certificate', $pdfData)->setPaper('a4', 'landscape');

        $filename = 'certificates/'.$studentSubmission->id.'_certificate.pdf';
        Storage::disk('s3')->put($filename, $pdf->output(), [
            'visibility' => 'public',
        ]);

        $studentSubmission->update([
            'certificate_id' => $certificateId,
            'certificate_path' => $filename,
        ]);
        $studentSubmission->touch();

        return $filename;
    }

    /**
     * Regenerate all existing certificates when signature or design is updated.
     */
    public function regenerateAllForUser(?User $user = null): int
    {
        $submissions = StudentSubmission::whereNotNull('certificate_path')
            ->where('status', 'graded')
            ->get();

        $count = 0;
        foreach ($submissions as $studentSubmission) {
            $mentorToUse = ($user && $user->role === 'mentor') ? $user : null;
            $this->generateForSubmission($studentSubmission, $mentorToUse);
            $count++;
        }

        return $count;
    }

    private function getSignatureBase64(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        $disk = Storage::disk('s3');
        if ($disk->exists($path)) {
            $content = $disk->get($path);
            if ($content) {
                $ext = pathinfo($path, PATHINFO_EXTENSION);
                $mime = 'image/'.($ext === 'jpg' ? 'jpeg' : $ext);

                return 'data:'.$mime.';base64,'.base64_encode($content);
            }
        }

        return null;
    }
}
