import { Link } from '@inertiajs/react';

export default function Footer() {
    return (
        <footer className="border-t border-gray-200 py-16 dark:border-white/10">
            <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                    <h3 className="font-bold">Skill Ventura</h3>

                    <p className="text-sm text-gray-500">
                        Learn like a hero grow like a pro.
                    </p>
                </div>

                <div>
                    <h4 className="mb-3 font-semibold">Program</h4>

                    <ul className="space-y-2 text-sm">
                        <li>
                            <Link
                                href="/online-course"
                                className="hover:underline"
                            >
                                Online Course
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/bootcamp"
                                className="hover:underline"
                            >
                                Bootcamp
                            </Link>
                        </li>
                    </ul>
                </div>

                <div>
                    <h4 className="mb-3 font-semibold">Company</h4>

                    <ul className="space-y-2 text-sm">
                        <li>
                            <Link href="/about-us" className="hover:underline">
                                About
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/blog"
                                className="hover:underline"
                            >
                                Blog
                            </Link>
                        </li>
                    </ul>
                </div>

                <div>
                    <h4 className="mb-3 font-semibold">Support</h4>

                    <ul className="space-y-2 text-sm">
                        <li>
                            <Link
                                href="/hubungi-kami"
                                className="hover:underline"
                            >
                                Contact
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/kebijakan-dan-privasi"
                                className="hover:underline"
                            >
                                Privacy
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </footer>
    );
}
