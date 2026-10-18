<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\Mime\MimeTypes;

class MediaController extends Controller
{
    /**
     * Stream a media file from the S3 disk (with local public disk fallback)
     * so that internal application URLs (/media/...) are used instead of direct S3 bucket URLs.
     */
    public function show(Request $request, string $path): StreamedResponse
    {
        $cleanPath = ltrim(trim($path), '/');

        if ($cleanPath === '' || str_contains($cleanPath, '..')) {
            abort(404);
        }

        $stream = Storage::disk('s3')->readStream($cleanPath);

        if (! is_resource($stream) && Storage::disk('public')->exists($cleanPath)) {
            $stream = Storage::disk('public')->readStream($cleanPath);
        }

        if (! is_resource($stream)) {
            abort(404);
        }

        $extension = strtolower(pathinfo($cleanPath, PATHINFO_EXTENSION));
        $mimeTypes = $extension !== '' ? MimeTypes::getDefault()->getMimeTypes($extension) : [];
        $mimeType = $mimeTypes[0] ?? 'application/octet-stream';

        $dispositionType = $request->boolean('download') ? 'attachment' : 'inline';
        $filename = addslashes(basename($cleanPath));

        return response()->stream(function () use ($stream): void {
            fpassthru($stream);

            if (is_resource($stream)) {
                fclose($stream);
            }
        }, 200, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => "{$dispositionType}; filename=\"{$filename}\"",
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
