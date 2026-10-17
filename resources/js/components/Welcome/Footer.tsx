import { Link } from '@inertiajs/react';

export default function Footer() {
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
                        <img src="/images/logo.webp" className="w-10" />

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                SKILL VENTURA
                            </h3>

                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Learn Like a Hero, Grow Like a Pro
                            </p>
                        </div>
                    </div>

                    <h4 className="mb-2 font-semibold text-gray-900 dark:text-white">
                        Learn in SKILL VENTURA
                    </h4>

                    <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                        A gamified learning platform where you level up through
                        real projects, missions, and a guided skill-building
                        roadmap.
                    </p>

                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <p>📍 Bogor, Indonesia</p>
                        <p>📞 +62 223 4432 5968</p>
                    </div>
                </div>

                {/* SOCIAL MEDIA */}
                <div className="flex flex-col items-center gap-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Social Media
                    </h4>

                    <div className="flex gap-6 text-xl">
                        <i className="fa-brands fa-instagram cursor-pointer text-pink-500 transition hover:scale-110"></i>

                        <i className="fa-brands fa-whatsapp cursor-pointer text-green-500 transition hover:scale-110"></i>

                        <i className="fa-brands fa-facebook cursor-pointer text-blue-600 transition hover:scale-110"></i>

                        <i className="fa-brands fa-github cursor-pointer text-gray-900 transition hover:scale-110 dark:text-white"></i>

                        <i className="fa-brands fa-x-twitter cursor-pointer text-gray-900 transition hover:scale-110 dark:text-white"></i>

                        <i className="fa-brands fa-linkedin cursor-pointer text-blue-700 transition hover:scale-110"></i>
                    </div>
                </div>

                {/* PROGRAM */}
                <div className="text-center md:text-left">
                    <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        Program
                    </h4>

                    <ul className="space-y-2 text-sm text-gray-600 sm:flex sm:flex-wrap sm:justify-center sm:space-y-0 sm:gap-x-6 sm:gap-y-2 md:flex-col md:justify-start md:space-y-2 dark:text-gray-400">
                        <li>
                            <Link
                                href="/online-course"
                                className="transition-colors hover:text-blue-600 dark:hover:text-yellow-400"
                            >
                                Online course
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/bootcamp"
                                className="transition-colors hover:text-blue-600 dark:hover:text-yellow-400"
                            >
                                Bootcamp
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/learn-gaming"
                                className="transition-colors hover:text-blue-600 dark:hover:text-yellow-400"
                            >
                                Learn gaming
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/corporate-training"
                                className="transition-colors hover:text-blue-600 dark:hover:text-yellow-400"
                            >
                                Corporate training
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/partnership"
                                className="transition-colors hover:text-blue-600 dark:hover:text-yellow-400"
                            >
                                Partnership
                            </Link>
                        </li>
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
                            <li>
                                <Link
                                    href="/about-us"
                                    className="transition-colors hover:text-blue-600 dark:hover:text-yellow-400"
                                >
                                    About us
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/blog"
                                    className="transition-colors hover:text-blue-600 dark:hover:text-yellow-400"
                                >
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/learn"
                                    className="transition-colors hover:text-blue-600 dark:hover:text-yellow-400"
                                >
                                    Learn
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/komunitas"
                                    className="transition-colors hover:text-blue-600 dark:hover:text-yellow-400"
                                >
                                    Komunitas
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* SUPPORT */}
                    <div>
                        <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                            Support
                        </h4>

                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <li>
                                <Link
                                    href="/hubungi-kami"
                                    className="transition-colors hover:text-blue-600 dark:hover:text-yellow-400"
                                >
                                    Hubungi Kami
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/syarat-dan-ketentuan"
                                    className="transition-colors hover:text-blue-600 dark:hover:text-yellow-400"
                                >
                                    Syarat dan Ketentuan
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/kebijakan-dan-privasi"
                                    className="transition-colors hover:text-blue-600 dark:hover:text-yellow-400"
                                >
                                    Kebijakan dan Privasi
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* COPYRIGHT */}
            <div className="container mx-auto mt-12 border-t border-gray-200 px-6 pt-6 dark:border-white/10">
                <p className="text-center text-xs text-gray-500 md:text-left dark:text-gray-400">
                    © SKILL VENTURA Learn. All Rights Reserved
                </p>
            </div>
        </footer>
    );
}
