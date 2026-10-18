import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    ExternalLink,
    FileText,
    PlayCircle,
    Shield,
    Sparkles,
    X,
    ZoomIn,
} from 'lucide-react';
import { useState } from 'react';
import Footer from '@/components/Welcome/Footer';
import Navbar from '@/components/Welcome/Navbar';
import { useAppearance } from '@/hooks/use-appearance';

export interface FooterProfileCard {
    enabled: boolean;
    badge?: string | null;
    name?: string | null;
    role?: string | null;
    bio?: string | null;
    avatar_path?: string | null;
    avatar_url?: string | null;
}

export interface FooterPageDetail {
    id: string;
    category: 'program' | 'company' | 'support';
    category_label: string;
    title: string;
    slug: string;
    link_type: 'internal_page' | 'external_url';
    external_url?: string | null;
    subtitle?: string | null;
    content?: string | null;
    image_url?: string | null;
    image_caption?: string | null;
    youtube_url?: string | null;
    cta_label?: string | null;
    cta_url?: string | null;
    profile_card?: FooterProfileCard | null;
}

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

export default function FooterPage({
    auth,
    slug,
    page,
}: {
    auth: { user: any };
    slug: string;
    page?: FooterPageDetail | null;
}) {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const darkMode = resolvedAppearance === 'dark';
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const toggleTheme = () => {
        updateAppearance(darkMode ? 'light' : 'dark');
    };

    const fallbackTitle = slug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    const title = page?.title || fallbackTitle;
    const categoryLabel = page?.category_label || 'Informasi';
    const category = page?.category || 'program';
    const subtitle = page?.subtitle || null;
    const content = page?.content?.trim() || null;
    const imageUrl = page?.image_url || null;
    const imageCaption = page?.image_caption || null;
    const youtubeEmbedUrl =
        category !== 'support' ? getYoutubeEmbedUrl(page?.youtube_url) : null;
    const ctaUrl = page?.cta_url?.trim() || null;
    const ctaLabel = page?.cta_label?.trim() || 'Selengkapnya';
    const profileCard =
        category === 'company' && page?.profile_card?.enabled
            ? page.profile_card
            : null;

    const hasMainBodyContent = Boolean(
        content || imageUrl || youtubeEmbedUrl || ctaUrl,
    );

    const isInternalCta = Boolean(ctaUrl && ctaUrl.startsWith('/'));

    return (
        <>
            <Head title={`${title} - SkillVentura`} />

            {/* Lightbox Modal for Page Image */}
            {lightboxOpen && imageUrl && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
                    onClick={() => setLightboxOpen(false)}
                >
                    <div
                        className="relative max-w-4xl w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setLightboxOpen(false)}
                            className="absolute -top-10 right-0 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold tracking-wider text-white/80 uppercase transition hover:text-white"
                        >
                            <X className="h-4 w-4" />
                            Tutup
                        </button>
                        <div className="overflow-hidden rounded-2xl border border-cyan-400/30 bg-slate-950 shadow-2xl">
                            <img
                                src={imageUrl}
                                alt={imageCaption || title}
                                className="max-h-[80vh] w-full object-contain"
                            />
                        </div>
                        {imageCaption && (
                            <p className="mt-3 text-center text-sm text-slate-200">
                                {imageCaption}
                            </p>
                        )}
                    </div>
                </div>
            )}

            <div className="relative min-h-screen w-full overflow-x-hidden bg-[#f8fafc] font-sans text-[#1e293b] antialiased transition-colors duration-300 2xl:mx-auto 2xl:max-w-[1780px] dark:bg-[#020202] dark:text-slate-100">
                {/* Ambient Light Mode Background Texture */}
                <div className="pointer-events-none absolute inset-0 -z-20">
                    <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.25] dark:opacity-0" />
                </div>

                <Navbar
                    auth={auth}
                    darkMode={darkMode}
                    toggleTheme={toggleTheme}
                />

                <main className="relative z-10 container mx-auto px-4 pt-28 pb-16 sm:px-6 md:pt-36 md:pb-24">
                    {/* Ambient Glows */}
                    <div className="pointer-events-none absolute top-24 left-1/4 -z-10 h-[240px] w-[240px] rounded-full bg-blue-700/30 blur-[90px]" />
                    <div className="pointer-events-none absolute right-1/4 bottom-16 -z-10 h-[220px] w-[220px] rounded-full bg-cyan-500/20 blur-[85px]" />

                    <div className="mx-auto max-w-4xl space-y-8">
                        <div>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-blue-500 hover:text-blue-600 dark:border-white/10 dark:bg-[#0f172a]/80 dark:text-slate-200 dark:hover:border-yellow-400 dark:hover:text-yellow-400"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Kembali ke Beranda
                            </Link>
                        </div>

                        {/* Header Section */}
                        <div
                            className={
                                profileCard
                                    ? 'text-center'
                                    : 'rounded-3xl border border-slate-200 bg-white p-8 shadow-lg sm:p-10 dark:border-cyan-400/30 dark:bg-[#13174D]'
                            }
                        >
                            <div
                                className={`mb-4 flex items-center gap-2 ${profileCard ? 'justify-center' : ''}`}
                            >
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-[#1D215D] px-3.5 py-1 font-['Orbitron'] text-xs font-semibold tracking-wider text-cyan-300 uppercase">
                                    {profileCard ? (
                                        <Sparkles className="h-3.5 w-3.5 text-[#FACC15]" />
                                    ) : (
                                        <FileText className="h-3.5 w-3.5 text-[#FACC15]" />
                                    )}
                                    {categoryLabel}
                                </span>
                            </div>

                            <h1 className="font-['Orbitron'] text-2xl font-extrabold tracking-wide text-slate-900 sm:text-3xl md:text-4xl dark:text-white">
                                {title}
                            </h1>

                            {subtitle && (
                                <p
                                    className={`mt-3 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300 ${
                                        profileCard ? 'mx-auto max-w-2xl' : ''
                                    }`}
                                >
                                    {subtitle}
                                </p>
                            )}
                        </div>

                        {/* Optional Profile Card (e.g., Guild Master on About Us / Company pages) */}
                        {profileCard && (
                            <div className="relative overflow-hidden rounded-3xl border border-cyan-400/40 bg-[#13174D] p-8 text-center text-white shadow-[0_15px_40px_rgba(0,0,0,0.35)] sm:p-12">
                                <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-blue-600/30 blur-3xl" />
                                <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />

                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="relative mb-6">
                                        <div className="h-36 w-36 overflow-hidden rounded-full border-4 border-[#FACC15] bg-[#1D215D] p-1 shadow-[0_0_25px_rgba(250,204,21,0.35)] sm:h-44 sm:w-44">
                                            <img
                                                src={
                                                    profileCard.avatar_url ||
                                                    '/images/default-avatar.svg'
                                                }
                                                alt={
                                                    profileCard.name ||
                                                    'Profile Avatar'
                                                }
                                                className="h-full w-full rounded-full object-cover"
                                            />
                                        </div>
                                        {profileCard.badge && (
                                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                                                <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-300/60 bg-[#FACC15] px-3.5 py-1 font-['Orbitron'] text-[11px] font-extrabold tracking-wider whitespace-nowrap text-slate-950 uppercase shadow-lg">
                                                    <Shield className="h-3.5 w-3.5 fill-slate-950" />
                                                    {profileCard.badge}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {profileCard.name && (
                                        <h2 className="mt-3 font-['Oxanium'] text-xl font-extrabold tracking-wide text-white sm:text-2xl md:text-3xl">
                                            {profileCard.name}
                                        </h2>
                                    )}

                                    {profileCard.role && (
                                        <p className="mt-1.5 font-['Orbitron'] text-sm font-bold tracking-[2px] text-[#FACC15] uppercase sm:text-base">
                                            {profileCard.role}
                                        </p>
                                    )}

                                    {profileCard.bio && (
                                        <>
                                            <div className="my-6 h-px w-24 bg-cyan-400/40" />
                                            <p className="max-w-2xl text-sm leading-relaxed whitespace-pre-line text-slate-300 sm:text-base">
                                                {profileCard.bio}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Main Structured Content Card (YouTube Embed, Image, Text, CTA Link) */}
                        {(hasMainBodyContent || !profileCard) && (
                            <div className="space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg sm:p-10 dark:border-cyan-400/30 dark:bg-[#13174D]">
                                {/* YouTube Video Embed (Program & Company) */}
                                {youtubeEmbedUrl && (
                                    <div className="space-y-3">
                                        <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-blue-600 uppercase dark:text-cyan-300">
                                            <PlayCircle className="h-4 w-4 text-[#FACC15]" />
                                            Video Informasi
                                        </div>
                                        <div className="aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-md dark:border-cyan-400/30">
                                            <iframe
                                                src={youtubeEmbedUrl}
                                                title={`Video ${title}`}
                                                className="h-full w-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Image / Banner Section */}
                                {imageUrl && (
                                    <div className="space-y-3">
                                        <div
                                            onClick={() =>
                                                setLightboxOpen(true)
                                            }
                                            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 dark:border-cyan-400/25 dark:bg-[#0f1340]"
                                        >
                                            <img
                                                src={imageUrl}
                                                alt={imageCaption || title}
                                                className="max-h-[440px] w-full object-contain transition duration-300 group-hover:scale-[1.01]"
                                            />
                                            <div className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-900/75 px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
                                                <ZoomIn className="h-3.5 w-3.5" />
                                                Perbesar Gambar
                                            </div>
                                        </div>
                                        {imageCaption && (
                                            <p className="text-center text-xs text-slate-500 italic dark:text-slate-300/80">
                                                {imageCaption}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Main Text / Article Paragraphs */}
                                {content ? (
                                    <div className="space-y-4 text-sm leading-relaxed whitespace-pre-line text-slate-700 sm:text-base dark:text-slate-200">
                                        {content}
                                    </div>
                                ) : (
                                    !imageUrl &&
                                    !youtubeEmbedUrl &&
                                    !ctaUrl && (
                                        <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-300">
                                            Informasi detail mengenai halaman{' '}
                                            <span className="font-semibold text-slate-800 dark:text-white">
                                                {title}
                                            </span>{' '}
                                            sedang diperbarui oleh Administrator
                                            SkillVentura.
                                        </p>
                                    )
                                )}

                                {/* Call To Action / URL Link Button */}
                                {ctaUrl && (
                                    <div className="border-t border-slate-200/80 pt-6 dark:border-cyan-400/20">
                                        {isInternalCta ? (
                                            <Link
                                                href={ctaUrl}
                                                className="inline-flex items-center gap-2 rounded-xl bg-[#3B28F6] px-6 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#2a1ce0] dark:bg-[#FACC15] dark:text-slate-950 dark:hover:bg-yellow-300"
                                            >
                                                <span>{ctaLabel}</span>
                                                <ExternalLink className="h-4 w-4" />
                                            </Link>
                                        ) : (
                                            <a
                                                href={ctaUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 rounded-xl bg-[#3B28F6] px-6 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#2a1ce0] dark:bg-[#FACC15] dark:text-slate-950 dark:hover:bg-yellow-300"
                                            >
                                                <span>{ctaLabel}</span>
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>

                <Footer />
            </div>
        </>
    );
}
