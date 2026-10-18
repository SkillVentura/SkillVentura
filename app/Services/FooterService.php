<?php

namespace App\Services;

use App\Models\FooterItem;
use App\Models\FooterSetting;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;

class FooterService
{
    /**
     * Get the default general footer settings matching the existing brand configuration.
     *
     * @return array<string, mixed>
     */
    public function getDefaultSettings(): array
    {
        return [
            'id' => 'default',
            'brand_name' => 'SKILL VENTURA',
            'brand_tagline' => 'Learn Like a Hero, Grow Like a Pro',
            'brand_subtitle' => 'Learn in SKILL VENTURA',
            'brand_description' => 'A gamified learning platform where you level up through real projects, missions, and a guided skill-building roadmap.',
            'logo_url' => '/images/logo.webp',
            'address' => 'Bogor, Indonesia',
            'phone' => '+62 223 4432 5968',
            'copyright_text' => '© SKILL VENTURA Learn. All Rights Reserved',
            'social_links' => $this->getDefaultSocialLinks(),
        ];
    }

    /**
     * Get the default social media platforms configuration.
     *
     * @return array<int, array{id: string, platform: string, label: string, url: string, is_active: bool}>
     */
    public function getDefaultSocialLinks(): array
    {
        return [
            [
                'id' => 'social-instagram',
                'platform' => 'instagram',
                'label' => 'Instagram',
                'url' => '',
                'is_active' => true,
            ],
            [
                'id' => 'social-whatsapp',
                'platform' => 'whatsapp',
                'label' => 'WhatsApp',
                'url' => '',
                'is_active' => true,
            ],
            [
                'id' => 'social-facebook',
                'platform' => 'facebook',
                'label' => 'Facebook',
                'url' => '',
                'is_active' => true,
            ],
            [
                'id' => 'social-github',
                'platform' => 'github',
                'label' => 'GitHub',
                'url' => '',
                'is_active' => true,
            ],
            [
                'id' => 'social-x',
                'platform' => 'x',
                'label' => 'X (Twitter)',
                'url' => '',
                'is_active' => true,
            ],
            [
                'id' => 'social-linkedin',
                'platform' => 'linkedin',
                'label' => 'LinkedIn',
                'url' => '',
                'is_active' => true,
            ],
        ];
    }

