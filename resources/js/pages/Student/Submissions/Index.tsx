import { useState, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import PageBackground from '@/components/Student/PageBackground';
import {
    ClipboardList,
    CheckCircle2,
    Clock,
    ArrowRight,
    ArrowLeft,
    Filter,
    Award,
    FileCheck,
    FileText,
    ExternalLink,
    TrendingUp,
} from 'lucide-react';

interface CareerGroup {
    id: string;
    _id?: string;
    slug?: string;
    name: string;
}

interface Submission {
    id: string;
    _id?: string;
    slug?: string;
    title: string;
    description: string;
    submission_type: string;
    attachment?: string;
    attachment_url?: string;
    created_at: string;
}

interface StudentSubmission {
    id: string;
    _id?: string;
    submission_id: string;
    status: string;
    grade?: string | number;
    feedback?: string;
    certificate_url?: string;
    created_at: string;
}

interface Props {
    group: CareerGroup;
    submissions: Submission[];
    studentSubmissions: Record<string, StudentSubmission>;
}

type FilterStatus = 'all' | 'pending' | 'submitted' | 'graded';

export default function Index({
    group,
    submissions,
    studentSubmissions,
}: Props) {
    const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');

    const getStatusInfo = (submission: Submission) => {
        const subId = (submission.id || submission._id) as string;
        const studentSub = studentSubmissions[subId];

        if (studentSub) {
            if (studentSub.status === 'graded') {
                return {
                    key: 'graded',
                    label: `Graded: ${studentSub.grade}`,
                    color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/30',
                    badgeBg: 'bg-emerald-600',
                    icon: <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
                };
            }
            return {
                key: 'submitted',
                label: 'Submitted',
                color: 'text-blue-700 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-500/15 border-blue-300 dark:border-blue-500/30',
                badgeBg: 'bg-blue-600',
                icon: <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
            };
        }

        return {
            key: 'pending',
            label: 'Not Submitted',
            color: 'text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/30',
            badgeBg: 'bg-amber-500',
            icon: <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
        };
    };

    const counts = useMemo(() => {
        let pending = 0;
        let submitted = 0;
        let graded = 0;

        submissions.forEach((submission) => {
            const status = getStatusInfo(submission);
            if (status.key === 'graded') {
                graded++;
            } else if (status.key === 'submitted') {
                submitted++;
            } else {
                pending++;
            }
        });

        return {
            all: submissions.length,
            pending,
            submitted,
            graded,
        };
    }, [submissions, studentSubmissions]);

    const filteredSubmissions = useMemo(() => {
        if (activeFilter === 'all') return submissions;
        return submissions.filter((submission) => {
            const status = getStatusInfo(submission);
            return status.key === activeFilter;
        });
    }, [submissions, studentSubmissions, activeFilter]);

    const progressPercentage = useMemo(() => {
        if (submissions.length === 0) return 0;
        const completedCount = counts.submitted + counts.graded;
        return Math.round((completedCount / submissions.length) * 100);
    }, [submissions.length, counts]);

    const handleBackNav = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = group.slug
                ? `/career-groups/${group.slug}`
                : '/course';
        }
    };

    return (
        <div className="relative flex h-screen flex-col overflow-hidden bg-[#fdfcfc] text-[#1e293b] dark:bg-[#020202] dark:text-white">
            <PageBackground />

            {/* ================= HEADER ================= */}
            <div className="w-full flex-shrink-0 px-2 pt-2 md:px-4 md:pt-3">
                <div
                    className="relative rounded-2xl p-[2px]"
                    style={{
                        backgroundImage:
                            'linear-gradient(to right, #3B28F6 0%, #4c2fff 30%, #7c3aed 60%, #facc15 100%)',
                    }}
                >
                    <div className="flex items-center gap-4 rounded-[14px] bg-white/95 px-4 py-3.5 backdrop-blur-md md:px-6 dark:bg-[#040812]/95">
                        <button
                            onClick={handleBackNav}
                            type="button"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 shadow-sm transition-all hover:scale-105 hover:border-blue-400 hover:bg-blue-100 md:h-11 md:w-11 dark:border-blue-500/40 dark:bg-[#0b1021] dark:text-indigo-400 dark:hover:bg-blue-900/40"
                            title="Back"
                        >
                            <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
                        </button>

                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-bold tracking-widest text-blue-600 uppercase md:text-xs dark:text-indigo-400">
                                Career Module Assignments
                            </span>
                            <h1 className="truncate font-['Orbitron'] text-lg font-extrabold tracking-wide text-[#1e3a8a] uppercase md:text-2xl lg:text-3xl dark:text-white">
                                {group.name}
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= MAIN CONTENT ================= */}
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-2 pt-2 pb-2 md:flex-row md:px-4 md:pt-3 md:pb-3">
                {/* ================= SIDEBAR (DESKTOP) ================= */}
                <div className="hidden w-full flex-col gap-4 overflow-hidden rounded-2xl border border-blue-200/90 bg-white/90 p-4 shadow-md backdrop-blur-sm md:flex md:w-[270px] md:flex-shrink-0 lg:w-[290px] dark:border-blue-500/30 dark:bg-[#080d1e]/90 dark:shadow-none">
                    <div className="flex items-center justify-between px-1">
                        <p className="font-['Orbitron'] text-xs font-bold tracking-[0.15em] text-blue-600 uppercase dark:text-gray-400">
                            Filter Status
                        </p>
                        <Filter className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-all ${
                                activeFilter === 'all'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-500/80 dark:bg-blue-500/20 dark:text-white'
                                    : 'border-slate-200/70 text-slate-600 hover:bg-slate-100/70 dark:border-white/5 dark:text-gray-300 dark:hover:bg-white/5'
                            }`}
                        >
                            <span className="flex items-center gap-2.5">
                                <ClipboardList className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                All Assignments
                            </span>
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-extrabold text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                                {counts.all}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveFilter('pending')}
                            className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-all ${
                                activeFilter === 'pending'
                                    ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-sm dark:border-amber-500/80 dark:bg-amber-500/20 dark:text-amber-300'
                                    : 'border-slate-200/70 text-slate-600 hover:bg-slate-100/70 dark:border-white/5 dark:text-gray-300 dark:hover:bg-white/5'
                            }`}
                        >
                            <span className="flex items-center gap-2.5">
                                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                Not Submitted
                            </span>
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                                {counts.pending}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveFilter('submitted')}
                            className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-all ${
                                activeFilter === 'submitted'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-500/80 dark:bg-blue-500/20 dark:text-white'
                                    : 'border-slate-200/70 text-slate-600 hover:bg-slate-100/70 dark:border-white/5 dark:text-gray-300 dark:hover:bg-white/5'
                            }`}
                        >
                            <span className="flex items-center gap-2.5">
                                <FileCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                Submitted
                            </span>
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-extrabold text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                                {counts.submitted}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveFilter('graded')}
                            className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-all ${
                                activeFilter === 'graded'
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm dark:border-emerald-500/80 dark:bg-emerald-500/20 dark:text-emerald-300'
                                    : 'border-slate-200/70 text-slate-600 hover:bg-slate-100/70 dark:border-white/5 dark:text-gray-300 dark:hover:bg-white/5'
                            }`}
                        >
                            <span className="flex items-center gap-2.5">
                                <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                Graded
                            </span>
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-extrabold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                                {counts.graded}
                            </span>
                        </button>
                    </div>

                    {/* Progress Overview Widget */}
                    <div className="mt-auto rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 to-indigo-50/70 p-3.5 dark:border-blue-500/20 dark:from-[#0d1430] dark:to-[#080d1e]">
                        <div className="mb-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider text-blue-700 uppercase dark:text-indigo-300">
                                <TrendingUp className="h-3.5 w-3.5" /> Progress
                            </span>
                            <span className="font-['Orbitron'] text-xs font-bold text-blue-900 dark:text-white">
                                {progressPercentage}%
                            </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200/60 dark:bg-blue-950">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                        <p className="mt-2 text-[10px] font-medium text-slate-500 dark:text-gray-400">
                            {counts.submitted + counts.graded} of {submissions.length} completed
                        </p>
                    </div>
                </div>

                {/* MOBILE FILTER BAR */}
                <div className="flex flex-shrink-0 gap-2 overflow-x-auto pb-1 md:hidden">
                    <button
                        onClick={() => setActiveFilter('all')}
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold ${
                            activeFilter === 'all'
                                ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                                : 'border-blue-200 bg-white text-slate-700 dark:border-blue-500/30 dark:bg-[#080d1e] dark:text-gray-300'
                        }`}
                    >
                        All ({counts.all})
                    </button>
                    <button
                        onClick={() => setActiveFilter('pending')}
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold ${
                            activeFilter === 'pending'
                                ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                                : 'border-blue-200 bg-white text-slate-700 dark:border-blue-500/30 dark:bg-[#080d1e] dark:text-gray-300'
                        }`}
                    >
                        Pending ({counts.pending})
                    </button>
                    <button
                        onClick={() => setActiveFilter('submitted')}
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold ${
                            activeFilter === 'submitted'
                                ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                                : 'border-blue-200 bg-white text-slate-700 dark:border-blue-500/30 dark:bg-[#080d1e] dark:text-gray-300'
                        }`}
                    >
                        Submitted ({counts.submitted})
                    </button>
                    <button
                        onClick={() => setActiveFilter('graded')}
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold ${
                            activeFilter === 'graded'
                                ? 'border-emerald-500 bg-emerald-600 text-white shadow-sm'
                                : 'border-blue-200 bg-white text-slate-700 dark:border-blue-500/30 dark:bg-[#080d1e] dark:text-gray-300'
                        }`}
                    >
                        Graded ({counts.graded})
                    </button>
                </div>

                {/* ================= CONTENT AREA ================= */}
                <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-blue-300 dark:scrollbar-thumb-blue-500/30 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto rounded-2xl border border-blue-200/90 bg-white/80 p-4 shadow-md backdrop-blur-sm sm:p-5 md:p-6 dark:border-blue-500/30 dark:bg-[#080d1e]/80 dark:shadow-none">
                    {filteredSubmissions.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10">
                                <ClipboardList className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                            </div>
                            <h3 className="mb-2 font-['Orbitron'] text-lg font-bold text-[#1e3a8a] dark:text-white">
                                {submissions.length === 0
                                    ? 'No Assignments Available'
                                    : 'No Assignments Match Selected Filter'}
                            </h3>
                            <p className="max-w-md font-['Oxanium'] text-sm text-slate-500 dark:text-gray-400">
                                {submissions.length === 0
                                    ? "Your mentor hasn't published any assignments for this module yet."
                                    : "There are no assignments matching the current status filter."}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {filteredSubmissions.map((submission) => {
                                const status = getStatusInfo(submission);
                                const submissionId = (submission.id || submission._id) as string;
                                const isSubmitted = studentSubmissions[submissionId];
                                const targetSlug = submission.slug || submissionId;

                                return (
                                    <div
                                        key={submissionId}
                                        className="group relative flex flex-col rounded-2xl border border-blue-200/90 bg-white p-5 shadow-sm transition-all hover:border-blue-400 hover:shadow-md md:p-6 dark:border-blue-500/30 dark:bg-[#0c1229] dark:hover:border-blue-400/60 dark:hover:shadow-none"
                                    >
                                        {/* Card Top Header Badges */}
                                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <div
                                                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-bold uppercase ${status.color}`}
                                                >
                                                    {status.icon}
                                                    {status.label}
                                                </div>
                                                <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-['Oxanium'] text-[11px] font-extrabold tracking-wider text-blue-600 uppercase dark:bg-blue-500/15 dark:text-blue-300">
                                                    {submission.submission_type} FORMAT
                                                </span>
                                            </div>
                                        </div>

                                        {/* Assignment Title */}
                                        <h3 className="mb-2 font-['Orbitron'] text-lg font-extrabold text-[#1e3a8a] transition-colors md:text-xl dark:text-white">
                                            {submission.title}
                                        </h3>

                                        {/* Description */}
                                        <p className="mb-4 font-['Oxanium'] text-sm leading-relaxed text-slate-600 line-clamp-3 dark:text-gray-300">
                                            {submission.description}
                                        </p>

                                        {/* Graded Feedback Card snippet (if graded) */}
                                        {isSubmitted && isSubmitted.status === 'graded' && (
                                            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-emerald-300 bg-emerald-50/70 p-4 md:flex-row md:items-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
                                                <div className="flex shrink-0 items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
                                                        <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                                    </div>
                                                    <div>
                                                        <span className="font-['Orbitron'] text-xl font-black text-emerald-700 dark:text-emerald-400">
                                                            {isSubmitted.grade}
                                                        </span>
                                                        <span className="ml-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                                            Score
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 md:border-l md:border-emerald-200 md:pl-4 dark:md:border-emerald-500/20">
                                                    <h4 className="font-['Orbitron'] text-xs font-bold text-emerald-900 dark:text-emerald-300">
                                                        Mentor Feedback:
                                                    </h4>
                                                    <p className="font-['Oxanium'] text-xs text-emerald-800 italic dark:text-emerald-200/80">
                                                        "{isSubmitted.feedback || 'No written feedback provided.'}"
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Attachment link if present */}
                                        {submission.attachment && (
                                            <div className="mb-4">
                                                <a
                                                    href={
                                                        submission.attachment_url ||
                                                        `/submissions/${targetSlug}/attachment`
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300"
                                                >
                                                    <FileText className="h-3.5 w-3.5" />
                                                    Download Reference Material
                                                    <ExternalLink className="h-3 w-3 opacity-60" />
                                                </a>
                                            </div>
                                        )}

                                        {/* Footer Primary Action Button */}
                                        <div className="mt-auto flex items-center justify-end pt-2 border-t border-slate-100 dark:border-blue-500/15">
                                            <Link
                                                href={`/submissions/${targetSlug}`}
                                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold tracking-wider uppercase transition-all shadow-sm ${
                                                    isSubmitted
                                                        ? 'border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-500/40 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900/60'
                                                        : 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700 hover:shadow-md'
                                                }`}
                                            >
                                                <span>
                                                    {isSubmitted
                                                        ? 'View Workspace & Submission'
                                                        : 'Open Workspace to Submit'}
                                                </span>
                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
