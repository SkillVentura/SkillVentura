import AppLayout from '@/layouts/app-layout';
import { useForm, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    FileText,
    Link as LinkIcon,
    CheckCircle2,
    MessageSquare,
    Download,
    User,
    Star,
    Award,
    ChevronRight,
    Send,
} from 'lucide-react';
import { FormEventHandler, useState, useEffect } from 'react';

interface Student {
    name: string;
    email: string;
}

interface CareerGroup {
    name: string;
}

interface Submission {
    title: string;
    description: string;
    submission_type: string;
    deadline?: string;
    group?: CareerGroup;
}

interface StudentSubmission {
    id: string;
    _id?: string;
    slug?: string;
    submission_id: string;
    file_path?: string;
    file_url?: string;
    link?: string;
    notes?: string;
    status: string;
    grade?: number;
    feedback?: string;
    created_at: string;
    student: Student;
    submission: Submission;
}

interface Props {
    studentSubmission: StudentSubmission;
}

export default function Show({ studentSubmission }: Props) {
    const isGraded = studentSubmission.status === 'graded';

    const { data, setData, put, processing, errors } = useForm({
        grade: studentSubmission.grade || 0,
        feedback: studentSubmission.feedback || '',
    });

    const [stars, setStars] = useState(0);

    useEffect(() => {
        const calculateStars = (grade: number) => {
            if (grade === 0) return 0;
            if (grade <= 20) return 1;
            if (grade <= 40) return 2;
            if (grade <= 60) return 3;
            if (grade <= 80) return 4;
            return 5;
        };
        setStars(calculateStars(data.grade));
    }, [data.grade]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(`/mentor/student-submissions/${studentSubmission.slug}/grade`);
    };

    const studentInitials = studentSubmission.student.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    return (
        <AppLayout>
            <div
                className="mx-auto w-full max-w-7xl space-y-6 p-4 text-slate-800 sm:p-6 lg:p-8 dark:text-slate-100"
                style={{ fontFamily: "'Outfit', sans-serif" }}
            >
                {/* BREADCRUMB & HEADER */}
                <div className="relative overflow-hidden rounded-xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 dark:border-slate-800">
                    <div className="absolute inset-0 bg-white dark:bg-gradient-to-b dark:from-[#0e0e1a] dark:to-[#090910]" />
                    <div className="absolute top-0 right-8 left-8 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-700" />

                    <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/mentor/dashboard"
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 shadow-sm transition-all hover:bg-slate-100 hover:text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <div>
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase dark:text-indigo-400">
                                        {studentSubmission.submission.group
                                            ?.name || 'Project'}
                                    </span>
                                    <ChevronRight className="h-3 w-3 shrink-0 text-slate-400 dark:text-slate-600" />
                                    <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                                        Submission Assessment
                                    </span>
                                </div>
                                <h1 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                                    {studentSubmission.submission.title}
                                </h1>
                            </div>
                        </div>
                        {isGraded && (
                            <div className="flex shrink-0 items-center gap-2 self-start rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 shadow-sm sm:self-auto dark:border-emerald-500/20 dark:bg-emerald-500/10">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-sm font-bold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
                                    Graded
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* MAIN CONTAINER */}
                <div className="space-y-6">
                    {/* STUDENT WORK & SUBMISSION ARTIFACTS CARD */}
                    <div className="relative overflow-hidden rounded-xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 sm:p-8 dark:border-slate-800">
                        <div className="absolute inset-0 bg-white dark:bg-gradient-to-b dark:from-[#0e0e1a] dark:to-[#090910]" />
                        <div className="absolute top-0 right-8 left-8 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-700" />

                        <div className="relative z-10 space-y-6">
                            {/* Student Profile Row */}
                            <div className="flex flex-col justify-between gap-6 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-center dark:border-slate-800/80">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-xl font-black text-white shadow-md">
                                        {studentInitials}
                                    </div>
                                    <div>
                                        <h2 className="mb-0.5 text-xl font-extrabold text-slate-900 dark:text-white">
                                            {studentSubmission.student.name}
                                        </h2>
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                                            <User className="h-4 w-4 shrink-0 text-slate-400" />
                                            {studentSubmission.student.email}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 sm:items-end">
                                    <span className="text-xs font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                        Submitted Timestamp
                                    </span>
                                    <div className="flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                                        <Calendar className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                                        {new Date(
                                            studentSubmission.created_at,
                                        ).toLocaleString('en-GB', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Submitted Links and Attachments */}
                            <div>
                                <div className="mb-6 flex items-center gap-3">
                                    <div className="rounded-lg bg-indigo-500/10 p-2">
                                        <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <h3 className="text-lg font-bold tracking-wide text-slate-900 dark:text-white">
                                        Submitted Assets & Notes
                                    </h3>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    {studentSubmission.link && (
                                        <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 shadow-sm sm:p-5 dark:border-slate-800/80 dark:bg-slate-950/40">
                                            <div>
                                                <label className="mb-2 block text-[11px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                                    Project / Repository Link
                                                </label>
                                            </div>
                                            <a
                                                href={studentSubmission.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group dark:hover:bg-slate-850 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                                            >
                                                <div className="flex items-center gap-3 truncate">
                                                    <div className="shrink-0 rounded-lg bg-indigo-50 p-2 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-950/50 dark:text-indigo-400">
                                                        <LinkIcon className="h-4 w-4" />
                                                    </div>
                                                    <span className="truncate text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                                        {studentSubmission.link}
                                                    </span>
                                                </div>
                                                <ArrowLeft className="ml-2 h-4 w-4 shrink-0 rotate-135 text-indigo-500" />
                                            </a>
                                        </div>
                                    )}

                                    {studentSubmission.file_path && (
                                        <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 shadow-sm sm:p-5 dark:border-slate-800/80 dark:bg-slate-950/40">
                                            <div>
                                                <label className="mb-2 block text-[11px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                                    Attached Document
                                                </label>
                                            </div>
                                            <a
                                                href={
                                                    studentSubmission.file_url ||
                                                    `/student-submissions/${studentSubmission.slug || studentSubmission.id}/file`
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group dark:hover:bg-slate-850 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                                            >
                                                <div className="flex items-center gap-3 truncate">
                                                    <div className="shrink-0 rounded-lg bg-blue-50 p-2 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950/50 dark:text-blue-400">
                                                        <Download className="h-4 w-4" />
                                                    </div>
                                                    <span className="truncate text-sm font-bold text-blue-600 dark:text-blue-400">
                                                        Download Submission File
                                                    </span>
                                                </div>
                                                <ArrowLeft className="ml-2 h-4 w-4 shrink-0 rotate-135 text-blue-500" />
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {studentSubmission.notes && (
                                    <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-100/35 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/40">
                                        <label className="mb-2 flex items-center gap-2 text-xs font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                            <MessageSquare className="h-4 w-4 text-slate-400" />{' '}
                                            Student's Note
                                        </label>
                                        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed font-medium whitespace-pre-wrap text-slate-700 italic dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                                            "{studentSubmission.notes}"
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* EVALUATION & MENTOR FEEDBACK SECTION (MAIN PROMINENT AREA) */}
                    <div className="shadow-indigo-150/40 relative overflow-hidden rounded-xl border border-indigo-200 p-6 shadow-md sm:p-8 dark:border-indigo-900/40 dark:shadow-none">
                        <div className="absolute inset-0 bg-white dark:bg-gradient-to-b dark:from-[#0e0e1a] dark:to-[#090910]" />
                        <div className="absolute top-0 right-8 left-8 h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent dark:via-indigo-600" />

                        <div className="relative z-10">
                            <div className="mb-8 flex items-center gap-3.5 border-b border-slate-200 pb-5 dark:border-slate-800">
                                <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 p-3 text-white shadow-md">
                                    <Award className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-extrabold tracking-wide text-slate-900 dark:text-white">
                                        Reviewer Evaluation & Feedback
                                    </h2>
                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                        Provide a score and structured feedback
                                        for the student's submission.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={submit} className="space-y-6">
                                <div className="grid items-start gap-6 lg:grid-cols-12">
                                    {/* SCORE & STAR RATING (LEFT/TOP SIDEBAR IN GRID) */}
                                    <div className="space-y-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm lg:col-span-4 dark:border-slate-800 dark:bg-slate-950/50">
                                        <div className="text-center">
                                            <label className="mb-3 block text-xs font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                                Final Score (0 - 100)
                                            </label>

                                            {/* Numeric Input */}
                                            <div className="relative mx-auto max-w-[160px]">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    required
                                                    value={
                                                        data.grade === 0 &&
                                                        !isGraded
                                                            ? ''
                                                            : data.grade
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'grade',
                                                            parseInt(
                                                                e.target.value,
                                                            ) || 0,
                                                        )
                                                    }
                                                    className="w-full rounded-2xl border-2 border-indigo-200 bg-white px-4 py-4 text-center text-4xl font-black text-indigo-600 placeholder-slate-300 shadow-inner transition-all outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-indigo-900/60 dark:bg-slate-900 dark:text-indigo-400 dark:placeholder-slate-700"
                                                    placeholder="0"
                                                />
                                            </div>
                                            {errors.grade && (
                                                <p className="mt-2 text-xs font-bold text-rose-500">
                                                    {errors.grade}
                                                </p>
                                            )}
                                        </div>

                                        {/* Dynamic Stars */}
                                        <div className="flex flex-col items-center justify-center border-t border-slate-200/80 pt-2 dark:border-slate-800/80">
                                            <span className="mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                                Rating Tier
                                            </span>
                                            <div className="flex gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        className={`h-5 w-5 ${
                                                            star <= stars
                                                                ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                                                                : 'text-slate-300 dark:text-slate-700'
                                                        } transition-all duration-300`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* MENTOR FEEDBACK TEXTAREA (RIGHT/MAIN MAIN CONTENT AREA) */}
                                    <div className="flex min-h-[260px] flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm lg:col-span-8 dark:border-slate-800 dark:bg-slate-950/50">
                                        <div>
                                            <label className="mb-3 flex items-center gap-2 text-xs font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                                <MessageSquare className="h-4 w-4 text-indigo-500" />{' '}
                                                Detailed Mentor Feedback
                                            </label>
                                            <textarea
                                                rows={8}
                                                required
                                                placeholder="Provide detailed, constructive feedback for the student. Highlight key strengths, note areas for technical improvement, and offer actionable guidance..."
                                                value={data.feedback}
                                                onChange={(e) =>
                                                    setData(
                                                        'feedback',
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm leading-relaxed font-medium text-slate-800 placeholder-slate-400 transition-all outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-600"
                                            />
                                            {errors.feedback && (
                                                <p className="mt-2 text-xs font-bold text-rose-500">
                                                    {errors.feedback}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ACTION BUTTON BAR */}
                                <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-4 sm:flex-row dark:border-slate-800">
                                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        {isGraded ? (
                                            <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                                                <CheckCircle2 className="h-4 w-4" />
                                                Submitting will update the
                                                existing grade and regenerate
                                                the student certificate.
                                            </span>
                                        ) : (
                                            <span>
                                                Submitting will finalize
                                                evaluation and automatically
                                                issue the certificate to the
                                                student.
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className={`flex w-full shrink-0 cursor-pointer items-center justify-center gap-2.5 rounded-xl px-8 py-3.5 text-sm font-bold tracking-wider uppercase shadow-md transition-all duration-300 active:scale-[0.99] sm:w-auto ${
                                            processing
                                                ? 'cursor-not-allowed border border-slate-300 bg-slate-200 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-600'
                                                : 'border border-indigo-600 bg-indigo-600 text-white shadow-indigo-500/20 hover:bg-indigo-700 dark:border-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500'
                                        }`}
                                    >
                                        <Send className="h-4 w-4" />
                                        <span>
                                            {processing
                                                ? 'Processing...'
                                                : isGraded
                                                  ? 'Update Review'
                                                  : 'Submit Review'}
                                        </span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
