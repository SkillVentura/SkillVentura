import AppLayout from '@/layouts/app-layout';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    Award,
    Clock,
    ExternalLink,
    FileText,
    GraduationCap,
    Search,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Calendar,
    X,
    User as UserIcon,
    ArrowLeft,
} from 'lucide-react';

interface StudentData {
    _id: string;
    name: string;
    email: string;
    avatar?: string | null;
}

interface SubmissionDetails {
    _id: string;
    title: string;
    group_name: string;
    mentor_name: string;
}

interface StudentSubmissionItem {
    _id: string;
    id: string;
    slug: string;
    status: 'submitted' | 'graded' | 'late' | string;
    grade?: number | string | null;
    feedback?: string | null;
    file_path?: string | null;
    file_url?: string | null;
    link?: string | null;
    notes?: string | null;
    certificate_path?: string | null;
    certificate_url?: string | null;
    created_at?: string | null;
    created_at_formatted: string;
    student: StudentData | null;
    submission: SubmissionDetails | null;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    total: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

interface Props {
    submissions: PaginatedData<StudentSubmissionItem>;
    filters: {
        status: string;
        search: string;
    };
    counts: {
        all: number;
        submitted: number;
        graded: number;
        late: number;
    };
}

export default function Index({ submissions, filters, counts }: Props) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [isLoading, setIsLoading] = useState(false);
    const currentStatus = filters.status || 'all';

