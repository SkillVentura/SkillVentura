import { Link, usePage } from '@inertiajs/react';

export interface FooterLinkItem {
    id: string;
    title: string;
    slug: string;
    link_type: 'internal_page' | 'external_url';
    href: string;
    is_external: boolean;
}

export interface FooterSocialLink {
    id: string;
    platform: string;
    label: string;
    url: string;
    is_active: boolean;
}

export interface PublicFooterData {
    brand_name: string;
    brand_tagline?: string | null;
    brand_subtitle?: string | null;
    brand_description?: string | null;
    logo_url: string;
    address?: string | null;
    phone?: string | null;
    copyright_text: string;
    social_links: FooterSocialLink[];
    categories: {
        program: FooterLinkItem[];
        company: FooterLinkItem[];
        support: FooterLinkItem[];
    };
}

const SOCIAL_ICON_MAP: Record<string, string> = {
    instagram: 'fa-brands fa-instagram text-pink-500',
    whatsapp: 'fa-brands fa-whatsapp text-green-500',
    facebook: 'fa-brands fa-facebook text-blue-600',
    github: 'fa-brands fa-github text-gray-900 dark:text-white',
    x: 'fa-brands fa-x-twitter text-gray-900 dark:text-white',
    linkedin: 'fa-brands fa-linkedin text-blue-700',
    youtube: 'fa-brands fa-youtube text-red-600',
    tiktok: 'fa-brands fa-tiktok text-gray-900 dark:text-white',
    discord: 'fa-brands fa-discord text-indigo-500',
    website: 'fa-solid fa-globe text-cyan-500',
};

const DEFAULT_FOOTER_DATA: PublicFooterData = {
    brand_name: 'SKILL VENTURA',
    brand_tagline: 'Learn Like a Hero, Grow Like a Pro',
    brand_subtitle: 'Learn in SKILL VENTURA',
    brand_description:
        'A gamified learning platform where you level up through real projects, missions, and a guided skill-building roadmap.',
    logo_url: '/images/logo.webp',
    address: 'Bogor, Indonesia',
    phone: '+62 223 4432 5968',
    copyright_text: '© SKILL VENTURA Learn. All Rights Reserved',
    social_links: [
        { id: '1', platform: 'instagram', label: 'Instagram', url: '', is_active: true },
        { id: '2', platform: 'whatsapp', label: 'WhatsApp', url: '', is_active: true },
        { id: '3', platform: 'facebook', label: 'Facebook', url: '', is_active: true },
        { id: '4', platform: 'github', label: 'GitHub', url: '', is_active: true },
        { id: '5', platform: 'x', label: 'X (Twitter)', url: '', is_active: true },
        { id: '6', platform: 'linkedin', label: 'LinkedIn', url: '', is_active: true },
    ],
    categories: {
        program: [
            { id: 'p1', title: 'Online course', slug: 'online-course', link_type: 'internal_page', href: '/online-course', is_external: false },
            { id: 'p2', title: 'Bootcamp', slug: 'bootcamp', link_type: 'internal_page', href: '/bootcamp', is_external: false },
            { id: 'p3', title: 'Learn gaming', slug: 'learn-gaming', link_type: 'internal_page', href: '/learn-gaming', is_external: false },
            { id: 'p4', title: 'Corporate training', slug: 'corporate-training', link_type: 'internal_page', href: '/corporate-training', is_external: false },
            { id: 'p5', title: 'Partnership', slug: 'partnership', link_type: 'internal_page', href: '/partnership', is_external: false },
        ],
        company: [
            { id: 'c1', title: 'About us', slug: 'about-us', link_type: 'internal_page', href: '/about-us', is_external: false },
            { id: 'c2', title: 'Blog', slug: 'blog', link_type: 'internal_page', href: '/blog', is_external: false },
            { id: 'c3', title: 'Learn', slug: 'learn', link_type: 'internal_page', href: '/learn', is_external: false },
            { id: 'c4', title: 'Komunitas', slug: 'komunitas', link_type: 'internal_page', href: '/komunitas', is_external: false },
        ],
        support: [
            { id: 's1', title: 'Hubungi Kami', slug: 'hubungi-kami', link_type: 'internal_page', href: '/hubungi-kami', is_external: false },
            { id: 's2', title: 'Syarat dan Ketentuan', slug: 'syarat-dan-ketentuan', link_type: 'internal_page', href: '/syarat-dan-ketentuan', is_external: false },
            { id: 's3', title: 'Kebijakan dan Privasi', slug: 'kebijakan-dan-privasi', link_type: 'internal_page', href: '/kebijakan-dan-privasi', is_external: false },
        ],
    },
};

