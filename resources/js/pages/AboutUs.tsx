import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Shield, Sparkles } from 'lucide-react';
import Footer from '@/components/Welcome/Footer';
import Navbar from '@/components/Welcome/Navbar';
import { useAppearance } from '@/hooks/use-appearance';

export default function AboutUs({ auth }: { auth: { user: any } }) {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const darkMode = resolvedAppearance === 'dark';

    const toggleTheme = () => {
        updateAppearance(darkMode ? 'light' : 'dark');
    };

    return (
        <>
            <Head title="About Us - SkillVentura" />
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

                        {/* Header Title */}
                        <div className="mb-12 text-center">
                            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-[#13174D] px-4 py-1.5 font-['Orbitron'] text-xs font-semibold tracking-[3px] text-cyan-300 uppercase">
                                <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                                About Us
                            </span>
                            <h1 className="mt-4 font-['Orbitron'] text-3xl font-extrabold tracking-wide text-slate-900 sm:text-4xl md:text-5xl dark:text-white">
                                SKILL VENTURA
                            </h1>
                            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">
                                Lorem ipsum dolor sit amet, consectetur
                                adipiscing elit. Sed do eiusmod tempor
                                incididunt ut labore et dolore magna aliqua.
                            </p>
                        </div>

                        {/* Guild Master Profile Card */}
                        <div className="relative overflow-hidden rounded-3xl border border-cyan-400/40 bg-[#13174D] p-8 text-center text-white shadow-[0_15px_40px_rgba(0,0,0,0.35)] sm:p-12">
                            <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-blue-600/30 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />

                            <div className="relative z-10 flex flex-col items-center">
                                {/* Photo Container */}
                                <div className="relative mb-6">
                                    <div className="h-36 w-36 overflow-hidden rounded-full border-4 border-[#FACC15] bg-[#1D215D] p-1 shadow-[0_0_25px_rgba(250,204,21,0.35)] sm:h-44 sm:w-44">
                                        <img
                                            src="/images/default-avatar.svg"
                                            alt="Ir. Ridwan Satrio Hadikusumo S.T., M.T."
                                            className="h-full w-full rounded-full object-cover"
                                        />
                                    </div>
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-300/60 bg-[#FACC15] px-3.5 py-1 font-['Orbitron'] text-[11px] font-extrabold tracking-wider text-slate-950 uppercase shadow-lg whitespace-nowrap">
                                            <Shield className="h-3.5 w-3.5 fill-slate-950" />
                                            Guild Master
                                        </span>
                                    </div>
                                </div>

                                {/* Name & Role */}
                                <h2 className="mt-3 font-['Oxanium'] text-xl font-extrabold tracking-wide text-white sm:text-2xl md:text-3xl">
                                    Ir. Ridwan Satrio Hadikusumo S.T., M.T.
                                </h2>
                                <p className="mt-1.5 font-['Orbitron'] text-sm font-bold tracking-[2px] text-[#FACC15] uppercase sm:text-base">
                                    Guild Master
                                </p>

                                <div className="my-6 h-px w-24 bg-cyan-400/40" />

                                <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                                    Lorem ipsum dolor sit amet, consectetur
                                    adipiscing elit, sed do eiusmod tempor
                                    incididunt ut labore et dolore magna aliqua.
                                    Ut enim ad minim veniam, quis nostrud
                                    exercitation ullamco laboris nisi ut aliquip
                                    ex ea commodo consequat.
                                </p>
                            </div>
                        </div>

                        {/* Additional Lorem Ipsum Sections */}
                        <div className="mt-10 grid gap-6 md:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-cyan-400/30 dark:bg-[#1D215D]/80">
                                <h3 className="mb-3 font-['Orbitron'] text-lg font-bold text-slate-900 dark:text-white">
                                    Lorem Ipsum Dolor
                                </h3>
                                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                    Lorem ipsum dolor sit amet, consectetur
                                    adipiscing elit. Duis aute irure dolor in
                                    reprehenderit in voluptate velit esse cillum
                                    dolore eu fugiat nulla pariatur. Excepteur
                                    sint occaecat cupidatat non proident.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-cyan-400/30 dark:bg-[#1D215D]/80">
                                <h3 className="mb-3 font-['Orbitron'] text-lg font-bold text-slate-900 dark:text-white">
                                    Consectetur Adipiscing
                                </h3>
                                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                    Lorem ipsum dolor sit amet, consectetur
                                    adipiscing elit. Sed ut perspiciatis unde
                                    omnis iste natus error sit voluptatem
                                    accusantium doloremque laudantium, totam rem
                                    aperiam.
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
