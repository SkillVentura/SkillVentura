import AppLayout from '@/layouts/app-layout';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    Award,
    BookOpen,
    CheckCircle2,
    Clock,
    FileText,
    GraduationCap,
    MessageSquare,
    Plus,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Target,
    TrendingUp,
    Users,
    Scale,
    AlertTriangle,
    ExternalLink,
    DollarSign,
} from 'lucide-react';
import { DashboardDisputeItem, DashboardContractExposure } from '@/types/quest';

interface ActivityTrend {
    date: string;
    label: string;
    enrollments: number;
    submissions: number;
    users: number;
}

interface CareerBranchDistribution {
    id: string;
    name: string;
    count: number;
    percentage: number;
}

interface GamificationStats {
    total_exp: number;
    total_gold: number;
    average_level: number;
}

interface PopularCourse {
    _id: string;
    title: string;
    thumbnail_url: string | null;
    students_count: number;
}

interface ActionRequired {
    active_disputes: number;
    quest_flags: number;
    pending_submissions: number;
    pending_quests: number;
    draft_courses: number;
    total_alerts: number;
}

interface TopStudent {
    _id: string;
    name: string;
    username?: string;
    avatar?: string | null;
    total_exp: number;
    total_gold: number;
    level: number;
}

interface RecentActivity {
    id: string;
    type: 'enrollment' | 'submission' | 'forum' | 'dispute';
    title: string;
    time: string;
    timestamp: number;
}

interface DashboardProps {
    metrics: {
        users: {
            student: number;
            mentor: number;
            admin: number;
            total: number;
            active_students: number;
        };
        courses: {
            total: number;
            published: number;
            total_enrollments: number;
        };
        submissions: {
            total: number;
            pending: number;
            graded: number;
            approved: number;
        };
        certificates: {
            issued: number;
        };
        quests: {
            total: number;
            active: number;
            completed: number;
            pending_approval: number;
            disputed: number;
        };
    };
    actionRequired: ActionRequired;
    disputeQueue?: DashboardDisputeItem[];
    disputeExposure?: DashboardContractExposure;
    popularCourses: PopularCourse[];
    activityTrends: ActivityTrend[];
    careerBranchDistribution: CareerBranchDistribution[];
    gamificationStats: GamificationStats;
    topStudents: TopStudent[];
    recentActivities: RecentActivity[];
    selectedPeriod: number;
}

const BRANCH_COLORS = [
    {
        bg: 'bg-indigo-500',
        hoverBg: 'hover:bg-indigo-600',
        text: 'text-indigo-500 dark:text-indigo-400',
        border: 'border-indigo-500/20',
        dot: 'bg-indigo-500',
    },
    {
        bg: 'bg-emerald-500',
        hoverBg: 'hover:bg-emerald-600',
        text: 'text-emerald-500 dark:text-emerald-400',
        border: 'border-emerald-500/20',
        dot: 'bg-emerald-500',
    },
    {
        bg: 'bg-amber-500',
        hoverBg: 'hover:bg-amber-600',
        text: 'text-amber-500 dark:text-amber-400',
        border: 'border-amber-500/20',
        dot: 'bg-amber-500',
    },
    {
        bg: 'bg-rose-500',
        hoverBg: 'hover:bg-rose-600',
        text: 'text-rose-500 dark:text-rose-400',
        border: 'border-rose-500/20',
        dot: 'bg-rose-500',
    },
    {
        bg: 'bg-cyan-500',
        hoverBg: 'hover:bg-cyan-600',
        text: 'text-cyan-500 dark:text-cyan-400',
        border: 'border-cyan-500/20',
        dot: 'bg-cyan-500',
    },
    {
        bg: 'bg-purple-500',
        hoverBg: 'hover:bg-purple-600',
        text: 'text-purple-500 dark:text-purple-400',
        border: 'border-purple-500/20',
        dot: 'bg-purple-500',
    },
];

function getSmoothPath(points: { x: number; y: number }[]): string {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i === 0 ? i : i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

        const tension = 0.15;

        const cp1x = p1.x + (p2.x - p0.x) * tension;
        const cp1y = Math.max(15, Math.min(210, p1.y + (p2.y - p0.y) * tension));

        const cp2x = p2.x - (p3.x - p1.x) * tension;
        const cp2y = Math.max(15, Math.min(210, p2.y - (p3.y - p1.y) * tension));

        path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }

    return path;
}