export default function Footer() {
    const { footer } = usePage<{ footer?: PublicFooterData }>().props;
    const data: PublicFooterData = footer ?? DEFAULT_FOOTER_DATA;

    const renderNavLink = (item: FooterLinkItem) => {
        if (item.is_external) {
            return (
                <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-blue-600 dark:hover:text-yellow-400"
                >
                    {item.title}
                </a>
            );
        }

        return (
            <Link
                href={item.href}
                className="transition-colors hover:text-blue-600 dark:hover:text-yellow-400"
            >
                {item.title}
            </Link>
        );
    };

    return (
        <footer className="relative pt-12 pb-10 sm:pt-14 md:pt-16">
            {/* Ambient Tech Glows */}
            <div className="pointer-events-none absolute top-0 right-1/4 z-0">
                <div className="h-[190px] w-[190px] rounded-full bg-blue-800/80 blur-[70px]" />
            </div>
            <div className="pointer-events-none absolute bottom-4 left-16 z-0">
                <div className="h-[170px] w-[170px] rounded-full bg-blue-800/80 blur-[65px]" />
            </div>

            <div className="relative z-10 container mx-auto grid gap-12 px-6 md:grid-cols-4">
                {/* BRAND */}
                <div className="mx-auto max-w-sm text-center md:mx-0 md:text-left">
                    <div className="mb-4 flex items-center justify-center gap-3 md:justify-start">
                        <img
                            src={data.logo_url || '/images/logo.webp'}
                            alt={data.brand_name}
                            className="w-10 object-contain"
                        />

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {data.brand_name}
                            </h3>

                            {data.brand_tagline && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {data.brand_tagline}
                                </p>
                            )}
                        </div>
                    </div>

                    {data.brand_subtitle && (
                        <h4 className="mb-2 font-semibold text-gray-900 dark:text-white">
                            {data.brand_subtitle}
                        </h4>
                    )}

                    {data.brand_description && (
                        <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                            {data.brand_description}
                        </p>
                    )}

                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        {data.address && <p>📍 {data.address}</p>}
                        {data.phone && <p>📞 {data.phone}</p>}
                    </div>
                </div>

                {/* SOCIAL MEDIA */}
                <div className="flex flex-col items-center gap-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Social Media
                    </h4>

                    <div className="flex flex-wrap justify-center gap-6 text-xl">
                        {(data.social_links ?? []).map((social) => {
                            const iconClass =
                                SOCIAL_ICON_MAP[social.platform] ||
                                'fa-solid fa-globe text-cyan-500';

                            if (social.url) {
                                return (
                                    <a
                                        key={social.id}
                                        href={social.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={social.label}
                                        aria-label={social.label}
                                        className="transition hover:scale-110"
                                    >
                                        <i className={`${iconClass} cursor-pointer`}></i>
                                    </a>
                                );
                            }

                            return (
                                <span
                                    key={social.id}
                                    title={social.label}
                                    aria-label={social.label}
                                    className="transition hover:scale-110"
                                >
                                    <i className={`${iconClass} cursor-pointer`}></i>
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* PROGRAM */}
                <div className="text-center md:text-left">
                    <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        Program
                    </h4>

                    <ul className="space-y-2 text-sm text-gray-600 sm:flex sm:flex-wrap sm:justify-center sm:space-y-0 sm:gap-x-6 sm:gap-y-2 md:flex-col md:justify-start md:space-y-2 dark:text-gray-400">
                        {(data.categories?.program ?? []).map((item) => (
                            <li key={item.id}>{renderNavLink(item)}</li>
                        ))}
                    </ul>
                </div>

                {/* COMPANY & SUPPORT */}
                <div className="grid grid-cols-2 gap-8 text-center md:text-left">
                    {/* COMPANY */}
                    <div>
                        <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                            Company
                        </h4>

                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            {(data.categories?.company ?? []).map((item) => (
                                <li key={item.id}>{renderNavLink(item)}</li>
                            ))}
                        </ul>
                    </div>

                    {/* SUPPORT */}
                    <div>
                        <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                            Support
                        </h4>

                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            {(data.categories?.support ?? []).map((item) => (
                                <li key={item.id}>{renderNavLink(item)}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* COPYRIGHT */}
            <div className="container mx-auto mt-12 border-t border-gray-200 px-6 pt-6 dark:border-white/10">
                <p className="text-center text-xs text-gray-500 md:text-left dark:text-gray-400">
                    {data.copyright_text}
                </p>
            </div>
        </footer>
    );
}
