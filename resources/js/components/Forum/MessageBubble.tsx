import React from 'react';
import {
    Pin,
    CornerUpLeft,
    Pencil,
    Trash2,
    User as UserIcon,
    MoreVertical,
} from 'lucide-react';
import { Message } from './types';

interface MessageBubbleProps {
    msg: Message;
    currentUserId: string;
    isMentorOrAdmin: boolean;
    isDark: boolean;
    isConsecutive: boolean;
    activeMenuMessageId: string | null;
    setActiveMenuMessageId: (id: string | null) => void;
    showReactionPickerId: string | null;
    setShowReactionPickerId: (id: string | null) => void;
    handleToggleReaction: (messageId: string, emoji: string) => void;
    handleReplyTo: (msg: Message) => void;
    handleStartEdit: (msg: Message) => void;
    handleTogglePin: (messageId: string) => void;
    handleDeleteMessage: (messageId: string) => void;
    handleShowProfile: (userId: string) => void;
    setPreviewImage: (preview: { url: string; msg: Message } | null) => void;
    scrollToMessage: (msgId: string) => void;
    quickReactions: string[];
    domRef?: React.Ref<HTMLDivElement>;
}

const getNameColor = (senderId: string) => {
    const colors = [
        '#FF453A', // Vibrant Red
        '#30D158', // Vibrant Green
        '#FF9F0A', // Vibrant Orange
        '#64D2FF', // Vibrant Sky Blue
        '#BF5AF2', // Vibrant Purple
        '#FFD60A', // Vibrant Yellow
        '#FF375F', // Vibrant Pink
        '#0A84FF', // Vibrant Blue
        '#00C7BE', // Vibrant Teal
        '#5E5CE6', // Vibrant Indigo
        '#E056FD', // Vibrant Magenta
        '#1DD1A1', // Vibrant Turquoise
        '#FECA57', // Vibrant Gold
        '#FF6B6B', // Pastel Red
        '#10AC84', // Dark Teal
        '#54A0FF', // Pastel Blue
    ];
    let hash = 0;
    for (let i = 0; i < senderId.length; i++) {
        hash = senderId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

const formatTime = (isoString: string) => {
    try {
        const date = new Date(isoString);
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    } catch {
        return '';
    }
};

export default function MessageBubble({
    msg,
    currentUserId,
    isMentorOrAdmin,
    isDark,
    isConsecutive,
    activeMenuMessageId,
    setActiveMenuMessageId,
    showReactionPickerId,
    setShowReactionPickerId,
    handleToggleReaction,
    handleReplyTo,
    handleStartEdit,
    handleTogglePin,
    handleDeleteMessage,
    handleShowProfile,
    setPreviewImage,
    scrollToMessage,
    quickReactions,
    domRef,
}: MessageBubbleProps) {
    const senderRole = msg.sender?.role || 'student';
    const senderId = msg.sender?.id || 'deleted';
    const isSelf = Boolean(senderId && senderId === currentUserId);
    const isSystem =
        senderRole === 'system' &&
        senderId === 'system' &&
        Boolean(msg.message && msg.message.length < 80);

    if (isSystem) {
        return (
            <div className="my-2 flex justify-center select-none">
                <span className="text-slate-650 max-w-[85%] rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-1 text-center font-['Oxanium'] text-[10px] leading-relaxed break-words whitespace-pre-wrap dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-500">
                    {msg.message}
                </span>
            </div>
        );
    }

    // Kelompokkan reaksi berdasarkan jenis emoji
    const groupReactions = (reactionsList: Message['reactions']) => {
        const groups: {
            [key: string]: {
                count: number;
                users: string[];
                hasReacted: boolean;
            };
        } = {};
        (reactionsList || []).forEach((r) => {
            if (!groups[r.emoji]) {
                groups[r.emoji] = { count: 0, users: [], hasReacted: false };
            }
            groups[r.emoji].count += 1;
            groups[r.emoji].users.push(r.user_name);
            if (r.user_id === currentUserId) {
                groups[r.emoji].hasReacted = true;
            }
        });
        return groups;
    };

    const reactionsGrouped = groupReactions(msg.reactions);

    return (
        <div
            ref={domRef}
            className={`group animate-fade-in-slide-up relative flex max-w-[86%] min-w-0 rounded-2xl transition-all duration-500 sm:max-w-[82%] md:max-w-[75%] lg:max-w-[70%] ${
                isMentorOrAdmin
                    ? 'gap-3.5 md:gap-4 lg:gap-4.5'
                    : 'gap-2 md:gap-3'
            } ${
                isSelf
                    ? 'ml-auto w-fit flex-row-reverse self-end'
                    : 'mr-auto w-fit self-start'
            } ${
                isConsecutive
                    ? 'mt-1'
                    : isMentorOrAdmin
                      ? 'mt-2.5 md:mt-2 lg:mt-2.5'
                      : 'mt-4'
            } ${Object.keys(reactionsGrouped).length > 0 ? 'mb-4.5' : ''}`}
        >
            {/* Avatar Pengirim */}
            {!isSelf &&
                (!isConsecutive ? (
                    <div
                        onClick={() => handleShowProfile(senderId)}
                        className={`shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-[#3B28F6] bg-slate-900 transition hover:scale-105 ${
                            isMentorOrAdmin
                                ? 'h-8 w-8 md:h-8 md:w-8 lg:h-9 lg:w-9'
                                : 'h-9 w-9 md:h-11 md:w-11'
                        }`}
                    >
                        {msg.sender?.avatar ? (
                            <img
                                src={msg.sender.avatar}
                                alt={msg.sender.name || 'User'}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[#1D215D]/60 text-slate-200">
                                <UserIcon className="h-4 w-4" />
                            </div>
                        )}
                    </div>
                ) : (
                    <div
                        className={`${isMentorOrAdmin ? 'w-8 md:w-8 lg:w-9' : 'w-9 md:w-11'} shrink-0`}
                    />
                ))}

            {/* Balon Chat Container */}
            <div className="relative flex min-w-0 flex-col">
                {/* ── MENU PILIHAN (Klik Bubble Chat) ── */}
                {activeMenuMessageId === msg.id && (
                    <div
                        onClick={(e) => e.stopPropagation()} // Mencegah tertutupnya menu
                        className={`message-action-menu animate-scale-up absolute bottom-full z-30 mb-2 flex scale-100 flex-col rounded-xl border border-slate-200 bg-white/95 p-2 text-slate-800 shadow-2xl backdrop-blur-md transition-all dark:border-[#3B28F6]/40 dark:bg-[#05060f]/95 dark:text-slate-200 ${
                            isSelf ? 'right-0' : 'left-0'
                        }`}
                        style={{
                            minWidth: '180px',
                        }}
                    >
                        {/* Quick Reaction Bar */}
                        <div className="border-slate-150 mb-2 flex items-center justify-between gap-1 border-b pb-2 dark:border-[#3B28F6]/20">
                            {quickReactions.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() =>
                                        handleToggleReaction(msg.id, emoji)
                                    }
                                    className="px-1.5 py-0.5 text-base transition hover:scale-125 active:scale-95"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>

                        {/* Actions List */}
                        <div className="flex flex-col font-['Oxanium'] text-xs">
                            <button
                                type="button"
                                onClick={() => handleReplyTo(msg)}
                                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#1D215D]/40 dark:hover:text-white"
                            >
                                <CornerUpLeft className="h-3.5 w-3.5" /> Balas
                            </button>

                            {isSelf && (
                                <button
                                    type="button"
                                    onClick={() => handleStartEdit(msg)}
                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#1D215D]/40 dark:hover:text-white"
                                >
                                    <Pencil className="h-3.5 w-3.5" /> Edit
                                </button>
                            )}

                            {isMentorOrAdmin && (
                                <button
                                    type="button"
                                    onClick={() => handleTogglePin(msg.id)}
                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#1D215D]/40 dark:hover:text-white"
                                >
                                    <Pin className="h-3.5 w-3.5" />
                                    {msg.is_pinned ? 'Lepas Semat' : 'Sematkan'}
                                </button>
                            )}

                            {(isSelf || isMentorOrAdmin) && (
                                <button
                                    type="button"
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                                >
                                    <Trash2 className="h-3.5 w-3.5" /> Hapus
                                </button>
                            )}
                        </div>
                    </div>
                )}
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuMessageId(
                            activeMenuMessageId === msg.id ? null : msg.id,
                        );
                    }}
                    style={
                        {
                            '--bubble-bg': isMentorOrAdmin
                                ? isDark
                                    ? isSelf
                                        ? '#232d3f'
                                        : '#1e293b'
                                    : isSelf
                                      ? '#e0e7ff'
                                      : '#ffffff'
                                : isDark
                                  ? '#0b0f19'
                                  : isSelf
                                    ? '#fefce8'
                                    : '#eef2ff',
                        } as React.CSSProperties
                    }
                    className={`chat-bubble-body relative flex min-w-0 cursor-pointer flex-col transition duration-200 select-none active:scale-[0.99] ${
                        isMentorOrAdmin
                            ? 'px-3 pt-1.5 pb-2.5'
                            : 'px-3 pt-2 pb-2.5'
                    } ${
                        isMentorOrAdmin
                            ? isSelf
                                ? `rounded-[8px] border border-[#c7d2fe] bg-[#e0e7ff] text-[#1e1b4b] shadow-[0_1px_1.5px_rgba(0,0,0,0.1)] dark:border-[#3b4b61] dark:bg-[#232d3f] dark:text-[#f1f5f9] ${isConsecutive ? '' : 'rounded-tr-none'}`
                                : `rounded-[8px] border border-slate-200 bg-[#ffffff] text-slate-800 shadow-[0_1px_1.5px_rgba(0,0,0,0.1)] dark:border-[#334155] dark:bg-[#1e293b] dark:text-[#f1f5f9] ${isConsecutive ? '' : 'rounded-tl-none'}`
                            : isSelf
                              ? `border-amber-355 rounded-[3px] border bg-[#fefce8] text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:border-[#facc15] dark:bg-[#facc15]/5 dark:text-slate-100 dark:shadow-[0_0_8px_rgba(250,204,21,0.15)] ${isConsecutive ? '' : 'rounded-tr-none'}`
                              : `rounded-[3px] border border-indigo-200 bg-[#eef2ff] text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:border-[#3B28F6] dark:bg-[#3B28F6]/5 dark:text-slate-100 dark:shadow-[0_0_8px_rgba(59,40,246,0.15)] ${isConsecutive ? '' : 'rounded-tl-none'}`
                    } ${msg.is_pinned ? (isMentorOrAdmin ? 'ring-1 ring-slate-400 dark:ring-slate-500' : 'ring-1 ring-amber-400 dark:ring-[#facc15]/50') : ''} ${
                        Object.keys(reactionsGrouped).length > 0 ? 'pb-5.5' : ''
                    }`}
                >
                    {/* Top Right Badges & Action Trigger Container */}
                    <div className="absolute top-1.5 right-1 z-10 flex items-center gap-1 select-none">
                        {msg.is_pinned && (
                            <Pin className="pointer-events-none h-3 w-3 rotate-45 text-[#facc15] dark:text-[#facc15]" />
                        )}
                        {!isSelf &&
                            !isConsecutive &&
                            msg.sender.role === 'admin' && (
                                <span className="pointer-events-none rounded-xs border border-rose-500/30 bg-rose-500/20 px-1 py-[1px] text-[8px] leading-none font-bold tracking-wider text-rose-500 uppercase dark:text-rose-400">
                                    Admin
                                </span>
                            )}
                        {!isSelf &&
                            !isConsecutive &&
                            msg.sender.role === 'mentor' && (
                                <span className="pointer-events-none rounded-xs border border-emerald-500/30 bg-emerald-500/20 px-1 py-[1px] text-[8px] leading-none font-bold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                                    Mentor
                                </span>
                            )}
                        <button
                            type="button"
                            aria-label="Opsi pesan"
                            title="Opsi pesan"
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuMessageId(
                                    activeMenuMessageId === msg.id
                                        ? null
                                        : msg.id,
                                );
                            }}
                            className={`flex h-4 w-4 cursor-pointer items-center justify-center rounded-full transition-colors ${
                                activeMenuMessageId === msg.id
                                    ? 'bg-slate-900/10 text-slate-800 dark:bg-white/15 dark:text-white'
                                    : 'text-slate-400 hover:bg-slate-900/5 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200'
                            }`}
                        >
                            <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    {/* Arrow Ekor Balon Chat */}
                    {!isConsecutive &&
                        (isMentorOrAdmin ? (
                            isSelf ? (
                                <div className="wa-bubble-arrow wa-bubble-arrow-right" />
                            ) : (
                                <div className="wa-bubble-arrow wa-bubble-arrow-left" />
                            )
                        ) : isSelf ? (
                            <div
                                className="pointer-events-none absolute top-[12px] right-[-5px] z-10 h-[10px] w-[10px] select-none"
                                style={{
                                    transform: 'rotate(-45deg)',
                                    borderWidth: '0 1px 1px 0',
                                    borderStyle: 'solid',
                                    borderColor: isDark ? '#facc15' : '#fcd34d',
                                    borderRadius: '0 0 1px 0',
                                    background:
                                        'linear-gradient(-45deg, var(--bubble-bg) 51%, transparent 0)',
                                }}
                            />
                        ) : (
                            <div
                                className="pointer-events-none absolute top-[12px] left-[-6px] z-10 h-[10px] w-[10px] select-none"
                                style={{
                                    transform: 'rotate(-45deg)',
                                    borderWidth: '1px 0 0 1px',
                                    borderStyle: 'solid',
                                    borderColor: isDark ? '#3B28F6' : '#c7d2fe',
                                    borderRadius: '2px 0 0 0',
                                    background:
                                        'linear-gradient(-45deg, transparent 48%, var(--bubble-bg) 0)',
                                }}
                            />
                        ))}

                    {/* Nama & Peran Pengirim */}
                    {!isSelf && !isConsecutive && (
                        <div
                            className={`mb-1 flex items-center ${
                                msg.sender.role === 'admin' ||
                                msg.sender.role === 'mentor'
                                    ? msg.is_pinned
                                        ? 'pr-20'
                                        : 'pr-16'
                                    : msg.is_pinned
                                      ? 'pr-9'
                                      : 'pr-5'
                            }`}
                        >
                            <span
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleShowProfile(senderId);
                                }}
                                className="cursor-pointer font-['Oxanium'] text-xs font-bold hover:underline"
                                style={{
                                    color: getNameColor(senderId),
                                }}
                            >
                                {msg.sender?.name || 'Pengguna Dihapus'}
                            </span>
                        </div>
                    )}

                    {/* Render Kutipan Pesan (Jika Balasan) */}
                    {msg.parent &&
                        (() => {
                            const parentSenderId = msg.parent!.sender_id;
                            const nameColor = parentSenderId
                                ? getNameColor(parentSenderId)
                                : '#3B28F6';
                            const isFullBorder = isSelf;
                            const needsTopRightSpace = isSelf || isConsecutive;
                            return (
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation(); // Mencegah menu terbuka jika mengklik kutipan
                                        scrollToMessage(msg.parent!.id);
                                    }}
                                    className={`mb-2.5 max-w-full cursor-pointer bg-slate-100/90 text-left transition hover:bg-slate-200/90 dark:bg-slate-900 dark:hover:bg-slate-950 ${
                                        needsTopRightSpace
                                            ? msg.is_pinned
                                                ? 'mr-8'
                                                : 'mr-4'
                                            : 'w-full'
                                    } ${
                                        isFullBorder
                                            ? 'rounded border border-indigo-200 px-3 py-1.5 dark:border-[#3B28F6]'
                                            : 'rounded-xs border border-indigo-200 py-1 pr-2 pl-3 dark:border-[#3B28F6]'
                                    }`}
                                >
                                    <p
                                        className="font-['Oxanium'] text-[11px] font-extrabold tracking-wide"
                                        style={{ color: nameColor }}
                                    >
                                        {msg.parent.sender_name}
                                    </p>
                                    <p className="mt-0.5 line-clamp-2 font-['Oxanium'] text-[11px] break-words text-slate-500 dark:text-slate-400">
                                        {msg.parent.message}
                                    </p>
                                </div>
                            );
                        })()}

                    {/* Gambar Lampiran */}
                    {msg.attachments && msg.attachments.length > 0 && (
                        <div
                            className={`mb-2 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-black/5 dark:border-[#3B28F6]/20 dark:bg-black/40 ${
                                (isSelf || isConsecutive) && !msg.parent
                                    ? msg.is_pinned
                                        ? 'mr-8'
                                        : 'mr-4'
                                    : ''
                            }`}
                        >
                            {msg.attachments.map((url, i) => (
                                <img
                                    key={i}
                                    src={url}
                                    alt="Lampiran"
                                    className="max-h-[220px] w-full cursor-pointer object-cover transition duration-200 hover:scale-[1.01]"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Mencegah menu terbuka jika mengklik lampiran
                                        setPreviewImage({ url, msg });
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Teks Pesan */}
                    {msg.message && (
                        <p
                            className={`w-full font-['Oxanium'] text-xs leading-relaxed break-words whitespace-pre-wrap text-slate-800 select-text dark:text-slate-100 sm:text-sm ${
                                isMentorOrAdmin
                                    ? 'md:text-[13px] lg:text-[13px] xl:text-[13px]'
                                    : 'md:text-sm'
                            } ${
                                (isSelf || isConsecutive) &&
                                !msg.parent &&
                                (!msg.attachments ||
                                    msg.attachments.length === 0)
                                    ? msg.is_pinned
                                        ? 'pr-8'
                                        : 'pr-4'
                                    : ''
                            }`}
                        >
                            {msg.message}
                            <span
                                className="inline-block h-3.5 w-[46px] select-none"
                                aria-hidden="true"
                            />
                        </p>
                    )}

                    {/* Waktu Kirim */}
                    <span className="absolute right-2.5 bottom-1 text-[9.5px] text-slate-500 uppercase select-none dark:text-slate-400 font-sans">
                        {formatTime(msg.created_at)}
                    </span>

                    {/* Badges Reaksi Melayang di Pinggir Balon */}
                    {Object.keys(reactionsGrouped).length > 0 && (
                        <div
                            className={`absolute -bottom-2.5 z-10 flex flex-wrap gap-1 ${
                                isSelf ? 'right-2' : 'left-2'
                            }`}
                        >
                            {Object.entries(reactionsGrouped).map(
                                ([emoji, data]) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleReaction(msg.id, emoji);
                                        }}
                                        title={data.users.join(', ')}
                                        className={`flex items-center gap-0.5 rounded-full px-1.5 py-[3px] text-[11px] leading-none shadow-sm transition-transform active:scale-90 dark:shadow-md ${
                                            data.hasReacted
                                                ? 'border border-indigo-300 bg-indigo-50 dark:border-slate-800 dark:bg-[#1f2c34]'
                                                : 'dark:text-slate-350 border border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200 dark:border-transparent dark:bg-slate-800 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        <span className="text-[13px]">
                                            {emoji}
                                        </span>
                                        {data.count > 1 && (
                                            <span
                                                className={`font-semibold ${
                                                    data.hasReacted
                                                        ? 'text-indigo-600 dark:text-indigo-400'
                                                        : 'text-slate-500 dark:text-slate-300'
                                                }`}
                                            >
                                                {data.count}
                                            </span>
                                        )}
                                    </button>
                                ),
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
