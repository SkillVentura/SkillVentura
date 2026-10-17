import { useForm, Link } from '@inertiajs/react';
import PageBackground from '@/components/Student/PageBackground';
import {
    FileText,
    Link as LinkIcon,
    UploadCloud,
    CheckCircle2,
    AlertCircle,
    MessageSquare,
    ClipboardList,
    ArrowLeft,
    Download,
    Award,
    ChevronLeft,
    ExternalLink,
    Sparkles,
    User as UserIcon,
} from 'lucide-react';
import { FormEventHandler, useState, useRef } from 'react';

interface CareerGroup {
    id: string;
    _id?: string;
    slug?: string;
    name: string;
    mentor?: User;
}

interface User {
    name: string;
}

interface Submission {
    id: string;
    _id?: string;
    slug?: string;
    group_id: string;
    title: string;
    description: string;
    submission_type: 'file' | 'link';
    attachment?: string;
    attachment_url?: string;
    group?: CareerGroup;
}

interface StudentSubmission {
    id: string;
    _id?: string;
    slug?: string;
    file_path?: string;
    file_url?: string;
    link?: string;
    notes?: string;
    status: string;
    grade?: string | number;
    feedback?: string;
    certificate_path?: string;
    certificate_url?: string;
}

interface Props {
    submission: Submission;
    studentSubmission: StudentSubmission | null;
}

