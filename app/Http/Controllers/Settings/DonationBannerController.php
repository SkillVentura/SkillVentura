<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\DonationBanner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class DonationBannerController extends Controller
{
    public function edit(): Response
    {
        $banner = DonationBanner::latest()->first();
        $hasRecord = $banner !== null;

        return Inertia::render('settings/donation-banner', [
            'banner' => $hasRecord ? [
                'id' => (string) $banner->_id,
                'title' => $banner->title,
                'url' => $banner->url,
                'image_url' => $banner->image_url ?? ($banner->is_active ? '/images/donation-banner.jpg' : null),
                'is_active' => (bool) $banner->is_active,
            ] : [
                'id' => 'default',
                'title' => 'Support Trakteer',
                'url' => 'https://teer.id/fot98sbqcmggbrot2l0l',
                'image_url' => '/images/donation-banner.jpg',
                'is_active' => true,
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $banner = DonationBanner::latest()->first();

        if ($request->filled('url')) {
            $rawUrl = trim((string) $request->input('url'));
            if (! preg_match('~^https?://~i', $rawUrl)) {
                $request->merge(['url' => 'https://'.$rawUrl]);
            }
        }

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:150'],
            'url' => ['required', 'url', 'max:500'],
            'is_active' => ['nullable', 'boolean'],
            'image' => [
                'nullable',
                'image',
                'mimes:png,jpg,jpeg,webp',
                'max:4096',
            ],
        ]);

        $imagePath = $banner?->image_path;

        if ($request->hasFile('image')) {
            if ($imagePath && Storage::disk('s3')->exists($imagePath)) {
                Storage::disk('s3')->delete($imagePath);
            }

            $imagePath = $request->file('image')->store('donation-banners', 's3');
        }

        $payload = [
            'title' => $validated['title'] ?? null,
            'url' => $validated['url'],
            'image_path' => $imagePath,
            'is_active' => $request->boolean('is_active', true),
            'updated_by' => (string) $request->user()->_id,
        ];

        if ($banner) {
            $banner->update($payload);
        } else {
            DonationBanner::create($payload);
        }

        return back()->with('success', 'Banner donasi berhasil disimpan.');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $banner = DonationBanner::latest()->first();

        if ($banner) {
            if ($banner->image_path && Storage::disk('s3')->exists($banner->image_path)) {
                Storage::disk('s3')->delete($banner->image_path);
            }

            $banner->update([
                'title' => null,
                'url' => '',
                'image_path' => null,
                'is_active' => false,
                'updated_by' => (string) $request->user()->_id,
            ]);
        } else {
            DonationBanner::create([
                'title' => null,
                'url' => '',
                'image_path' => null,
                'is_active' => false,
                'updated_by' => (string) $request->user()->_id,
            ]);
        }

        return back()->with('success', 'Banner donasi berhasil dihapus.');
    }
}
