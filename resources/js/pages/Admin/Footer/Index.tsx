import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    Edit2,
    Eye,
    FileText,
    ImageIcon,
    Info,
    Layers,
    Link2,
    Loader2,
    PanelBottom,
    PlayCircle,
    Plus,
    Share2,
    Shield,
    Sparkles,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kelola Footer',
        href: '/admin/footer',
    },
];

type FooterCategory = 'program' | 'company' | 'support';
type ModalTab = 'general' | 'media' | 'action';

interface SocialLinkItem {
    id: string;
    platform: string;
    label: string;
    url: string;
    is_active: boolean;
}

interface FooterSettingsData {
    id: string;
    brand_name: string;
    brand_tagline: string | null;
    brand_subtitle: string | null;
    brand_description: string | null;
    logo_url: string;
    logo_path?: string | null;
    address: string | null;
    phone: string | null;
    copyright_text: string;
    social_links: SocialLinkItem[];
}

interface ProfileCardData {
    enabled: boolean;
    badge?: string | null;
    name?: string | null;
    role?: string | null;
    bio?: string | null;
    avatar_path?: string | null;
    avatar_url?: string | null;
}

interface FooterItemData {
    id: string;
    _id?: string;
    category: FooterCategory;
    category_label: string;
    title: string;
    slug: string;
    link_type: 'internal_page' | 'external_url';
    external_url: string | null;
    href: string;
    order: number;
    is_active: boolean;
    subtitle: string | null;
    content: string | null;
    image_path: string | null;
    image_url: string | null;
    image_caption: string | null;
    youtube_url: string | null;
    cta_label: string | null;
    cta_url: string | null;
    profile_card: ProfileCardData | null;
}

interface FooterStats {
    total_items: number;
    active_items: number;
    program_count: number;
    company_count: number;
    support_count: number;
    active_socials: number;
}

const SOCIAL_PLATFORMS = [
    {
        value: 'instagram',
        label: 'Instagram',
        icon: 'fa-brands fa-instagram text-pink-500',
    },
    {
        value: 'whatsapp',
        label: 'WhatsApp',
        icon: 'fa-brands fa-whatsapp text-green-500',
    },
    {
        value: 'facebook',
        label: 'Facebook',
        icon: 'fa-brands fa-facebook text-blue-600',
    },
    {
        value: 'github',
        label: 'GitHub',
        icon: 'fa-brands fa-github text-slate-900 dark:text-white',
    },
    {
        value: 'x',
        label: 'X (Twitter)',
        icon: 'fa-brands fa-x-twitter text-slate-900 dark:text-white',
    },
    {
        value: 'linkedin',
        label: 'LinkedIn',
        icon: 'fa-brands fa-linkedin text-blue-700',
    },
    {
        value: 'youtube',
        label: 'YouTube',
        icon: 'fa-brands fa-youtube text-red-600',
    },
    {
        value: 'tiktok',
        label: 'TikTok',
        icon: 'fa-brands fa-tiktok text-slate-900 dark:text-white',
    },
    {
        value: 'discord',
        label: 'Discord',
        icon: 'fa-brands fa-discord text-indigo-500',
    },
    {
        value: 'website',
        label: 'Website',
        icon: 'fa-solid fa-globe text-cyan-500',
    },
];

const CATEGORY_INFO: Record<
    FooterCategory,
    {
        label: string;
        badgeClass: string;
        description: string;
        supportsYoutube: boolean;
        supportsProfileCard: boolean;
    }
> = {
    program: {
        label: 'Program',
        badgeClass:
            'border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
        description:
            'Menu program pembelajaran & kemitraan (Mendukung Text, Image, Embed Video YouTube, & Tombol URL Link/CTA).',
        supportsYoutube: true,
        supportsProfileCard: false,
    },
    company: {
        label: 'Company',
        badgeClass:
            'border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
        description:
            'Profil perusahaan, edukasi & komunitas (Mendukung Text, Image, Embed Video YouTube, URL Link/CTA, & Kartu Profil Pimpinan).',
        supportsYoutube: true,
        supportsProfileCard: true,
    },
    support: {
        label: 'Support',
        badgeClass:
            'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
        description:
            'Pusat bantuan & dokumen regulasi/kebijakan (Fokus pada Text terstruktur, Image pendukung, & URL Link kontak tanpa video YouTube).',
        supportsYoutube: false,
        supportsProfileCard: false,
    },
};

