import AppLayout from '@/layouts/app-layout';
import { Link, useForm } from '@inertiajs/react';
import ProfileFormBasic from '@/components/Mentor/ProfileFormBasic';
import ProfileFormWorkExperience from '@/components/Mentor/ProfileFormWorkExperience';
import ProfileFormEducation from '@/components/Mentor/ProfileFormEducation';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

// Helper to normalize strings
const normalizeString = (val: any): string => {
    if (val === null || val === undefined) {
        return '';
    }
    return String(val).toLowerCase().trim().replace(/\s+/g, ' ');
};

// Helper to check if value looks like a valid identifier (not empty, not just "unknown" or "assignment")
const isValidIdentifier = (val: string): boolean => {
    if (!val) {
        return false;
    }
    const ignored = [
        'unknown',
        'assignment',
        'undefined',
        'null',
        'course',
        'path',
        'quiz',
        'module',
        'none',
    ];
    return !ignored.includes(val);
};

// Helper to extract all strings and values recursively from an object/array
const collectAllValues = (obj: any, keysToCollect: string[]): string[] => {
    const values: string[] = [];

    const recurse = (current: any) => {
        if (!current) {
            return;
        }
        if (
            typeof current === 'string' ||
            typeof current === 'number' ||
            typeof current === 'boolean'
        ) {
            const normalized = normalizeString(current);
            if (isValidIdentifier(normalized)) {
                values.push(normalized);
            }
            return;
        }
        if (Array.isArray(current)) {
            current.forEach((item) => recurse(item));
            return;
        }
        if (typeof current === 'object') {
            Object.keys(current).forEach((k) => {
                const isTargetKey = keysToCollect.some(
                    (target) =>
                        k === target ||
                        k.toLowerCase() === target.toLowerCase() ||
                        k.toLowerCase().includes(target.toLowerCase()),
                );

                if (isTargetKey) {
                    const val = current[k];
                    if (
                        val &&
                        (typeof val === 'string' ||
                            typeof val === 'number' ||
                            typeof val === 'boolean')
                    ) {
                        const normalized = normalizeString(val);
                        if (isValidIdentifier(normalized)) {
                            values.push(normalized);
                        }
                    } else if (
                        val &&
                        (typeof val === 'object' || Array.isArray(val))
                    ) {
                        recurse(val);
                    }
                } else {
                    recurse(current[k]);
                }
            });
        }
    };

    recurse(obj);
    return Array.from(new Set(values));
};

// Extract Selected Course Identifiers
const getSelectedCourseIdentifiers = (course: any): string[] => {
    if (!course) {
        return [];
    }

    const ids: string[] = [];
    const add = (val: any) => {
        const norm = normalizeString(val);
        if (norm && isValidIdentifier(norm)) {
            ids.push(norm);
        }
    };

    add(course.id);
    add(course._id);
    add(course.slug);
    add(course.title);
    add(course.name);
    add(course.course_name);
    add(course.courseName);
    add(course.career_group);
    add(course.careerGroup);

    const deepKeys = [
        'id',
        '_id',
        'slug',
        'title',
        'name',
        'course_name',
        'courseName',
        'career_group',
        'careerGroup',
        'basic_paths',
        'basic_path',
        'path',
        'paths',
        'module',
        'modules',
        'quiz',
        'quizzes',
    ];

    const deepValues = collectAllValues(course, deepKeys);
    deepValues.forEach((v) => {
        if (!ids.includes(v)) {
            ids.push(v);
        }
    });

    return ids;
};

// Extract Item Identifiers
const getItemIdentifiers = (item: any): string[] => {
    if (!item) {
        return [];
    }

    const ids: string[] = [];
    const add = (val: any) => {
        const norm = normalizeString(val);
        if (norm && isValidIdentifier(norm)) {
            ids.push(norm);
        }
    };

    add(item.course_id);
    add(item.courseId);
    add(item.basic_path_id);
    add(item.basicPathId);
    add(item.basic_path_title);
    add(item.basicPathTitle);
    add(item.path_id);
    add(item.pathId);
    add(item.path_title);
    add(item.pathTitle);
    add(item.path_name);
    add(item.pathName);
    add(item.module_id);
    add(item.moduleId);
    add(item.module_title);
    add(item.moduleTitle);
    add(item.quiz_id);
    add(item.quizId);
    add(item.quiz_title);
    add(item.quizTitle);
    add(item.title);
    add(item.name);
    add(item.slug);
    add(item.career_group);
    add(item.careerGroup);

    const deepKeys = [
        'id',
        '_id',
        'slug',
        'title',
        'name',
        'course_id',
        'courseId',
        'basic_path_id',
        'basicPathId',
        'basic_path_title',
        'basicPathTitle',
        'path_id',
        'pathId',
        'path_title',
        'pathTitle',
        'path_name',
        'pathName',
        'module_id',
        'moduleId',
        'module_title',
        'moduleTitle',
        'quiz_id',
        'quizId',
        'quiz_title',
        'quizTitle',
        'career_group',
        'careerGroup',
    ];

    const deepValues = collectAllValues(item, deepKeys);
    deepValues.forEach((v) => {
        if (!ids.includes(v)) {
            ids.push(v);
        }
    });

    return ids;
};

// Match Condition
const isMatch = (
    selectedCourseIdentifiers: string[],
    itemIdentifiers: string[],
): boolean => {
    for (const cId of selectedCourseIdentifiers) {
        for (const iId of itemIdentifiers) {
            if (cId === iId) {
                return true;
            }
            if (cId.length > 2 && iId.length > 2) {
                if (cId.includes(iId) || iId.includes(cId)) {
                    return true;
                }
            }
        }
    }
    return false;
};

