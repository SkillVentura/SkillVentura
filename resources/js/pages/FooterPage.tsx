import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, FileText } from 'lucide-react';
import Footer from '@/components/Welcome/Footer';
import Navbar from '@/components/Welcome/Navbar';
import { useAppearance } from '@/hooks/use-appearance';

const PAGE_TITLES: Record<string, { title: string; category: string }> = {
    'online-course': { title: 'Online Course', category: 'Program' },
    bootcamp: { title: 'Bootcamp', category: 'Program' },
    'learn-gaming': { title: 'Learn Gaming', category: 'Program' },
    'corporate-training': { title: 'Corporate Training', category: 'Program' },
    partnership: { title: 'Partnership', category: 'Program' },
    blog: { title: 'Blog', category: 'Company' },
    learn: { title: 'Learn', category: 'Company' },
    komunitas: { title: 'Komunitas', category: 'Company' },
    'hubungi-kami': { title: 'Hubungi Kami', category: 'Support' },
    'syarat-dan-ketentuan': {
        title: 'Syarat dan Ketentuan',
        category: 'Support',
    },
    'kebijakan-dan-privasi': {
        title: 'Kebijakan dan Privasi',
        category: 'Support',
    },
};

export default function FooterPage({
    auth,
    slug,
}: {
    auth: { user: any };
    slug: string;
}) {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const darkMode = resolvedAppearance === 'dark';

    const toggleTheme = () => {
        updateAppearance(darkMode ? 'light' : 'dark');
    };

    const pageInfo = PAGE_TITLES[slug] || {
        title: slug
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '),
        category: 'Informasi',
    };

    return (
        <>
            <Head title={`${pageInfo.title} - SkillVentura`} />
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

                    <div className="mx-auto max-w-4xl">
                        <div className="mb-8">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-blue-500 hover:text-blue-600 dark:border-white/10 dark:bg-[#0f172a]/80 dark:text-slate-200 dark:hover:border-yellow-400 dark:hover:text-yellow-400"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Kembali ke Beranda
                            </Link>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg sm:p-12 dark:border-cyan-400/30 dark:bg-[#13174D]">
                            <div className="mb-6 flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-[#1D215D] px-3.5 py-1 font-['Orbitron'] text-xs font-semibold tracking-wider text-cyan-300 uppercase">
                                    <FileText className="h-3.5 w-3.5 text-[#FACC15]" />
                                    {pageInfo.category}
                                </span>
                            </div>

                            <h1 className="mb-6 font-['Orbitron'] text-2xl font-extrabold tracking-wide text-slate-900 sm:text-3xl md:text-4xl dark:text-white">
                                {pageInfo.title}
                            </h1>

                            <div className="space-y-4 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
                                <p>
                                    Lorem ipsum dolor sit amet, consectetur
                                    adipiscing elit. Sed do eiusmod tempor
                                    incididunt ut labore et dolore magna aliqua.
                                    Ut enim ad minim veniam, quis nostrud
                                    exercitation ullamco laboris nisi ut aliquip
                                    ex ea commodo consequat.
                                </p>
                                <p>
                                    Duis aute irure dolor in reprehenderit in
                                    voluptate velit esse cillum dolore eu fugiat
                                    nulla pariatur. Excepteur sint occaecat
                                    cupidatat non proident, sunt in culpa qui
                                    officia deserunt mollit anim id est laborum.
                                </p>
                                <p>
                                    Sed ut perspiciatis unde omnis iste natus
                                    error sit voluptatem accusantium doloremque
                                    laudantium, totam rem aperiam, eaque ipsa
                                    quae ab illo inventore veritatis et quasi
                                    architecto beatae vitae dicta sunt
                                    explicabo. Nemo enim ipsam voluptatem quia
                                    voluptas sit aspernatur aut odit aut fugit.
                                </p>
                            </div>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        </>
    );
}
