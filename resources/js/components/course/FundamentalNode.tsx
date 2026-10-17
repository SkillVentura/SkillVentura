import { Link } from '@inertiajs/react';

type Props = {
    title: string;
    description?: string | null;
    index: number;
    isLast?: boolean;
    href?: string;
    thumbnail?: string | null;
};

export default function FundamentalNode({
    title,
    description,
    isLast,
    href,
    thumbnail,
}: Props) {
    return (
        <div className="relative z-10 mx-auto flex w-full max-w-[420px] flex-col items-center transition-all">
            <Link
                href={href || '#'}
                className="block w-full rounded-xl p-[2px] transition-all hover:shadow-[0_4px_20px_rgba(99,102,241,0.35)]"
                style={{
                    background:
                        'linear-gradient(to right, #3b82f6, #7c3aed, #facc15)',
                    boxShadow:
                        '0 0 0 1px rgba(59,130,246,0.3), 0 2px 12px rgba(99,102,241,0.15)',
                }}
            >
                <div className="flex h-full w-full items-center gap-4 rounded-xl bg-[#0D1037] p-4 text-white">
                    {/* Icon / Image block */}
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-blue-500 bg-blue-900/40">
                        {thumbnail ? (
                            <img
                                src={
                                    thumbnail.startsWith('http') || thumbnail.startsWith('/')
                                        ? thumbnail
                                        : `/storage/${thumbnail}`
                                }
                                className="h-full w-full object-cover"
                                alt="thumbnail"
                            />
                        ) : (
                            /* rocket icon */
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className="h-7 w-7 text-blue-400"
                            >
                                <path
                                    d="M12 2C12 2 7 6 7 13l2 2c0-4 1.5-7 3-9 1.5 2 3 5 3 9l2-2c0-7-5-11-5-11Z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M9 15l-2 4 3-1M15 15l2 4-3-1"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <circle
                                    cx="12"
                                    cy="13"
                                    r="1.5"
                                    fill="currentColor"
                                />
                            </svg>
                        )}
                    </div>

                    <div className="flex min-w-0 flex-col text-left">
                        <h3 className="truncate font-['Orbitron'] text-sm leading-tight font-bold tracking-wide text-white uppercase">
                            {title}
                        </h3>
                        <p className="mt-1 line-clamp-2 font-sans text-[10px] leading-snug text-slate-400 sm:text-[11px]">
                            {description ||
                                'This fundamental module covers the core concepts, syntax, and essential tools required to begin programming modern web solutions.'}
                        </p>
                    </div>
                </div>
            </Link>

            {!isLast && <div className="h-12 w-[2px] bg-blue-500/70"></div>}
        </div>
    );
}
