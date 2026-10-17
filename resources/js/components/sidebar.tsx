import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Home,
    Users,
    LogOut,
    Settings,
    Box,
    UserCheckIcon,
    User,
    FileSignature,
    GraduationCap,
    MessageSquare,
    Briefcase,
    HeartHandshake,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */
type Role = 'admin' | 'mentor' | 'student';

type MenuSection = 'main' | 'activity' | 'platform';

type MenuItem = {
    name: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    href: string;
    roles: Role[];
    section: MenuSection;
};

const sectionLabels: Record<MenuSection, string> = {
    main: 'Menu Utama',
    activity: 'Aktivitas & Komunitas',
    platform: 'Konfigurasi Platform',
};

/* -------------------------------------------------------------------------- */
/* MENU CONFIG (STATIC ONLY) */
/* -------------------------------------------------------------------------- */
const menu: MenuItem[] = [
    {
        name: 'Dashboard',
        icon: Home,
        href: '/dashboard', // will be overridden dynamically
        roles: ['admin', 'mentor', 'student'],
        section: 'main',
    },
    {
        name: 'Courses',
        icon: BookOpen,
        href: '/admin/courses',
        roles: ['admin'],
        section: 'main',
    },
    {
        name: 'Student Journey',
        icon: UserCheckIcon,
        href: '/mentor/student-journey',
        roles: ['mentor'],
        section: 'main',
    },
    {
        name: 'My Profile',
        icon: User,
        href: '/mentor/profile',
        roles: ['mentor'],
        section: 'main',
    },
    {
        name: 'My Profile',
        icon: User,
        href: '/profile',
        roles: ['student'],
        section: 'main',
    },
    {
        name: 'Users',
        icon: Users,
        href: '/admin/users',
        roles: ['admin'],
        section: 'main',
    },
    {
        name: 'Assets',
        icon: Box,
        href: '/admin/assets',
        roles: ['admin'],
        section: 'main',
    },
    {
        name: 'Quests',
        icon: Briefcase,
        href: '/admin/quests',
        roles: ['admin'],
        section: 'activity',
    },
    {
        name: 'Proyek Kelulusan',
        icon: GraduationCap,
        href: '/admin/submissions',
        roles: ['admin'],
        section: 'activity',
    },
    {
        name: 'Forum Diskusi',
        icon: MessageSquare,
        href: '/admin/forum', // dynamically overridden below
        roles: ['admin', 'mentor'],
        section: 'activity',
    },
    {
        name: 'Signature',
        icon: FileSignature,
        href: '/signature',
        roles: ['admin', 'mentor'],
        section: 'platform',
    },
    {
        name: 'Banner Donasi',
        icon: HeartHandshake,
        href: '/donation-banner',
        roles: ['admin', 'mentor'],
        section: 'platform',
    },
];

