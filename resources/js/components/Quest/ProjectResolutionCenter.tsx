import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import {
    ShieldAlert,
    Clock,
    UserX,
    FileText,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    HelpCircle,
    Scale,
    Calendar,
    ChevronDown,
    ChevronUp,
    ExternalLink,
} from 'lucide-react';
import { Quest, ResolutionRequest } from '@/types/quest';

interface Props {
    quest: Quest;
    isCreator: boolean;
    isWorker: boolean;
    onOpenMediation?: () => void;
}

export default function ProjectResolutionCenter({
    quest,
    isCreator,
    isWorker,
    onOpenMediation,
}: Props) {
    const [showExtensionModal, setShowExtensionModal] = useState(false);
    const [showCancellationModal, setShowCancellationModal] = useState(false);
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Form: Request Extension
    const extensionForm = useForm({
        proposed_deadline: '',
        reason: '',
    });

    // Form: Respond Extension
    const respondExtensionForm = useForm({
        request_id: '',
        accept: true,
        response_note: '',
    });

    // Form: Request Mutual Cancellation
    const cancellationForm = useForm({
        reason: '',
        dp_handling: 'refund_creator',
        split_percentage: 50,
    });

    // Form: Respond Cancellation
    const respondCancellationForm = useForm({
        request_id: '',
        accept: true,
        response_note: '',
    });

    // Form: File Formal Dispute
    const disputeForm = useForm<{
        category: string;
        reason: string;
        binding_agreement_accepted: boolean;
        evidence_files: File[];
    }>({
        category: 'scope_dispute',
        reason: '',
        binding_agreement_accepted: false,
        evidence_files: [],
    });

    // Form: Respond to Dispute
    const disputeResponseForm = useForm<{
        response_note: string;
        evidence_files: File[];
    }>({
        response_note: '',
        evidence_files: [],
    });

    if (!(isCreator || isWorker)) return null;

    const dispute = quest.dispute;
    const isDisputed = quest.status === 'disputed';
    const isDisputeResolved = Boolean(dispute?.ruling);

    const pendingRequests = (quest.resolution_requests || []).filter(
        (r) => r.status === 'pending',
    );
    const pendingExtension = pendingRequests.find(
        (r) => r.type === 'deadline_extension',
    );
    const pendingCancellation = pendingRequests.find(
        (r) => r.type === 'mutual_cancellation',
    );

    const isFiler = dispute?.filer_id === (isCreator ? quest.creator_id : quest.worker_id);
    const canRespondDispute = isDisputed && !isFiler && !dispute?.response;

    // Handlers
    const handleExtensionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        extensionForm.post(`/quests/${quest.slug}/request-extension`, {
            onSuccess: () => {
                setShowExtensionModal(false);
                extensionForm.reset();
            },
        });
    };

    const handleRespondExtension = (requestId: string, accept: boolean) => {
        respondExtensionForm.transform(() => ({
            request_id: requestId,
            accept: accept,
            response_note: respondExtensionForm.data.response_note,
        })).post(`/quests/${quest.slug}/respond-extension`, {
            onSuccess: () => respondExtensionForm.reset(),
        });
    };

    const handleCancellationSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        cancellationForm.post(`/quests/${quest.slug}/request-cancellation`, {
            onSuccess: () => {
                setShowCancellationModal(false);
                cancellationForm.reset();
            },
        });
    };

    const handleRespondCancellation = (requestId: string, accept: boolean) => {
        respondCancellationForm.transform(() => ({
            request_id: requestId,
            accept: accept,
            response_note: respondCancellationForm.data.response_note,
        })).post(`/quests/${quest.slug}/respond-cancellation`, {
            onSuccess: () => respondCancellationForm.reset(),
        });
    };

    const handleDisputeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!disputeForm.data.binding_agreement_accepted) {
            alert('Anda wajib menyetujui klausul arbitrase mengikat.');
            return;
        }
        disputeForm.post(`/quests/${quest.slug}/dispute`, {
            onSuccess: () => {
                setShowDisputeModal(false);
                disputeForm.reset();
            },
        });
    };

    const handleDisputeResponseSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        disputeResponseForm.post(`/quests/${quest.slug}/respond-dispute`, {
            onSuccess: () => {
                setShowResponseModal(false);
                disputeResponseForm.reset();
            },
        });
    };

    return (
        <div className="space-y-4 font-['Oxanium']">
            {/* 1. DISPUTE ACTIVE DELEGATION ALERT */}
            {isDisputed && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border-2 border-amber-400/80 bg-amber-50/90 p-4 shadow-sm dark:border-amber-500/40 dark:bg-amber-950/30">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700/50 dark:bg-amber-950/80 dark:text-amber-300">
                            <Scale className="h-5 w-5 animate-pulse" />
                        </div>
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <h4 className="font-['Orbitron'] text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                                    Proyek Sedang Dalam Arbitrase Sengketa
                                </h4>
                                <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-900 dark:bg-amber-900/80 dark:text-amber-200">
                                    Mode Read-Only
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                                Seluruh aksi pengerjaan dan pembayaran P2P dibekukan sementara. Akses berkas bukti digital, klarifikasi tanggapan, dan obrolan mediasi 3 pihak telah dipindahkan ke <strong>Ruang Mediasi Privat</strong>.
                            </p>
                        </div>
                    </div>

                    {onOpenMediation && (
                        <button
                            type="button"
                            onClick={onOpenMediation}
                            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-amber-700"
                        >
                            <span>Buka Ruang Mediasi</span>
                            <ExternalLink size={12} />
                        </button>
                    )}
                </div>
            )}

            {/* 2. DISPUTE RESOLVED DELEGATION ALERT */}
            {isDisputeResolved && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border-2 border-emerald-400 bg-emerald-50/90 p-4 shadow-sm dark:border-emerald-700/60 dark:bg-emerald-950/30">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <h4 className="font-['Orbitron'] text-xs font-bold uppercase tracking-wider text-emerald-950 dark:text-emerald-200">
                                    Putusan Arbitrase Telah Diterbitkan
                                </h4>
                                {dispute?.memo_number && (
                                    <span className="rounded-md border border-emerald-300 bg-emerald-100/90 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/80 dark:text-emerald-200">
                                        {dispute.memo_number}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                                {dispute?.verdict_label || 'Sengketa telah diputus oleh Administrator.'} Berita acara lengkap dan petunjuk transaksi P2P tersedia di Ruang Mediasi Privat.
                            </p>
                        </div>
                    </div>

                    {onOpenMediation && (
                        <button
                            type="button"
                            onClick={onOpenMediation}
                            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-700"
                        >
                            <span>Lihat Berita Acara</span>
                            <ExternalLink size={12} />
                        </button>
                    )}
                </div>
            )}

            {/* 3. PENDING BILATERAL REQUESTS NOTIFICATION CARDS */}
            {pendingExtension && (
                <div className="flex items-start justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs dark:border-blue-900/40 dark:bg-blue-950/20">
                    <div className="flex items-start gap-2.5">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                        <div>
                            <span className="block font-bold text-blue-900 dark:text-blue-200">
                                Permohonan Perpanjangan Tenggat Waktu
                            </span>
                            <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                                Pekerja ({pendingExtension.requester_name}) mengusulkan perpanjangan waktu hingga{' '}
                                <strong>
                                    {new Date(pendingExtension.proposed_deadline || '').toLocaleDateString('id-ID', {
                                        dateStyle: 'medium',
                                    })}
                                </strong>
                                . Alasan: "{pendingExtension.reason}"
                            </p>
                        </div>
                    </div>

                    {isCreator ? (
                        <div className="flex shrink-0 gap-1.5">
                            <button
                                type="button"
                                onClick={() => handleRespondExtension(pendingExtension.id, true)}
                                className="cursor-pointer rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
                            >
                                Setujui
                            </button>
                            <button
                                type="button"
                                onClick={() => handleRespondExtension(pendingExtension.id, false)}
                                className="cursor-pointer rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300"
                            >
                                Tolak
                            </button>
                        </div>
                    ) : (
                        <span className="shrink-0 rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                            Menunggu Persetujuan Klien
                        </span>
                    )}
                </div>
            )}

            {pendingCancellation && (
                <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50/70 p-4 text-xs dark:border-red-900/40 dark:bg-red-950/20">
                    <div className="flex items-start gap-2.5">
                        <UserX className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                        <div>
                            <span className="block font-bold text-red-900 dark:text-red-200">
                                Permohonan Pembatalan Kesepakatan Damai
                            </span>
                            <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                                Diajukan oleh {pendingCancellation.requester_name}. Alasan: "{pendingCancellation.reason}". Usulan DP: {pendingCancellation.dp_handling === 'refund_creator' ? 'Dikembalikan penuh ke klien' : pendingCancellation.dp_handling === 'keep_worker' ? 'Diikhlaskan untuk pekerja' : `Bagi hasil (${pendingCancellation.split_percentage}%)`}.
                            </p>
                        </div>
                    </div>

                    {(isCreator && pendingCancellation.requester_id !== quest.creator_id) ||
                    (isWorker && pendingCancellation.requester_id !== quest.worker_id) ? (
                        <div className="flex shrink-0 gap-1.5">
                            <button
                                type="button"
                                onClick={() => handleRespondCancellation(pendingCancellation.id, true)}
                                className="cursor-pointer rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-700"
                            >
                                Setujui Batal
                            </button>
                            <button
                                type="button"
                                onClick={() => handleRespondCancellation(pendingCancellation.id, false)}
                                className="cursor-pointer rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300"
                            >
                                Tolak
                            </button>
                        </div>
                    ) : (
                        <span className="shrink-0 rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800 dark:bg-red-900/50 dark:text-red-300">
                            Menunggu Persetujuan Pihak Lawan
                        </span>
                    )}
                </div>
            )}

            {/* 4. COMPACT RESOLUTION TRIGGER BAR (NON-INTRUSIVE) */}
            {!isDisputed && !isDisputeResolved && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/80 transition-all dark:border-slate-800 dark:bg-slate-900/60">
                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex w-full cursor-pointer items-center justify-between p-3.5 text-left text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                        <div className="flex items-center gap-2">
                            <HelpCircle className="h-4 w-4 text-slate-400" />
                            <span>Pusat Bantuan & Resolusi Kendala Proyek</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <span>{isExpanded ? 'Sembunyikan' : 'Buka Opsi Bantuan'}</span>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                    </button>

                    {isExpanded && (
                        <div className="space-y-3 border-t border-slate-100 p-4 pt-3 dark:border-slate-800/80">
                            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                                Apabila terjadi kendala terkait jadwal, materi acuan, spesifikasi, atau kelanjutan kerja sama, gunakan jalur penyelesaian terstruktur di bawah ini secara bijak:
                            </p>

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                {isWorker && (
                                    <button
                                        type="button"
                                        onClick={() => setShowExtensionModal(true)}
                                        className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                                    >
                                        <Clock size={13} className="text-blue-500" />
                                        Minta Perpanjangan Waktu
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setShowCancellationModal(true)}
                                    className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                                >
                                    <UserX size={13} className="text-amber-500" />
                                    Permohonan Batal Damai
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowDisputeModal(true)}
                                    className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-red-200/60 bg-red-50/50 px-3 py-2 text-[11px] font-bold text-red-700 transition-colors hover:bg-red-100/50 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400"
                                >
                                    <ShieldAlert size={13} className="text-red-500" />
                                    Eskalasi ke Admin (Dispute)
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL 1: REQUEST EXTENSION */}
            {showExtensionModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div
                        onClick={() => setShowExtensionModal(false)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
                    />
                    <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-[#0e0e1a]">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-850 dark:text-white">
                            <Clock className="text-blue-500" size={16} />
                            Permohonan Perpanjangan Tenggat Waktu
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Ajukan tanggal baru yang rasional beserta alasan kendala yang dihadapi. Permohonan ini akan diteruskan ke pembuat quest untuk ditinjau.
                        </p>

                        <form onSubmit={handleExtensionSubmit} className="mt-4 space-y-3 text-xs">
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-400">
                                    Tenggat Waktu Baru yang Diusulkan *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={extensionForm.data.proposed_deadline}
                                    onChange={(e) => extensionForm.setData('proposed_deadline', e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                                {extensionForm.errors.proposed_deadline && (
                                    <p className="mt-1 text-red-500">{extensionForm.errors.proposed_deadline}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-400">
                                    Alasan / Justifikasi Teknis *
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Jelaskan kendala teknis atau kebutuhan tambahan waktu..."
                                    value={extensionForm.data.reason}
                                    onChange={(e) => extensionForm.setData('reason', e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                                {extensionForm.errors.reason && (
                                    <p className="mt-1 text-red-500">{extensionForm.errors.reason}</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowExtensionModal(false)}
                                    className="rounded-lg bg-slate-100 px-3.5 py-2 font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={extensionForm.processing}
                                    className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {extensionForm.processing ? 'Mengirim...' : 'Kirim Permohonan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: REQUEST MUTUAL CANCELLATION */}
            {showCancellationModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div
                        onClick={() => setShowCancellationModal(false)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
                    />
                    <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-[#0e0e1a]">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-850 dark:text-white">
                            <UserX className="text-amber-500" size={16} />
                            Permohonan Pembatalan Kesepakatan Damai
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Mengakhiri kontrak secara baik-baik dengan persetujuan kedua belah pihak tanpa penalti sepihak.
                        </p>

                        <form onSubmit={handleCancellationSubmit} className="mt-4 space-y-3 text-xs">
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-400">
                                    Usulan Perlakuan Uang Muka (DP) *
                                </label>
                                <select
                                    value={cancellationForm.data.dp_handling}
                                    onChange={(e) => cancellationForm.setData('dp_handling', e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                >
                                    <option value="refund_creator">Uang Muka Dikembalikan Penuh ke Klien</option>
                                    <option value="keep_worker">Uang Muka Diikhlaskan untuk Pekerja (Kompensasi)</option>
                                    <option value="split">Bagi Hasil Proporsional (Split)</option>
                                </select>
                            </div>

                            {cancellationForm.data.dp_handling === 'split' && (
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-400">
                                        Persentase untuk Pekerja: {cancellationForm.data.split_percentage}%
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="99"
                                        value={cancellationForm.data.split_percentage}
                                        onChange={(e) => cancellationForm.setData('split_percentage', Number(e.target.value))}
                                        className="mt-1 w-full"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-400">
                                    Alasan Permohonan Pembatalan *
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Jelaskan alasan mengapa kontrak ini sebaiknya diakhiri secara damai..."
                                    value={cancellationForm.data.reason}
                                    onChange={(e) => cancellationForm.setData('reason', e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                                {cancellationForm.errors.reason && (
                                    <p className="mt-1 text-red-500">{cancellationForm.errors.reason}</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCancellationModal(false)}
                                    className="rounded-lg bg-slate-100 px-3.5 py-2 font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={cancellationForm.processing}
                                    className="rounded-lg bg-amber-600 px-4 py-2 font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                                >
                                    {cancellationForm.processing ? 'Mengirim...' : 'Ajukan Pembatalan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: FORMAL DISPUTE ESCALATION */}
            {showDisputeModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div
                        onClick={() => setShowDisputeModal(false)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
                    />
                    <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-[#0e0e1a]">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-red-600 dark:text-red-400">
                            <ShieldAlert className="text-red-500" size={18} />
                            Eskalasi Sengketa ke Arbitrase Admin
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Gunakan eskalasi ini jika terjadi kebuntuan (*deadlock*), wanprestasi berat, atau pelanggaran etika. Proyek akan dibekukan sementara menunggu keputusan Admin.
                        </p>

                        <form onSubmit={handleDisputeSubmit} className="mt-4 space-y-3 text-xs">
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-400">
                                    Kategori Masalah *
                                </label>
                                <select
                                    value={disputeForm.data.category}
                                    onChange={(e) => disputeForm.setData('category', e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                >
                                    <option value="breach_of_deadline">Keterlambatan Fatal / Gagal Memenuhi Tenggat Waktu</option>
                                    <option value="scope_dispute">Perbedaan Penafsiran Lingkup Tugas (Scope Creep)</option>
                                    <option value="quality_or_defect">Hasil Kerja Cacat / Tidak Sesuai Standar / Plagiarisme</option>
                                    <option value="non_payment">Penolakan Persetujuan / Pelunasan Tanpa Alasan Sah</option>
                                    <option value="misconduct_or_fraud">Pelanggaran Etika / Bukti Transfer Palsu / Penipuan</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-400">
                                    Kronologi & Fakta Pelanggaran *
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Tuliskan secara objektif kronologi kejadian, bukti komunikasi, dan pelanggaran kesepakatan..."
                                    value={disputeForm.data.reason}
                                    onChange={(e) => disputeForm.setData('reason', e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                                {disputeForm.errors.reason && (
                                    <p className="mt-1 text-red-500">{disputeForm.errors.reason}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-400">
                                    Lampiran Berkas Bukti (Screenshot/PDF/ZIP, Max 5 Berkas, Max 10MB/file)
                                </label>
                                <input
                                    type="file"
                                    multiple
                                    accept=".jpg,.jpeg,.png,.pdf,.zip"
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        disputeForm.setData('evidence_files', files);
                                    }}
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 file:mr-2 file:cursor-pointer file:rounded-md file:border-0 file:bg-red-50 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-red-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:file:bg-red-950/40 dark:file:text-red-300"
                                />
                                {disputeForm.data.evidence_files.length > 0 && (
                                    <span className="mt-1 block text-[10px] text-slate-500">
                                        {disputeForm.data.evidence_files.length} berkas dipilih
                                    </span>
                                )}
                                {disputeForm.errors.evidence_files && (
                                    <p className="mt-1 text-red-500">{disputeForm.errors.evidence_files}</p>
                                )}
                            </div>

                            {/* Legal Agreement Checkbox */}
                            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                                <label className="flex items-start gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        required
                                        checked={disputeForm.data.binding_agreement_accepted}
                                        onChange={(e) => disputeForm.setData('binding_agreement_accepted', e.target.checked)}
                                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                                        <strong>Klausul Arbitrase Mengikat:</strong> Saya memahami bahwa pengajuan ini akan membekukan proyek, dan saya menyetujui bahwa putusan Administrator Platform SkillVentura bersifat final, mengikat, dan membebaskan platform dari segala tuntutan hukum perdata/pidana.
                                    </span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowDisputeModal(false)}
                                    className="rounded-lg bg-slate-100 px-3.5 py-2 font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={disputeForm.processing || !disputeForm.data.binding_agreement_accepted}
                                    className="rounded-lg bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                    {disputeForm.processing ? 'Mengirim...' : 'Kirim Laporan Arbitrase'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 4: RESPOND TO DISPUTE (COUNTER-EVIDENCE) */}
            {showResponseModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div
                        onClick={() => setShowResponseModal(false)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
                    />
                    <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-[#0e0e1a]">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                            <Scale size={18} />
                            Beri Tanggapan Resmi / Bukti Tandingan
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Sampaikan klarifikasi dan argumen Anda kepada Admin mediator agar perkara ditinjau secara adil dari kedua sisi.
                        </p>

                        <form onSubmit={handleDisputeResponseSubmit} className="mt-4 space-y-3 text-xs">
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-400">
                                    Tanggapan & Penjelasan Fakta *
                                </label>
                                <textarea
                                    required
                                    rows={5}
                                    placeholder="Tuliskan klarifikasi Anda mengenai tuduhan atau dasar sengketa yang diajukan..."
                                    value={disputeResponseForm.data.response_note}
                                    onChange={(e) => disputeResponseForm.setData('response_note', e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                                {disputeResponseForm.errors.response_note && (
                                    <p className="mt-1 text-red-500">{disputeResponseForm.errors.response_note}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-400">
                                    Lampiran Berkas Bukti Tandingan (Screenshot/PDF/ZIP, Max 5 Berkas, Max 10MB/file)
                                </label>
                                <input
                                    type="file"
                                    multiple
                                    accept=".jpg,.jpeg,.png,.pdf,.zip"
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        disputeResponseForm.setData('evidence_files', files);
                                    }}
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 file:mr-2 file:cursor-pointer file:rounded-md file:border-0 file:bg-indigo-50 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-indigo-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:file:bg-indigo-950/40 dark:file:text-indigo-300"
                                />
                                {disputeResponseForm.data.evidence_files.length > 0 && (
                                    <span className="mt-1 block text-[10px] text-slate-500">
                                        {disputeResponseForm.data.evidence_files.length} berkas dipilih
                                    </span>
                                )}
                                {disputeResponseForm.errors.evidence_files && (
                                    <p className="mt-1 text-red-500">{disputeResponseForm.errors.evidence_files}</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowResponseModal(false)}
                                    className="rounded-lg bg-slate-100 px-3.5 py-2 font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={disputeResponseForm.processing}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {disputeResponseForm.processing ? 'Mengirim...' : 'Kirim Tanggapan ke Admin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