    /**
     * Get the baseline navigation items for the 3 footer categories.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getBaselineItems(): array
    {
        return [
            // PROGRAM
            [
                'category' => 'program',
                'title' => 'Online course',
                'slug' => 'online-course',
                'link_type' => 'internal_page',
                'external_url' => null,
                'order' => 1,
                'is_active' => true,
                'subtitle' => 'Program pembelajaran mandiri terarah dengan kurikulum berbasis industri.',
                'content' => null,
                'image_path' => null,
                'image_caption' => null,
                'youtube_url' => null,
                'cta_label' => null,
                'cta_url' => null,
                'profile_card' => null,
            ],
            [
                'category' => 'program',
                'title' => 'Bootcamp',
                'slug' => 'bootcamp',
                'link_type' => 'internal_page',
                'external_url' => null,
                'order' => 2,
                'is_active' => true,
                'subtitle' => 'Program intensif berbasis proyek nyata bersama mentor berpengalaman.',
                'content' => null,
                'image_path' => null,
                'image_caption' => null,
                'youtube_url' => null,
                'cta_label' => null,
                'cta_url' => null,
                'profile_card' => null,
            ],
            [
                'category' => 'program',
                'title' => 'Learn gaming',
                'slug' => 'learn-gaming',
                'link_type' => 'internal_page',
                'external_url' => null,
                'order' => 3,
                'is_active' => true,
                'subtitle' => 'Pengalaman belajar bergaya RPG dengan sistem level, quest, dan leaderboard.',
                'content' => null,
                'image_path' => null,
                'image_caption' => null,
                'youtube_url' => null,
                'cta_label' => null,
                'cta_url' => null,
                'profile_card' => null,
            ],
            [
                'category' => 'program',
                'title' => 'Corporate training',
                'slug' => 'corporate-training',
                'link_type' => 'internal_page',
                'external_url' => null,
                'order' => 4,
                'is_active' => true,
                'subtitle' => 'Pelatihan peningkatan kompetensi teknologi untuk tim dan institusi.',
                'content' => null,
                'image_path' => null,
                'image_caption' => null,
                'youtube_url' => null,
                'cta_label' => null,
                'cta_url' => null,
                'profile_card' => null,
            ],
            [
                'category' => 'program',
                'title' => 'Partnership',
                'slug' => 'partnership',
                'link_type' => 'internal_page',
                'external_url' => null,
                'order' => 5,
                'is_active' => true,
                'subtitle' => 'Kolaborasi strategis bersama mitra industri, kampus, dan komunitas.',
                'content' => null,
                'image_path' => null,
                'image_caption' => null,
                'youtube_url' => null,
                'cta_label' => null,
                'cta_url' => null,
                'profile_card' => null,
            ],

            // COMPANY
            [
                'category' => 'company',
                'title' => 'About us',
                'slug' => 'about-us',
                'link_type' => 'internal_page',
                'external_url' => null,
                'order' => 1,
                'is_active' => true,
                'subtitle' => 'Mengenal visi, misi, dan sosok di balik ekosistem pembelajaran SkillVentura.',
                'content' => null,
                'image_path' => null,
                'image_caption' => null,
                'youtube_url' => null,
                'cta_label' => null,
                'cta_url' => null,
                'profile_card' => [
                    'enabled' => true,
                    'badge' => 'Guild Master',
                    'name' => 'Ir. Ridwan Satrio Hadikusumo S.T., M.T.',
                    'role' => 'Guild Master',
                    'bio' => '',
                    'avatar_path' => null,
                ],
            ],
            [
                'category' => 'company',
                'title' => 'Blog',
                'slug' => 'blog',
                'link_type' => 'internal_page',
                'external_url' => null,
                'order' => 2,
                'is_active' => true,
                'subtitle' => 'Wawasan, artikel teknologi, dan pembaruan seputar pengembangan karier.',
                'content' => null,
                'image_path' => null,
                'image_caption' => null,
                'youtube_url' => null,
                'cta_label' => null,
                'cta_url' => null,
                'profile_card' => null,
            ],
            [
                'category' => 'company',
                'title' => 'Learn',
                'slug' => 'learn',
                'link_type' => 'internal_page',
                'external_url' => null,
                'order' => 3,
                'is_active' => true,
                'subtitle' => 'Alur belajar terpandu dari Basic Fundamental hingga spesialisasi Career Branch.',
                'content' => null,
                'image_path' => null,
                'image_caption' => null,
                'youtube_url' => null,
                'cta_label' => null,
                'cta_url' => null,
                'profile_card' => null,
            ],
            [
                'category' => 'company',
                'title' => 'Komunitas',
                'slug' => 'komunitas',
                'link_type' => 'internal_page',
                'external_url' => null,
                'order' => 4,
                'is_active' => true,
                'subtitle' => 'Ruang diskusi, jejaring sesama pembelajar, dan kolaborasi proyek.',
                'content' => null,
                'image_path' => null,
                'image_caption' => null,
                'youtube_url' => null,
                'cta_label' => null,
                'cta_url' => null,
                'profile_card' => null,
            ],

            // SUPPORT
            [
                'category' => 'support',
                'title' => 'Hubungi Kami',
                'slug' => 'hubungi-kami',
                'link_type' => 'internal_page',
                'external_url' => null,
                'order' => 1,
                'is_active' => true,
                'subtitle' => 'Layanan bantuan dan dukungan pengguna tersedia Senin - Jumat (08.00 - 16.00 WIB).',
                'content' => null,
                'image_path' => '/images/servis.webp',
                'image_caption' => 'Customer Support SkillVentura',
                'youtube_url' => null,
                'cta_label' => null,
                'cta_url' => null,
                'profile_card' => null,
            ],
            [
                'category' => 'support',
                'title' => 'Syarat dan Ketentuan',
                'slug' => 'syarat-dan-ketentuan',
                'link_type' => 'internal_page',
                'external_url' => null,
                'order' => 2,
                'is_active' => true,
                'subtitle' => 'Ketentuan penggunaan layanan dan etika berkomunitas di platform SkillVentura.',
                'content' => null,
                'image_path' => null,
                'image_caption' => null,
                'youtube_url' => null,
                'cta_label' => null,
                'cta_url' => null,
                'profile_card' => null,
            ],
            [
                'category' => 'support',
                'title' => 'Kebijakan dan Privasi',
                'slug' => 'kebijakan-dan-privasi',
                'link_type' => 'internal_page',
                'external_url' => null,
                'order' => 3,
                'is_active' => true,
                'subtitle' => 'Komitmen pelindungan data pribadi dan privasi seluruh pengguna SkillVentura.',
                'content' => null,
                'image_path' => null,
                'image_caption' => null,
                'youtube_url' => null,
                'cta_label' => null,
                'cta_url' => null,
                'profile_card' => null,
            ],
        ];
    }

    /**
     * Get formatted general footer settings.
     *
     * @return array<string, mixed>
     */
    public function getSettingsPayload(): array
    {
        $setting = FooterSetting::latest()->first();
        $defaults = $this->getDefaultSettings();

        if (! $setting) {
            return $defaults;
        }

        $socialLinks = is_array($setting->social_links)
            ? array_values($setting->social_links)
            : $defaults['social_links'];

        return [
            'id' => (string) $setting->_id,
            'brand_name' => $setting->brand_name ?? $defaults['brand_name'],
            'brand_tagline' => $setting->brand_tagline ?? $defaults['brand_tagline'],
            'brand_subtitle' => $setting->brand_subtitle ?? $defaults['brand_subtitle'],
            'brand_description' => $setting->brand_description ?? $defaults['brand_description'],
            'logo_url' => $setting->logo_url,
            'logo_path' => $setting->logo_path,
            'address' => $setting->address ?? $defaults['address'],
            'phone' => $setting->phone ?? $defaults['phone'],
            'copyright_text' => $setting->copyright_text ?? $defaults['copyright_text'],
            'social_links' => $socialLinks,
        ];
    }