/* -------------------------------------------------------------------------- */
/* COMPONENT */
/* -------------------------------------------------------------------------- */
export default function Sidebar({
    isOpen,
    setSidebarOpen,
}: {
    isOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}) {
    const { url, props } = usePage<any>();
    const navRef = useRef<HTMLElement | null>(null);
    const activeItemRef = useRef<HTMLAnchorElement | null>(null);
    const [canScrollUp, setCanScrollUp] = useState(false);
    const [canScrollDown, setCanScrollDown] = useState(false);

    const userRole: Role | null = props?.auth?.user?.role ?? null;

    const hasRole = (allowed: Role[]) =>
        userRole ? allowed.includes(userRole) : false;

    const cleanUrl = url.split('?')[0];
    const isActiveRoute = (href: string) =>
        cleanUrl === href || cleanUrl.startsWith(`${href}/`);

    /* -------------------- Dynamic Dashboard Route -------------------- */
    const getDashboardRoute = () => {
        switch (userRole) {
            case 'admin':
                return '/admin/dashboard';
            case 'mentor':
                return '/mentor/dashboard';
            case 'student':
                return '/dashboard';
            default:
                return '/dashboard';
        }
    };

    /* -------------------- Check Scroll Overflow -------------------- */
    const updateScrollIndicators = useCallback(() => {
        const el = navRef.current;
        if (!el) {
            return;
        }
        setCanScrollUp(el.scrollTop > 8);
        setCanScrollDown(
            el.scrollTop + el.clientHeight < el.scrollHeight - 8,
        );
    }, []);

    useEffect(() => {
        updateScrollIndicators();
        window.addEventListener('resize', updateScrollIndicators);
        return () =>
            window.removeEventListener('resize', updateScrollIndicators);
    }, [updateScrollIndicators, isOpen, url]);

    useEffect(() => {
        if (activeItemRef.current) {
            activeItemRef.current.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth',
            });
        }
    }, [cleanUrl]);

    const scrollMenuBy = (amount: number) => {
        navRef.current?.scrollBy({ top: amount, behavior: 'smooth' });
    };

    /* -------------------- Auto Close on Resize (Mobile) -------------------- */
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [setSidebarOpen]);

    const visibleMenu = menu.filter((item) => hasRole(item.roles));
    const sections: MenuSection[] = ['main', 'activity', 'platform'];

    return (
        <>
            {/* Mobile Backdrop Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-[#030712]/60 backdrop-blur-sm transition-opacity duration-300 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col rounded-r-xl border-r border-white/8 bg-[#060B1A] transition-all duration-300 ease-in-out md:translate-x-0 ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                } ${isOpen ? 'md:w-64' : 'md:w-16'}`}
            >
                {/* Desktop Toggle Button */}
                <button
                    onClick={() => setSidebarOpen(!isOpen)}
                    className="absolute top-5 -right-3 z-50 hidden h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-transparent bg-sky-500 text-white shadow-[0_0_10px_rgba(14,165,233,0.3)] transition hover:scale-110 hover:bg-sky-600 md:flex dark:bg-sky-600 dark:hover:bg-sky-500"
                >
                    {isOpen ? (
                        <ChevronLeft size={14} />
                    ) : (
                        <ChevronRight size={14} />
                    )}
                </button>

                {/* Brand with Mobile Close Button */}
                <div
                    className={`shrink-0 border-b border-white/5 ${
                        isOpen
                            ? 'flex items-start justify-between px-6 py-5'
                            : 'flex items-center justify-center py-5'
                    }`}
                >
                    {isOpen ? (
                        <>
                            <Link href="/" className="group block">
                                <h1 className="text-lg font-bold tracking-tight text-white select-none">
                                    Skill
                                    <span className="text-[#7C5CFF] transition group-hover:text-yellow-400">
                                        Ventura
                                    </span>
                                </h1>
                                <p className="mt-0.5 text-[11px] tracking-wide text-slate-400">
                                    Learning Management System
                                </p>
                            </Link>
                            {/* Mobile Close Button inside Drawer */}
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/4 active:scale-95 md:hidden"
                            >
                                <X size={18} />
                            </button>
                        </>
                    ) : (
                        <Link
                            href="/"
                            title="SkillVentura Home"
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#7C5CFF]/30 bg-[#7C5CFF]/15 text-xs font-extrabold tracking-tighter text-white shadow-[0_0_12px_rgba(124,92,255,0.2)] transition hover:border-[#7C5CFF]"
                        >
                            S<span className="text-[#7C5CFF]">V</span>
                        </Link>
                    )}
                </div>

                {/* Scrollable Menu Wrapper with Interactive Fade Indicators */}
                <div className="relative flex min-h-0 flex-1 flex-col">
                    {canScrollUp && (
                        <button
                            type="button"
                            onClick={() => scrollMenuBy(-120)}
                            aria-label="Scroll menu ke atas"
                            className="absolute inset-x-0 top-0 z-20 flex h-7 cursor-pointer items-center justify-center bg-gradient-to-b from-[#060B1A] via-[#060B1A]/90 to-transparent text-slate-400 transition hover:text-[#7C5CFF]"
                        >
                            <ChevronUp className="h-3.5 w-3.5 animate-bounce" />
                        </button>
                    )}

                    <nav
                        ref={navRef}
                        onScroll={updateScrollIndicators}
                        className="sidebar-scrollbar min-h-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto px-3 py-4"
                    >
                        {sections.map((sectionKey) => {
                            const sectionItems = visibleMenu.filter(
                                (item) => item.section === sectionKey,
                            );
                            if (sectionItems.length === 0) {
                                return null;
                            }

                            return (
                                <div key={sectionKey} className="space-y-1">
                                    {isOpen ? (
                                        <p className="px-3 pb-1 text-[10px] font-bold tracking-[0.16em] text-slate-500/90 uppercase select-none">
                                            {sectionLabels[sectionKey]}
                                        </p>
                                    ) : (
                                        sectionKey !== 'main' && (
                                            <div className="mx-auto my-2 h-px w-6 bg-white/8" />
                                        )
                                    )}

                                    {sectionItems.map((item) => {
                                        const href =
                                            item.name === 'Dashboard'
                                                ? getDashboardRoute()
                                                : item.name === 'Forum Diskusi'
                                                  ? `/${userRole}/forum`
                                                  : item.href;

                                        const Icon = item.icon;
                                        const active = isActiveRoute(href);

                                        return (
                                            <Link
                                                key={`${item.section}-${item.name}`}
                                                ref={
                                                    active
                                                        ? activeItemRef
                                                        : undefined
                                                }
                                                href={href}
                                                title={
                                                    !isOpen
                                                        ? item.name
                                                        : undefined
                                                }
                                                className={`group relative flex items-center border-l-[3px] py-2.5 text-sm font-medium transition-all duration-200 ${
                                                    isOpen
                                                        ? 'gap-3 px-3'
                                                        : 'justify-center px-0'
                                                } ${
                                                    active
                                                        ? 'rounded-r-lg border-[#7C5CFF] bg-gradient-to-r from-[#7C5CFF]/20 to-[#7C5CFF]/5 text-white shadow-[inset_0_0_12px_rgba(124,92,255,0.12)]'
                                                        : 'rounded-lg border-transparent text-slate-400 hover:translate-x-0.5 hover:bg-white/5 hover:text-white'
                                                }`}
                                                onClick={() =>
                                                    window.innerWidth < 768 &&
                                                    setSidebarOpen(false)
                                                }
                                            >
                                                <Icon
                                                    size={18}
                                                    className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                                                        active
                                                            ? 'text-[#7C5CFF] drop-shadow-[0_0_6px_rgba(124,92,255,0.5)]'
                                                            : 'text-slate-400 transition-colors group-hover:text-white'
                                                    }`}
                                                />
                                                {isOpen && (
                                                    <span className="truncate">
                                                        {item.name}
                                                    </span>
                                                )}

                                                {/* Admin Quests Pending Badge */}
                                                {item.name === 'Quests' &&
                                                    userRole === 'admin' &&
                                                    props?.pendingCounts
                                                        ?.quests > 0 && (
                                                        <>
                                                            {isOpen ? (
                                                                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/20 px-1.5 text-[10px] font-bold text-amber-400 animate-pulse">
                                                                    {
                                                                        props
                                                                            .pendingCounts
                                                                            .quests
                                                                    }
                                                                </span>
                                                            ) : (
                                                                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                                                            )}
                                                        </>
                                                    )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </nav>

                    {canScrollDown && (
                        <button
                            type="button"
                            onClick={() => scrollMenuBy(120)}
                            aria-label="Scroll menu ke bawah"
                            className="absolute inset-x-0 bottom-0 z-20 flex h-7 cursor-pointer items-center justify-center bg-gradient-to-t from-[#060B1A] via-[#060B1A]/90 to-transparent text-slate-400 transition hover:text-[#7C5CFF]"
                        >
                            <ChevronDown className="h-3.5 w-3.5 animate-bounce" />
                        </button>
                    )}
                </div>

                {/* User Section */}
                <div
                    className={`shrink-0 border-t border-white/8 bg-[#030712]/40 transition-all duration-300 ${isOpen ? 'p-4' : 'flex flex-col items-center p-3'}`}
                >
                    <div
                        className={`flex items-center ${isOpen ? 'w-full gap-3' : 'justify-center'}`}
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#7C5CFF]/30 bg-[#7C5CFF]/20 text-sm font-semibold text-[#7C5CFF] shadow-[0_0_10px_rgba(124,92,255,0.15)]">
                            {props?.auth?.user?.name?.charAt(0)}
                        </div>

                        {isOpen && (
                            <div className="flex min-w-0 flex-col">
                                <span className="truncate text-sm font-medium text-white">
                                    {props?.auth?.user?.name}
                                </span>
                                <span className="truncate text-[11px] text-slate-400">
                                    {props?.auth?.user?.email}
                                </span>
                            </div>
                        )}
                    </div>

                    <div
                        className={`mt-3.5 flex ${isOpen ? 'w-full flex-row gap-2' : 'flex-col items-center gap-2'}`}
                    >
                        {/* Settings */}
                        <Link
                            href="/settings"
                            className={`flex items-center justify-center gap-2 rounded-lg border border-white/8 bg-white/4 text-slate-300 transition hover:bg-white/8 ${
                                isOpen
                                    ? 'flex-1 px-3 py-2'
                                    : 'h-9 w-9 shrink-0 p-0'
                            }`}
                        >
                            <Settings size={16} />
                            {isOpen && (
                                <span className="text-xs font-medium">
                                    Settings
                                </span>
                            )}
                        </Link>

                        {/* Logout */}
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 transition hover:bg-rose-500/20 ${
                                isOpen
                                    ? 'flex-1 px-3 py-2'
                                    : 'h-9 w-9 shrink-0 p-0'
                            }`}
                        >
                            <LogOut size={16} />
                            {isOpen && (
                                <span className="text-xs font-medium">
                                    Logout
                                </span>
                            )}
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                {isOpen && (
                    <div className="shrink-0 border-t border-white/8 px-5 py-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                        © {new Date().getFullYear()} SkillVentura
                    </div>
                )}
            </aside>
        </>
    );
}