export default function Dashboard({
    metrics,
    actionRequired = {
        active_disputes: 0,
        quest_flags: 0,
        pending_submissions: 0,
        pending_quests: 0,
        draft_courses: 0,
        total_alerts: 0,
    },
    disputeQueue = [],
    disputeExposure = {
        total_disputed_count: 0,
        total_disputed_amount: 0,
        total_active_quests: 0,
        total_active_exposure: 0,
    },
    popularCourses = [],
    activityTrends = [],
    careerBranchDistribution = [],
    gamificationStats = {
        total_exp: 0,
        total_gold: 0,
        average_level: 1,
    },
    topStudents = [],
    recentActivities = [],
    selectedPeriod = 30,
}: DashboardProps) {
    const { auth } = usePage().props as any;
    const user = auth.user;

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // Filter time range handler
    const handlePeriodChange = (days: number) => {
        router.get(
            '/admin/dashboard',
            { period: days },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    // Trends Calculations
    const totalPeriodEnrollments = activityTrends.reduce(
        (sum, t) => sum + (t.enrollments || 0),
        0,
    );
    const totalPeriodSubmissions = activityTrends.reduce(
        (sum, t) => sum + (t.submissions || 0),
        0,
    );

    const maxEnrollments = Math.max(
        ...activityTrends.map((t) => t.enrollments || 0),
        5,
    );
    const maxSubmissions = Math.max(
        ...activityTrends.map((t) => t.submissions || 0),
        5,
    );

    const divisor = Math.max(1, activityTrends.length - 1);

    const pointsEnrollments = activityTrends.map((t, idx) => {
        const x = 40 + (idx / divisor) * 520;
        const y = 210 - ((t.enrollments || 0) / maxEnrollments) * 180;
        return { x, y };
    });

    const pointsSubmissions = activityTrends.map((t, idx) => {
        const x = 40 + (idx / divisor) * 520;
        const y = 210 - ((t.submissions || 0) / maxSubmissions) * 180;
        return { x, y };
    });

    const enrollmentsPath = getSmoothPath(pointsEnrollments);
    const enrollmentsArea =
        enrollmentsPath && pointsEnrollments.length > 0
            ? `${enrollmentsPath} L ${pointsEnrollments[pointsEnrollments.length - 1].x} 210 L ${pointsEnrollments[0].x} 210 Z`
            : '';

    const submissionsPath = getSmoothPath(pointsSubmissions);
    const submissionsArea =
        submissionsPath && pointsSubmissions.length > 0
            ? `${submissionsPath} L ${pointsSubmissions[pointsSubmissions.length - 1].x} 210 L ${pointsSubmissions[0].x} 210 Z`
            : '';

    const handleMouseMove = (
        e: React.MouseEvent<SVGSVGElement, MouseEvent>,
    ) => {
        if (activityTrends.length === 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const svgWidth = rect.width;
        const relativeX = (x / svgWidth) * 600;
        const paddingLeft = 40;
        const chartWidth = 520;
        const index = Math.round(
            ((relativeX - paddingLeft) / chartWidth) * (activityTrends.length - 1),
        );
        if (index >= 0 && index < activityTrends.length) {
            setHoveredIndex(index);
        } else {
            setHoveredIndex(null);
        }
    };

    const leftGridLines = [0, 0.33, 0.66, 1].map((r) =>
        Math.round(r * maxEnrollments),
    );
    const rightGridLines = [0, 0.33, 0.66, 1].map((r) =>
        Math.round(r * maxSubmissions),
    );

    // Compute sample x-axis indices
    const xAxisStep = Math.max(1, Math.floor(activityTrends.length / 5));
    const xAxisIndices: number[] = [];
    for (let i = 0; i < activityTrends.length; i += xAxisStep) {
        xAxisIndices.push(i);
    }
    if (
        activityTrends.length > 0 &&
        !xAxisIndices.includes(activityTrends.length - 1)
    ) {
        xAxisIndices.push(activityTrends.length - 1);
    }

    return (
        <AppLayout>
            <div className="relative min-h-screen overflow-hidden bg-transparent px-4 py-6 text-slate-900 transition-colors duration-200 sm:px-6 lg:px-8 dark:bg-transparent dark:text-white">
                <div className="relative z-10 mx-auto max-w-7xl space-y-6">
                    {/* TOP HERO & CONTEXT HEADER */}
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-[#f8f9ff] to-indigo-50/30 p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-gradient-to-br dark:from-[#0d0f17] dark:via-[#090b12] dark:to-[#07080f]">
                        {/* Decorative background radial ambient glow */}
                        <div
                            className="pointer-events-none absolute inset-0 z-0 opacity-60 dark:opacity-40"
                            style={{
                                backgroundImage: `
                                    radial-gradient(circle at top right, rgba(124, 92, 255, 0.12), transparent 70%),
                                    radial-gradient(circle at bottom left, rgba(56, 189, 248, 0.08), transparent 60%)
                                `,
                            }}
                        />
                        <div className="absolute top-0 right-10 left-10 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

                        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-2xl space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-indigo-600 uppercase dark:text-indigo-400">
                                        <Sparkles className="h-3 w-3" />
                                        Pusat Kontrol Eksekutif
                                    </span>
                                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                        Sistem Aktif
                                    </span>
                                </div>
                                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                                    SkillVentura Overview
                                </h1>
                                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                    Selamat datang kembali,{' '}
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        {user.name}
                                    </span>
                                    . Pantau performa pembelajaran, antrean
                                    tindakan operasional, dan metrik gamifikasi
                                    secara terpadu.
                                </p>
                            </div>

                            {/* Quick Action Shortcuts */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                <Link
                                    href="/admin/courses"
                                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-indigo-600/25 transition-all hover:bg-indigo-500 active:scale-95"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>Kelola Kursus</span>
                                </Link>
                                <Link
                                    href="/admin/quests?status=disputed"
                                    className="relative inline-flex items-center gap-2 rounded-xl border border-rose-200/80 bg-rose-50/50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 shadow-sm transition-all hover:border-rose-300 hover:bg-rose-100/60 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300 dark:hover:bg-rose-900/30"
                                >
                                    <Scale className="h-4 w-4 text-rose-500" />
                                    <span>Arbitrase Sengketa</span>
                                    {actionRequired.active_disputes > 0 && (
                                        <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                                            {actionRequired.active_disputes}
                                        </span>
                                    )}
                                </Link>
                                <Link
                                    href="/admin/quests-flags"
                                    className="relative inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                                    <span>Moderasi Konten</span>
                                    {actionRequired.quest_flags > 0 && (
                                        <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                                            {actionRequired.quest_flags}
                                        </span>
                                    )}
                                </Link>
                                <Link
                                    href="/admin/users"
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    <Users className="h-4 w-4 text-indigo-500" />
                                    <span>Daftar Siswa</span>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* ZONE 1: ACTION REQUIRED CENTER (OPERATIONAL QUEUES) */}
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xs font-bold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                                    Pusat Tindakan & Antrean Tugas
                                </h2>
                                {actionRequired.total_alerts > 0 ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                                        {actionRequired.total_alerts} Perlu
                                        Tindakan
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Terkendali
                                    </span>
                                )}
                            </div>
                        </div>

                        {actionRequired.total_alerts > 0 ? (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                                {/* Alert 1: Active Contract Disputes (P2P Arbitration) */}
                                <div
                                    className={`relative flex flex-col justify-between overflow-hidden rounded-xl border p-4 transition-all duration-200 ${
                                        actionRequired.active_disputes > 0
                                            ? 'border-rose-200/80 bg-rose-50/40 hover:border-rose-300 dark:border-rose-500/20 dark:bg-rose-500/[0.04]'
                                            : 'border-slate-200/70 bg-white/60 hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900/30'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span
                                                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                                    actionRequired.active_disputes > 0
                                                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                }`}
                                            >
                                                <Scale className="h-4 w-4" />
                                            </span>
                                            <span
                                                className={`font-mono text-xs font-bold ${
                                                    actionRequired.active_disputes > 0
                                                        ? 'text-rose-600 dark:text-rose-400'
                                                        : 'text-emerald-600 dark:text-emerald-400'
                                                }`}
                                            >
                                                {actionRequired.active_disputes > 0
                                                    ? `${actionRequired.active_disputes} Sengketa`
                                                    : '0 Sengketa'}
                                            </span>
                                        </div>
                                        <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-white">
                                            Arbitrase Sengketa P2P
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            {actionRequired.active_disputes > 0
                                                ? disputeExposure && disputeExposure.total_disputed_amount > 0
                                                    ? `Rp ${disputeExposure.total_disputed_amount.toLocaleString('id-ID')} dana dibekukan dalam mediasi tripartit.`
                                                    : 'Kontrak kerja mengalami sengketa dan menanti intervensi admin.'
                                                : 'Tidak ada sengketa aktif. Escrow P2P berjalan lancar.'}
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                                        <Link
                                            href="/admin/quests?status=disputed"
                                            className={`inline-flex items-center text-xs font-semibold transition-colors ${
                                                actionRequired.active_disputes > 0
                                                    ? 'text-rose-600 hover:text-rose-700 dark:text-rose-400'
                                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                            }`}
                                        >
                                            {actionRequired.active_disputes > 0
                                                ? 'Buka Ruang Mediasi →'
                                                : 'Riwayat Arbitrase →'}
                                        </Link>
                                    </div>
                                </div>

                                {/* Alert 2: Quest Content Flags (Moderation) */}
                                <div
                                    className={`relative flex flex-col justify-between overflow-hidden rounded-xl border p-4 transition-all duration-200 ${
                                        actionRequired.quest_flags > 0
                                            ? 'border-amber-200/80 bg-amber-50/40 hover:border-amber-300 dark:border-amber-500/20 dark:bg-amber-500/[0.04]'
                                            : 'border-slate-200/70 bg-white/60 hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900/30'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span
                                                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                                    actionRequired.quest_flags > 0
                                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                }`}
                                            >
                                                {actionRequired.quest_flags > 0 ? (
                                                    <ShieldAlert className="h-4 w-4" />
                                                ) : (
                                                    <ShieldCheck className="h-4 w-4" />
                                                )}
                                            </span>
                                            <span
                                                className={`font-mono text-xs font-bold ${
                                                    actionRequired.quest_flags > 0
                                                        ? 'text-amber-600 dark:text-amber-400'
                                                        : 'text-emerald-600 dark:text-emerald-400'
                                                }`}
                                            >
                                                {actionRequired.quest_flags > 0
                                                    ? `${actionRequired.quest_flags} Laporan`
                                                    : '0 Laporan'}
                                            </span>
                                        </div>
                                        <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-white">
                                            Moderasi Laporan Konten
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            {actionRequired.quest_flags > 0
                                                ? 'Postingan quest dilaporkan pengguna karena pelanggaran pedoman.'
                                                : 'Semua konten quest bersih. Tidak ada laporan pelanggaran.'}
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                                        <Link
                                            href="/admin/quests-flags"
                                            className={`inline-flex items-center text-xs font-semibold transition-colors ${
                                                actionRequired.quest_flags > 0
                                                    ? 'text-amber-600 hover:text-amber-700 dark:text-amber-400'
                                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                            }`}
                                        >
                                            {actionRequired.quest_flags > 0
                                                ? 'Tinjau Laporan →'
                                                : 'Riwayat Moderasi →'}
                                        </Link>
                                    </div>
                                </div>

                                {/* Alert 3: Pending Submissions */}
                                <div
                                    className={`relative flex flex-col justify-between overflow-hidden rounded-xl border p-4 transition-all duration-200 ${
                                        actionRequired.pending_submissions > 0
                                            ? 'border-indigo-200/80 bg-indigo-50/40 hover:border-indigo-300 dark:border-indigo-500/20 dark:bg-indigo-500/[0.04]'
                                            : 'border-slate-200/70 bg-white/60 dark:border-slate-800/80 dark:bg-slate-900/30'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                                <GraduationCap className="h-4 w-4" />
                                            </span>
                                            <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                {actionRequired.pending_submissions > 0
                                                    ? `${actionRequired.pending_submissions} Menanti Review`
                                                    : '0 Menunggu'}
                                            </span>
                                        </div>
                                        <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-white">
                                            Proyek Kelulusan
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            Proyek akhir siswa yang diajukan untuk kelulusan dan penerbitan sertifikat.
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                                        <Link
                                            href="/admin/submissions?status=submitted"
                                            className="inline-flex items-center text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400"
                                        >
                                            Pantau Proyek Siswa →
                                        </Link>
                                    </div>
                                </div>

                                {/* Alert 4: Pending Quests Approval */}
                                <div
                                    className={`relative flex flex-col justify-between overflow-hidden rounded-xl border p-4 transition-all duration-200 ${
                                        actionRequired.pending_quests > 0
                                            ? 'border-cyan-200/80 bg-cyan-50/40 hover:border-cyan-300 dark:border-cyan-500/20 dark:bg-cyan-500/[0.04]'
                                            : 'border-slate-200/70 bg-white/60 dark:border-slate-800/80 dark:bg-slate-900/30'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                                                <Target className="h-4 w-4" />
                                            </span>
                                            <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                                                {actionRequired.pending_quests}{' '}
                                                Menunggu
                                            </span>
                                        </div>
                                        <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-white">
                                            Persetujuan Quest Baru
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            Pengajuan quest baru menanti verifikasi sebelum dirilis ke siswa.
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                                        <Link
                                            href="/admin/quests?status=submitted"
                                            className="inline-flex items-center text-xs font-semibold text-cyan-600 transition-colors hover:text-cyan-700 dark:text-cyan-400"
                                        >
                                            Tinjau Quest →
                                        </Link>
                                    </div>
                                </div>

                                {/* Alert 5: Draft Courses */}
                                <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/80 bg-white/80 p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40">
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400">
                                                <BookOpen className="h-4 w-4" />
                                            </span>
                                            <span
                                                className={`font-mono text-xs font-bold ${
                                                    actionRequired.draft_courses > 0
                                                        ? 'text-slate-600 dark:text-slate-400'
                                                        : 'text-emerald-600 dark:text-emerald-400'
                                                }`}
                                            >
                                                {actionRequired.draft_courses > 0
                                                    ? `${actionRequired.draft_courses} Draf`
                                                    : 'Semua Terbit'}
                                            </span>
                                        </div>
                                        <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-white">
                                            {actionRequired.draft_courses > 0
                                                ? 'Kursus Belum Dirilis'
                                                : 'Status Katalog Kursus'}
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            {actionRequired.draft_courses > 0
                                                ? 'Materi kursus sedang dirancang dan belum dibuka untuk umum.'
                                                : 'Semua katalog kursus aktif telah dirilis untuk siswa.'}
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                                        <Link
                                            href="/admin/courses"
                                            className="inline-flex items-center text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                        >
                                            Kelola Katalog Kursus →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/[0.03]">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                <div>
                                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                                        Semua Operasional Terkendali
                                    </p>
                                    <p className="text-xs text-emerald-700/80 dark:text-emerald-400/70">
                                        Tidak ada tugas yang tertunda, sengketa
                                        aktif, atau quest yang menanti
                                        persetujuan saat ini.
                                    </p>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* ZONE 1.5: ACTIVE DISPUTE RESOLUTION QUEUE (WAR ROOM GATEWAY) */}
                    {disputeQueue && disputeQueue.length > 0 && (
                        <section className="relative overflow-hidden rounded-2xl border border-rose-200/80 bg-white p-5 shadow-sm transition-all duration-200 dark:border-rose-900/40 dark:bg-gradient-to-br dark:from-[#130d12] dark:via-[#0e0b14] dark:to-[#0a0710]">
                            {/* Top decorative gradient bar */}
                            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-500" />

                            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center dark:border-slate-800/80">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-rose-600 uppercase dark:text-rose-400">
                                            <Scale className="h-3 w-3" />
                                            Ruang Mediasi Tripartit
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
                                            {disputeQueue.length} Kasus Membutuhkan Intervensi
                                        </span>
                                    </div>
                                    <h2 className="text-base font-black tracking-tight text-slate-900 sm:text-lg dark:text-white">
                                        Antrean Kasus Arbitrase & Sengketa P2P
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Selesaikan sengketa kontrak kerja freelance, verifikasi bukti kedua belah pihak, dan putuskan pembagian dana escrow sesuai SLA.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    {disputeExposure && disputeExposure.total_disputed_amount > 0 && (
                                        <div className="rounded-xl border border-rose-200/60 bg-rose-50/40 px-3.5 py-2 text-right dark:border-rose-900/40 dark:bg-rose-950/20">
                                            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                                Dana Tertahan di Sengketa
                                            </span>
                                            <p className="font-mono text-sm font-black text-rose-600 dark:text-rose-400">
                                                Rp {(disputeExposure.total_disputed_amount ?? 0).toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    )}
                                    <Link
                                        href="/admin/quests?status=disputed"
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-rose-600/20 transition-all hover:bg-rose-500"
                                    >
                                        <span>Semua Sengketa</span>
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            </div>

                            {/* Dispute Queue List */}
                            <div className="mt-4 divide-y divide-slate-100 overflow-x-auto dark:divide-slate-800/80">
                                <div className="min-w-[700px]">
                                    <div className="grid grid-cols-12 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                        <div className="col-span-4">Proyek & Kategori</div>
                                        <div className="col-span-3">Para Pihak (Klien vs Freelancer)</div>
                                        <div className="col-span-2 text-center">Fase Mediasi</div>
                                        <div className="col-span-2 text-center">Batas Waktu SLA</div>
                                        <div className="col-span-1 text-right">Aksi</div>
                                    </div>
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                        {disputeQueue.map((dispute) => {
                                            const contractAmt = dispute.contract_amount ?? 0;
                                            const dpAmt = dispute.dp_amount ?? 0;
                                            const clientName = dispute.creator?.name ?? 'Klien';
                                            const workerName = dispute.worker?.name ?? 'Belum ada worker';
                                            const phaseText = dispute.phase_label ?? dispute.phase ?? 'Mediasi';
                                            const slaHours = dispute.sla_hours_remaining;

                                            return (
                                                <div
                                                    key={dispute.id}
                                                    className="grid grid-cols-12 items-center py-3 text-xs transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-900/30"
                                                >
                                                    <div className="col-span-4 pr-3">
                                                        <p className="truncate font-bold text-slate-800 dark:text-white">
                                                            {dispute.title}
                                                        </p>
                                                        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400">
                                                            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                                                Rp {contractAmt.toLocaleString('id-ID')}
                                                            </span>
                                                            {dpAmt > 0 && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>
                                                                        DP: Rp {dpAmt.toLocaleString('id-ID')}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="col-span-3 pr-2">
                                                        <p className="truncate font-medium text-slate-700 dark:text-slate-300">
                                                            <span className="text-slate-400">Klien:</span> {clientName}
                                                        </p>
                                                        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                                                            <span className="text-slate-400">Worker:</span> {workerName}
                                                        </p>
                                                    </div>
                                                    <div className="col-span-2 text-center">
                                                        <span className="inline-flex rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                                            {phaseText}
                                                        </span>
                                                    </div>
                                                    <div className="col-span-2 text-center">
                                                        {slaHours === null || slaHours === undefined ? (
                                                            <span className="text-[10px] text-slate-400">-</span>
                                                        ) : slaHours <= 0 ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
                                                                SLA Terlewat
                                                            </span>
                                                        ) : slaHours <= 24 ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                                                <Clock className="h-3 w-3" />
                                                                {slaHours} jam
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                                <Clock className="h-3 w-3" />
                                                                {slaHours} jam
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="col-span-1 text-right">
                                                        <Link
                                                            href={`/admin/quests/${dispute.id}`}
                                                            className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 transition-colors hover:bg-rose-100 hover:text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900/50"
                                                            title="Buka Ruang Mediasi Tripartit"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ZONE 2: CORE VITAL KPIS (4 ENTERPRISE CARDS) */}
                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Card 1: Siswa & Pengguna */}
                        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-slate-800 dark:bg-[#0c0e17]">
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                        Total Siswa
                                    </span>
                                    <p className="mt-1 font-mono text-3xl font-black text-slate-900 dark:text-white">
                                        {metrics.users.student.toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                                    {metrics.users.active_students} Siswa Aktif
                                </span>
                                <span>•</span>
                                <span>{metrics.users.mentor} Mentor</span>
                                <span>•</span>
                                <span>{metrics.users.admin} Admin</span>
                            </div>

                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                                <Link
                                    href="/admin/users"
                                    className="inline-flex items-center text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400"
                                >
                                    Kelola Pengguna ({metrics.users.total}) →
                                </Link>
                            </div>
                        </div>

                        {/* Card 2: Pendaftaran Kursus */}
                        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-slate-800 dark:bg-[#0c0e17]">
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                        Pendaftaran Kursus
                                    </span>
                                    <p className="mt-1 font-mono text-3xl font-black text-slate-900 dark:text-white">
                                        {metrics.courses.total_enrollments.toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                                    {metrics.courses.published} Terpublikasi
                                </span>
                                <span>dari</span>
                                <span>{metrics.courses.total} Total Kursus</span>
                            </div>

                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                                <Link
                                    href="/admin/courses"
                                    className="inline-flex items-center text-xs font-semibold text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400"
                                >
                                    Buka Katalog Kursus →
                                </Link>
                            </div>
                        </div>

                        {/* Card 3: Sertifikat & Penilaian */}
                        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-slate-800 dark:bg-[#0c0e17]">
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                        Kelulusan & Sertifikat
                                    </span>
                                    <p className="mt-1 font-mono text-3xl font-black text-slate-900 dark:text-white">
                                        {metrics.certificates.issued.toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                                    <Award className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                                    {metrics.submissions.graded} Proyek Dinilai
                                </span>
                                <span>•</span>
                                <span>
                                    {metrics.submissions.pending} Menunggu Review
                                </span>
                            </div>

                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                                <Link
                                    href="/admin/submissions"
                                    className="inline-flex items-center text-xs font-semibold text-amber-600 transition-colors hover:text-amber-700 dark:text-amber-400"
                                >
                                    Pantau Proyek & Sertifikat ({metrics.submissions.total}) →
                                </Link>
                            </div>
                        </div>

                        {/* Card 4: Ekosistem Quest */}
                        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-slate-800 dark:bg-[#0c0e17]">
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                        Ekosistem Quest
                                    </span>
                                    <p className="mt-1 font-mono text-3xl font-black text-slate-900 dark:text-white">
                                        {metrics.quests.total.toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                                    <Target className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                                    {metrics.quests.active} Sedang Berjalan
                                </span>
                                <span>•</span>
                                <span>{metrics.quests.completed} Selesai</span>
                                {metrics.quests.disputed > 0 && (
                                    <>
                                        <span>•</span>
                                        <span className="inline-flex items-center rounded-md bg-rose-500/10 px-2 py-0.5 font-bold text-rose-600 dark:text-rose-400">
                                            {metrics.quests.disputed} Sengketa
                                        </span>
                                    </>
                                )}
                            </div>

                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                                <Link
                                    href="/admin/quests"
                                    className="inline-flex items-center text-xs font-semibold text-rose-600 transition-colors hover:text-rose-700 dark:text-rose-400"
                                >
                                    Pantau Daftar Quest →
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* ZONE 3: VISUAL ANALYTICS (TRENDS & BRANCH DISTRIBUTION) */}
                    <div className="grid gap-5 lg:grid-cols-3">
                        {/* 1. LEARNING ACTIVITY TRENDS (SVG Dual Axis Chart) */}
                        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-gradient-to-b dark:from-[#0e0e1a] dark:to-[#090910]">
                            <div>
                                <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                    <div>
                                        <h2 className="text-sm font-bold tracking-wider text-slate-800 uppercase dark:text-white">
                                            Tren Aktivitas Belajar
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Perbandingan volume pendaftaran
                                            kursus dan pengumpulan tugas siswa.
                                        </p>
                                    </div>

                                    {/* Period Filters */}
                                    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-900">
                                        {[7, 30, 90].map((days) => (
                                            <button
                                                key={days}
                                                onClick={() =>
                                                    handlePeriodChange(days)
                                                }
                                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                                                    selectedPeriod === days
                                                        ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-800 dark:text-indigo-400'
                                                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                                                }`}
                                            >
                                                {days} Hari
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Legend & Period Summary */}
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-y border-slate-100 py-2.5 text-xs dark:border-slate-800/80">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                                            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                                            Pendaftaran Kursus ({totalPeriodEnrollments})
                                        </span>
                                        <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                            Pengumpulan Tugas ({totalPeriodSubmissions})
                                        </span>
                                    </div>
                                </div>

                                {/* SVG Chart */}
                                <div className="relative h-64 w-full">
                                    {activityTrends.length > 0 ? (
                                        <>
                                            <svg
                                                viewBox="0 0 600 240"
                                                className="h-full w-full overflow-visible"
                                                onMouseMove={handleMouseMove}
                                                onMouseLeave={() =>
                                                    setHoveredIndex(null)
                                                }
                                            >
                                                <defs>
                                                    <linearGradient
                                                        id="enrollmentsGradient"
                                                        x1="0"
                                                        y1="0"
                                                        x2="0"
                                                        y2="1"
                                                    >
                                                        <stop
                                                            offset="0%"
                                                            stopColor="#6366f1"
                                                            stopOpacity="0.28"
                                                        />
                                                        <stop
                                                            offset="100%"
                                                            stopColor="#6366f1"
                                                            stopOpacity="0.00"
                                                        />
                                                    </linearGradient>
                                                    <linearGradient
                                                        id="submissionsGradient"
                                                        x1="0"
                                                        y1="0"
                                                        x2="0"
                                                        y2="1"
                                                    >
                                                        <stop
                                                            offset="0%"
                                                            stopColor="#10b981"
                                                            stopOpacity="0.28"
                                                        />
                                                        <stop
                                                            offset="100%"
                                                            stopColor="#10b981"
                                                            stopOpacity="0.00"
                                                        />
                                                    </linearGradient>
                                                </defs>

                                                {/* Grid lines */}
                                                {leftGridLines.map(
                                                    (leftVal, idx) => {
                                                        const ratio = idx / 3;
                                                        const y =
                                                            210 - ratio * 180;
                                                        const rightVal =
                                                            rightGridLines[idx];
                                                        return (
                                                            <g key={idx}>
                                                                <line
                                                                    x1="40"
                                                                    y1={y}
                                                                    x2="560"
                                                                    y2={y}
                                                                    stroke="currentColor"
                                                                    strokeWidth="1"
                                                                    strokeDasharray="4 4"
                                                                    className="text-slate-200 dark:text-slate-800"
                                                                />
                                                                <text
                                                                    x="30"
                                                                    y={y + 3}
                                                                    textAnchor="end"
                                                                    className="fill-indigo-500 font-mono text-[9px] font-bold dark:fill-indigo-400"
                                                                >
                                                                    {leftVal}
                                                                </text>
                                                                <text
                                                                    x="570"
                                                                    y={y + 3}
                                                                    textAnchor="start"
                                                                    className="fill-emerald-500 font-mono text-[9px] font-bold dark:fill-emerald-400"
                                                                >
                                                                    {rightVal}
                                                                </text>
                                                            </g>
                                                        );
                                                    },
                                                )}

                                                {/* Gradient Areas */}
                                                {enrollmentsArea && (
                                                    <path
                                                        d={enrollmentsArea}
                                                        fill="url(#enrollmentsGradient)"
                                                    />
                                                )}
                                                {submissionsArea && (
                                                    <path
                                                        d={submissionsArea}
                                                        fill="url(#submissionsGradient)"
                                                    />
                                                )}

                                                {/* Curves */}
                                                {enrollmentsPath && (
                                                    <path
                                                        d={enrollmentsPath}
                                                        fill="none"
                                                        stroke="#6366f1"
                                                        strokeWidth="2.5"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                )}
                                                {submissionsPath && (
                                                    <path
                                                        d={submissionsPath}
                                                        fill="none"
                                                        stroke="#10b981"
                                                        strokeWidth="2.5"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                )}

                                                {/* X Axis Labels */}
                                                {xAxisIndices.map((idx) => {
                                                    if (
                                                        idx >=
                                                        activityTrends.length
                                                    )
                                                        return null;
                                                    const x =
                                                        40 +
                                                        (idx / divisor) * 520;
                                                    return (
                                                        <text
                                                            key={idx}
                                                            x={x}
                                                            y="230"
                                                            textAnchor="middle"
                                                            className="fill-slate-400 font-mono text-[9px] font-bold dark:fill-slate-500"
                                                        >
                                                            {
                                                                activityTrends[
                                                                    idx
                                                                ].label
                                                            }
                                                        </text>
                                                    );
                                                })}

                                                {/* Hover Guideline */}
                                                {hoveredIndex !== null &&
                                                    hoveredIndex <
                                                        activityTrends.length && (
                                                        <line
                                                            x1={
                                                                40 +
                                                                (hoveredIndex /
                                                                    divisor) *
                                                                    520
                                                            }
                                                            y1="20"
                                                            x2={
                                                                40 +
                                                                (hoveredIndex /
                                                                    divisor) *
                                                                    520
                                                            }
                                                            y2="210"
                                                            stroke="#6366f1"
                                                            strokeWidth="1.5"
                                                            strokeDasharray="3 3"
                                                            className="opacity-60"
                                                        />
                                                    )}

                                                {/* Hover Dots */}
                                                {hoveredIndex !== null &&
                                                    hoveredIndex <
                                                        activityTrends.length && (
                                                        <>
                                                            <circle
                                                                cx={
                                                                    pointsEnrollments[
                                                                        hoveredIndex
                                                                    ].x
                                                                }
                                                                cy={
                                                                    pointsEnrollments[
                                                                        hoveredIndex
                                                                    ].y
                                                                }
                                                                r="4.5"
                                                                fill="#6366f1"
                                                                stroke="#fff"
                                                                strokeWidth="1.5"
                                                            />
                                                            <circle
                                                                cx={
                                                                    pointsSubmissions[
                                                                        hoveredIndex
                                                                    ].x
                                                                }
                                                                cy={
                                                                    pointsSubmissions[
                                                                        hoveredIndex
                                                                    ].y
                                                                }
                                                                r="4.5"
                                                                fill="#10b981"
                                                                stroke="#fff"
                                                                strokeWidth="1.5"
                                                            />
                                                        </>
                                                    )}
                                            </svg>

                                            {/* Tooltip Overlay */}
                                            {hoveredIndex !== null &&
                                                hoveredIndex <
                                                    activityTrends.length && (
                                                    <div
                                                        className="pointer-events-none absolute z-20 space-y-1.5 rounded-xl border border-slate-700/60 bg-slate-950/90 p-3 text-xs text-white shadow-xl backdrop-blur-md"
                                                        style={{
                                                            left: `${Math.max(12, Math.min(88, (hoveredIndex / divisor) * 100))}%`,
                                                            top: '12px',
                                                            transform:
                                                                'translateX(-50%)',
                                                        }}
                                                    >
                                                        <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                            {
                                                                activityTrends[
                                                                    hoveredIndex
                                                                ].label
                                                            }
                                                        </p>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="flex items-center gap-2">
                                                                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                                                                Pendaftaran:{' '}
                                                                <strong className="font-mono text-indigo-300">
                                                                    {
                                                                        activityTrends[
                                                                            hoveredIndex
                                                                        ]
                                                                            .enrollments
                                                                    }
                                                                </strong>
                                                            </span>
                                                            <span className="flex items-center gap-2">
                                                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                                                Tugas:{' '}
                                                                <strong className="font-mono text-emerald-300">
                                                                    {
                                                                        activityTrends[
                                                                            hoveredIndex
                                                                        ]
                                                                            .submissions
                                                                    }
                                                                </strong>
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                        </>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-sm text-slate-400 dark:text-slate-500">
                                            Tidak ada riwayat aktivitas dalam
                                            rentang ini.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 2. CAREER BRANCH DISTRIBUTION */}
                        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-gradient-to-b dark:from-[#0e0e1a] dark:to-[#090910]">
                            <div>
                                <h2 className="text-sm font-bold tracking-wider text-slate-800 uppercase dark:text-white">
                                    Distribusi Cabang Karir
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    Spesialisasi yang dipilih oleh siswa aktif.
                                </p>

                                {careerBranchDistribution.length > 0 ? (
                                    <div className="mt-5 space-y-5">
                                        {/* Segmented Progress Bar */}
                                        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/80">
                                            {careerBranchDistribution.map(
                                                (branch, idx) => {
                                                    const color =
                                                        BRANCH_COLORS[
                                                            idx %
                                                                BRANCH_COLORS.length
                                                        ];
                                                    return (
                                                        <div
                                                            key={branch.id}
                                                            className={`h-full transition-all duration-300 ${color.bg}`}
                                                            style={{
                                                                width: `${branch.percentage}%`,
                                                            }}
                                                            title={`${branch.name}: ${branch.percentage}%`}
                                                        />
                                                    );
                                                },
                                            )}
                                        </div>

                                        {/* Detailed Legend */}
                                        <div className="space-y-3">
                                            {careerBranchDistribution.map(
                                                (branch, idx) => {
                                                    const color =
                                                        BRANCH_COLORS[
                                                            idx %
                                                                BRANCH_COLORS.length
                                                        ];
                                                    return (
                                                        <div
                                                            key={branch.id}
                                                            className="flex items-center justify-between text-xs"
                                                        >
                                                            <div className="flex min-w-0 items-center gap-2">
                                                                <span
                                                                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${color.dot}`}
                                                                />
                                                                <span className="truncate font-semibold text-slate-700 dark:text-slate-300">
                                                                    {branch.name}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-slate-500 dark:text-slate-400">
                                                                    {branch.count}{' '}
                                                                    siswa
                                                                </span>
                                                                <span
                                                                    className={`font-mono font-bold ${color.text}`}
                                                                >
                                                                    {
                                                                        branch.percentage
                                                                    }
                                                                    %
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex h-48 items-center justify-center text-center text-xs text-slate-400 dark:text-slate-500">
                                        Belum ada data pemilihan cabang karir
                                        siswa.
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 border-t border-slate-100 pt-3 text-right dark:border-slate-800">
                                <Link
                                    href="/admin/courses"
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                                >
                                    Kelola Jalur Karir →
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* ZONE 4: GAMIFICATION ECONOMY, LEADERBOARD & RECENT ACTIVITIES */}
                    <div className="grid gap-5 lg:grid-cols-3">
                        {/* 1. Gamification Economy Snapshot */}
                        <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-gradient-to-b dark:from-[#0e0e1a] dark:to-[#090910]">
                            <div>
                                <h2 className="text-sm font-bold tracking-wider text-slate-800 uppercase dark:text-white">
                                    Ekonomi Gamifikasi
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    Total akumulasi EXP dan Gold siswa di
                                    platform.
                                </p>

                                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                                    {/* EXP Card */}
                                    <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800/60 dark:bg-slate-900/40">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                                            <img
                                                src="/images/exp.webp"
                                                alt="EXP"
                                                className="h-10 w-10 object-contain"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                Total EXP
                                            </p>
                                            <p className="font-mono text-xl font-black text-slate-800 dark:text-white">
                                                {gamificationStats.total_exp.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Gold Card */}
                                    <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800/60 dark:bg-slate-900/40">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                                            <img
                                                src="/images/Gold.webp"
                                                alt="Gold"
                                                className="h-10 w-10 object-contain"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                Total Gold Siswa
                                            </p>
                                            <p className="font-mono text-xl font-black text-slate-800 dark:text-white">
                                                {gamificationStats.total_gold.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Avg Level Card */}
                                    <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800/60 dark:bg-slate-900/40">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                            <TrendingUp className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                Rata-rata Level
                                            </p>
                                            <p className="font-mono text-xl font-black text-slate-800 dark:text-white">
                                                Lv. {gamificationStats.average_level}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                                <Link
                                    href="/admin/assets"
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                                >
                                    Kelola Aset RPG & Karakter →
                                </Link>
                            </div>
                        </div>

                        {/* 2. Top 5 Siswa Berprestasi (RPG Leaderboard) */}
                        <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-gradient-to-b dark:from-[#0e0e1a] dark:to-[#090910]">
                            <div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-sm font-bold tracking-wider text-slate-800 uppercase dark:text-white">
                                            Top Siswa RPG
                                        </h2>
                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                            Siswa dengan total EXP tertinggi.
                                        </p>
                                    </div>
                                    <span className="rounded-md bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                        Top 5
                                    </span>
                                </div>

                                <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {topStudents.length > 0 ? (
                                        topStudents.map((student, idx) => (
                                            <div
                                                key={student._id}
                                                className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                                            >
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <span
                                                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                                                            idx === 0
                                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                                                                : idx === 1
                                                                  ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                                                                  : idx === 2
                                                                    ? 'bg-amber-700/20 text-amber-900 dark:bg-amber-700/30 dark:text-amber-400'
                                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                        }`}
                                                    >
                                                        {idx + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs font-bold text-slate-800 dark:text-white">
                                                            {student.name}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400">
                                                            Lv. {student.level} •{' '}
                                                            {student.total_exp.toLocaleString()}{' '}
                                                            EXP
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                                                    {student.total_gold.toLocaleString()}{' '}
                                                    G
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                                            Belum ada data peringkat siswa.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                                <Link
                                    href="/admin/users"
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                                >
                                    Lihat Semua Siswa →
                                </Link>
                            </div>
                        </div>

                        {/* 3. Feed Aktivitas Terkini Platform */}
                        <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-gradient-to-b dark:from-[#0e0e1a] dark:to-[#090910]">
                            <div>
                                <h2 className="text-sm font-bold tracking-wider text-slate-800 uppercase dark:text-white">
                                    Aktivitas Terkini
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    Aliran peristiwa pendaftaran, tugas &
                                    diskusi.
                                </p>

                                <div className="mt-4 space-y-3">
                                    {recentActivities.length > 0 ? (
                                        recentActivities.map((act) => (
                                            <div
                                                key={act.id}
                                                className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/40 p-2.5 text-xs dark:border-slate-800/60 dark:bg-slate-900/40"
                                            >
                                                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                                                    {act.type === 'enrollment' && (
                                                        <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                                                    )}
                                                    {act.type === 'submission' && (
                                                        <FileText className="h-3.5 w-3.5 text-emerald-500" />
                                                    )}
                                                    {act.type === 'forum' && (
                                                        <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
                                                    )}
                                                    {act.type === 'dispute' && (
                                                        <Scale className="h-3.5 w-3.5 text-rose-500" />
                                                    )}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium text-slate-800 dark:text-slate-200">
                                                        {act.title}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400">
                                                        {act.time}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                                            Belum ada riwayat aktivitas terbaru.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                                <Link
                                    href="/admin/forum"
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                                >
                                    Buka Forum Diskusi →
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* ZONE 5: KURSUS PALING POPULER */}
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0c0e17]">
                        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-bold tracking-wider text-slate-800 uppercase dark:text-white">
                                        Kursus Terpopuler Berdasarkan Pendaftaran
                                    </h2>
                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                        Daftar kursus dengan antusiasme siswa
                                        tertinggi.
                                    </p>
                                </div>
                                <Link
                                    href="/admin/courses"
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                                >
                                    Lihat Semua Kursus →
                                </Link>
                            </div>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                            {popularCourses.length > 0 ? (
                                popularCourses.map((course, idx) => (
                                    <div
                                        key={course._id}
                                        className="flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-900/40"
                                    >
                                        <div className="flex min-w-0 items-center gap-4">
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-mono text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                #{idx + 1}
                                            </span>
                                            {course.thumbnail_url ? (
                                                <img
                                                    src={course.thumbnail_url}
                                                    alt={course.title}
                                                    className="h-10 w-14 rounded-md object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-10 w-14 items-center justify-center rounded-md bg-indigo-50 text-indigo-400 dark:bg-indigo-950/40">
                                                    <BookOpen className="h-5 w-5" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                                    {course.title}
                                                </h3>
                                                <span className="text-xs text-slate-400">
                                                    Kursus Publikasi
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-4">
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 font-mono text-xs font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                                                <Users className="h-3.5 w-3.5" />
                                                {course.students_count} Siswa
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">
                                    Belum ada kursus yang aktif.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