    const handleFilterChange = (status: string) => {
        setIsLoading(true);
        router.get(
            '/admin/submissions',
            {
                status: status !== 'all' ? status : undefined,
                search: searchQuery || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsLoading(false),
            },
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        router.get(
            '/admin/submissions',
            {
                status: currentStatus !== 'all' ? currentStatus : undefined,
                search: searchQuery || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsLoading(false),
            },
        );
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setIsLoading(true);
        router.get(
            '/admin/submissions',
            {
                status: currentStatus !== 'all' ? currentStatus : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsLoading(false),
            },
        );
    };

    return (
        <AppLayout>
            <div
                className="relative min-h-screen bg-transparent px-4 py-6 text-slate-900 transition-colors duration-200 sm:px-6 lg:px-8 dark:bg-transparent dark:text-white"
                style={{ fontFamily: "'Outfit', sans-serif" }}
            >
                {/* Ambient Glow */}
                <div className="pointer-events-none absolute top-0 left-1/2 z-0 h-[400px] w-full max-w-7xl -translate-x-1/2 rounded-full bg-indigo-500/5 blur-[120px] select-none dark:bg-indigo-500/5" />

                <div className="relative z-10 mx-auto max-w-7xl space-y-6">
                    {/* Header Banner */}
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-indigo-50/20 p-5 shadow-sm sm:p-7 md:p-8 dark:border-slate-800 dark:bg-gradient-to-br dark:from-[#0d0f17] dark:via-[#090b12] dark:to-[#07080f]">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-indigo-600 uppercase dark:text-indigo-400">
                                        <GraduationCap className="h-3.5 w-3.5" />
                                        Supervisi Kelulusan
                                    </span>
                                </div>
                                <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl md:text-3xl dark:text-white">
                                    Monitoring Proyek Kelulusan Siswa
                                </h1>
                                <p className="text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-400">
                                    Pantau pengumpulan proyek akhir cabang karir, status evaluasi mentor, dan sertifikat yang diterbitkan.
                                </p>
                            </div>

                            <Link
                                href="/admin/dashboard"
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span>Kembali ke Dashboard</span>
                            </Link>
                        </div>
                    </div>

                    {/* Top KPI Metric Cards (Interactive Filter Chips) */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                        {/* 1. Semua Pengajuan */}
                        <div
                            onClick={() => handleFilterChange('all')}
                            className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-4 transition-all duration-200 ${
                                currentStatus === 'all'
                                    ? 'border-indigo-500 bg-indigo-50/70 shadow-md shadow-indigo-500/10 dark:border-indigo-500/60 dark:bg-indigo-950/40'
                                    : 'border-slate-200/90 bg-white hover:border-indigo-300 hover:bg-slate-50/80 dark:border-slate-800 dark:bg-[#0c0e17] dark:hover:border-slate-700'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                    Total Pengajuan
                                </span>
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                                    <GraduationCap className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-xl font-black text-slate-900 sm:text-2xl dark:text-white">
                                    {counts.all}
                                </span>
                                <span className="text-[11px] font-medium text-slate-400">
                                    proyek
                                </span>
                            </div>
                        </div>

                        {/* 2. Menanti Review */}
                        <div
                            onClick={() => handleFilterChange('submitted')}
                            className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-4 transition-all duration-200 ${
                                currentStatus === 'submitted'
                                    ? 'border-amber-500 bg-amber-50/70 shadow-md shadow-amber-500/10 dark:border-amber-500/60 dark:bg-amber-950/40'
                                    : 'border-slate-200/90 bg-white hover:border-amber-300 hover:bg-slate-50/80 dark:border-slate-800 dark:bg-[#0c0e17] dark:hover:border-slate-700'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                    Menanti Review
                                </span>
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                                    <Clock className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-xl font-black text-amber-600 sm:text-2xl dark:text-amber-400">
                                    {counts.submitted}
                                </span>
                                <span className="text-[11px] font-medium text-slate-400">
                                    antrean
                                </span>
                            </div>
                        </div>

                        {/* 3. Selesai Dinilai */}
                        <div
                            onClick={() => handleFilterChange('graded')}
                            className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-4 transition-all duration-200 ${
                                currentStatus === 'graded'
                                    ? 'border-emerald-500 bg-emerald-50/70 shadow-md shadow-emerald-500/10 dark:border-emerald-500/60 dark:bg-emerald-950/40'
                                    : 'border-slate-200/90 bg-white hover:border-emerald-300 hover:bg-slate-50/80 dark:border-slate-800 dark:bg-[#0c0e17] dark:hover:border-slate-700'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                    Selesai Dinilai
                                </span>
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                    <Award className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-xl font-black text-emerald-600 sm:text-2xl dark:text-emerald-400">
                                    {counts.graded}
                                </span>
                                <span className="text-[11px] font-medium text-slate-400">
                                    lulus
                                </span>
                            </div>
                        </div>

                        {/* 4. Terlambat */}
                        <div
                            onClick={() => handleFilterChange('late')}
                            className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-4 transition-all duration-200 ${
                                currentStatus === 'late'
                                    ? 'border-rose-500 bg-rose-50/70 shadow-md shadow-rose-500/10 dark:border-rose-500/60 dark:bg-rose-950/40'
                                    : 'border-slate-200/90 bg-white hover:border-rose-300 hover:bg-slate-50/80 dark:border-slate-800 dark:bg-[#0c0e17] dark:hover:border-slate-700'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                    Terlambat
                                </span>
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                                    <AlertCircle className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-xl font-black text-rose-600 sm:text-2xl dark:text-rose-400">
                                    {counts.late}
                                </span>
                                <span className="text-[11px] font-medium text-slate-400">
                                    terlambat
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Status Filter Buttons (Scrollable on small phones) */}
                        <div className="flex max-w-full items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                            <button
                                onClick={() => handleFilterChange('all')}
                                className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                                    currentStatus === 'all'
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0c0e17] dark:text-slate-300 dark:hover:bg-slate-800'
                                }`}
                            >
                                Semua ({counts.all})
                            </button>
                            <button
                                onClick={() => handleFilterChange('submitted')}
                                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                                    currentStatus === 'submitted'
                                        ? 'bg-amber-500 text-white shadow-xs'
                                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0c0e17] dark:text-slate-300 dark:hover:bg-slate-800'
                                }`}
                            >
                                <Clock className="h-3.5 w-3.5" />
                                Menanti Review ({counts.submitted})
                            </button>
                            <button
                                onClick={() => handleFilterChange('graded')}
                                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                                    currentStatus === 'graded'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0c0e17] dark:text-slate-300 dark:hover:bg-slate-800'
                                }`}
                            >
                                <Award className="h-3.5 w-3.5" />
                                Selesai Dinilai ({counts.graded})
                            </button>
                            {counts.late > 0 && (
                                <button
                                    onClick={() => handleFilterChange('late')}
                                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                                        currentStatus === 'late'
                                            ? 'bg-rose-600 text-white shadow-xs'
                                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0c0e17] dark:text-slate-300 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    Terlambat ({counts.late})
                                </button>
                            )}
                        </div>

                        {/* Search Input Form */}
                        <form
                            onSubmit={handleSearch}
                            className="relative w-full sm:w-72 md:w-80"
                        >
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama siswa atau email..."
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-8 pl-9 text-xs font-semibold text-slate-800 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-[#0c0e17] dark:text-white dark:placeholder-slate-500"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                    title="Bersihkan pencarian"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </form>
                    </div>

                    {/* Table / Card Container */}
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all duration-200 dark:border-slate-800 dark:bg-[#0c0e17]">
                        {isLoading && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-[2px] dark:bg-[#0c0e17]/70">
                                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-white px-4 py-2 text-xs font-bold text-indigo-600 shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-indigo-400">
                                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                                    <span>Memuat data pengajuan...</span>
                                </div>
                            </div>
                        )}

                        {/* DESKTOP TABLE VIEW (Visible on Large Screens >= 1024px) */}
                        <div
                            className={`hidden lg:block overflow-x-auto transition-opacity duration-200 ${
                                isLoading
                                    ? 'pointer-events-none opacity-50'
                                    : 'opacity-100'
                            }`}
                        >
                            <table className="w-full min-w-[950px] border-collapse text-left text-xs">
                                <thead className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-extrabold tracking-wider text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                                    <tr>
                                        <th className="px-5 py-4 whitespace-nowrap">Siswa</th>
                                        <th className="px-5 py-4 whitespace-nowrap">Cabang Karir & Proyek</th>
                                        <th className="px-5 py-4 whitespace-nowrap">Lampiran Proyek</th>
                                        <th className="px-5 py-4 whitespace-nowrap">Status & Nilai</th>
                                        <th className="px-5 py-4 whitespace-nowrap">Mentor Evaluator</th>
                                        <th className="px-5 py-4 whitespace-nowrap">Tanggal Serah</th>
                                        <th className="px-5 py-4 text-right whitespace-nowrap">Sertifikat</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {submissions.data.length > 0 ? (
                                        submissions.data.map((sub) => (
                                            <tr
                                                key={sub._id}
                                                className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-900/40"
                                            >
                                                {/* Siswa */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {sub.student?.avatar ? (
                                                            <img
                                                                src={sub.student.avatar}
                                                                alt={sub.student.name}
                                                                className="h-9 w-9 shrink-0 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                                                            />
                                                        ) : (
                                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                                                                {sub.student?.name
                                                                    ? sub.student.name.charAt(0).toUpperCase()
                                                                    : 'S'}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0 max-w-[200px]">
                                                            <p className="truncate font-bold text-slate-900 dark:text-white" title={sub.student?.name ?? 'Siswa'}>
                                                                {sub.student?.name ?? 'Siswa'}
                                                            </p>
                                                            <p className="truncate text-[11px] text-slate-400" title={sub.student?.email ?? '-'}>
                                                                {sub.student?.email ?? '-'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Cabang Karir & Proyek */}
                                                <td className="px-5 py-4">
                                                    <div className="max-w-[240px]">
                                                        <span className="inline-block rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                                                            {sub.submission?.group_name ?? 'Cabang Karir'}
                                                        </span>
                                                        <p className="mt-1 font-semibold text-slate-800 line-clamp-2 dark:text-slate-200" title={sub.submission?.title ?? 'Proyek Akhir'}>
                                                            {sub.submission?.title ?? 'Proyek Akhir'}
                                                        </p>
                                                    </div>
                                                </td>

                                                {/* Lampiran & Link */}
                                                <td className="px-5 py-4">
                                                    <div className="space-y-1.5">
                                                        {sub.link && (
                                                            <a
                                                                href={sub.link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                                            >
                                                                <ExternalLink className="h-3 w-3 shrink-0" />
                                                                <span className="truncate max-w-[140px]">Tautan Proyek</span>
                                                            </a>
                                                        )}
                                                        {sub.file_path && (
                                                            <a
                                                                href={
                                                                    sub.file_url ||
                                                                    `/student-submissions/${sub.slug || sub.id}/file`
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1.5 font-bold text-slate-600 hover:underline dark:text-slate-300"
                                                            >
                                                                <FileText className="h-3 w-3 shrink-0 text-slate-400" />
                                                                <span className="truncate max-w-[140px]">Berkas Lampiran</span>
                                                            </a>
                                                        )}
                                                        {!sub.link && !sub.file_path && (
                                                            <span className="text-slate-400 italic">Tidak ada lampiran</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Status & Nilai */}
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    {sub.status === 'graded' ? (
                                                        <div className="space-y-1">
                                                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
                                                                <Award className="h-3 w-3" />
                                                                Nilai: {sub.grade}
                                                            </span>
                                                            {sub.feedback && (
                                                                <p className="max-w-[180px] truncate text-[10px] text-slate-400" title={sub.feedback}>
                                                                    "{sub.feedback}"
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : sub.status === 'submitted' ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-700 dark:border-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
                                                            <Clock className="h-3 w-3" />
                                                            Menanti Review
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-extrabold text-rose-700 dark:border-rose-800 dark:bg-rose-500/10 dark:text-rose-400">
                                                            <AlertCircle className="h-3 w-3" />
                                                            Terlambat
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Mentor Evaluator */}
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                        {sub.submission?.mentor_name ?? 'Mentor Penilai'}
                                                    </span>
                                                </td>

                                                {/* Tanggal Serah */}
                                                <td className="px-5 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                                                    {sub.created_at_formatted}
                                                </td>

                                                {/* Sertifikat */}
                                                <td className="px-5 py-4 text-right whitespace-nowrap">
                                                    {sub.certificate_url ? (
                                                        <a
                                                            href={sub.certificate_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                                                        >
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                            Sertifikat Terbit
                                                        </a>
                                                    ) : (
                                                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-400 dark:bg-slate-800">
                                                            Belum Terbit
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-5 py-16 text-center text-slate-400 dark:text-slate-500">
                                                <GraduationCap className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                                                <p className="font-bold text-slate-700 dark:text-slate-300">Tidak ada pengajuan proyek yang cocok</p>
                                                <p className="mt-1 text-xs">Coba sesuaikan filter status atau kata kunci pencarian Anda.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* MOBILE & TABLET CARD VIEW (Visible on screens < 1024px) */}
                        <div
                            className={`block lg:hidden p-3.5 sm:p-5 transition-opacity duration-200 ${
                                isLoading
                                    ? 'pointer-events-none opacity-50'
                                    : 'opacity-100'
                            }`}
                        >
                            {submissions.data.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {submissions.data.map((sub) => (
                                        <div
                                            key={sub._id}
                                            className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 dark:border-slate-800 dark:bg-[#0e111b]"
                                        >
                                            {/* Card Top: Student Profile & Status Badge */}
                                            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800/80">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    {sub.student?.avatar ? (
                                                        <img
                                                            src={sub.student.avatar}
                                                            alt={sub.student.name}
                                                            className="h-10 w-10 shrink-0 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                                                        />
                                                    ) : (
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-black text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                                                            {sub.student?.name
                                                                ? sub.student.name.charAt(0).toUpperCase()
                                                                : 'S'}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <h3 className="truncate text-xs font-bold text-slate-900 dark:text-white">
                                                            {sub.student?.name ?? 'Siswa'}
                                                        </h3>
                                                        <p className="truncate text-[11px] text-slate-400">
                                                            {sub.student?.email ?? '-'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Status Badge */}
                                                <div className="shrink-0">
                                                    {sub.status === 'graded' ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-black text-emerald-700 dark:border-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
                                                            <Award className="h-3 w-3" />
                                                            {sub.grade}
                                                        </span>
                                                    ) : sub.status === 'submitted' ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
                                                            <Clock className="h-3 w-3" />
                                                            Review
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 dark:border-rose-800 dark:bg-rose-500/10 dark:text-rose-400">
                                                            <AlertCircle className="h-3 w-3" />
                                                            Telat
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Card Mid: Career Group & Project Title */}
                                            <div className="space-y-2 py-3">
                                                <div>
                                                    <span className="inline-block rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                                                        {sub.submission?.group_name ?? 'Cabang Karir'}
                                                    </span>
                                                    <p className="mt-1 text-xs font-bold leading-snug text-slate-800 dark:text-slate-100">
                                                        {sub.submission?.title ?? 'Proyek Akhir'}
                                                    </p>
                                                </div>

                                                {/* Mentor & Date info */}
                                                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                                    <div className="flex items-center gap-1.5 truncate">
                                                        <UserIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                        <span className="truncate">
                                                            {sub.submission?.mentor_name ?? 'Mentor'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                        <span className="truncate">
                                                            {sub.created_at_formatted}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Feedback quote if available */}
                                                {sub.feedback && (
                                                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-[11px] text-slate-600 dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-300">
                                                        <span className="font-bold text-slate-400">Evaluasi: </span>
                                                        <span className="italic font-medium">"{sub.feedback}"</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Card Bottom: Links & Certificate Actions */}
                                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800/80">
                                                {/* Attachment links */}
                                                <div className="flex items-center gap-2">
                                                    {sub.link && (
                                                        <a
                                                            href={sub.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50/70 px-2.5 py-1 text-[11px] font-bold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                            Tautan
                                                        </a>
                                                    )}
                                                    {sub.file_path && (
                                                        <a
                                                            href={
                                                                sub.file_url ||
                                                                `/student-submissions/${sub.slug || sub.id}/file`
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                        >
                                                            <FileText className="h-3 w-3" />
                                                            Berkas
                                                        </a>
                                                    )}
                                                    {!sub.link && !sub.file_path && (
                                                        <span className="text-[11px] text-slate-400 italic">Tanpa lampiran</span>
                                                    )}
                                                </div>

                                                {/* Certificate */}
                                                <div>
                                                    {sub.certificate_url ? (
                                                        <a
                                                            href={sub.certificate_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                                                        >
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                            Sertifikat
                                                        </a>
                                                    ) : (
                                                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400 dark:bg-slate-800">
                                                            Belum Terbit
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-16 text-center text-slate-400 dark:text-slate-500">
                                    <GraduationCap className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                                    <p className="font-bold text-slate-700 dark:text-slate-300">Tidak ada pengajuan proyek yang cocok</p>
                                    <p className="mt-1 text-xs">Coba sesuaikan filter status atau kata kunci pencarian Anda.</p>
                                </div>
                            )}
                        </div>

                        {/* Pagination Container (Responsive Flex Column / Row) */}
                        {submissions.last_page > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 px-4 py-3.5 sm:px-6 dark:border-slate-800">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    Menampilkan {submissions.data.length} dari total {submissions.total} pengajuan proyek
                                </span>
                                <div className="flex max-w-full items-center gap-1 overflow-x-auto pb-1 sm:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                    {submissions.links.map((link, idx) => (
                                        <Link
                                            key={idx}
                                            href={link.url || '#'}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                                                link.active
                                                    ? 'bg-indigo-600 text-white shadow-xs'
                                                    : link.url
                                                      ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0c0e17] dark:text-slate-300 dark:hover:bg-slate-800'
                                                      : 'cursor-not-allowed border border-transparent text-slate-300 dark:text-slate-600'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