    /**
     * Ensure baseline footer items are persisted before an admin CRUD mutation.
     */
    public function ensureItemsInitialized(?string $userId = null): void
    {
        $setting = FooterSetting::latest()->first();

        if ($setting && $setting->items_initialized) {
            return;
        }

        if (FooterItem::count() === 0) {
            foreach ($this->getBaselineItems() as $item) {
                FooterItem::create(array_merge($item, [
                    'updated_by' => $userId,
                ]));
            }
        }

        if ($setting) {
            $setting->update(['items_initialized' => true]);
        } else {
            $defaults = $this->getDefaultSettings();
            unset($defaults['id'], $defaults['logo_url']);
            FooterSetting::create(array_merge($defaults, [
                'items_initialized' => true,
                'updated_by' => $userId,
            ]));
        }
    }

    /**
     * Get all footer items (from DB if initialized/present, or baseline fallback).
     *
     * @return array<int, array<string, mixed>>
     */
    public function getItemsPayload(bool $onlyActive = false): array
    {
        $setting = FooterSetting::latest()->first();
        $hasDbItems = ($setting && $setting->items_initialized) || FooterItem::count() > 0;

        if (! $hasDbItems) {
            $items = collect($this->getBaselineItems())->map(function (array $item) {
                return $this->formatItemArray($item, 'baseline-'.$item['slug']);
            });

            if ($onlyActive) {
                $items = $items->filter(fn (array $item) => (bool) $item['is_active']);
            }

            return $items->values()->all();
        }

        $query = FooterItem::orderBy('order')->orderBy('created_at');
        if ($onlyActive) {
            $query->where('is_active', true);
        }

        return $query->get()->map(fn (FooterItem $item) => $this->formatModelItem($item))->values()->all();
    }

    /**
     * Get compact footer data shared across public pages via Inertia.
     *
     * @return array<string, mixed>
     */
    public function getPublicFooterData(): array
    {
        $settings = $this->getSettingsPayload();
        $activeItems = $this->getItemsPayload(true);

        $grouped = [
            'program' => [],
            'company' => [],
            'support' => [],
        ];

        foreach ($activeItems as $item) {
            $cat = $item['category'] ?? 'program';
            if (isset($grouped[$cat])) {
                $grouped[$cat][] = [
                    'id' => $item['id'],
                    'title' => $item['title'],
                    'slug' => $item['slug'],
                    'link_type' => $item['link_type'],
                    'href' => $item['href'],
                    'is_external' => $item['link_type'] === 'external_url' && ! empty($item['external_url']),
                ];
            }
        }

        $activeSocials = array_values(array_filter(
            $settings['social_links'] ?? [],
            fn (array $s) => ! empty($s['is_active'])
        ));

        return [
            'brand_name' => $settings['brand_name'],
            'brand_tagline' => $settings['brand_tagline'],
            'brand_subtitle' => $settings['brand_subtitle'],
            'brand_description' => $settings['brand_description'],
            'logo_url' => $settings['logo_url'],
            'address' => $settings['address'],
            'phone' => $settings['phone'],
            'copyright_text' => $settings['copyright_text'],
            'social_links' => $activeSocials,
            'categories' => $grouped,
        ];
    }

