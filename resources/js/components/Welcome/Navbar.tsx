import { login, register } from '@/routes';
import { Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar({
    auth,
    darkMode,
    toggleTheme,
}: {
    auth: any;
    darkMode: boolean;
    toggleTheme: () => void;
}) {
    const [activeSection, setActiveSection] = useState('home');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    useEffect(() => {
        const handleScroll = () => {
            const sections = ['home', 'about', 'learn', 'contact'];

            let current = 'home';

            sections.forEach((id) => {
                const element = document.getElementById(id);
                if (element) {
                    const offsetTop = element.offsetTop - 100; // jarak navbar
                    if (window.scrollY >= offsetTop) {
                        current = id;
                    }
                }
            });

            setActiveSection(current);
        };

        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className="fixed top-0 right-0 left-0 z-50">
            <motion.nav className="flex w-full items-center justify-between border-b bg-white px-4 py-2 shadow-sm md:px-1 md:py-1 lg:px-8 lg:py-2 dark:bg-[#04062d]">
                <Link href="/" className="flex items-center gap-[-10px]">
                    {/* Use existing logo logic or fallback to icon */}
                    <div className="flex items-center justify-center rounded-lg text-white">
                        {/* <Gem size={24} /> */}
                        <img
                            src="/images/logo-fast.webp"
                            alt="Logo"
                            className="h-16 w-auto object-contain md:h-16 lg:h-18 xl:h-19"
                        />
                    </div>
                </Link>

                <div className="mt-2 hidden items-center gap-6 text-lg font-black tracking-wide drop-shadow-sm md:mt-2 md:flex md:gap-6 md:text-xl lg:mt-3 lg:gap-10 lg:text-2xl">
                    <a
                        href="/#"
                        onClick={() => setActiveSection('home')}
                        className={`transition-all duration-300 ${
                            activeSection === 'home'
                                ? 'text-[#FACC15]'
                                : 'text-slate-600 hover:text-yellow-400 dark:text-slate-100'
                        }`}
                        style={{ fontFamily: 'Lalezar' }}
                    >
                        HOME
                    </a>

                    <a
                        href="/#about"
                        onClick={() => setActiveSection('about')}
                        className={`transition-all duration-300 ${
                            activeSection === 'about'
                                ? 'text-[#FACC15]'
                                : 'text-slate-600 hover:text-yellow-400 dark:text-slate-100'
                        }`}
                        style={{ fontFamily: 'Lalezar' }}
                    >
                        ABOUT
                    </a>

                    <a
                        href="/#learn"
                        onClick={() => setActiveSection('learn')}
                        className={`transition-all duration-300 ${
                            activeSection === 'learn'
                                ? 'text-[#FACC15]'
                                : 'text-slate-600 hover:text-yellow-400 dark:text-slate-100'
                        }`}
                        style={{ fontFamily: 'Lalezar' }}
                    >
                        LEARN
                    </a>

                    <a
                        href="/#contact"
                        onClick={() => setActiveSection('contact')}
                        className={`transition-all duration-300 ${
                            activeSection === 'contact'
                                ? 'text-[#FACC15]'
                                : 'text-slate-600 hover:text-yellow-400 dark:text-slate-100'
                        }`}
                        style={{ fontFamily: 'Lalezar' }}
                    >
                        CONTACT
                    </a>
                </div>

                <div className="hidden items-center gap-3 md:flex">
                    {auth?.user ? (
                        <Link
                            href={
                                auth.user.role === 'admin'
                                    ? '/admin/dashboard'
                                    : auth.user.role === 'mentor'
                                      ? '/mentor/dashboard'
                                      : '/dashboard'
                            }
                            className="rounded-xs bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 md:px-4 md:py-2.5 md:text-sm lg:px-5"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link
                                href={login()}
                                className="rounded-sm bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 md:px-4 md:py-2.5 md:text-sm lg:px-5"
                            >
                                Login
                            </Link>
                            <Link
                                href={register()}
                                className="rounded-xl bg-[#FACC15] px-3 py-2 text-xs font-bold text-black shadow-lg shadow-yellow-400/20 transition-all hover:bg-yellow-300 md:px-4 md:py-2.5 md:text-sm lg:px-5"
                            >
                                Register
                            </Link>
                        </>
                    )}
                    <button
                        onClick={toggleTheme}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-white/80 shadow transition hover:scale-105 md:h-9 md:w-9 lg:h-10 lg:w-10 dark:border-white/10 dark:bg-[#0f172a]"
                    >
                        {darkMode ? (
                            <Sun
                                size={16}
                                className="text-yellow-400 md:size-[18px]"
                            />
                        ) : (
                            <Moon
                                size={16}
                                className="text-slate-700 md:size-[18px]"
                            />
                        )}
                    </button>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="p-2 text-sky-500 md:hidden dark:text-sky-400"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
            </motion.nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ y: -60, opacity: 0, scale: 0.98 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -40, opacity: 0, scale: 0.98 }}
                        transition={{
                            duration: 0.35,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        className="fixed top-20 right-0 left-0 z-40 flex flex-col gap-4 border-b border-white/10 bg-white/90 px-6 pt-8 pb-10 shadow-2xl backdrop-blur-md md:hidden dark:bg-[#0b1120]/90 dark:bg-gradient-to-b dark:from-[#0b1120] dark:to-[#0f172a]"
                    >
                        {/* MENU ITEMS */}
                        {[
                            { name: 'HOME', href: '/#' },
                            { name: 'ABOUT', href: '/#about' },
                            { name: 'LEARN', href: '/#learn' },
                            { name: 'CONTACT', href: '/#contact' },
                        ].map((item, i) => (
                            <motion.a
                                key={item.name}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                style={{ fontFamily: 'Oxanium' }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + i * 0.05 }}
                                className="group block w-full rounded-lg px-4 py-3 text-2xl font-bold text-slate-800 transition-all duration-200 hover:scale-[1.02] hover:bg-yellow-400/10 hover:shadow-md active:scale-95 dark:text-slate-100 dark:hover:bg-yellow-400/10"
                            >
                                <span className="transition-colors duration-200 group-hover:text-yellow-500">
                                    {item.name}
                                </span>
                            </motion.a>
                        ))}

                        <div className="my-4 h-px bg-white/10" />

                        {/* BUTTONS */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col gap-3"
                        >
                            <Link
                                href={login()}
                                className="w-full rounded-lg bg-blue-600 py-3 text-center font-bold text-white transition hover:bg-blue-700 active:scale-95"
                            >
                                Login
                            </Link>

                            <Link
                                href={register()}
                                className="w-full rounded-lg bg-yellow-400 py-3 text-center font-bold text-black transition hover:bg-yellow-300 active:scale-95"
                            >
                                Join For Free
                            </Link>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