function getYoutubeEmbedUrl(url?: string | null): string | null {
    if (!url) {
        return null;
    }
    try {
        let videoId = '';
        if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split(/[?&#]/)[0] || '';
        } else if (url.includes('youtube.com/watch')) {
            videoId = new URL(url).searchParams.get('v') || '';
        } else if (url.includes('youtube.com/embed/')) {
            videoId = url.split('youtube.com/embed/')[1]?.split(/[?&#]/)[0] || '';
        } else if (url.includes('youtube.com/shorts/')) {
            videoId = url.split('youtube.com/shorts/')[1]?.split(/[?&#]/)[0] || '';
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    } catch {
        return null;
    }
}

export default function AdminFooterIndex({
    settings,
    items,
    stats,
}: {
    settings: FooterSettingsData;
    items: FooterItemData[];
    stats: FooterStats;
}) {
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<'items' | 'brand' | 'socials'>(
        'items',
    );
    const [categoryFilter, setCategoryFilter] = useState<
        'all' | FooterCategory
    >('all');

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    /* ================= 1. BRAND & CONTACT FORM ================= */
    const [logoPreview, setLogoPreview] = useState<string>(
        settings.logo_url || '/images/logo.webp',
    );
    const brandForm = useForm<{
        brand_name: string;
        brand_tagline: string;
        brand_subtitle: string;
        brand_description: string;
        address: string;
        phone: string;
        copyright_text: string;
        logo: File | null;
        remove_logo: boolean;
    }>({
        brand_name: settings.brand_name || 'SKILL VENTURA',
        brand_tagline: settings.brand_tagline || '',
        brand_subtitle: settings.brand_subtitle || '',
        brand_description: settings.brand_description || '',
        address: settings.address || '',
        phone: settings.phone || '',
        copyright_text:
            settings.copyright_text ||
            '© SKILL VENTURA Learn. All Rights Reserved',
        logo: null,
        remove_logo: false,
    });

    useEffect(() => {
        setLogoPreview(settings.logo_url || '/images/logo.webp');
    }, [settings.logo_url]);

    const handleBrandLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        brandForm.setData((prev) => ({
            ...prev,
            logo: file,
            remove_logo: false,
        }));
        if (file) {
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleResetLogo = () => {
        brandForm.setData((prev) => ({
            ...prev,
            logo: null,
            remove_logo: true,
        }));
        setLogoPreview('/images/logo.webp');
    };

    const submitBrandSettings = (e: React.FormEvent) => {
        e.preventDefault();
        brandForm.post('/admin/footer/settings', {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    /* ================= 2. SOCIAL MEDIA FORM ================= */
    const [socialRows, setSocialRows] = useState<SocialLinkItem[]>(
        settings.social_links || [],
    );
    const [isSavingSocials, setIsSavingSocials] = useState(false);

    useEffect(() => {
        setSocialRows(settings.social_links || []);
    }, [settings.social_links]);

    const addSocialRow = () => {
        if (socialRows.length >= 12) {
            return;
        }
        setSocialRows((prev) => [
            ...prev,
            {
                id: `social-${Date.now()}`,
                platform: 'website',
                label: 'Website',
                url: '',
                is_active: true,
            },
        ]);
    };

    const updateSocialRow = (
        index: number,
        field: keyof SocialLinkItem,
        value: string | boolean,
    ) => {
        setSocialRows((prev) => {
            const copy = [...prev];
            const current = { ...copy[index], [field]: value };
            if (field === 'platform') {
                const found = SOCIAL_PLATFORMS.find((p) => p.value === value);
                if (found) {
                    current.label = found.label;
                }
            }
            copy[index] = current;
            return copy;
        });
    };

    const submitSocialLinks = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingSocials(true);
        router.post(
            '/admin/footer/socials',
            { social_links: socialRows as any },
            {
                preserveScroll: true,
                onFinish: () => setIsSavingSocials(false),
            },
        );
    };

    /* ================= 3. FOOTER MENU & PAGE ITEMS CRUD ================= */
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState<ModalTab>('general');
    const [editingItem, setEditingItem] = useState<FooterItemData | null>(null);
    const [itemImagePreview, setItemImagePreview] = useState<string | null>(
        null,
    );
    const [profileAvatarPreview, setProfileAvatarPreview] = useState<
        string | null
    >(null);

    const itemForm = useForm<{
        category: FooterCategory;
        title: string;
        link_type: 'internal_page' | 'external_url';
        external_url: string;
        is_active: boolean;
        subtitle: string;
        content: string;
        image: File | null;
        remove_image: boolean;
        image_caption: string;
        youtube_url: string;
        cta_label: string;
        cta_url: string;
        profile_enabled: boolean;
        profile_badge: string;
        profile_name: string;
        profile_role: string;
        profile_bio: string;
        profile_avatar: File | null;
        remove_profile_avatar: boolean;
    }>({
        category: 'program',
        title: '',
        link_type: 'internal_page',
        external_url: '',
        is_active: true,
        subtitle: '',
        content: '',
        image: null,
        remove_image: false,
        image_caption: '',
        youtube_url: '',
        cta_label: '',
        cta_url: '',
        profile_enabled: false,
        profile_badge: 'Guild Master',
        profile_name: '',
        profile_role: 'Guild Master',
        profile_bio: '',
        profile_avatar: null,
        remove_profile_avatar: false,
    });

    const openCreateModal = (defaultCat: FooterCategory = 'program') => {
        setEditingItem(null);
        setModalTab('general');
        setItemImagePreview(null);
        setProfileAvatarPreview(null);
        itemForm.clearErrors();
        itemForm.setData({
            category: defaultCat,
            title: '',
            link_type: 'internal_page',
            external_url: '',
            is_active: true,
            subtitle: '',
            content: '',
            image: null,
            remove_image: false,
            image_caption: '',
            youtube_url: '',
            cta_label: '',
            cta_url: '',
            profile_enabled: false,
            profile_badge: 'Guild Master',
            profile_name: '',
            profile_role: 'Guild Master',
            profile_bio: '',
            profile_avatar: null,
            remove_profile_avatar: false,
        });
        setIsItemModalOpen(true);
    };

    const openEditModal = (item: FooterItemData) => {
        setEditingItem(item);
        setModalTab('general');
        setItemImagePreview(item.image_url || null);
        setProfileAvatarPreview(item.profile_card?.avatar_url || null);
        itemForm.clearErrors();
        itemForm.setData({
            category: item.category,
            title: item.title,
            link_type: item.link_type || 'internal_page',
            external_url: item.external_url || '',
            is_active: item.is_active,
            subtitle: item.subtitle || '',
            content: item.content || '',
            image: null,
            remove_image: false,
            image_caption: item.image_caption || '',
            youtube_url: item.youtube_url || '',
            cta_label: item.cta_label || '',
            cta_url: item.cta_url || '',
            profile_enabled: Boolean(item.profile_card?.enabled),
            profile_badge: item.profile_card?.badge || 'Guild Master',
            profile_name: item.profile_card?.name || '',
            profile_role: item.profile_card?.role || 'Guild Master',
            profile_bio: item.profile_card?.bio || '',
            profile_avatar: null,
            remove_profile_avatar: false,
        });
        setIsItemModalOpen(true);
    };

    const handleItemImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        itemForm.setData((prev) => ({
            ...prev,
            image: file,
            remove_image: false,
        }));
        if (file) {
            setItemImagePreview(URL.createObjectURL(file));
        }
    };

    const handleProfileAvatarChange = (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0] ?? null;
        itemForm.setData((prev) => ({
            ...prev,
            profile_avatar: file,
            remove_profile_avatar: false,
        }));
        if (file) {
            setProfileAvatarPreview(URL.createObjectURL(file));
        }
    };

    const submitItemForm = (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingItem
            ? `/admin/footer/items/${editingItem.id}`
            : '/admin/footer/items';

        itemForm.post(url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsItemModalOpen(false);
                setEditingItem(null);
            },
        });
    };

    const handleToggleItem = (item: FooterItemData) => {
        router.post(
            `/admin/footer/items/${item.id}/toggle`,
            {},
            { preserveScroll: true },
        );
    };

    const handleMoveOrder = (
        category: FooterCategory,
        indexInCat: number,
        direction: 'up' | 'down',
    ) => {
        const catItems = items
            .filter((i) => i.category === category)
            .sort((a, b) => a.order - b.order);

        const targetIndex =
            direction === 'up' ? indexInCat - 1 : indexInCat + 1;
        if (targetIndex < 0 || targetIndex >= catItems.length) {
            return;
        }

        const reordered = [...catItems];
        const [moved] = reordered.splice(indexInCat, 1);
        reordered.splice(targetIndex, 0, moved);

        const payload = reordered.map((item, idx) => ({
            id: item.id,
            order: idx + 1,
        }));

        router.post(
            '/admin/footer/items/reorder',
            { items: payload },
            { preserveScroll: true },
        );
    };

    /* ================= CUSTOM DELETE DIALOG STATE (NO BROWSER ALERT) ================= */
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        type: 'footer_item' | 'social_row';
        title: string;
        subtitle: string;
        item?: FooterItemData | null;
        socialIndex?: number | null;
    }>({
        open: false,
        type: 'footer_item',
        title: '',
        subtitle: '',
        item: null,
        socialIndex: null,
    });
    const [isDeleting, setIsDeleting] = useState(false);

    const openDeleteItemDialog = (item: FooterItemData) => {
        setDeleteDialog({
            open: true,
            type: 'footer_item',
            title: `Hapus Menu "${item.title}"?`,
            subtitle: `Menu "${item.title}" (/${item.slug}) pada kolom ${item.category_label} beserta seluruh isi konten halamannya akan dihapus permanen dari Footer.`,
            item,
            socialIndex: null,
        });
    };

    const openDeleteSocialDialog = (index: number, social: SocialLinkItem) => {
        setDeleteDialog({
            open: true,
            type: 'social_row',
            title: `Hapus Sosial Media "${social.label}"?`,
            subtitle: `Platform "${social.label}" akan dihapus dari daftar tautan sosial media Footer.`,
            item: null,
            socialIndex: index,
        });
    };

    const handleExecuteDelete = () => {
        if (deleteDialog.type === 'footer_item' && deleteDialog.item) {
            setIsDeleting(true);
            router.delete(`/admin/footer/items/${deleteDialog.item.id}`, {
                preserveScroll: true,
                onFinish: () => {
                    setIsDeleting(false);
                    setDeleteDialog((prev) => ({ ...prev, open: false }));
                },
            });
            return;
        }

        if (
            deleteDialog.type === 'social_row' &&
            deleteDialog.socialIndex !== null &&
            deleteDialog.socialIndex !== undefined
        ) {
            const updatedRows = socialRows.filter(
                (_, i) => i !== deleteDialog.socialIndex,
            );
            setSocialRows(updatedRows);
            setIsDeleting(true);
            router.post(
                '/admin/footer/socials',
                { social_links: updatedRows as any },
                {
                    preserveScroll: true,
                    onFinish: () => {
                        setIsDeleting(false);
                        setDeleteDialog((prev) => ({ ...prev, open: false }));
                    },
                },
            );
        }
    };

    const categoriesToShow: FooterCategory[] =
        categoryFilter === 'all'
            ? ['program', 'company', 'support']
            : [categoryFilter];

    const currentCatMeta = CATEGORY_INFO[itemForm.data.category];
    const youtubePreviewUrl = currentCatMeta.supportsYoutube
        ? getYoutubeEmbedUrl(itemForm.data.youtube_url)
        : null;

    const hasGeneralErrors = Boolean(
        itemForm.errors.category ||
            itemForm.errors.title ||
            itemForm.errors.slug ||
            itemForm.errors.external_url ||
            itemForm.errors.subtitle ||
            itemForm.errors.content,
    );
    const hasMediaErrors = Boolean(
        itemForm.errors.image ||
            itemForm.errors.image_caption ||
            itemForm.errors.youtube_url,
    );
    const hasActionErrors = Boolean(
        itemForm.errors.cta_label ||
            itemForm.errors.cta_url ||
            itemForm.errors.profile_avatar ||
            itemForm.errors.profile_name,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Footer" />

            <div
                className="mx-auto w-full space-y-8 p-4 sm:p-6 lg:p-8"
                style={{ fontFamily: "'Outfit', sans-serif" }}
            >
                {/* Header Hero Banner */}
                <div className="relative overflow-hidden rounded-xl border border-slate-300 bg-[#f5f6ff] p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-[#0d0f17]">
                    <div
                        className="pointer-events-none absolute inset-0 z-0 opacity-70 dark:opacity-40"
                        style={{
                            backgroundImage: `
                                radial-gradient(circle at top right, rgba(124, 92, 255, 0.14), transparent 70%),
                                radial-gradient(circle at bottom left, rgba(56, 189, 248, 0.10), transparent 60%)
                            `,
                        }}
                    />

                    <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-2xl space-y-2.5">
                            <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold tracking-[0.2em] text-indigo-500 uppercase dark:text-indigo-400">
                                <PanelBottom className="h-3.5 w-3.5" />
                                Konfigurasi Platform (Khusus Admin)
                            </span>

                            <h1 className="text-2xl leading-snug font-semibold tracking-tight text-slate-800 md:text-[28px] dark:text-white">
                                Manajemen Footer & Halaman Informasi
                            </h1>

                            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400/80">
                                Kelola informasi identitas brand, tautan sosial
                                media, serta menu dan isi halaman footer (
                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                    Text, Image, URL Link, & Embed YouTube
                                </span>
                                ) sesuai porsi dan fungsi tiap kategori.
                            </p>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-3 sm:gap-4">
                            <div className="rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 text-center backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
                                <p className="text-xl font-bold text-[#7C5CFF]">
                                    {stats.active_items}/{stats.total_items}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Menu Aktif
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 text-center backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
                                <p className="text-xl font-bold text-cyan-500">
                                    3
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Kategori Kolom
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 text-center backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
                                <p className="text-xl font-bold text-emerald-500">
                                    {stats.active_socials}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    URL Sosmed
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Navigation Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3 dark:border-slate-800">
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab('items')}
                            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                                activeTab === 'items'
                                    ? 'bg-[#7C5CFF] text-white shadow-sm'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                            }`}
                        >
                            <FileText className="h-4 w-4" />
                            <span>
                                Menu & Halaman Informasi ({stats.total_items})
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('brand')}
                            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                                activeTab === 'brand'
                                    ? 'bg-[#7C5CFF] text-white shadow-sm'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                            }`}
                        >
                            <Sparkles className="h-4 w-4" />
                            <span>Identitas Brand & Kontak</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('socials')}
                            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                                activeTab === 'socials'
                                    ? 'bg-[#7C5CFF] text-white shadow-sm'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                            }`}
                        >
                            <Share2 className="h-4 w-4" />
                            <span>Social Media Links</span>
                        </button>
                    </div>

                    {activeTab === 'items' && (
                        <button
                            type="button"
                            onClick={() =>
                                openCreateModal(
                                    categoryFilter === 'all'
                                        ? 'program'
                                        : categoryFilter,
                                )
                            }
                            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#3B28F6] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2a1ce0]"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Tambah Menu Footer</span>
                        </button>
                    )}
                </div>

                {/* ================= TAB 1: MENU & HALAMAN INFORMASI ================= */}
                {activeTab === 'items' && (
                    <div className="space-y-6">
                        {/* Category Filter Pills */}
                        <div className="flex flex-wrap items-center gap-2">
                            {(
                                [
                                    {
                                        key: 'all',
                                        label: `Semua Kategori (${stats.total_items})`,
                                    },
                                    {
                                        key: 'program',
                                        label: `Program (${stats.program_count})`,
                                    },
                                    {
                                        key: 'company',
                                        label: `Company (${stats.company_count})`,
                                    },
                                    {
                                        key: 'support',
                                        label: `Support (${stats.support_count})`,
                                    },
                                ] as const
                            ).map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setCategoryFilter(tab.key)}
                                    className={`cursor-pointer rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition ${
                                        categoryFilter === tab.key
                                            ? 'border-[#7C5CFF] bg-[#7C5CFF]/15 text-[#7C5CFF] dark:text-indigo-300'
                                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Category Sections */}
                        {categoriesToShow.map((catKey) => {
                            const catMeta = CATEGORY_INFO[catKey];
                            const catItems = items
                                .filter((i) => i.category === catKey)
                                .sort((a, b) => a.order - b.order);

                            return (
                                <div
                                    key={catKey}
                                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0b0e17]"
                                >
                                    <div className="flex flex-col justify-between gap-3 border-b border-slate-200 bg-slate-50/70 px-6 py-4 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900/50">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2.5">
                                                <span
                                                    className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-bold uppercase ${catMeta.badgeClass}`}
                                                >
                                                    Kolom {catMeta.label}
                                                </span>
                                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                    {catItems.length} item menu
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {catMeta.description}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                openCreateModal(catKey)
                                            }
                                            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-500/20 dark:text-indigo-300"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            <span>
                                                Tambah di {catMeta.label}
                                            </span>
                                        </button>
                                    </div>

                                    {catItems.length === 0 ? (
                                        <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                                            Belum ada menu pada kategori{' '}
                                            {catMeta.label}.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
                                            {catItems.map((item, idx) => {
                                                const hasText = Boolean(
                                                    item.content?.trim() ||
                                                        item.subtitle?.trim(),
                                                );
                                                const hasImage = Boolean(
                                                    item.image_url,
                                                );
                                                const hasYoutube = Boolean(
                                                    item.youtube_url &&
                                                        catKey !== 'support',
                                                );
                                                const hasCta = Boolean(
                                                    item.cta_url ||
                                                        (item.link_type ===
                                                            'external_url' &&
                                                            item.external_url),
                                                );
                                                const hasProfile = Boolean(
                                                    item.profile_card?.enabled,
                                                );

                                                return (
                                                    <div
                                                        key={item.id}
                                                        className="flex flex-col justify-between gap-4 px-6 py-4 transition hover:bg-slate-50/60 sm:flex-row sm:items-center dark:hover:bg-slate-900/30"
                                                    >
                                                        <div className="flex items-start gap-3.5">
                                                            {/* Order & Up/Down Controls */}
                                                            <div className="flex flex-col items-center gap-1 pt-0.5">
                                                                <button
                                                                    type="button"
                                                                    disabled={
                                                                        idx ===
                                                                        0
                                                                    }
                                                                    onClick={() =>
                                                                        handleMoveOrder(
                                                                            catKey,
                                                                            idx,
                                                                            'up',
                                                                        )
                                                                    }
                                                                    title="Geser ke atas"
                                                                    className="cursor-pointer rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-25 dark:hover:bg-slate-800 dark:hover:text-white"
                                                                >
                                                                    <ArrowUp className="h-3.5 w-3.5" />
                                                                </button>
                                                                <span className="text-[11px] font-bold text-slate-400">
                                                                    #{idx + 1}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    disabled={
                                                                        idx ===
                                                                        catItems.length -
                                                                            1
                                                                    }
                                                                    onClick={() =>
                                                                        handleMoveOrder(
                                                                            catKey,
                                                                            idx,
                                                                            'down',
                                                                        )
                                                                    }
                                                                    title="Geser ke bawah"
                                                                    className="cursor-pointer rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-25 dark:hover:bg-slate-800 dark:hover:text-white"
                                                                >
                                                                    <ArrowDown className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                                        {
                                                                            item.title
                                                                        }
                                                                    </h3>
                                                                    {!item.is_active && (
                                                                        <span className="rounded bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-500">
                                                                            Nonaktif
                                                                        </span>
                                                                    )}
                                                                    <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                                                                        {item.link_type ===
                                                                        'external_url'
                                                                            ? `Direct URL: ${item.external_url}`
                                                                            : `/${item.slug}`}
                                                                    </span>
                                                                </div>

                                                                {item.subtitle && (
                                                                    <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                                                                        {
                                                                            item.subtitle
                                                                        }
                                                                    </p>
                                                                )}

                                                                {/* Content Type Indicators */}
                                                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                                                    <span
                                                                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold ${
                                                                            hasText
                                                                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                                                                : 'bg-slate-100 text-slate-400 dark:bg-slate-800/60 dark:text-slate-500'
                                                                        }`}
                                                                    >
                                                                        <FileText className="h-3 w-3" />
                                                                        Text
                                                                    </span>

                                                                    <span
                                                                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold ${
                                                                            hasImage
                                                                                ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                                                                                : 'bg-slate-100 text-slate-400 dark:bg-slate-800/60 dark:text-slate-500'
                                                                        }`}
                                                                    >
                                                                        <ImageIcon className="h-3 w-3" />
                                                                        Image
                                                                    </span>

                                                                    {catKey !==
                                                                        'support' && (
                                                                        <span
                                                                            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold ${
                                                                                hasYoutube
                                                                                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                                                                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800/60 dark:text-slate-500'
                                                                            }`}
                                                                        >
                                                                            <PlayCircle className="h-3 w-3" />
                                                                            YouTube
                                                                        </span>
                                                                    )}

                                                                    <span
                                                                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold ${
                                                                            hasCta
                                                                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                                                                : 'bg-slate-100 text-slate-400 dark:bg-slate-800/60 dark:text-slate-500'
                                                                        }`}
                                                                    >
                                                                        <Link2 className="h-3 w-3" />
                                                                        URL Link
                                                                    </span>

                                                                    {hasProfile && (
                                                                        <span className="inline-flex items-center gap-1 rounded bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                                                                            <Shield className="h-3 w-3" />
                                                                            Kartu
                                                                            Profil
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                                                            <a
                                                                href={item.href}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                title="Pratinjau halaman di tab baru"
                                                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300"
                                                            >
                                                                <Eye className="h-3.5 w-3.5" />
                                                                <span>
                                                                    Lihat
                                                                </span>
                                                            </a>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleToggleItem(
                                                                        item,
                                                                    )
                                                                }
                                                                className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                                                                    item.is_active
                                                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400'
                                                                        : 'border-slate-300 bg-slate-100 text-slate-500 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                                                }`}
                                                            >
                                                                {item.is_active
                                                                    ? 'Aktif'
                                                                    : 'Nonaktif'}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openEditModal(
                                                                        item,
                                                                    )
                                                                }
                                                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#7C5CFF]/15 px-3 py-1.5 text-xs font-semibold text-[#7C5CFF] transition hover:bg-[#7C5CFF] hover:text-white"
                                                            >
                                                                <Edit2 className="h-3.5 w-3.5" />
                                                                <span>
                                                                    Kelola Isi
                                                                </span>
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openDeleteItemDialog(
                                                                        item,
                                                                    )
                                                                }
                                                                className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-rose-500/25 bg-rose-500/10 p-1.5 text-rose-500 transition hover:bg-rose-500 hover:text-white"
                                                                title="Hapus menu"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ================= TAB 2: IDENTITAS BRAND & KONTAK ================= */}
                {activeTab === 'brand' && (
                    <div className="grid gap-8 lg:grid-cols-12">
                        <form
                            onSubmit={submitBrandSettings}
                            className="space-y-5 rounded-xl border border-slate-300 bg-white p-6 lg:col-span-7 dark:border-slate-800 dark:bg-[#0b0e17]"
                        >
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                Pengaturan Identitas Brand & Kontak Footer
                            </h2>

                            {/* Logo Upload */}
                            <div className="space-y-2">
                                <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase dark:text-slate-300">
                                    Logo Brand Footer (Image)
                                </label>
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-2 dark:border-slate-700 dark:bg-slate-900">
                                        <img
                                            src={logoPreview}
                                            alt="Logo Preview"
                                            className="h-full w-full object-contain"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3.5 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-500/20 dark:text-indigo-300">
                                            <Upload className="h-3.5 w-3.5" />
                                            <span>Pilih Gambar Logo</span>
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                                onChange={handleBrandLogoChange}
                                                className="hidden"
                                            />
                                        </label>
                                        {logoPreview !==
                                            '/images/logo.webp' && (
                                            <button
                                                type="button"
                                                onClick={handleResetLogo}
                                                className="cursor-pointer rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/20"
                                            >
                                                Gunakan Logo Bawaan
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {brandForm.errors.logo && (
                                    <p className="text-xs text-rose-500">
                                        {brandForm.errors.logo}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Nama Brand{' '}
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={brandForm.data.brand_name}
                                        onChange={(e) =>
                                            brandForm.setData(
                                                'brand_name',
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                    {brandForm.errors.brand_name && (
                                        <p className="mt-1 text-xs text-rose-500">
                                            {brandForm.errors.brand_name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Tagline Brand
                                    </label>
                                    <input
                                        type="text"
                                        value={brandForm.data.brand_tagline}
                                        onChange={(e) =>
                                            brandForm.setData(
                                                'brand_tagline',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Learn Like a Hero, Grow Like a Pro"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Sub-judul Kolom Brand
                                </label>
                                <input
                                    type="text"
                                    value={brandForm.data.brand_subtitle}
                                    onChange={(e) =>
                                        brandForm.setData(
                                            'brand_subtitle',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Learn in SKILL VENTURA"
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Deskripsi Singkat Platform (Proporsional 1-2
                                    Kalimat)
                                </label>
                                <textarea
                                    rows={3}
                                    value={brandForm.data.brand_description}
                                    onChange={(e) =>
                                        brandForm.setData(
                                            'brand_description',
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                />
                                {brandForm.errors.brand_description && (
                                    <p className="mt-1 text-xs text-rose-500">
                                        {brandForm.errors.brand_description}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Lokasi / Alamat Singkat
                                    </label>
                                    <input
                                        type="text"
                                        value={brandForm.data.address}
                                        onChange={(e) =>
                                            brandForm.setData(
                                                'address',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Bogor, Indonesia"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Nomor Telepon / WhatsApp
                                    </label>
                                    <input
                                        type="text"
                                        value={brandForm.data.phone}
                                        onChange={(e) =>
                                            brandForm.setData(
                                                'phone',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="+62 223 4432 5968"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Teks Copyright Baris Bawah{' '}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={brandForm.data.copyright_text}
                                    onChange={(e) =>
                                        brandForm.setData(
                                            'copyright_text',
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={brandForm.processing}
                                    className="cursor-pointer rounded-xl bg-[#7C5CFF] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6a48eb] disabled:opacity-50"
                                >
                                    {brandForm.processing
                                        ? 'Menyimpan...'
                                        : 'Simpan Identitas Footer'}
                                </button>
                            </div>
                        </form>

                        {/* Live Preview Brand Column */}
                        <div className="space-y-4 rounded-xl border border-slate-300 bg-white p-6 lg:col-span-5 dark:border-slate-800 dark:bg-[#0b0e17]">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-indigo-500 uppercase">
                                <Eye className="h-3.5 w-3.5" />
                                Live Preview Kolom Brand Footer
                            </span>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-[#050814]">
                                <div className="mb-4 flex items-center gap-3">
                                    <img
                                        src={logoPreview}
                                        alt="Preview"
                                        className="w-10 object-contain"
                                    />
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                            {brandForm.data.brand_name ||
                                                'SKILL VENTURA'}
                                        </h3>
                                        {brandForm.data.brand_tagline && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {brandForm.data.brand_tagline}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {brandForm.data.brand_subtitle && (
                                    <h4 className="mb-2 font-semibold text-gray-900 dark:text-white">
                                        {brandForm.data.brand_subtitle}
                                    </h4>
                                )}

                                {brandForm.data.brand_description && (
                                    <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                        {brandForm.data.brand_description}
                                    </p>
                                )}

                                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                    {brandForm.data.address && (
                                        <p>📍 {brandForm.data.address}</p>
                                    )}
                                    {brandForm.data.phone && (
                                        <p>📞 {brandForm.data.phone}</p>
                                    )}
                                </div>

                                <div className="mt-6 border-t border-gray-200 pt-4 text-xs text-gray-500 dark:border-white/10 dark:text-gray-400">
                                    {brandForm.data.copyright_text}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ================= TAB 3: SOCIAL MEDIA LINKS ================= */}
                {activeTab === 'socials' && (
                    <form
                        onSubmit={submitSocialLinks}
                        className="space-y-6 rounded-xl border border-slate-300 bg-white p-6 dark:border-slate-800 dark:bg-[#0b0e17]"
                    >
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Tautan Sosial Media Footer (URL Link)
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Atur ikon platform dan URL tujuan ketika
                                    pengunjung mengklik ikon sosial media di
                                    footer.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={addSocialRow}
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-500/20 dark:text-indigo-300"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Tambah Platform</span>
                            </button>
                        </div>

                        <div className="space-y-3">
                            {socialRows.map((social, idx) => {
                                const platformMeta =
                                    SOCIAL_PLATFORMS.find(
                                        (p) => p.value === social.platform,
                                    ) || SOCIAL_PLATFORMS[0];

                                return (
                                    <div
                                        key={social.id || idx}
                                        className="grid items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 sm:grid-cols-12 dark:border-slate-800 dark:bg-slate-900/40"
                                    >
                                        <div className="flex items-center gap-3 sm:col-span-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg dark:border-slate-700 dark:bg-slate-900">
                                                <i
                                                    className={
                                                        platformMeta.icon
                                                    }
                                                />
                                            </div>
                                            <select
                                                value={social.platform}
                                                onChange={(e) =>
                                                    updateSocialRow(
                                                        idx,
                                                        'platform',
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                            >
                                                {SOCIAL_PLATFORMS.map((p) => (
                                                    <option
                                                        key={p.value}
                                                        value={p.value}
                                                    >
                                                        {p.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="sm:col-span-3">
                                            <input
                                                type="text"
                                                value={social.label}
                                                onChange={(e) =>
                                                    updateSocialRow(
                                                        idx,
                                                        'label',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Label (misal: Instagram)"
                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                            />
                                        </div>

                                        <div className="sm:col-span-4">
                                            <input
                                                type="text"
                                                value={social.url}
                                                onChange={(e) =>
                                                    updateSocialRow(
                                                        idx,
                                                        'url',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="https://instagram.com/skillventura"
                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                            />
                                        </div>

                                        <div className="flex items-center justify-end gap-3 sm:col-span-2">
                                            <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                                                <input
                                                    type="checkbox"
                                                    checked={social.is_active}
                                                    onChange={(e) =>
                                                        updateSocialRow(
                                                            idx,
                                                            'is_active',
                                                            e.target.checked,
                                                        )
                                                    }
                                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                                                />
                                                <span>Aktif</span>
                                            </label>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openDeleteSocialDialog(
                                                        idx,
                                                        social,
                                                    )
                                                }
                                                className="cursor-pointer rounded-lg border border-rose-500/20 bg-rose-500/10 p-1.5 text-rose-500 transition hover:bg-rose-500 hover:text-white"
                                                title="Hapus platform"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Tip: Jika URL diisi, ikon sosial media di footer
                                otomatis menjadi tautan aktif yang membuka tab
                                baru.
                            </p>
                            <button
                                type="submit"
                                disabled={isSavingSocials}
                                className="cursor-pointer rounded-xl bg-[#7C5CFF] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6a48eb] disabled:opacity-50"
                            >
                                {isSavingSocials
                                    ? 'Menyimpan...'
                                    : 'Simpan Tautan Sosmed'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* ================= PORTAL MODAL: CREATE / EDIT MENU & HALAMAN FOOTER ================= */}
            {mounted &&
                isItemModalOpen &&
                createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto p-3 sm:p-6">
                        {/* Backdrop */}
                        <div
                            onClick={() => setIsItemModalOpen(false)}
                            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
                        />

                        {/* Modal Box */}
                        <form
                            onSubmit={submitItemForm}
                            className="relative z-10 my-auto flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-[#0d111a]"
                        >
                            {/* Top Accent Gradient Bar */}
                            <div className="h-1 w-full bg-gradient-to-r from-[#3B28F6] via-[#7C5CFF] to-cyan-400" />

                            {/* Sticky Header */}
                            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800/80">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#7C5CFF]/30 bg-[#7C5CFF]/15 text-[#7C5CFF]">
                                        <Layers className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-base font-bold text-slate-900 sm:text-lg dark:text-white">
                                                {editingItem
                                                    ? `Kelola Menu: ${editingItem.title}`
                                                    : 'Tambah Menu Footer Baru'}
                                            </h2>
                                            <span
                                                className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${currentCatMeta.badgeClass}`}
                                            >
                                                {currentCatMeta.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Sesuaikan informasi menu dan isi
                                            halaman sesuai porsi kategori{' '}
                                            {currentCatMeta.label}.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsItemModalOpen(false)}
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Sub-Tabs Navigation Bar inside Modal (Only when internal_page) */}
                            {itemForm.data.link_type === 'internal_page' && (
                                <div className="flex shrink-0 gap-1.5 border-b border-slate-200 bg-slate-50/80 px-6 py-2.5 dark:border-slate-800/80 dark:bg-slate-900/50">
                                    <button
                                        type="button"
                                        onClick={() => setModalTab('general')}
                                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                            modalTab === 'general'
                                                ? 'bg-[#7C5CFF] text-white shadow-sm'
                                                : 'text-slate-600 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <FileText className="h-3.5 w-3.5" />
                                        <span>1. Navigasi & Teks</span>
                                        {hasGeneralErrors && (
                                            <span className="h-2 w-2 rounded-full bg-rose-400" />
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setModalTab('media')}
                                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                            modalTab === 'media'
                                                ? 'bg-[#7C5CFF] text-white shadow-sm'
                                                : 'text-slate-600 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <ImageIcon className="h-3.5 w-3.5" />
                                        <span>
                                            2. Media Visual
                                            {currentCatMeta.supportsYoutube
                                                ? ' (Image & YouTube)'
                                                : ' (Image)'}
                                        </span>
                                        {hasMediaErrors && (
                                            <span className="h-2 w-2 rounded-full bg-rose-400" />
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setModalTab('action')}
                                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                            modalTab === 'action'
                                                ? 'bg-[#7C5CFF] text-white shadow-sm'
                                                : 'text-slate-600 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <Link2 className="h-3.5 w-3.5" />
                                        <span>
                                            3. URL Link CTA
                                            {currentCatMeta.supportsProfileCard
                                                ? ' & Profil'
                                                : ''}
                                        </span>
                                        {hasActionErrors && (
                                            <span className="h-2 w-2 rounded-full bg-rose-400" />
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Scrollable Body */}
                            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                                {/* TAB GENERAL OR EXTERNAL URL MODE */}
                                {(modalTab === 'general' ||
                                    itemForm.data.link_type ===
                                        'external_url') && (
                                    <div className="space-y-5">
                                        {/* Category & Link Type */}
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    Kategori Kolom Footer{' '}
                                                    <span className="text-rose-500">
                                                        *
                                                    </span>
                                                </label>
                                                <select
                                                    value={
                                                        itemForm.data.category
                                                    }
                                                    onChange={(e) =>
                                                        itemForm.setData(
                                                            'category',
                                                            e.target
                                                                .value as FooterCategory,
                                                        )
                                                    }
                                                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-[#7C5CFF] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                                >
                                                    <option value="program">
                                                        Program (Online Course,
                                                        Bootcamp, dll.)
                                                    </option>
                                                    <option value="company">
                                                        Company (About Us, Blog,
                                                        Komunitas, dll.)
                                                    </option>
                                                    <option value="support">
                                                        Support (Hubungi Kami,
                                                        S&K, Privasi, dll.)
                                                    </option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    Fungsi Saat Menu Diklik{' '}
                                                    <span className="text-rose-500">
                                                        *
                                                    </span>
                                                </label>
                                                <select
                                                    value={
                                                        itemForm.data.link_type
                                                    }
                                                    onChange={(e) =>
                                                        itemForm.setData(
                                                            'link_type',
                                                            e.target.value as
                                                                | 'internal_page'
                                                                | 'external_url',
                                                        )
                                                    }
                                                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-[#7C5CFF] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                                >
                                                    <option value="internal_page">
                                                        Halaman Informasi
                                                        Internal (URL Otomatis)
                                                    </option>
                                                    <option value="external_url">
                                                        Direct URL Link
                                                        Eksternal (Tab Baru)
                                                    </option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Title (Full Width - Slug is generated automatically) */}
                                        <div>
                                            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                Judul Menu & Halaman{' '}
                                                <span className="text-rose-500">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={itemForm.data.title}
                                                onChange={(e) =>
                                                    itemForm.setData(
                                                        'title',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Contoh: Bootcamp"
                                                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#7C5CFF] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                            />
                                            {itemForm.errors.title && (
                                                <p className="mt-1 text-xs text-rose-500">
                                                    {itemForm.errors.title}
                                                </p>
                                            )}
                                        </div>

                                        {/* Active Toggle */}
                                        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
                                            <div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                    Status Tampil di Footer
                                                </p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    Jika aktif, menu ini dapat
                                                    dilihat dan diakses oleh
                                                    pengunjung.
                                                </p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={
                                                    itemForm.data.is_active
                                                }
                                                onChange={(e) =>
                                                    itemForm.setData(
                                                        'is_active',
                                                        e.target.checked,
                                                    )
                                                }
                                                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#7C5CFF]"
                                            />
                                        </div>

                                        {/* External URL Input OR Text Content Inputs */}
                                        {itemForm.data.link_type ===
                                        'external_url' ? (
                                            <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                                                <label className="block text-xs font-bold tracking-wider text-amber-600 uppercase dark:text-amber-400">
                                                    Direct URL Link Tujuan{' '}
                                                    <span className="text-rose-500">
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={
                                                        itemForm.data
                                                            .external_url
                                                    }
                                                    onChange={(e) =>
                                                        itemForm.setData(
                                                            'external_url',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="https://discord.gg/skillventura atau https://wa.me/628..."
                                                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#7C5CFF] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                                />
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    Saat pengunjung mengklik
                                                    menu ini di footer, mereka
                                                    langsung diarahkan ke URL di
                                                    atas pada tab baru.
                                                </p>
                                                {itemForm.errors
                                                    .external_url && (
                                                    <p className="text-xs text-rose-500">
                                                        {
                                                            itemForm.errors
                                                                .external_url
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-4 border-t border-slate-200 pt-4 dark:border-slate-800">
                                                <div>
                                                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                        Ringkasan / Sub-judul
                                                        Halaman (Text Singkat)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={
                                                            itemForm.data
                                                                .subtitle
                                                        }
                                                        onChange={(e) =>
                                                            itemForm.setData(
                                                                'subtitle',
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Ringkasan singkat yang tampil tepat di bawah judul halaman"
                                                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#7C5CFF] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                        Isi Konten / Deskripsi
                                                        Lengkap Halaman (Text
                                                        Paragraf)
                                                    </label>
                                                    <textarea
                                                        rows={6}
                                                        value={
                                                            itemForm.data
                                                                .content
                                                        }
                                                        onChange={(e) =>
                                                            itemForm.setData(
                                                                'content',
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Tuliskan penjelasan lengkap, informasi program, atau poin-poin ketentuan di sini..."
                                                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 focus:border-[#7C5CFF] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                                    />
                                                    {itemForm.errors
                                                        .content && (
                                                        <p className="mt-1 text-xs text-rose-500">
                                                            {
                                                                itemForm.errors
                                                                    .content
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* TAB MEDIA: IMAGE & YOUTUBE */}
                                {itemForm.data.link_type === 'internal_page' &&
                                    modalTab === 'media' && (
                                        <div className="space-y-5">
                                            {/* Image Upload Card */}
                                            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-sky-600 uppercase dark:text-sky-400">
                                                        <ImageIcon className="h-4 w-4" />
                                                        <span>
                                                            Gambar Banner /
                                                            Ilustrasi Halaman
                                                        </span>
                                                    </div>
                                                    {itemImagePreview && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setItemImagePreview(
                                                                    null,
                                                                );
                                                                itemForm.setData(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        image: null,
                                                                        remove_image: true,
                                                                    }),
                                                                );
                                                            }}
                                                            className="cursor-pointer rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-500 transition hover:bg-rose-500 hover:text-white"
                                                        >
                                                            Hapus Gambar
                                                        </button>
                                                    )}
                                                </div>

                                                {itemImagePreview ? (
                                                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950/10 p-2 dark:border-slate-700">
                                                        <img
                                                            src={
                                                                itemImagePreview
                                                            }
                                                            alt="Preview"
                                                            className="max-h-48 w-full rounded-lg object-contain"
                                                        />
                                                    </div>
                                                ) : (
                                                    <label className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-6 text-center transition hover:border-[#7C5CFF] dark:border-slate-700 dark:bg-slate-900/60">
                                                        <Upload className="mb-2 h-7 w-7 text-slate-400 transition group-hover:text-[#7C5CFF]" />
                                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                                            Klik untuk memilih
                                                            gambar ilustrasi /
                                                            banner
                                                        </span>
                                                        <span className="mt-1 text-[11px] text-slate-400">
                                                            PNG, JPG, JPEG, atau
                                                            WEBP (Maks. 4MB)
                                                        </span>
                                                        <input
                                                            type="file"
                                                            accept="image/png,image/jpeg,image/webp"
                                                            onChange={
                                                                handleItemImageChange
                                                            }
                                                            className="hidden"
                                                        />
                                                    </label>
                                                )}

                                                {itemImagePreview && (
                                                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                        <Upload className="h-3.5 w-3.5 text-[#7C5CFF]" />
                                                        <span>
                                                            Ganti File Gambar
                                                        </span>
                                                        <input
                                                            type="file"
                                                            accept="image/png,image/jpeg,image/webp"
                                                            onChange={
                                                                handleItemImageChange
                                                            }
                                                            className="hidden"
                                                        />
                                                    </label>
                                                )}

                                                {itemForm.errors.image && (
                                                    <p className="text-xs text-rose-500">
                                                        {itemForm.errors.image}
                                                    </p>
                                                )}

                                                <div>
                                                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                        Keterangan / Caption
                                                        Gambar (Opsional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={
                                                            itemForm.data
                                                                .image_caption
                                                        }
                                                        onChange={(e) =>
                                                            itemForm.setData(
                                                                'image_caption',
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Keterangan singkat di bawah gambar"
                                                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-[#7C5CFF] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                                    />
                                                </div>
                                            </div>

                                            {/* YouTube Embed Card */}
                                            {currentCatMeta.supportsYoutube ? (
                                                <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                                                    <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-rose-600 uppercase dark:text-rose-400">
                                                        <PlayCircle className="h-4 w-4" />
                                                        <span>
                                                            Embed Video YouTube
                                                            (Opsional)
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                            URL Video YouTube
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={
                                                                itemForm.data
                                                                    .youtube_url
                                                            }
                                                            onChange={(e) =>
                                                                itemForm.setData(
                                                                    'youtube_url',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                                                            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#7C5CFF] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                                        />
                                                    </div>

                                                    {youtubePreviewUrl && (
                                                        <div className="aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-black shadow-sm dark:border-slate-700">
                                                            <iframe
                                                                src={
                                                                    youtubePreviewUrl
                                                                }
                                                                title="YouTube Preview"
                                                                className="h-full w-full"
                                                                allowFullScreen
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs text-amber-700 dark:text-amber-300">
                                                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                                                    <span>
                                                        Untuk kategori{' '}
                                                        <strong>Support</strong>{' '}
                                                        (Hubungi Kami, Syarat &
                                                        Ketentuan, Kebijakan
                                                        Privasi), fitur Embed
                                                        Video YouTube tidak
                                                        digunakan agar halaman
                                                        dokumen legal dan pusat
                                                        bantuan tetap formal dan
                                                        fokus.
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                {/* TAB ACTION: CTA URL LINK & PROFILE CARD */}
                                {itemForm.data.link_type === 'internal_page' &&
                                    modalTab === 'action' && (
                                        <div className="space-y-5">
                                            {/* CTA Button Config */}
                                            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                                                <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-amber-600 uppercase dark:text-amber-400">
                                                    <Link2 className="h-4 w-4" />
                                                    <span>
                                                        Tombol Tautan / Call-To-Action
                                                        (URL Link)
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    Tambahkan tombol aksi di
                                                    bagian bawah halaman (misal
                                                    mengarahkan ke pendaftaran,
                                                    grup komunitas, atau
                                                    WhatsApp CS).
                                                </p>

                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div>
                                                        <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                            Label Tombol
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={
                                                                itemForm.data
                                                                    .cta_label
                                                            }
                                                            onChange={(e) =>
                                                                itemForm.setData(
                                                                    'cta_label',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="Contoh: Daftar Sekarang / Hubungi CS"
                                                            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#7C5CFF] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                            URL Link Tujuan
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={
                                                                itemForm.data
                                                                    .cta_url
                                                            }
                                                            onChange={(e) =>
                                                                itemForm.setData(
                                                                    'cta_url',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="/register atau https://wa.me/628..."
                                                            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#7C5CFF] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Optional Profile Card (Company Category) */}
                                            {currentCatMeta.supportsProfileCard && (
                                                <div className="space-y-4 rounded-xl border border-purple-500/30 bg-purple-500/5 p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-purple-600 uppercase dark:text-purple-400">
                                                            <Shield className="h-4 w-4" />
                                                            <span>
                                                                Kartu Profil
                                                                Pimpinan / Guild
                                                                Master
                                                            </span>
                                                        </div>
                                                        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    itemForm
                                                                        .data
                                                                        .profile_enabled
                                                                }
                                                                onChange={(e) =>
                                                                    itemForm.setData(
                                                                        'profile_enabled',
                                                                        e.target
                                                                            .checked,
                                                                    )
                                                                }
                                                                className="h-4 w-4 rounded border-slate-300 text-purple-600"
                                                            />
                                                            <span>
                                                                Tampilkan Kartu
                                                                Profil
                                                            </span>
                                                        </label>
                                                    </div>

                                                    {itemForm.data
                                                        .profile_enabled && (
                                                        <div className="space-y-4 pt-1">
                                                            <div className="flex flex-wrap items-center gap-4">
                                                                <img
                                                                    src={
                                                                        profileAvatarPreview ||
                                                                        '/images/default-avatar.svg'
                                                                    }
                                                                    alt="Profile Avatar"
                                                                    className="h-14 w-14 rounded-full border-2 border-yellow-400 object-cover"
                                                                />
                                                                <div className="flex flex-wrap gap-2">
                                                                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-600 dark:text-purple-300">
                                                                        <Upload className="h-3.5 w-3.5" />
                                                                        <span>
                                                                            Upload
                                                                            Foto
                                                                            Profil
                                                                        </span>
                                                                        <input
                                                                            type="file"
                                                                            accept="image/png,image/jpeg,image/webp"
                                                                            onChange={
                                                                                handleProfileAvatarChange
                                                                            }
                                                                            className="hidden"
                                                                        />
                                                                    </label>
                                                                    {profileAvatarPreview &&
                                                                        profileAvatarPreview !==
                                                                            '/images/default-avatar.svg' && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setProfileAvatarPreview(
                                                                                        '/images/default-avatar.svg',
                                                                                    );
                                                                                    itemForm.setData(
                                                                                        (
                                                                                            prev,
                                                                                        ) => ({
                                                                                            ...prev,
                                                                                            profile_avatar:
                                                                                                null,
                                                                                            remove_profile_avatar: true,
                                                                                        }),
                                                                                    );
                                                                                }}
                                                                                className="cursor-pointer rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-500"
                                                                            >
                                                                                Reset
                                                                                Foto
                                                                            </button>
                                                                        )}
                                                                </div>
                                                            </div>

                                                            <div className="grid gap-3 sm:grid-cols-3">
                                                                <div>
                                                                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                                        Nama
                                                                        Lengkap
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            itemForm
                                                                                .data
                                                                                .profile_name
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            itemForm.setData(
                                                                                'profile_name',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                                        Jabatan
                                                                        / Role
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            itemForm
                                                                                .data
                                                                                .profile_role
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            itemForm.setData(
                                                                                'profile_role',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                                        Label
                                                                        Badge
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            itemForm
                                                                                .data
                                                                                .profile_badge
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            itemForm.setData(
                                                                                'profile_badge',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                                    Bio Singkat
                                                                    / Kutipan
                                                                </label>
                                                                <textarea
                                                                    rows={3}
                                                                    value={
                                                                        itemForm
                                                                            .data
                                                                            .profile_bio
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        itemForm.setData(
                                                                            'profile_bio',
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                            </div>

                            {/* Sticky Footer Bar */}
                            <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50/80 px-6 py-4 dark:border-slate-800/80 dark:bg-slate-900/60">
                                <div className="hidden items-center gap-1.5 text-[11px] text-slate-500 sm:flex dark:text-slate-400">
                                    <span>Target:</span>
                                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                                        {itemForm.data.link_type ===
                                        'external_url'
                                            ? itemForm.data.external_url ||
                                              'URL Eksternal'
                                            : `/${itemForm.data.slug || '...'}`}
                                    </span>
                                </div>

                                <div className="flex w-full items-center justify-end gap-2.5 sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsItemModalOpen(false)
                                        }
                                        className="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={itemForm.processing}
                                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#7C5CFF] px-5 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-[#6a48eb] disabled:opacity-50"
                                    >
                                        {itemForm.processing && (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        )}
                                        <span>
                                            {itemForm.processing
                                                ? 'Menyimpan...'
                                                : editingItem
                                                  ? 'Simpan Perubahan'
                                                  : 'Tambah Menu Footer'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>,
                    document.body,
                )}

            {/* ================= PORTAL MODAL: CUSTOM DELETE CONFIRMATION (NO ALERT) ================= */}
            {mounted &&
                deleteDialog.open &&
                createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <div
                            onClick={() =>
                                !isDeleting &&
                                setDeleteDialog((prev) => ({
                                    ...prev,
                                    open: false,
                                }))
                            }
                            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
                        />

                        <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0d111a]">
                            <div className="h-1 w-full bg-gradient-to-r from-rose-500 to-orange-500" />

                            <div className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/15 text-rose-500">
                                        <AlertTriangle className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                            {deleteDialog.title}
                                        </h3>
                                        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                            {deleteDialog.subtitle}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800/80">
                                    <button
                                        type="button"
                                        disabled={isDeleting}
                                        onClick={() =>
                                            setDeleteDialog((prev) => ({
                                                ...prev,
                                                open: false,
                                            }))
                                        }
                                        className="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isDeleting}
                                        onClick={handleExecuteDelete}
                                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
                                    >
                                        {isDeleting ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-3.5 w-3.5" />
                                        )}
                                        <span>
                                            {isDeleting
                                                ? 'Menghapus...'
                                                : 'Ya, Hapus'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body,
                )}
        </AppLayout>
    );
}