export default function Show({ submission, studentSubmission }: Props) {
    const isSubmitted = !!studentSubmission;
    const isGraded = studentSubmission?.status === 'graded';

    const { data, setData, post, processing, errors } = useForm({
        file: null as File | null,
        link: studentSubmission?.link || '',
        notes: studentSubmission?.notes || '',
    });

    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setData('file', e.dataTransfer.files[0]);
        }
    };

    const targetSlug = submission.slug || submission.id || (submission._id as string);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(`/submissions/${targetSlug}/submit`);
    };

    const handleBackNav = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else if (submission.group?.slug) {
            window.location.href = `/career-groups/${submission.group.slug}/submissions`;
        } else {
            window.location.href = '/course';
        }
    };

    const backUrl = submission.group?.slug
        ? `/career-groups/${submission.group.slug}/submissions`
        : '/course';

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
                                Assignment Workspace
                            </span>
                            <h1 className="truncate font-['Orbitron'] text-lg font-extrabold tracking-wide text-[#1e3a8a] uppercase md:text-2xl lg:text-3xl dark:text-white">
                                {submission.title}
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
                            Assignment Details
                        </p>
                    </div>

                    {/* Metadata Summary Card */}
                    <div className="flex flex-col gap-3 rounded-xl border border-blue-200/80 bg-white p-3.5 shadow-xs dark:border-blue-500/20 dark:bg-[#0c1229]">
                        <div>
                            <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                                Format Required
                            </span>
                            <p className="font-['Orbitron'] text-xs font-bold text-blue-700 uppercase dark:text-blue-300">
                                {submission.submission_type} Submission
                            </p>
                        </div>

                        {submission.group?.mentor && (
                            <div className="border-t border-slate-100 pt-2 dark:border-blue-500/15">
                                <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                                    Assigned Mentor
                                </span>
                                <p className="flex items-center gap-1.5 font-['Oxanium'] text-xs font-semibold text-slate-700 dark:text-gray-300">
                                    <UserIcon className="h-3.5 w-3.5 text-blue-500" />
                                    {submission.group.mentor.name}
                                </p>
                            </div>
                        )}

                        <div className="border-t border-slate-100 pt-2 dark:border-blue-500/15">
                            <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                                Workspace Status
                            </span>
                            <div className="mt-1">
                                {isGraded ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
                                        <Award className="h-3.5 w-3.5" /> Graded ({studentSubmission.grade})
                                    </span>
                                ) : isSubmitted ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Submitted
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300">
                                        Not Submitted
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ================= CONTENT AREA ================= */}
                <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-blue-300 dark:scrollbar-thumb-blue-500/30 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto rounded-2xl border border-blue-200/90 bg-white/80 p-4 shadow-md backdrop-blur-sm sm:p-6 md:p-8 dark:border-blue-500/30 dark:bg-[#080d1e]/80 dark:shadow-none">
                    {/* MENTOR EVALUATION & FEEDBACK BOX (If Graded) - PLACED AT VERY TOP */}
                    {isGraded && (
                        <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50/95 via-teal-50/85 to-emerald-50/95 p-5 shadow-sm md:p-6 dark:border-emerald-500/40 dark:from-emerald-950/50 dark:via-teal-950/40 dark:to-emerald-950/50">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                                <div className="flex shrink-0 items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20 sm:h-14 sm:w-14 dark:bg-emerald-600">
                                        <Award className="h-7 w-7 sm:h-8 sm:w-8" />
                                    </div>
                                    <div>
                                        <span className="font-['Orbitron'] text-2xl font-black text-emerald-700 sm:text-3xl dark:text-emerald-400">
                                            {studentSubmission.grade}
                                        </span>
                                        <span className="ml-2 text-xs font-bold tracking-widest text-emerald-800 uppercase dark:text-emerald-300">
                                            Final Score
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 border-t border-emerald-300/60 pt-3.5 min-w-0 md:border-t-0 md:border-l md:pt-0 md:pl-5 dark:border-emerald-500/30">
                                    <h4 className="flex items-center gap-1.5 font-['Orbitron'] text-xs font-bold tracking-wider text-emerald-900 uppercase dark:text-emerald-300">
                                        <Sparkles className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                        Mentor Feedback:
                                    </h4>
                                    <p className="mt-1 font-['Oxanium'] text-xs leading-relaxed text-emerald-900 italic break-words whitespace-pre-line sm:text-sm dark:text-emerald-100">
                                        "{studentSubmission.feedback || 'Great work! No additional written feedback provided.'}"
                                    </p>
                                </div>

                                {studentSubmission.certificate_url && (
                                    <a
                                        href={studentSubmission.certificate_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-500 sm:w-auto sm:px-5 sm:py-3 md:self-center"
                                    >
                                        <Award className="h-4 w-4" />
                                        View Certificate
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Assignment Info Banner Card */}
                    <div className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 p-5 md:p-6 dark:border-blue-500/20 dark:from-[#0c132f] dark:to-[#080d1e]">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-100/70 px-3 py-1 text-xs font-extrabold text-blue-800 uppercase dark:border-blue-500/40 dark:bg-blue-500/20 dark:text-blue-300">
                                <FileText className="h-3.5 w-3.5" />
                                {submission.submission_type} Submission
                            </span>
                        </div>

                        <h2 className="font-['Orbitron'] text-xl font-extrabold text-[#1e3a8a] sm:text-2xl md:text-3xl dark:text-white">
                            {submission.title}
                        </h2>

                        <p className="font-['Oxanium'] text-sm leading-relaxed whitespace-pre-line text-slate-700 md:text-base dark:text-gray-300">
                            {submission.description}
                        </p>

                        {submission.attachment && (
                            <div className="pt-2">
                                <a
                                    href={
                                        submission.attachment_url ||
                                        `/submissions/${submission.slug || submission.id || submission._id}/attachment`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-xl border border-blue-300 bg-white px-4 py-2.5 text-xs font-bold text-blue-700 shadow-xs transition-all hover:bg-blue-50 hover:shadow-md dark:border-blue-500/40 dark:bg-[#0c1229] dark:text-blue-300 dark:hover:bg-blue-900/50"
                                >
                                    <ClipboardList className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    Download Reference Material
                                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                                </a>
                            </div>
                        )}
                    </div>

                    {/* SUBMISSION WORKSPACE CARD */}
                    <div className="flex flex-col gap-5 rounded-2xl border border-blue-200/90 bg-white p-5 shadow-sm md:p-6 dark:border-blue-500/30 dark:bg-[#0c1229]">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-300 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/15">
                                <UploadCloud className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-['Orbitron'] text-base font-bold text-[#1e3a8a] md:text-lg dark:text-white">
                                    Submission Workspace
                                </h3>
                                <p className="font-['Oxanium'] text-xs text-slate-500 dark:text-gray-400">
                                    Submit your assignment solution or edit your submission below
                                </p>
                            </div>
                        </div>

                        {/* Existing Submission Banner */}
                        {isSubmitted && (
                            <div className="flex flex-col gap-4 rounded-xl border border-emerald-300 bg-emerald-50/60 p-4 md:p-5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-['Orbitron'] text-sm font-bold text-emerald-900 md:text-base dark:text-emerald-300">
                                            {isGraded ? 'Task Graded & Completed' : 'Task Successfully Submitted'}
                                        </h4>
                                        <p className="font-['Oxanium'] text-xs text-emerald-700 dark:text-emerald-400/90">
                                            {isGraded
                                                ? 'Your submission has been evaluated by your mentor.'
                                                : 'Your solution is uploaded and currently under mentor review.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 pt-2">
                                    {studentSubmission?.link && (
                                        <div className="rounded-xl border border-emerald-200 bg-white p-3.5 dark:border-emerald-500/20 dark:bg-black/30">
                                            <label className="mb-1 flex items-center gap-1.5 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                                                <LinkIcon className="h-3.5 w-3.5" /> Project URL
                                            </label>
                                            <a
                                                href={studentSubmission.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-['Oxanium'] text-xs font-bold break-all text-blue-600 underline md:text-sm dark:text-blue-400"
                                            >
                                                {studentSubmission.link}
                                            </a>
                                        </div>
                                    )}

                                    {studentSubmission?.file_path && (
                                        <div className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-500/20 dark:bg-black/30">
                                            <div>
                                                <label className="mb-1 flex items-center gap-1.5 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                                                    <FileText className="h-3.5 w-3.5" /> Submitted Document
                                                </label>
                                                <div className="font-['Oxanium'] text-xs font-bold text-slate-700 md:text-sm dark:text-gray-200">
                                                    File Uploaded & Saved
                                                </div>
                                            </div>
                                            <a
                                                href={
                                                    studentSubmission.file_url ||
                                                    `/student-submissions/${studentSubmission.slug || studentSubmission.id || studentSubmission._id}/file`
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 shadow-xs transition-colors hover:bg-blue-100 dark:border-blue-500/40 dark:bg-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-500/30"
                                            >
                                                <Download className="h-4 w-4" /> Download Submitted File
                                            </a>
                                        </div>
                                    )}

                                    {studentSubmission?.notes && (
                                        <div className="rounded-xl border border-emerald-200 bg-white p-3.5 dark:border-emerald-500/20 dark:bg-black/30">
                                            <label className="mb-1 flex items-center gap-1.5 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                                                <MessageSquare className="h-3.5 w-3.5" /> Private Notes
                                            </label>
                                            <div className="font-['Oxanium'] text-xs text-slate-600 italic md:text-sm dark:text-gray-300">
                                                "{studentSubmission.notes}"
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {!isGraded && (
                                    <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                        <div>
                                            <strong className="font-['Orbitron']">
                                                Update Submission
                                            </strong>
                                            <p className="mt-0.5 font-['Oxanium']">
                                                You can modify and overwrite your submission using the form below as long as it hasn't been graded.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Submission Input Form */}
                        {(!isSubmitted || !isGraded) && (
                            <form
                                onSubmit={submit}
                                className="flex flex-col gap-5 pt-2"
                            >
                                {submission.submission_type === 'link' ? (
                                    <div>
                                        <label className="mb-2 block text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-gray-300">
                                            Project URL <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                                                <LinkIcon className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <input
                                                type="url"
                                                required
                                                placeholder="https://github.com/username/project"
                                                value={data.link}
                                                onChange={(e) =>
                                                    setData(
                                                        'link',
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full rounded-xl border border-blue-200 bg-white py-3 pr-4 pl-10 text-xs font-semibold text-slate-800 transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 md:text-sm dark:border-blue-500/30 dark:bg-white/5 dark:text-white dark:focus:border-blue-400"
                                            />
                                        </div>
                                        {errors.link && (
                                            <p className="mt-1.5 text-xs font-medium text-red-500">
                                                {errors.link}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <label className="mb-2 block text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-gray-300">
                                            Upload File <span className="text-red-500">*</span>
                                        </label>
                                        <div
                                            className={`flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                                                dragActive
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                                                    : 'border-blue-200 bg-blue-50/40 hover:border-blue-400 hover:bg-blue-50/80 dark:border-blue-500/30 dark:bg-white/5 dark:hover:border-blue-400'
                                            } ${
                                                data.file
                                                    ? 'border-emerald-500 bg-emerald-50/80 dark:border-emerald-500/40 dark:bg-emerald-500/10'
                                                    : ''
                                            }`}
                                            onDragEnter={handleDrag}
                                            onDragLeave={handleDrag}
                                            onDragOver={handleDrag}
                                            onDrop={handleDrop}
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                        >
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={(e) =>
                                                    setData(
                                                        'file',
                                                        e.target.files?.[0] ||
                                                            null,
                                                    )
                                                }
                                                className="hidden"
                                            />

                                            {data.file ? (
                                                <div className="flex flex-col items-center">
                                                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                                        <FileText className="h-6 w-6" />
                                                    </div>
                                                    <p className="max-w-[240px] truncate font-['Oxanium'] text-sm font-bold text-emerald-900 sm:max-w-[300px] dark:text-emerald-300">
                                                        {data.file.name}
                                                    </p>
                                                    <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400/80">
                                                        Ready to upload
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setData(
                                                                'file',
                                                                null,
                                                            );
                                                        }}
                                                        className="mt-3 rounded-lg bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700 transition-colors hover:bg-red-500 hover:text-white dark:bg-slate-800 dark:text-gray-300"
                                                    >
                                                        Remove File
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                                                        <UploadCloud className="h-6 w-6" />
                                                    </div>
                                                    <p className="font-['Oxanium'] text-sm font-bold text-slate-700 dark:text-gray-200">
                                                        Click to browse or drag file here
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-400">
                                                        Supported formats: PDF, ZIP, DOCX (Max 10MB)
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        {errors.file && (
                                            <p className="mt-1.5 text-xs font-medium text-red-500">
                                                {errors.file}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label className="mb-2 block text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-gray-300">
                                        Private Notes{' '}
                                        <span className="font-normal text-slate-400 normal-case">
                                            (Optional)
                                        </span>
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Add context, challenges faced, or notes for your mentor..."
                                        value={data.notes}
                                        onChange={(e) =>
                                            setData('notes', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-blue-200 bg-white p-3.5 text-xs font-medium text-slate-800 transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 md:text-sm dark:border-blue-500/30 dark:bg-white/5 dark:text-white dark:focus:border-blue-400"
                                    />
                                    {errors.notes && (
                                        <p className="mt-1.5 text-xs font-medium text-red-500">
                                            {errors.notes}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-['Orbitron'] text-xs font-bold tracking-wider text-white uppercase shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-lg disabled:opacity-50"
                                >
                                    <UploadCloud className="h-4 w-4" />
                                    <span>
                                        {isSubmitted
                                            ? 'Update Submission'
                                            : 'Submit Assignment'}
                                    </span>
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