// Reusable premium card component with unified blue-grey colors and no corner brackets/icons
function PremiumCard({
    title,
    badgeText,
    children,
    footer,
    className = '',
}: {
    title?: string;
    badgeText?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-gradient-to-b dark:from-[#0e0e1a] dark:to-[#090910] dark:shadow-none ${className}`}
            style={{ fontFamily: "'Outfit', sans-serif" }}
        >
            {/* Top accent line */}
            <div className="absolute top-0 right-8 left-8 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-700" />

            <div>
                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 sm:px-6 dark:border-white/5">
                        <h2 className="text-sm font-bold tracking-[0.2em] text-slate-800 uppercase dark:text-white">
                            {title}
                        </h2>
                        {badgeText && (
                            <span className="text-slate-650 rounded border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                                {badgeText}
                            </span>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="p-5 sm:p-6">{children}</div>
            </div>

            {/* Footer */}
            {footer && (
                <div className="border-t border-slate-200 bg-slate-50/50 px-5 py-3.5 sm:px-6 dark:border-white/5 dark:bg-white/[0.01]">
                    {footer}
                </div>
            )}
        </div>
    );
}

// Reusable metric card with unified blue-grey border, no icons, no corner brackets
function StatCard({
    title,
    value,
    subtitle,
}: {
    title: string;
    value: any;
    subtitle: string;
}) {
    return (
        <div
            className="relative overflow-hidden rounded-xl border border-slate-200 p-4 sm:p-5 dark:border-slate-800"
            style={{ fontFamily: "'Outfit', sans-serif" }}
        >
            <div className="absolute inset-0 bg-white dark:bg-gradient-to-b dark:from-[#0e0e1a] dark:to-[#090910]" />
            {/* Top accent line */}
            <div className="absolute top-0 right-8 left-8 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-700" />

            {/* Content */}
            <div className="relative z-10">
                <p className="text-[0.6rem] font-semibold tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
                    {title}
                </p>

                <p className="mt-2 text-2xl leading-none font-black tracking-tight text-slate-800 sm:text-3xl dark:text-white">
                    {value}
                </p>

                <p className="text-slate-550 mt-2 text-xs tracking-wide dark:text-slate-400/60">
                    {subtitle}
                </p>
            </div>
        </div>
    );
}

export default function Show({ user, details }: { user: any; details: any }) {
    const [selectedDetail, setSelectedDetail] = useState<{
        type: 'quiz' | 'submission' | 'mentor_submission';
        data: any;
    } | null>(null);

    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<any>(null);

    const { data, setData, post, processing, errors } = useForm({
        name: user.name || '',
        email: user.email || '',
        profession: user.profession || '',
        linkedin: user.linkedin || '',
        description: user.description || '',
        user_experience: user.user_experience || '',
        work_experiences: user.work_experiences || [],
        educations: user.educations || [],
        _method: 'put',
    });

    const submitProfileUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/users/${user.username || user._id}`, {
            preserveScroll: true,
            onSuccess: () => setShowEditProfileModal(false),
        });
    };

    // Filter submissions and quizzes based on selected course (career group or course name)
    const quizResults = details.recent_quizzes || [];
    const submissions = details.recent_submissions || [];

    const isSingleCourse = details.course_history?.length === 1;
    const selectedCourseIdentifiers = selectedCourse
        ? getSelectedCourseIdentifiers(selectedCourse)
        : [];

    const filteredSubmissions = selectedCourse
        ? isSingleCourse
            ? submissions
            : submissions.filter((sub: any) => {
                  const itemIds = getItemIdentifiers(sub);
                  const matched = isMatch(selectedCourseIdentifiers, itemIds);
                  return matched;
              })
        : [];

    const filteredQuizResults = selectedCourse
        ? isSingleCourse
            ? quizResults
            : quizResults.filter((quiz: any) => {
                  const itemIds = getItemIdentifiers(quiz);
                  const matched = isMatch(selectedCourseIdentifiers, itemIds);
                  return matched;
              })
        : [];

    const filteredQuizzes = filteredQuizResults;

    console.log('selectedCourse', selectedCourse);
    console.log('course identifiers', selectedCourseIdentifiers);
    console.log('quizResults raw', quizResults);
    console.log('submissions raw', submissions);
    console.log('filteredQuizResults', filteredQuizResults);
    console.log('filteredSubmissions', filteredSubmissions);

    const StudentDetails = () => (
        <div className="space-y-6">
            {/* KPI Cards: Level, EXP, Gold, Rank (grid-cols-2 on mobile, lg:grid-cols-4 on desktop) */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    title="Level"
                    value={details.gamification.level}
                    subtitle="Current student level"
                />
                <StatCard
                    title="EXP"
                    value={details.gamification.exp}
                    subtitle="Experience points accumulated"
                />
                <StatCard
                    title="Total Gold"
                    value={details.gamification.gold}
                    subtitle="Acquired game gold"
                />
                <div className="relative overflow-hidden rounded-xl border border-slate-200 p-4 sm:p-5 dark:border-slate-800">
                    <div className="absolute inset-0 bg-white dark:bg-gradient-to-b dark:from-[#0e0e1a] dark:to-[#090910]" />
                    <div className="absolute top-0 right-8 left-8 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-700" />

                    <div className="relative z-10 flex h-full items-center justify-between">
                        <div className="text-left">
                            <p className="text-[0.6rem] font-semibold tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
                                Rank
                            </p>
                            <p
                                className="mt-2 text-lg leading-none font-black text-slate-800 uppercase dark:text-white"
                                style={{ fontFamily: "'Outfit', sans-serif" }}
                            >
                                {details.gamification.rank?.name || 'Unranked'}
                            </p>
                            <div className="mt-2 flex gap-1">
                                {[...Array(3)].map((_, i) => (
                                    <span
                                        key={i}
                                        className={`h-2 w-2 rounded-full ${details.gamification.rank && i < details.gamification.rank.star ? 'dark:bg-slate-555 bg-slate-400' : 'bg-slate-200 dark:bg-slate-700'}`}
                                    ></span>
                                ))}
                            </div>
                        </div>
                        {details.gamification.rank?.image && (
                            <img
                                src={details.gamification.rank.image}
                                alt={details.gamification.rank.name}
                                className="h-10 w-10 object-contain"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Course History (Paling Atas) */}
            <PremiumCard
                title="Course History"
                badgeText="Select a course to view details"
            >
                {details.course_history?.length > 0 ? (
                    <div
                        className="custom-scrollbar max-h-[300px] space-y-2 overflow-y-auto pr-1"
                        style={{ scrollbarWidth: 'thin' }}
                    >
                        {details.course_history.map(
                            (course: any, idx: number) => {
                                const isSelected =
                                    selectedCourse?.course_name ===
                                    course.course_name;
                                return (
                                    <div
                                        key={idx}
                                        onClick={() =>
                                            setSelectedCourse(course)
                                        }
                                        className={`flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-3 transition-colors ${
                                            isSelected
                                                ? 'border-slate-400 bg-slate-100/80 dark:border-slate-600 dark:bg-slate-800/60'
                                                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/10 dark:hover:bg-slate-800/20'
                                        }`}
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            {course.thumbnail_url ? (
                                                <img
                                                    src={course.thumbnail_url}
                                                    alt="Thumbnail"
                                                    className="h-10 w-10 rounded-md border border-slate-200 bg-white object-cover dark:border-slate-700 dark:bg-slate-900"
                                                />
                                            ) : (
                                                <div className="text-slate-405 flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-xs font-semibold dark:border-slate-700 dark:bg-slate-900">
                                                    Course
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <h4 className="truncate text-xs font-semibold text-slate-800 dark:text-white">
                                                    {course.course_name}
                                                </h4>
                                                <p className="truncate text-[10px] text-slate-400 dark:text-slate-500">
                                                    {course.career_group}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`inline-block rounded border px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase ${
                                                isSelected
                                                    ? 'border-slate-400/30 bg-slate-200 text-slate-800 dark:border-slate-600/30 dark:bg-slate-700 dark:text-slate-200'
                                                    : 'bg-slate-55 text-slate-650 dark:text-slate-350 border-slate-200 dark:border-slate-700 dark:bg-slate-800/50'
                                            }`}
                                        >
                                            {course.status}
                                        </span>
                                    </div>
                                );
                            },
                        )}
                    </div>
                ) : (
                    <div className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                        No course history available.
                    </div>
                )}
            </PremiumCard>

            {/* Layout Grid: Submissions and Quiz Results */}
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-6">
                {/* All Submissions */}
                <PremiumCard title="All Submissions">
                    {!selectedCourse ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <p className="max-w-xs text-sm leading-relaxed font-medium text-slate-400 dark:text-slate-500">
                                Select a course from Course History to view
                                related quiz results and submissions.
                            </p>
                        </div>
                    ) : filteredSubmissions.length > 0 ? (
                        <div
                            className="custom-scrollbar max-h-[300px] space-y-3 overflow-y-auto pr-2"
                            style={{ scrollbarWidth: 'thin' }}
                        >
                            {filteredSubmissions.map(
                                (sub: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/10 dark:hover:bg-slate-800/20"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0 flex-1">
                                                <h4 className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                                                    {sub.title}
                                                </h4>
                                                <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                                                    {sub.career_group}
                                                </p>
                                                <p className="mt-2.5 text-[10px] text-slate-500 dark:text-slate-400">
                                                    Submitted:{' '}
                                                    {new Date(
                                                        sub.submitted_at,
                                                    ).toLocaleDateString(
                                                        'en-US',
                                                        {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        },
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex flex-shrink-0 flex-col items-end gap-2 text-right">
                                                <span
                                                    className={`rounded border px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase ${
                                                        sub.status ===
                                                            'graded' ||
                                                        sub.status ===
                                                            'approved'
                                                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                            : 'dark:text-amber-450 border-amber-500/20 bg-amber-500/10 text-amber-600'
                                                    }`}
                                                >
                                                    {sub.status}
                                                </span>
                                                {sub.grade && (
                                                    <p className="text-xs font-bold text-slate-700 dark:text-white">
                                                        Grade: {sub.grade}
                                                    </p>
                                                )}
                                                <button
                                                    onClick={() =>
                                                        setSelectedDetail({
                                                            type: 'submission',
                                                            data: sub,
                                                        })
                                                    }
                                                    className="mt-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                                                >
                                                    View
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                Tidak ada submissions untuk course ini
                            </p>
                        </div>
                    )}
                </PremiumCard>

                {/* All Quiz Results */}
                <PremiumCard title="All Quiz Results">
                    {!selectedCourse ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <p className="max-w-xs text-sm leading-relaxed font-medium text-slate-400 dark:text-slate-500">
                                Select a course from Course History to view
                                related quiz results and submissions.
                            </p>
                        </div>
                    ) : filteredQuizzes.length > 0 ? (
                        <div
                            className="custom-scrollbar max-h-[300px] space-y-3 overflow-y-auto pr-2"
                            style={{ scrollbarWidth: 'thin' }}
                        >
                            {filteredQuizzes.map((quiz: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/10 dark:hover:bg-slate-800/20"
                                >
                                    <div className="min-w-0">
                                        <h4 className="truncate text-xs font-semibold text-slate-800 dark:text-white">
                                            Quiz: {quiz.path_name}
                                        </h4>
                                        <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                                            {new Date(
                                                quiz.completed_at,
                                            ).toLocaleDateString('en-US', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex flex-shrink-0 flex-col items-end gap-1.5 text-right">
                                        <span
                                            className={`text-xs font-black ${quiz.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-650 dark:text-rose-455'}`}
                                        >
                                            Score: {quiz.score}/100 (+
                                            {quiz.score * 2} ERP)
                                        </span>
                                        <button
                                            onClick={() =>
                                                setSelectedDetail({
                                                    type: 'quiz',
                                                    data: quiz,
                                                })
                                            }
                                            className="dark:bg-slate-955 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                                        >
                                            Answers
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                Tidak ada quiz results untuk course ini
                            </p>
                        </div>
                    )}
                </PremiumCard>
            </div>

            {/* Character Details (Dipindah Paling Bawah) */}
            <PremiumCard title="Character Details">
                <div className="relative flex flex-col items-center gap-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:flex-row dark:border-slate-800 dark:bg-slate-900/20">
                    <div className="z-10 flex-shrink-0">
                        {details.gamification.character_avatar ? (
                            <div className="flex h-16 w-auto items-center justify-center rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700/50 dark:bg-slate-900/40">
                                <img
                                    src={details.gamification.character_avatar}
                                    alt={details.gamification.character}
                                    className="h-full w-auto object-contain"
                                />
                            </div>
                        ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-900/80">
                                No Avatar
                            </div>
                        )}
                    </div>
                    <div className="z-10 text-center sm:text-left">
                        <p className="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                            Active Character
                        </p>
                        <p className="truncate text-lg font-black text-slate-800 dark:text-white">
                            {details.gamification.character ||
                                'No Active Character'}
                        </p>
                    </div>
                </div>
            </PremiumCard>
        </div>
    );

    const MentorDetails = () => (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    title="Total Mentored"
                    value={details.stats.total_students}
                    subtitle="Students guided"
                />
                <StatCard
                    title="Active Students"
                    value={details.stats.active_students}
                    subtitle="Currently active"
                />
                <StatCard
                    title="Graduated"
                    value={details.stats.graduated_students}
                    subtitle="Completed learning path"
                />
                <StatCard
                    title="Pending Submissions"
                    value={details.stats.pending_submissions_count}
                    subtitle="Awaiting evaluation"
                />
            </div>

            {/* Layout Grid */}
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                    {/* Pending Submission Queue */}
                    <PremiumCard
                        title="Submission Queue"
                        badgeText={`${details.stats.pending_submissions_count} Pending`}
                    >
                        {details.recent_pending_submissions?.length > 0 ? (
                            <div
                                className="custom-scrollbar max-h-[300px] space-y-3 overflow-y-auto pr-2"
                                style={{ scrollbarWidth: 'thin' }}
                            >
                                {details.recent_pending_submissions.map(
                                    (sub: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className="border-slate-150 dark:border-slate-855 rounded-lg border bg-slate-50/50 p-3.5 transition-colors hover:bg-slate-100 dark:bg-slate-900/10 dark:hover:bg-slate-800/20"
                                        >
                                            <div className="mb-2.5 flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <h4 className="text-slate-850 truncate text-xs font-semibold dark:text-white">
                                                        {sub.task_title}
                                                    </h4>
                                                    <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                                                        {sub.career_group}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        setSelectedDetail({
                                                            type: 'mentor_submission',
                                                            data: sub,
                                                        })
                                                    }
                                                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                                                >
                                                    Detail
                                                </button>
                                            </div>
                                            <div className="border-slate-150 mt-2.5 flex items-center justify-between border-t pt-2 text-[10px] dark:border-slate-800">
                                                <p className="font-medium text-slate-500 dark:text-slate-400">
                                                    Student: {sub.student_name}
                                                </p>
                                                <p className="text-slate-400 dark:text-slate-500">
                                                    {new Date(
                                                        sub.submitted_at,
                                                    ).toLocaleDateString(
                                                        'en-US',
                                                        {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        },
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                                No pending submissions.
                            </div>
                        )}
                    </PremiumCard>

                    {/* Active Students List */}
                    <PremiumCard title="Active Students Under Guidance">
                        {details.active_students_list?.length > 0 ? (
                            <div
                                className="custom-scrollbar grid max-h-[300px] grid-cols-1 gap-3 overflow-y-auto pr-2 sm:grid-cols-2"
                                style={{ scrollbarWidth: 'thin' }}
                            >
                                {details.active_students_list.map(
                                    (student: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className="border-slate-150 flex items-center gap-3 rounded-lg border bg-slate-50/50 p-3 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/10 dark:hover:bg-slate-800/20"
                                        >
                                            <img
                                                src={
                                                    student.avatar ||
                                                    `https://ui-avatars.com/api/?name=${student.name}&background=6366f1&color=fff`
                                                }
                                                alt={student.name}
                                                className="h-9 w-9 rounded-full border border-slate-200 bg-white object-cover dark:border-slate-700 dark:bg-slate-900"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-slate-855 truncate text-xs font-semibold dark:text-white">
                                                    {student.name}
                                                </p>
                                                <p className="truncate text-[10px] text-slate-400 dark:text-slate-500">
                                                    @{student.username}
                                                </p>
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                                No active students currently.
                            </div>
                        )}
                    </PremiumCard>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Assigned Career Groups */}
                    <PremiumCard title="Assigned Career Groups">
                        {details.career_groups?.length > 0 ? (
                            <div
                                className="custom-scrollbar grid max-h-[300px] grid-cols-1 gap-2.5 overflow-y-auto pr-2"
                                style={{ scrollbarWidth: 'thin' }}
                            >
                                {details.career_groups.map((group: any) => (
                                    <div
                                        key={group.id}
                                        className="border-slate-150 flex items-center gap-3 rounded-lg border bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/10"
                                    >
                                        <div className="h-2 w-2 rounded-full bg-slate-400 shadow-sm"></div>
                                        <span className="text-slate-850 text-xs font-semibold dark:text-white">
                                            {group.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                                No career groups assigned yet.
                            </div>
                        )}
                    </PremiumCard>

                    {/* Signature Management */}
                    <PremiumCard title="Digital Signature Preview">
                        <div className="border-slate-150 flex min-h-[180px] flex-col items-center justify-center rounded-xl border bg-slate-50/30 p-5 dark:border-slate-800 dark:bg-slate-900/10">
                            {details.signature_url ? (
                                <div className="text-center">
                                    <img
                                        src={details.signature_url}
                                        alt="Mentor Signature"
                                        className="border-slate-250 mx-auto mb-3.5 h-auto max-w-[240px] rounded-lg border bg-white object-contain p-3 dark:border-slate-700 dark:bg-white/5 dark:invert"
                                    />
                                    <p className="text-slate-450 dark:text-slate-450 text-[11px]">
                                        Signature is used for generating valid
                                        PDF certificates.
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <p className="mb-1.5 text-xs font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                        No Signature
                                    </p>
                                    <p className="dark:text-slate-405 text-xs font-medium text-slate-500">
                                        No digital signature uploaded yet.
                                    </p>
                                    <p className="mt-1.5 text-[10px] font-bold text-rose-500 dark:text-rose-400">
                                        Warning: Certificates signed by this
                                        mentor may fail to generate.
                                    </p>
                                </div>
                            )}
                        </div>
                    </PremiumCard>
                </div>
            </div>
        </div>
    );

    return (
        <AppLayout>
            <div className="relative min-h-screen overflow-hidden bg-transparent px-6 py-6 text-slate-900 transition-colors duration-200 sm:px-6 lg:px-10 dark:bg-transparent dark:text-white">
                {/* Subtle topglow */}
                <div className="pointer-events-none absolute top-0 left-1/2 z-0 h-[400px] w-full max-w-7xl -translate-x-1/2 bg-gradient-to-b from-indigo-500/5 to-transparent blur-3xl" />

                <div className="relative z-10 mx-auto max-w-7xl space-y-6 sm:space-y-8">
                    {/* BACK BUTTON */}
                    <div>
                        <Link
                            href="/admin/users"
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                            style={{ fontFamily: "'Outfit', sans-serif" }}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Users
                        </Link>
                    </div>

                    {/* USER PROFILE HEADER */}
                    <div className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 md:flex-row md:items-start dark:border-slate-800 dark:bg-gradient-to-b dark:from-[#0e0e1a] dark:to-[#090910] dark:shadow-none">
                        {/* Top accent line */}
                        <div className="absolute top-0 right-8 left-8 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-700" />

                        {/* Avatar (No shadows, no glows, no hover) */}
                        <div className="flex-shrink-0">
                            <img
                                src={
                                    user.avatar ||
                                    `https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff`
                                }
                                alt={user.name}
                                className="h-24 w-24 rounded-full border border-slate-200 bg-slate-100 object-cover sm:h-32 sm:w-32 dark:border-slate-800 dark:bg-slate-900"
                            />
                        </div>

                        {/* Content */}
                        <div className="relative z-10 flex-1 text-center md:text-left">
                            <div className="mb-2 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                                <div>
                                    <h1
                                        className="text-slate-805 text-2xl leading-none font-bold tracking-tight sm:text-3xl dark:text-white"
                                        style={{
                                            background:
                                                'linear-gradient(135deg, #2a1ce0 0%, #3B28F6 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text',
                                            fontFamily: 'Orbitron, sans-serif',
                                        }}
                                    >
                                        {user.name}
                                    </h1>
                                    <p
                                        className="mt-1.5 text-sm font-medium text-slate-400 dark:text-slate-500"
                                        style={{
                                            fontFamily: "'Outfit', sans-serif",
                                        }}
                                    >
                                        @{user.username}
                                    </p>
                                </div>
                                <div className="flex items-center justify-center gap-2.5 md:justify-start">
                                    <span
                                        className={`inline-flex self-center rounded-full border px-4 py-1.5 text-xs font-black tracking-wider uppercase ${
                                            user.role === 'admin'
                                                ? 'dark:text-rose-455 border-rose-500/20 bg-rose-500/10 text-rose-600'
                                                : user.role === 'mentor'
                                                  ? 'dark:text-blue-455 border-blue-500/20 bg-blue-500/10 text-blue-600'
                                                  : 'text-emerald-650 dark:text-emerald-455 border-emerald-500/20 bg-emerald-500/10'
                                        }`}
                                        style={{
                                            fontFamily: "'Outfit', sans-serif",
                                        }}
                                    >
                                        {user.role}
                                    </span>
                                    {user.role === 'mentor' && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowEditProfileModal(true)
                                            }
                                            className="text-indigo-650 cursor-pointer rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-bold transition-all hover:bg-indigo-500/20 hover:shadow-[0_0_12px_rgba(99,102,241,0.3)] dark:text-indigo-400"
                                            style={{
                                                fontFamily:
                                                    "'Outfit', sans-serif",
                                            }}
                                        >
                                            Edit Details
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div
                                className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 md:justify-start dark:text-slate-400"
                                style={{ fontFamily: "'Outfit', sans-serif" }}
                            >
                                <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-800/40">
                                    <span className="mr-1 text-[9px] font-semibold tracking-widest text-slate-400 uppercase">
                                        Email
                                    </span>
                                    <span className="font-semibold">
                                        {user.email}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-800/40">
                                    <span className="mr-1 text-[9px] font-semibold tracking-widest text-slate-400 uppercase">
                                        Joined
                                    </span>
                                    <span className="font-semibold">
                                        {new Date(
                                            user.created_at,
                                        ).toLocaleDateString('en-US', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DYNAMIC CONTENT BASED ON ROLE */}
                    {user.role === 'student' && <StudentDetails />}
                    {user.role === 'mentor' && <MentorDetails />}
                    {user.role === 'admin' && (
                        <div
                            className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-gradient-to-b dark:from-[#0e0e1a] dark:to-[#090910] dark:shadow-none"
                            style={{ fontFamily: "'Outfit', sans-serif" }}
                        >
                            <div className="absolute top-0 right-8 left-8 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-700" />

                            <div className="relative z-10 py-6">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 dark:text-rose-400">
                                    Admin
                                </div>
                                <h3
                                    className="text-slate-850 text-lg font-bold dark:text-white"
                                    style={{
                                        fontFamily: "'Orbitron', sans-serif",
                                    }}
                                >
                                    Administrator Account
                                </h3>
                                <p className="text-slate-550 mx-auto mt-2 max-w-md text-sm dark:text-slate-400">
                                    This account has full system-wide
                                    permissions and access controls. No learning
                                    path or guidance details to show.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedDetail && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
                    onClick={() => setSelectedDetail(null)}
                >
                    <div
                        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0e0e1a]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-6 dark:border-slate-800/80 dark:bg-slate-900/50">
                            <div>
                                <h2
                                    className="text-slate-850 text-lg font-bold capitalize dark:text-white"
                                    style={{
                                        fontFamily: "'Orbitron', sans-serif",
                                    }}
                                >
                                    {selectedDetail.type.replace('_', ' ')}{' '}
                                    Details
                                </h2>
                                <p
                                    className="text-slate-450 mt-1 text-xs dark:text-slate-400"
                                    style={{
                                        fontFamily: "'Outfit', sans-serif",
                                    }}
                                >
                                    Deep dive into the records.
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedDetail(null)}
                                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 dark:bg-slate-950/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                                Close
                            </button>
                        </div>

                        <div
                            className="custom-scrollbar overflow-y-auto bg-white p-6 text-slate-800 dark:bg-[#090910] dark:text-slate-200"
                            style={{ scrollbarWidth: 'thin' }}
                        >
                            {/* Quiz Detail */}
                            {selectedDetail.type === 'quiz' && (
                                <div
                                    className="space-y-6"
                                    style={{
                                        fontFamily: "'Outfit', sans-serif",
                                    }}
                                >
                                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                                        <div>
                                            <h3 className="text-slate-805 text-sm font-bold dark:text-white">
                                                {selectedDetail.data.path_name}
                                            </h3>
                                            <p className="text-slate-455 mt-1 text-xs dark:text-slate-400">
                                                Completed at{' '}
                                                {new Date(
                                                    selectedDetail.data
                                                        .completed_at,
                                                ).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-slate-850 text-2xl font-black dark:text-white">
                                                {selectedDetail.data.score}{' '}
                                                <span className="text-xs font-normal text-slate-500">
                                                    / 100 (+
                                                    {selectedDetail.data.score *
                                                        2}{' '}
                                                    ERP)
                                                </span>
                                            </p>
                                            <p
                                                className={`mt-1 text-[10px] font-bold tracking-widest uppercase ${selectedDetail.data.passed ? 'text-emerald-500 dark:text-emerald-400' : 'dark:text-rose-455 text-rose-500'}`}
                                            >
                                                {selectedDetail.data.passed
                                                    ? 'PASSED'
                                                    : 'FAILED'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="border-slate-150 mb-2 border-b pb-2 text-xs font-bold tracking-wider text-slate-400 uppercase dark:border-slate-800 dark:text-slate-500">
                                            Questions & Answers
                                        </h4>
                                        {selectedDetail.data.questions?.map(
                                            (q: any, qIdx: number) => {
                                                let chosenAnswerId = null;
                                                if (
                                                    Array.isArray(
                                                        selectedDetail.data
                                                            .answers,
                                                    )
                                                ) {
                                                    const found =
                                                        selectedDetail.data.answers.find(
                                                            (a: any) =>
                                                                a.question_id ===
                                                                q._id,
                                                        );
                                                    chosenAnswerId = found
                                                        ? found.answer_id
                                                        : null;
                                                } else if (
                                                    typeof selectedDetail.data
                                                        .answers === 'object'
                                                ) {
                                                    chosenAnswerId =
                                                        selectedDetail.data
                                                            .answers[q._id];
                                                }

                                                return (
                                                    <div
                                                        key={q._id}
                                                        className="border-slate-150 rounded-xl border bg-slate-50/50 p-4 dark:border-slate-700/50 dark:bg-slate-800/20"
                                                    >
                                                        <p className="text-slate-805 mb-3 text-xs font-semibold dark:text-white">
                                                            <span className="text-slate-455 dark:text-slate-555 mr-2">
                                                                {qIdx + 1}.
                                                            </span>{' '}
                                                            {q.question_text}
                                                        </p>
                                                        <div className="space-y-2 pl-4">
                                                            {q.answers?.map(
                                                                (ans: any) => {
                                                                    const isChosen =
                                                                        ans._id ===
                                                                        chosenAnswerId;
                                                                    const isCorrect =
                                                                        ans.is_correct;

                                                                    let highlightClass =
                                                                        'text-slate-500 dark:text-slate-455 bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-805';
                                                                    let prefixText =
                                                                        '';

                                                                    if (
                                                                        isChosen &&
                                                                        isCorrect
                                                                    ) {
                                                                        highlightClass =
                                                                            'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border-emerald-500/20';
                                                                        prefixText =
                                                                            '[Correct] ';
                                                                    } else if (
                                                                        isChosen &&
                                                                        !isCorrect
                                                                    ) {
                                                                        highlightClass =
                                                                            'text-rose-600 dark:text-rose-455 font-bold bg-rose-500/10 border-rose-500/20';
                                                                        prefixText =
                                                                            '[Wrong] ';
                                                                    } else if (
                                                                        !isChosen &&
                                                                        isCorrect
                                                                    ) {
                                                                        highlightClass =
                                                                            'text-emerald-650 dark:text-emerald-400 border-emerald-500/20 border-dashed';
                                                                        prefixText =
                                                                            '[Correct Key] ';
                                                                    }

                                                                    return (
                                                                        <div
                                                                            key={
                                                                                ans._id
                                                                            }
                                                                            className={`flex items-start gap-2 rounded-lg border p-2 text-xs transition ${highlightClass}`}
                                                                        >
                                                                            <span className="text-xs">
                                                                                {
                                                                                    prefixText
                                                                                }
                                                                                {
                                                                                    ans.answer_text
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                },
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            },
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Submission Detail */}
                            {(selectedDetail.type === 'submission' ||
                                selectedDetail.type ===
                                    'mentor_submission') && (
                                <div
                                    className="space-y-5"
                                    style={{
                                        fontFamily: "'Outfit', sans-serif",
                                    }}
                                >
                                    {/* ── Hero Header ───────────────────────────── */}
                                    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                                        <div className="relative px-5 pt-5 pb-4">
                                            {/* type badge + status */}
                                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-[#3B28F6] uppercase dark:bg-slate-800 dark:text-indigo-400">
                                                    {selectedDetail.type ===
                                                    'mentor_submission'
                                                        ? 'Mentor Task'
                                                        : 'Submission'}
                                                </span>
                                                <span
                                                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                                                        selectedDetail.data
                                                            .status ===
                                                            'graded' ||
                                                        selectedDetail.data
                                                            .status ===
                                                            'approved'
                                                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                            : selectedDetail
                                                                    .data
                                                                    .status ===
                                                                'rejected'
                                                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                                                              : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                                                    }`}
                                                >
                                                    {selectedDetail.data
                                                        .status ?? 'Pending'}
                                                </span>
                                            </div>

                                            {/* title */}
                                            <h3 className="text-base font-bold text-slate-800 dark:text-white">
                                                {selectedDetail.data.title ||
                                                    selectedDetail.data
                                                        .task_title ||
                                                    'Untitled Assignment'}
                                            </h3>

                                            {/* career group */}
                                            {selectedDetail.data
                                                .career_group && (
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    {
                                                        selectedDetail.data
                                                            .career_group
                                                    }
                                                </p>
                                            )}

                                            {/* meta: submitted by + date + grade */}
                                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-slate-200 pt-3 dark:border-slate-800">
                                                {selectedDetail.data
                                                    .student_name && (
                                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                                        <span>
                                                            Submitted by
                                                        </span>
                                                        <span className="font-semibold text-slate-700 dark:text-white">
                                                            {
                                                                selectedDetail
                                                                    .data
                                                                    .student_name
                                                            }
                                                        </span>
                                                    </div>
                                                )}
                                                {selectedDetail.data
                                                    .submitted_at && (
                                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                                        <span>
                                                            {new Date(
                                                                selectedDetail
                                                                    .data
                                                                    .submitted_at,
                                                            ).toLocaleString(
                                                                'en-US',
                                                                {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                },
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                                {selectedDetail.data.grade && (
                                                    <div className="ml-auto flex items-center gap-1.5">
                                                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                                            Score
                                                        </span>
                                                        <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-sm font-black text-[#3B28F6] dark:bg-slate-800 dark:text-indigo-300">
                                                            {
                                                                selectedDetail
                                                                    .data.grade
                                                            }
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Student Notes ──────────────────────────── */}
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                                        <div className="border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
                                            <h4 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                                Student Notes
                                            </h4>
                                        </div>
                                        <div className="px-4 py-3">
                                            {selectedDetail.data.notes ? (
                                                <p className="text-xs leading-relaxed whitespace-pre-wrap text-slate-600 dark:text-slate-300">
                                                    {selectedDetail.data.notes}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-slate-400 italic dark:text-slate-600">
                                                    No notes provided.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* ── Attachments ────────────────────────────── */}
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                                        <div className="border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
                                            <h4 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                                Attachments
                                            </h4>
                                        </div>
                                        <div className="space-y-2 px-4 py-3">
                                            {selectedDetail.data.link && (
                                                <a
                                                    href={
                                                        selectedDetail.data.link
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="group flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 transition-all hover:border-blue-400 hover:bg-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:hover:border-blue-400/40 dark:hover:bg-blue-500/20"
                                                >
                                                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-blue-500/20 text-sm dark:bg-blue-500/30">
                                                        🔗
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[10px] font-bold tracking-wider text-blue-500 uppercase dark:text-blue-400">
                                                            External Link
                                                        </p>
                                                        <p className="mt-0.5 truncate text-[11px] font-medium text-blue-700 dark:text-blue-300">
                                                            {
                                                                selectedDetail
                                                                    .data.link
                                                            }
                                                        </p>
                                                    </div>
                                                    <svg
                                                        className="h-3.5 w-3.5 flex-shrink-0 text-blue-400 opacity-60 transition group-hover:opacity-100"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth={2}
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                        />
                                                    </svg>
                                                </a>
                                            )}

                                            {selectedDetail.data.file_path && (
                                                <a
                                                    href={
                                                        selectedDetail.data.file_url ||
                                                        `/student-submissions/${selectedDetail.data.id}/file`
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 transition-all hover:border-slate-400 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                                            Uploaded File
                                                        </p>
                                                        <p className="mt-0.5 truncate text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                                            Download Submission File
                                                        </p>
                                                    </div>
                                                </a>
                                            )}

                                            {!selectedDetail.data.link &&
                                                !selectedDetail.data
                                                    .file_path && (
                                                    <p className="text-xs text-slate-400 italic dark:text-slate-600">
                                                        No attachments uploaded.
                                                    </p>
                                                )}
                                        </div>
                                    </div>

                                    {/* ── Mentor Evaluation ─────────────────────── */}
                                    {selectedDetail.type === 'submission' &&
                                        (selectedDetail.data.feedback ||
                                            selectedDetail.data.grade) && (
                                            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                                                <div className="absolute inset-x-0 top-0 h-0.5 bg-[#3B28F6]" />
                                                <div className="relative">
                                                    <div className="border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
                                                        <h4 className="text-[10px] font-bold tracking-widest text-[#3B28F6] uppercase dark:text-indigo-400">
                                                            Mentor Evaluation
                                                        </h4>
                                                    </div>
                                                    <div className="space-y-3 px-4 py-3">
                                                        {selectedDetail.data
                                                            .grade && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                    Score
                                                                    Awarded
                                                                </span>
                                                                <span className="rounded-lg bg-slate-100 px-3 py-1 text-lg font-black text-[#3B28F6] dark:bg-slate-800 dark:text-indigo-300">
                                                                    {
                                                                        selectedDetail
                                                                            .data
                                                                            .grade
                                                                    }
                                                                </span>
                                                            </div>
                                                        )}
                                                        {selectedDetail.data
                                                            .feedback && (
                                                            <div>
                                                                <p className="mb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                                                    Feedback
                                                                </p>
                                                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-relaxed whitespace-pre-wrap text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                                                                    {
                                                                        selectedDetail
                                                                            .data
                                                                            .feedback
                                                                    }
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Mentor Profile Edit Modal */}
            {showEditProfileModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
                    onClick={() => setShowEditProfileModal(false)}
                >
                    <form
                        onSubmit={submitProfileUpdate}
                        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0e0e1a]"
                        onClick={(e) => e.stopPropagation()}
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-6 dark:border-slate-800/80 dark:bg-slate-900/50">
                            <div>
                                <h2
                                    className="text-slate-855 text-lg font-bold dark:text-white"
                                    style={{
                                        fontFamily: "'Orbitron', sans-serif",
                                    }}
                                >
                                    Edit Mentor Profile Details
                                </h2>
                                <p className="text-slate-550 dark:text-slate-450 mt-1 text-xs">
                                    Update professional bio, LinkedIn link, work
                                    experience, and educational background.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowEditProfileModal(false)}
                                className="bg-slate-105 dark:bg-slate-955/50 text-slate-550 dark:text-slate-455 dark:hover:bg-slate-805 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors hover:bg-slate-200 hover:text-slate-800 dark:hover:text-white"
                            >
                                Close
                            </button>
                        </div>

                        <div
                            className="custom-scrollbar space-y-6 overflow-y-auto bg-white p-6 dark:bg-[#090910]"
                            style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor:
                                    'rgba(99,102,241,0.3) transparent',
                            }}
                        >
                            {/* Basic profile info */}
                            <ProfileFormBasic
                                data={data}
                                setData={setData}
                                errors={errors}
                            />

                            <div className="bg-slate-150 my-4 h-px dark:bg-slate-800" />

                            {/* Work Experience */}
                            <ProfileFormWorkExperience
                                workExperiences={data.work_experiences}
                                onChange={(val) =>
                                    setData('work_experiences', val)
                                }
                                errors={errors}
                            />

                            <div className="bg-slate-150 my-4 h-px dark:bg-slate-800" />

                            {/* Education */}
                            <ProfileFormEducation
                                educations={data.educations}
                                onChange={(val) => setData('educations', val)}
                                errors={errors}
                            />
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 p-5 dark:border-slate-800/80 dark:bg-slate-900/30">
                            <button
                                type="button"
                                onClick={() => setShowEditProfileModal(false)}
                                className="text-slate-605 dark:text-slate-350 hover:bg-slate-55 cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold transition-all active:scale-95 dark:bg-slate-950 dark:hover:bg-slate-900"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="hover:to-purple-550 flex cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-400 disabled:opacity-50"
                            >
                                {processing ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AppLayout>
    );
}