    /**
     * Find an active footer item by slug for public page rendering.
     *
     * @return array<string, mixed>|null
     */
    public function findActivePageBySlug(string $slug): ?array
    {
        $setting = FooterSetting::latest()->first();
        $hasDbItems = ($setting && $setting->items_initialized) || FooterItem::count() > 0;

        if ($hasDbItems) {
            $item = FooterItem::where('slug', $slug)
                ->where('is_active', true)
                ->first();

            return $item ? $this->formatModelItem($item) : null;
        }

        $baseline = collect($this->getBaselineItems())
            ->first(fn (array $item) => $item['slug'] === $slug && ! empty($item['is_active']));

        return $baseline ? $this->formatItemArray($baseline, 'baseline-'.$baseline['slug']) : null;
    }

    /**
     * Format a FooterItem model into a normalized array.
     *
     * @return array<string, mixed>
     */
    public function formatModelItem(FooterItem $item): array
    {
        return $this->formatItemArray([
            'category' => $item->category,
            'title' => $item->title,
            'slug' => $item->slug,
            'link_type' => $item->link_type ?? 'internal_page',
            'external_url' => $item->external_url,
            'order' => (int) ($item->order ?? 1),
            'is_active' => (bool) $item->is_active,
            'subtitle' => $item->subtitle,
            'content' => $item->content,
            'image_path' => $item->image_path,
            'image_url' => $item->image_url,
            'image_caption' => $item->image_caption,
            'youtube_url' => $item->youtube_url,
            'cta_label' => $item->cta_label,
            'cta_url' => $item->cta_url,
            'profile_card' => $item->profile_card,
        ], (string) $item->_id);
    }

    /**
     * Format raw item array with computed URLs and labels.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function formatItemArray(array $data, string $id): array
    {
        $category = $data['category'] ?? 'program';
        $categoryLabels = [
            'program' => 'Program',
            'company' => 'Company',
            'support' => 'Support',
        ];

        $linkType = $data['link_type'] ?? 'internal_page';
        $externalUrl = $data['external_url'] ?? null;
        $slug = $data['slug'] ?? '';

        $href = ($linkType === 'external_url' && ! empty($externalUrl))
            ? $externalUrl
            : '/'.$slug;

        $imageUrl = $data['image_url'] ?? null;
        if (! $imageUrl && ! empty($data['image_path'])) {
            $imagePath = (string) $data['image_path'];
            if (str_starts_with($imagePath, '/') || str_starts_with($imagePath, 'http')) {
                $imageUrl = $imagePath;
            } else {
                /** @var FilesystemAdapter $disk */
                $disk = Storage::disk('s3');
                $imageUrl = $disk->url($imagePath);
            }
        }

        $profileCard = is_array($data['profile_card'] ?? null) ? $data['profile_card'] : null;
        if ($profileCard) {
            $avatarPath = $profileCard['avatar_path'] ?? null;
            if ($avatarPath && ! str_starts_with((string) $avatarPath, '/') && ! str_starts_with((string) $avatarPath, 'http')) {
                /** @var FilesystemAdapter $disk */
                $disk = Storage::disk('s3');
                $profileCard['avatar_url'] = $disk->url((string) $avatarPath);
            } else {
                $profileCard['avatar_url'] = $avatarPath ?: '/images/default-avatar.svg';
            }
        }

        return [
            'id' => $id,
            '_id' => $id,
            'category' => $category,
            'category_label' => $categoryLabels[$category] ?? 'Informasi',
            'title' => $data['title'] ?? '',
            'slug' => $slug,
            'link_type' => $linkType,
            'external_url' => $externalUrl,
            'href' => $href,
            'order' => (int) ($data['order'] ?? 1),
            'is_active' => (bool) ($data['is_active'] ?? true),
            'subtitle' => $data['subtitle'] ?? null,
            'content' => $data['content'] ?? null,
            'image_path' => $data['image_path'] ?? null,
            'image_url' => $imageUrl,
            'image_caption' => $data['image_caption'] ?? null,
            'youtube_url' => $category === 'support' ? null : ($data['youtube_url'] ?? null),
            'cta_label' => $data['cta_label'] ?? null,
            'cta_url' => $data['cta_url'] ?? null,
            'profile_card' => $profileCard,
        ];
    }

    /**
     * Normalize a URL string so external links without scheme get https:// prepended,
     * while internal paths starting with / remain relative.
     */
    public function normalizeUrl(?string $rawUrl): ?string
    {
        if ($rawUrl === null) {
            return null;
        }

        $trimmed = trim($rawUrl);
        if ($trimmed === '') {
            return null;
        }

        if (str_starts_with($trimmed, '/') || str_starts_with($trimmed, '#') || str_starts_with($trimmed, 'mailto:') || str_starts_with($trimmed, 'tel:')) {
            return $trimmed;
        }

        if (! preg_match('~^https?://~i', $trimmed)) {
            return 'https://'.$trimmed;
        }

        return $trimmed;
    }
}
