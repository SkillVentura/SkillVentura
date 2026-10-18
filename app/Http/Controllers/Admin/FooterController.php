<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Footer\SaveFooterItemRequest;
use App\Http\Requests\Footer\UpdateFooterSettingRequest;
use App\Http\Requests\Footer\UpdateFooterSocialLinksRequest;
use App\Models\FooterItem;
use App\Models\FooterSetting;
use App\Services\FooterService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class FooterController extends Controller
{
    /**
     * Reserved top-level paths that cannot be used as footer page slugs.
     *
     * @var array<int, string>
     */
    private const RESERVED_SLUGS = [
        'admin',
        'mentor',
        'dashboard',
        'login',
        'register',
        'logout',
        'forgot-password',
        'reset-password',
        'two-factor-challenge',
        'user',
        'email',
        'settings',
        'signature',
        'donation-banner',
        'quests',
        'forum',
        'courses',
        'course',
        'modules',
        'paths',
        'quiz',
        'select-career',
        'leaderboard',
        'career-groups',
        'submissions',
        'notifications',
        'select-character',
        'certificates',
        'mentors',
        'profile',
        'auth',
        'up',
        'storage',
        'sanctum',
        'api',
    ];

    public function __construct(public FooterService $footerService) {}

    /**
     * Display the Admin Footer CMS dashboard.
     */
    public function index(): Response
    {
        $settings = $this->footerService->getSettingsPayload();
        $items = $this->footerService->getItemsPayload(false);

        return Inertia::render('Admin/Footer/Index', [
            'settings' => $settings,
            'items' => $items,
            'stats' => [
                'total_items' => count($items),
                'active_items' => count(array_filter($items, fn (array $i) => ! empty($i['is_active']))),
                'program_count' => count(array_filter($items, fn (array $i) => ($i['category'] ?? '') === 'program')),
                'company_count' => count(array_filter($items, fn (array $i) => ($i['category'] ?? '') === 'company')),
                'support_count' => count(array_filter($items, fn (array $i) => ($i['category'] ?? '') === 'support')),
                'active_socials' => count(array_filter($settings['social_links'] ?? [], fn (array $s) => ! empty($s['is_active']) && ! empty($s['url']))),
            ],
        ]);
    }

    /**
     * Update general footer brand, contact, logo, and copyright settings.
     */
    public function updateSettings(UpdateFooterSettingRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $setting = FooterSetting::latest()->first();
        $logoPath = $setting?->logo_path;

        if ($request->boolean('remove_logo')) {
            if ($logoPath && ! str_starts_with($logoPath, '/') && Storage::disk('s3')->exists($logoPath)) {
                Storage::disk('s3')->delete($logoPath);
            }
            $logoPath = null;
        }

        if ($request->hasFile('logo')) {
            if ($logoPath && ! str_starts_with($logoPath, '/') && Storage::disk('s3')->exists($logoPath)) {
                Storage::disk('s3')->delete($logoPath);
            }
            $logoPath = $request->file('logo')->store('footer/logos', 's3');
        }

        $payload = [
            'brand_name' => $validated['brand_name'],
            'brand_tagline' => $validated['brand_tagline'] ?? null,
            'brand_subtitle' => $validated['brand_subtitle'] ?? null,
            'brand_description' => $validated['brand_description'] ?? null,
            'logo_path' => $logoPath,
            'address' => $validated['address'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'copyright_text' => $validated['copyright_text'],
            'updated_by' => (string) $request->user()->_id,
        ];

        if ($setting) {
            $setting->update($payload);
        } else {
            $payload['social_links'] = $this->footerService->getDefaultSocialLinks();
            $payload['items_initialized'] = false;
            FooterSetting::create($payload);
        }

        return back()->with('success', 'Identitas brand dan informasi kontak footer berhasil diperbarui.');
    }

    /**
     * Update social media links array on FooterSetting.
     */
    public function updateSocialLinks(UpdateFooterSocialLinksRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $setting = FooterSetting::latest()->first();

        $normalizedSocials = [];
        foreach ($validated['social_links'] as $index => $social) {
            $normalizedSocials[] = [
                'id' => ! empty($social['id']) ? (string) $social['id'] : 'social-'.$social['platform'].'-'.($index + 1),
                'platform' => $social['platform'],
                'label' => $social['label'],
                'url' => $this->footerService->normalizeUrl($social['url'] ?? null) ?? '',
                'is_active' => (bool) $social['is_active'],
            ];
        }

        if ($setting) {
            $setting->update([
                'social_links' => $normalizedSocials,
                'updated_by' => (string) $request->user()->_id,
            ]);
        } else {
            $defaults = $this->footerService->getDefaultSettings();
            unset($defaults['id'], $defaults['logo_url']);
            FooterSetting::create(array_merge($defaults, [
                'social_links' => $normalizedSocials,
                'items_initialized' => false,
                'updated_by' => (string) $request->user()->_id,
            ]));
        }

        return back()->with('success', 'Tautan sosial media footer berhasil disimpan.');
    }

    /**
     * Create a new footer navigation & page item.
     */
    public function storeItem(SaveFooterItemRequest $request): RedirectResponse
    {
        $this->footerService->ensureItemsInitialized((string) $request->user()->_id);

        $validated = $request->validated();
        $slug = $this->generateUniqueSlug($validated['title']);

        $category = $validated['category'];
        $maxOrder = FooterItem::where('category', $category)->max('order') ?? 0;

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('footer/items', 's3');
        }

        $profileCard = null;
        if ($category === 'company' && $request->boolean('profile_enabled')) {
            $avatarPath = null;
            if ($request->hasFile('profile_avatar')) {
                $avatarPath = $request->file('profile_avatar')->store('footer/profiles', 's3');
            }

            $profileCard = [
                'enabled' => true,
                'badge' => $validated['profile_badge'] ?: 'Guild Master',
                'name' => $validated['profile_name'] ?: '',
                'role' => $validated['profile_role'] ?: '',
                'bio' => $validated['profile_bio'] ?? '',
                'avatar_path' => $avatarPath,
            ];
        }

        FooterItem::create([
            'category' => $category,
            'title' => $validated['title'],
            'slug' => $slug,
            'link_type' => $validated['link_type'],
            'external_url' => $validated['link_type'] === 'external_url'
                ? $this->footerService->normalizeUrl($validated['external_url'] ?? null)
                : null,
            'order' => ((int) $maxOrder) + 1,
            'is_active' => $request->boolean('is_active', true),
            'subtitle' => $validated['subtitle'] ?? null,
            'content' => $validated['content'] ?? null,
            'image_path' => $imagePath,
            'image_caption' => $validated['image_caption'] ?? null,
            'youtube_url' => $category === 'support'
                ? null
                : $this->footerService->normalizeUrl($validated['youtube_url'] ?? null),
            'cta_label' => $validated['cta_label'] ?? null,
            'cta_url' => $this->footerService->normalizeUrl($validated['cta_url'] ?? null),
            'profile_card' => $profileCard,
            'updated_by' => (string) $request->user()->_id,
        ]);

        return back()->with('success', 'Item menu & halaman footer "'.$validated['title'].'" berhasil ditambahkan.');
    }

    /**
     * Update an existing footer navigation & page item.
     */
    public function updateItem(SaveFooterItemRequest $request, string $id): RedirectResponse
    {
        $this->footerService->ensureItemsInitialized((string) $request->user()->_id);

        $item = $this->resolveItemByIdOrBaseline($id);
        $validated = $request->validated();

        $slug = (Str::slug((string) $item->title) === Str::slug($validated['title']) && ! empty($item->slug))
            ? (string) $item->slug
            : $this->generateUniqueSlug($validated['title'], (string) $item->_id);

        $category = $validated['category'];
        $imagePath = $item->image_path;

        if ($request->boolean('remove_image')) {
            if ($imagePath && ! str_starts_with($imagePath, '/') && Storage::disk('s3')->exists($imagePath)) {
                Storage::disk('s3')->delete($imagePath);
            }
            $imagePath = null;
        }

        if ($request->hasFile('image')) {
            if ($imagePath && ! str_starts_with($imagePath, '/') && Storage::disk('s3')->exists($imagePath)) {
                Storage::disk('s3')->delete($imagePath);
            }
            $imagePath = $request->file('image')->store('footer/items', 's3');
        }

        $existingProfile = is_array($item->profile_card) ? $item->profile_card : [];
        $profileCard = null;

        if ($category === 'company' && $request->boolean('profile_enabled')) {
            $avatarPath = $existingProfile['avatar_path'] ?? null;

            if ($request->boolean('remove_profile_avatar')) {
                if ($avatarPath && ! str_starts_with((string) $avatarPath, '/') && Storage::disk('s3')->exists((string) $avatarPath)) {
                    Storage::disk('s3')->delete((string) $avatarPath);
                }
                $avatarPath = null;
            }

            if ($request->hasFile('profile_avatar')) {
                if ($avatarPath && ! str_starts_with((string) $avatarPath, '/') && Storage::disk('s3')->exists((string) $avatarPath)) {
                    Storage::disk('s3')->delete((string) $avatarPath);
                }
                $avatarPath = $request->file('profile_avatar')->store('footer/profiles', 's3');
            }

            $profileCard = [
                'enabled' => true,
                'badge' => $validated['profile_badge'] ?: 'Guild Master',
                'name' => $validated['profile_name'] ?: '',
                'role' => $validated['profile_role'] ?: '',
                'bio' => $validated['profile_bio'] ?? '',
                'avatar_path' => $avatarPath,
            ];
        } else {
            $oldAvatar = $existingProfile['avatar_path'] ?? null;
            if ($oldAvatar && ! str_starts_with((string) $oldAvatar, '/') && Storage::disk('s3')->exists((string) $oldAvatar)) {
                Storage::disk('s3')->delete((string) $oldAvatar);
            }
        }

        $item->update([
            'category' => $category,
            'title' => $validated['title'],
            'slug' => $slug,
            'link_type' => $validated['link_type'],
            'external_url' => $validated['link_type'] === 'external_url'
                ? $this->footerService->normalizeUrl($validated['external_url'] ?? null)
                : null,
            'is_active' => $request->boolean('is_active', true),
            'subtitle' => $validated['subtitle'] ?? null,
            'content' => $validated['content'] ?? null,
            'image_path' => $imagePath,
            'image_caption' => $validated['image_caption'] ?? null,
            'youtube_url' => $category === 'support'
                ? null
                : $this->footerService->normalizeUrl($validated['youtube_url'] ?? null),
            'cta_label' => $validated['cta_label'] ?? null,
            'cta_url' => $this->footerService->normalizeUrl($validated['cta_url'] ?? null),
            'profile_card' => $profileCard,
            'updated_by' => (string) $request->user()->_id,
        ]);

        return back()->with('success', 'Informasi footer "'.$validated['title'].'" berhasil diperbarui.');
    }

    /**
     * Toggle active status of a footer item.
     */
    public function toggleItem(Request $request, string $id): RedirectResponse
    {
        $this->footerService->ensureItemsInitialized((string) $request->user()->_id);

        $item = $this->resolveItemByIdOrBaseline($id);
        $item->update([
            'is_active' => ! $item->is_active,
            'updated_by' => (string) $request->user()->_id,
        ]);

        $statusLabel = $item->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', 'Menu footer "'.$item->title.'" berhasil '.$statusLabel.'.');
    }

    /**
     * Reorder footer items within a category.
     */
    public function reorderItems(Request $request): RedirectResponse
    {
        $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'string'],
            'items.*.order' => ['required', 'integer', 'min:1'],
        ]);

        $this->footerService->ensureItemsInitialized((string) $request->user()->_id);

        foreach ($request->input('items', []) as $row) {
            $item = $this->resolveItemByIdOrBaseline((string) $row['id'], false);
            if ($item) {
                $item->update(['order' => (int) $row['order']]);
            }
        }

        return back()->with('success', 'Urutan menu footer berhasil diperbarui.');
    }

    /**
     * Delete a footer item and clean up its S3 files.
     */
    public function destroyItem(Request $request, string $id): RedirectResponse
    {
        $this->footerService->ensureItemsInitialized((string) $request->user()->_id);

        $item = $this->resolveItemByIdOrBaseline($id);
        $title = $item->title;

        if ($item->image_path && ! str_starts_with($item->image_path, '/') && Storage::disk('s3')->exists($item->image_path)) {
            Storage::disk('s3')->delete($item->image_path);
        }

        $profileCard = is_array($item->profile_card) ? $item->profile_card : [];
        $avatarPath = $profileCard['avatar_path'] ?? null;
        if ($avatarPath && ! str_starts_with((string) $avatarPath, '/') && Storage::disk('s3')->exists((string) $avatarPath)) {
            Storage::disk('s3')->delete((string) $avatarPath);
        }

        $item->delete();

        return back()->with('success', 'Menu footer "'.$title.'" berhasil dihapus.');
    }

    /**
     * Render a public footer page by slug (including /about-us and dynamic slugs).
     */
    public function showPublicPage(string $slug): Response|SymfonyResponse
    {
        $page = $this->footerService->findActivePageBySlug($slug);

        if (! $page) {
            abort(404);
        }

        if (($page['link_type'] ?? 'internal_page') === 'external_url' && ! empty($page['external_url'])) {
            return Inertia::location($page['external_url']);
        }

        return Inertia::render('FooterPage', [
            'slug' => $slug,
            'page' => $page,
        ]);
    }

    /**
     * Resolve a FooterItem by MongoDB _id or baseline-<slug> identifier.
     */
    private function resolveItemByIdOrBaseline(string $id, bool $failIfNotFound = true): ?FooterItem
    {
        if (str_starts_with($id, 'baseline-')) {
            $slug = substr($id, 9);
            $item = FooterItem::where('slug', $slug)->first();
            if (! $item && $failIfNotFound) {
                abort(404);
            }

            return $item;
        }

        return $failIfNotFound ? FooterItem::findOrFail($id) : FooterItem::find($id);
    }

    /**
     * Automatically generate a unique, non-reserved URL slug from the item title.
     */
    private function generateUniqueSlug(string $title, ?string $ignoreId = null): string
    {
        $baseSlug = Str::slug($title);

        if ($baseSlug === '') {
            $baseSlug = 'halaman-footer';
        }

        if (in_array($baseSlug, self::RESERVED_SLUGS, true)) {
            $baseSlug .= '-info';
        }

        $slug = $baseSlug;
        $counter = 2;

        while (
            in_array($slug, self::RESERVED_SLUGS, true)
            || FooterItem::where('slug', $slug)
                ->when($ignoreId !== null, fn ($q) => $q->where('_id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $baseSlug.'-'.$counter;
            $counter++;
        }

        return $slug;
    }
}
