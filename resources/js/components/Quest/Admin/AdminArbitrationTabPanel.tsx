import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import {
    TrendingUp,
    ShieldAlert,
    ShieldCheck,
    MessageSquare,
    Award,
    FolderGit,
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    Scale,
    ExternalLink,
    AlertTriangle,
    Gavel,
    UserX,
    Ban,
    UserCheck,
    AlertOctagon,
    RefreshCw,
    PlusCircle,
    Calendar,
    DollarSign,
    ArrowRight,
    Users,
    Check,
    Lock,
    HelpCircle,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { Quest, Bid } from '@/types/quest';
import QuestChatPanel from '@/components/Quest/QuestChatPanel';

interface Transaction {
    _id: string;
    amount: number;
    type: string;
    description: string;
    created_at: string;
    user?: {
        name: string;
    } | null;
}

interface AdminArbitrationTabPanelProps {
    quest: Quest;
    transactions: Transaction[];
    formatDate: (dateStr: string) => string;
    formatCurrency: (num: number) => string;
    extendDeadlineForm: any;
    handleExtendDeadline: (e: React.FormEvent) => void;
    handleReopenBidding: () => void;
    handleForceCancel: () => void;
    handleArbitrate: (e: React.FormEvent) => void;
    arbitrateForm: any;
    setSelectedChatBid: (bid: { id: string; name: string } | null) => void;
    bids: Bid[];
    openExtendDeadlineModal?: () => void;
}

export default function AdminArbitrationTabPanel({
    quest,
    transactions,
    formatDate,
    formatCurrency,
    extendDeadlineForm,
    handleExtendDeadline,
    handleReopenBidding,
    handleForceCancel,
    handleArbitrate,
    arbitrateForm,
    setSelectedChatBid,
    bids,
    openExtendDeadlineModal,
}: AdminArbitrationTabPanelProps) {
    const dispute = quest.dispute;
    const isDisputed = quest.status === 'disputed' || dispute?.status === 'pending';
    const isDisputeResolved = Boolean(dispute?.status?.startsWith('resolved'));

    // Modals state
    const [showEvidenceModal, setShowEvidenceModal] = useState(false);
    const [showSlaModal, setShowSlaModal] = useState(false);
    const [showComplianceModal, setShowComplianceModal] = useState(false);
    const [showBilateralDetails, setShowBilateralDetails] = useState(false);

    // Evidence request form
    const evidenceForm = useForm({
        target_party: 'worker' as 'creator' | 'worker' | 'both',
        instruction: '',
        deadline_hours: 48 as 24 | 48 | 72,
    });

    // SLA extension form
    const slaForm = useForm({
        additional_hours: 24 as 24 | 48 | 72,
        reason: '',
    });

    // P2P compliance verification form
    const complianceForm = useForm({
        compliance_status: 'verified' as 'verified' | 'non_compliant',
        audit_note: '',
    });

    // Submit Request Evidence
    const handleRequestEvidenceSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        evidenceForm.post(`/admin/quests/${quest.slug || quest._id}/request-evidence`, {
            onSuccess: () => {
                setShowEvidenceModal(false);
                evidenceForm.reset();
            },
        });
    };

    // Submit Extend SLA
    const handleExtendSlaSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        slaForm.post(`/admin/quests/${quest.slug || quest._id}/extend-dispute-sla`, {
            onSuccess: () => {
                setShowSlaModal(false);
                slaForm.reset();
            },
        });
    };

    // Submit P2P Compliance Verification
    const handleComplianceSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        complianceForm.post(`/admin/quests/${quest.slug || quest._id}/verify-p2p-compliance`, {
            onSuccess: () => {
                setShowComplianceModal(false);
                complianceForm.reset();
            },
        });
    };

    // Find accepted bid or default bid for embedded chat
    const activeBid = bids.find(
        (b) => b.status === 'accepted' || b.student?._id === quest.worker_id,
    ) || bids[0];

    const ledger = dispute?.p2p_ledger;
    const contractValue = ledger?.contract_amount ?? (quest.accepted_bid_amount || quest.max_salary || quest.max_budget || 0);
    const dpAmount = ledger?.dp_amount ?? (quest.dp_amount || 0);
    const dpPercentage = ledger?.dp_percentage ?? (quest.dp_percentage || 0);
    const remainingContract = ledger?.remaining_balance ?? Math.max(0, contractValue - dpAmount);
    const disputedAmount = ledger?.disputed_amount ?? dpAmount;

    // Simulation for Ruling Form
    const splitPct = arbitrateForm?.data?.split_percentage ?? 50;
    const workerSplitShare = Math.round((contractValue * splitPct) / 100);
    const clientSplitShare = contractValue - workerSplitShare;

    let simulationTransferParty: 'creator' | 'worker' | 'none' = 'none';
    let simulationTransferAmount = 0;
    let simulationInstruction = '';

    if (arbitrateForm?.data?.ruling === 'refund') {
        simulationTransferParty = 'worker';
        simulationTransferAmount = dpAmount;
        simulationInstruction = `Pekerja wajib merefund Down Payment (DP) sebesar ${formatCurrency(dpAmount)} ke Klien.`;
    } else if (arbitrateForm?.data?.ruling === 'pay_worker') {
        simulationTransferParty = 'creator';
        simulationTransferAmount = remainingContract;
        simulationInstruction = `Klien wajib mentransfer sisa pelunasan sebesar ${formatCurrency(remainingContract)} ke Pekerja.`;
    } else if (arbitrateForm?.data?.ruling === 'split') {
        if (workerSplitShare > dpAmount) {
            simulationTransferParty = 'creator';
            simulationTransferAmount = workerSplitShare - dpAmount;
            simulationInstruction = `Klien wajib mentransfer kekurangan sebesar ${formatCurrency(simulationTransferAmount)} ke Pekerja (karena hak pekerja ${formatCurrency(workerSplitShare)} melebihi DP ${formatCurrency(dpAmount)}).`;
        } else if (workerSplitShare < dpAmount) {
            simulationTransferParty = 'worker';
            simulationTransferAmount = dpAmount - workerSplitShare;
            simulationInstruction = `Pekerja wajib merefund kelebihan DP sebesar ${formatCurrency(simulationTransferAmount)} ke Klien (karena hak pekerja ${formatCurrency(workerSplitShare)} lebih kecil dari DP ${formatCurrency(dpAmount)}).`;
        } else {
            simulationTransferParty = 'none';
            simulationTransferAmount = 0;
            simulationInstruction = `Tidak ada transfer lanjutan yang diperlukan (hak pekerja ${formatCurrency(workerSplitShare)} persis sama dengan DP yang telah diterima).`;
        }
    }

    return (
        <div className="space-y-8 font-['Outfit']">
            {/* 1. HEADER STRIP: CASE DOSSIER & METADATA BANNER */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-gradient-to-b dark:from-[#0e0e1a] dark:to-[#090910]">
                <div className="absolute top-0 right-8 left-8 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5 dark:border-slate-800/80">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <span className="font-mono text-xs font-black tracking-widest text-indigo-600 uppercase dark:text-indigo-400">
                                {dispute?.memo_number ?? `KASUS #ARB-${(quest._id || '').slice(-6).toUpperCase()}`}
                            </span>
                            <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                    isDisputed
                                        ? 'border border-red-500/40 bg-red-500/10 text-red-700 animate-pulse dark:text-red-400'
                                        : isDisputeResolved
                                          ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                          : 'border border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                            >
                                {isDisputed
                                    ? 'Sengketa Aktif (Fase Mediasi)'
                                    : isDisputeResolved
                                      ? 'Putusan Inkracht (Selesai)'
                                      : 'Normal (Tanpa Sengketa)'}
                            </span>
                        </div>
                        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Ruang Arbitrase & Mediasi Resmi Mediator
                        </h2>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Portal pengawasan sengketa P2P Milestone Langsung & alokasi reward gamifikasi platform.
                        </p>
                    </div>

                    {/* SLA Status Pill */}
                    <div className="flex items-center gap-3">
                        {isDisputed && (
                            <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                                <Clock size={16} className="animate-spin text-amber-600 dark:text-amber-400" />
                                <div>
                                    <span className="block text-[10px] font-bold text-amber-600/80 uppercase">
                                        SLA Respon Terlapor
                                    </span>
                                    <span>
                                        {dispute?.response
                                            ? 'Tanggapan Diterima'
                                            : `Maks. 48 Jam ${
                                                  dispute?.sla_extended_hours
                                                      ? `(+${dispute.sla_extended_hours}j)`
                                                      : ''
                                              }`}
                                    </span>
                                </div>
                            </div>
                        )}
                        {isDisputeResolved && dispute?.p2p_compliance && (
                            <div
                                className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold ${
                                    dispute.p2p_compliance.status === 'verified'
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                        : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
                                }`}
                            >
                                {dispute.p2p_compliance.status === 'verified' ? (
                                    <ShieldCheck size={16} />
                                ) : (
                                    <AlertOctagon size={16} />
                                )}
                                <div>
                                    <span className="block text-[10px] font-bold uppercase">
                                        Kepatuhan P2P
                                    </span>
                                    <span>
                                        {dispute.p2p_compliance.status === 'verified'
                                            ? 'Patuh (Verified)'
                                            : 'Wanprestasi'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4-Card Case Financial & Contract Summary */}
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Nilai Kontrak P2P */}
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 dark:border-slate-800/80 dark:bg-[#030712]">
                        <span className="block text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                            Nilai Kontrak P2P (Riil)
                        </span>
                        <span className="mt-0.5 block text-sm font-extrabold text-slate-900 dark:text-white">
                            {formatCurrency(contractValue)}
                        </span>
                        <span className="mt-1 block text-[10px] text-slate-500">
                            Transfer Langsung Antar Pihak (Non-Escrow)
                        </span>
                    </div>

                    {/* Down Payment (DP) */}
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 dark:border-slate-800/80 dark:bg-[#030712]">
                        <div className="flex items-center justify-between">
                            <span className="block text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                                Down Payment ({dpPercentage}%)
                            </span>
                            {quest.dp_proof && (
                                <a
                                    href={quest.dp_proof.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-bold text-indigo-600 hover:underline dark:text-indigo-400 inline-flex items-center gap-1"
                                >
                                    Bukti DP <ExternalLink size={10} />
                                </a>
                            )}
                        </div>
                        <span className="mt-0.5 block text-sm font-extrabold text-amber-600 dark:text-amber-400">
                            {formatCurrency(dpAmount)}
                        </span>
                        <span className="mt-1 block text-[10px] text-slate-500">
                            {quest.dp_confirmed_at
                                ? 'DP Terkonfirmasi Diterima Pekerja'
                                : quest.dp_uploaded_at
                                  ? 'Menunggu Konfirmasi DP'
                                  : 'DP Belum Ditransfer'}
                        </span>
                    </div>

                    {/* Pelunasan Akhir P2P */}
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 dark:border-slate-800/80 dark:bg-[#030712]">
                        <div className="flex items-center justify-between">
                            <span className="block text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                                Sisa Pelunasan P2P
                            </span>
                            {quest.payment_proof && (
                                <a
                                    href={quest.payment_proof.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-bold text-emerald-600 hover:underline dark:text-emerald-400 inline-flex items-center gap-1"
                                >
                                    Bukti Lunas <ExternalLink size={10} />
                                </a>
                            )}
                        </div>
                        <span className="mt-0.5 block text-sm font-extrabold text-slate-900 dark:text-white">
                            {formatCurrency(remainingContract)}
                        </span>
                        <span className="mt-1 block text-[10px] text-slate-500">
                            {quest.payment_confirmed_at
                                ? 'Pelunasan Telah Dikonfirmasi'
                                : 'Ditransfer Pasca Deliverable Disetujui'}
                        </span>
                    </div>

                    {/* Platform Gamification Rewards */}
                    <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3.5 dark:border-purple-500/20 dark:bg-purple-950/20">
                        <span className="block text-[10px] font-bold text-purple-700 uppercase dark:text-purple-400">
                            Reward Gamifikasi Platform
                        </span>
                        <div className="mt-0.5 flex items-center gap-2">
                            <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
                                {quest.rewards?.gold ?? 0} Gold
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                                {quest.rewards?.exp ?? 0} EXP
                            </span>
                        </div>
                        <span className="mt-1 block text-[10px] text-purple-600 dark:text-purple-400">
                            Dikelola Penuh Oleh Platform (Otomatis)
                        </span>
                    </div>
                </div>

                {/* Parties Profile Strip */}
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 border-t border-slate-200/80 pt-4 dark:border-slate-800/80">
                    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-[#030712]">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                            KL
                        </div>
                        <div className="min-w-0">
                            <span className="block text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                                Pihak Pertama (Klien / Pembuat)
                            </span>
                            <span className="block truncate text-xs font-bold text-slate-900 dark:text-white">
                                {quest.creator?.name ?? 'Unknown'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-[#030712]">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                            PK
                        </div>
                        <div className="min-w-0">
                            <span className="block text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                                Pihak Kedua (Pekerja / Freelancer)
                            </span>
                            <span className="block truncate text-xs font-bold text-slate-900 dark:text-white">
                                {quest.worker?.name ?? 'Belum Ada Pekerja Terpilih'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. FASE 1: RIWAYAT RESOLUSI BILATERAL MANDIRI (TIER 1) */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-gradient-to-b dark:from-[#0e0e1a] dark:to-[#090910]">
                <div className="absolute top-0 right-8 left-8 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <Scale size={18} className="text-indigo-600 dark:text-indigo-400" />
                        <div>
                            <h3 className="text-sm font-extrabold tracking-wider text-slate-900 uppercase dark:text-white">
                                Fase 1: Riwayat Resolusi Bilateral Mandiri (Tier 1 Self-Resolution)
                            </h3>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                Negosiasi langsung antara Klien dan Pekerja sebelum eskalasi ke Arbitrase Admin.
                            </p>
                        </div>
                    </div>
                    <span className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                        {quest.resolution_requests?.length ?? 0} Pengajuan
                    </span>
                </div>

                {quest.resolution_requests && quest.resolution_requests.length > 0 ? (
                    <div className="mt-4 space-y-3">
                        {quest.resolution_requests.map((req) => (
                            <div
                                key={req.id}
                                className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-[#030712]"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="rounded border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700 uppercase dark:text-indigo-300">
                                            {req.type === 'deadline_extension' || req.type === 'extension'
                                                ? 'Perpanjangan Waktu'
                                                : 'Pembatalan Sepakat'}
                                        </span>
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                                            Diajukan oleh {req.requested_by_name || req.requester_name || 'Salah satu pihak'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-500">
                                            {formatDate(req.created_at || req.requested_at || '')}
                                        </span>
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                                                req.status === 'approved' || req.status === 'accepted'
                                                    ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                                    : req.status === 'rejected'
                                                      ? 'border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400'
                                                      : 'border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                            }`}
                                        >
                                            {req.status === 'approved' || req.status === 'accepted'
                                                ? 'Disetujui'
                                                : req.status === 'rejected'
                                                  ? 'Ditolak'
                                                  : 'Menunggu Tanggapan'}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-xs text-slate-700 dark:text-slate-300">
                                    <p className="font-semibold italic">
                                        Alasan: "{req.reason}"
                                    </p>
                                    {(req.type === 'deadline_extension' || req.type === 'extension') &&
                                        req.proposed_deadline && (
                                            <p className="mt-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                                                Usulan Batas Waktu Baru: {formatDate(req.proposed_deadline)}
                                            </p>
                                        )}
                                    {req.type === 'mutual_cancellation' &&
                                        req.dp_settlement_percentage !== undefined &&
                                        req.dp_settlement_percentage !== null && (
                                            <p className="mt-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                                Kesepakatan DP: Pekerja {req.dp_settlement_percentage}% / Klien{' '}
                                                {100 - req.dp_settlement_percentage}%
                                            </p>
                                        )}
                                </div>

                                {req.response_note && (
                                    <div className="mt-2 rounded-lg border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-800 dark:bg-[#0d0f17]">
                                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                                            <span>
                                                Tanggapan ({req.responded_by_name ?? 'Pihak Terkait'}):
                                            </span>
                                            {req.responded_at && (
                                                <span>{formatDate(req.responded_at)}</span>
                                            )}
                                        </div>
                                        <p className="mt-0.5 font-semibold text-slate-800 italic dark:text-slate-200">
                                            "{req.response_note}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-[#030712] dark:text-slate-400">
                        Kedua belah pihak tidak menempuh resolusi bilateral mandiri dan langsung mengajukan eskalasi ke Arbitrase Admin.
                    </div>
                )}
            </div>

            {/* 3. FASE 2: RUANG PENYELIDIKAN & MEDIASI TRIPARTIT (TIER 2) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-extrabold tracking-wider text-slate-900 uppercase dark:text-white flex items-center gap-2">
                            <ShieldAlert size={18} className="text-red-600 dark:text-red-400" />
                            Fase 2: Ruang Penyelidikan & Mediasi Tripartit (Tier 2 Investigation & Mediation)
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Pemeriksaan berkas bukti, tanggapan terlapor, dan saluran komunikasi tripartit langsung antara Mediator, Klien, dan Pekerja.
                        </p>
                    </div>
                    {/* Toolstrip buttons */}
                    {isDisputed && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowEvidenceModal(true)}
                                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-500/20 dark:text-indigo-300"
                            >
                                <PlusCircle size={14} />
                                Minta Bukti Tambahan
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowSlaModal(true)}
                                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-500/20 dark:text-amber-300"
                            >
                                <Clock size={14} />
                                Perpanjang SLA
                            </button>
                        </div>
                    )}
                </div>

                {/* 2-Column War Room Layout */}
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                    {/* LEFT COLUMN: EVIDENCE DOSSIER & DISCOVERY REQUESTS (lg:col-span-7) */}
                    <div className="space-y-6 lg:col-span-7">
                        {dispute ? (
                            <div className="space-y-4">
                                {/* Gugatan Pelapor Dossier */}
                                <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 dark:border-red-500/30 dark:bg-red-950/20 space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-500/20 pb-3 text-xs font-semibold">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900 dark:text-white">
                                                Gugatan Diajukan Oleh:{' '}
                                                <strong className="text-red-700 dark:text-red-300">
                                                    {dispute.filer_name}
                                                </strong>
                                            </span>
                                            {dispute.category_label && (
                                                <span className="rounded-md border border-red-500/40 bg-red-500/20 px-2 py-0.5 text-[10px] font-extrabold text-red-700 uppercase dark:text-red-300">
                                                    {dispute.category_label}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-slate-500">
                                            Waktu: {dispute.ruled_at ? formatDate(dispute.ruled_at) : 'Dispute Aktif'}
                                        </span>
                                    </div>

                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                                            Argumen & Narasi Gugatan:
                                        </span>
                                        <p className="rounded-xl border border-slate-300/80 bg-white p-3.5 text-xs font-semibold text-slate-800 italic dark:border-slate-800 dark:bg-[#0d0f17] dark:text-slate-200">
                                            "{dispute.reason}"
                                        </p>
                                    </div>

                                    {/* Evidence files */}
                                    {dispute.evidence_files && dispute.evidence_files.length > 0 && (
                                        <div className="space-y-1.5 pt-1">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                                                Lampiran Berkas Bukti Pelapor:
                                            </span>
                                            <div className="flex flex-wrap gap-2">
                                                {dispute.evidence_files.map((file, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={file.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-indigo-600 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0d0f17] dark:text-indigo-400 dark:hover:bg-slate-800/80"
                                                    >
                                                        <FileText size={14} />
                                                        <span className="max-w-[200px] truncate">{file.name}</span>
                                                        <ExternalLink size={12} />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Tanggapan Pihak Terlapor (Counter-evidence) */}
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0d0f17] space-y-3">
                                    <h4 className="border-b border-slate-200 pb-2 text-xs font-bold tracking-wider text-slate-900 uppercase dark:border-slate-800 dark:text-white">
                                        Klarifikasi & Bukti Balik Pihak Terlapor
                                    </h4>

                                    {dispute.response ? (
                                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
                                            <div className="flex items-center justify-between text-xs font-bold">
                                                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                                                    <CheckCircle2 size={14} />
                                                    Tanggapan Resmi: {dispute.response.responder_name}
                                                </span>
                                                {dispute.response.responded_at && (
                                                    <span className="text-[10px] font-normal text-slate-500">
                                                        {formatDate(dispute.response.responded_at)}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs font-semibold text-slate-800 italic dark:text-slate-200">
                                                "{dispute.response.response_note}"
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300">
                                            <Clock size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                                            <div>
                                                <span className="font-bold">Menunggu Tanggapan Terlapor</span>
                                                <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-400">
                                                    Pihak terlapor diberikan jendela waktu 48 jam untuk menyampaikan klarifikasi dan bukti balik.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Discovery Requests by Mediator */}
                                {dispute.evidence_requests && dispute.evidence_requests.length > 0 && (
                                    <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5 dark:border-indigo-500/30 dark:bg-indigo-950/20 space-y-3">
                                        <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                                            <h4 className="text-xs font-bold tracking-wider text-indigo-950 uppercase dark:text-indigo-200">
                                                Permintaan Bukti Tambahan dari Mediator ({dispute.evidence_requests.length})
                                            </h4>
                                        </div>

                                        <div className="space-y-2.5">
                                            {dispute.evidence_requests.map((req) => (
                                                <div
                                                    key={req.id}
                                                    className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs shadow-sm dark:border-slate-800 dark:bg-[#0d0f17] space-y-2"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="inline-flex items-center gap-1 rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                                                            <Lock size={10} />
                                                            Kepada:{' '}
                                                            {req.target_party === 'creator'
                                                                ? 'Klien (Privat)'
                                                                : req.target_party === 'worker'
                                                                  ? 'Pekerja (Privat)'
                                                                  : 'Keduanya (Publik)'}
                                                        </span>
                                                        <div className="flex items-center gap-2 text-[10px]">
                                                            <span className="text-slate-500">
                                                                Batas: {formatDate(req.deadline)} ({req.deadline_hours} Jam)
                                                            </span>
                                                            <span
                                                                className={`rounded px-2 py-0.5 font-bold uppercase ${
                                                                    req.status === 'submitted'
                                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                                                }`}
                                                            >
                                                                {req.status === 'submitted' ? 'Telah Diserahkan' : 'Menunggu Respons'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                                                        "{req.instruction}"
                                                    </p>

                                                    {/* If submitted, show files & notes to mediator */}
                                                    {req.status === 'submitted' && (
                                                        <div className="space-y-1.5 border-t border-slate-100 pt-2 dark:border-slate-800">
                                                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                                                                <span>Berkas Bukti Diserahkan ({req.submitted_by}):</span>
                                                                <span className="text-emerald-600 dark:text-emerald-400">
                                                                    Diverifikasi Mediator
                                                                </span>
                                                            </div>
                                                            {req.notes && (
                                                                <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                                                                    "{req.notes}"
                                                                </p>
                                                            )}
                                                            {req.files && req.files.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 pt-0.5">
                                                                    {req.files.map((f: any, idx: number) => (
                                                                        <a
                                                                            key={idx}
                                                                            href={f.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                                                        >
                                                                            <FileText size={12} />
                                                                            {f.name} <ExternalLink size={10} />
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-[#030712] dark:text-slate-400">
                                <ShieldAlert className="mx-auto mb-2 h-8 w-8 text-slate-400 opacity-60" />
                                <p className="font-extrabold text-slate-800 uppercase dark:text-slate-300">
                                    Tidak Ada Sengketa Aktif
                                </p>
                                <p className="mt-0.5 text-[11px]">
                                    Quest ini berjalan normal tanpa ada gugatan sengketa aktif.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: EMBEDDED TRIPARTITE CHAT (lg:col-span-5) */}
                    <div className="lg:col-span-5">
                        {activeBid ? (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
                                    <span className="flex items-center gap-1.5">
                                        <MessageSquare size={14} className="text-indigo-600 dark:text-indigo-400" />
                                        Ruang Mediasi Tripartit
                                    </span>
                                    <span className="text-[10px] font-normal text-slate-500">
                                        Mediator • Klien • Pekerja
                                    </span>
                                </div>
                                <QuestChatPanel
                                    bidId={activeBid._id}
                                    questTitle={quest.title}
                                    targetUserName={quest.worker?.name ?? activeBid.student?.name ?? 'Pekerja'}
                                    isDisputed={true}
                                    creatorId={quest.creator_id}
                                    workerId={quest.worker_id ?? undefined}
                                    embedded={true}
                                    className="h-[650px] w-full"
                                    isLocked={isDisputeResolved}
                                    lockedReason="Ruang mediasi tripartit ditutup permanen karena amar putusan arbitrase telah ditetapkan dan berkekuatan hukum tetap."
                                />
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-[#030712] dark:text-slate-400 h-[300px] flex flex-col items-center justify-center">
                                <MessageSquare className="mx-auto mb-2 h-8 w-8 text-slate-400 opacity-60" />
                                <p className="font-extrabold uppercase">Obrolan Mediasi Tidak Tersedia</p>
                                <p className="mt-1 text-[11px]">Tidak ada proposal penawaran aktif untuk memuat ruang obrolan mediasi.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 4. FASE 3: PUTUSAN ARBITRASE MENGIKAT (TIER 3 BINDING VERDICT) */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-gradient-to-b dark:from-[#0e0e1a] dark:to-[#090910]">
                <div className="absolute top-0 right-8 left-8 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <Gavel size={18} className="text-purple-600 dark:text-purple-400" />
                        <div>
                            <h3 className="text-sm font-extrabold tracking-wider text-slate-900 uppercase dark:text-white">
                                Fase 3: Putusan Arbitrase Mengikat (Tier 3 Binding Arbitration Ruling)
                            </h3>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                Penetapan vonis final oleh Dewan Mediator yang mengikat kedua belah pihak secara hukum dan operasional.
                            </p>
                        </div>
                    </div>
                </div>

                {isDisputeResolved && dispute ? (
                    /* RULING CERTIFICATE (IF RESOLVED) */
                    <div className="mt-5 space-y-6 rounded-2xl border border-emerald-500/30 bg-emerald-50/5 p-6 dark:border-emerald-500/30 dark:bg-emerald-950/20">
                        {/* Certificate Header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/20 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                                    <Award size={24} />
                                </div>
                                <div>
                                    <span className="block font-mono text-xs font-black tracking-widest text-emerald-800 dark:text-emerald-300">
                                        {dispute.award?.award_number ?? dispute.memo_number ?? '#ARB-FINAL'}
                                    </span>
                                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        Akta Ketetapan Resmi Arbitrase (Inkracht)
                                    </h4>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                        Diputuskan pada {formatDate(dispute.award?.ruled_at ?? dispute.ruled_at)} oleh {dispute.award?.arbiter_name ?? 'Dewan Arbitrase SkillVentura'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs font-black uppercase text-emerald-800 dark:text-emerald-300">
                                    Berkekuatan Hukum Tetap
                                </span>
                            </div>
                        </div>

                        {/* I. Konsideran Fakta (Findings of Fact) */}
                        <div className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0d0f17]">
                            <span className="block text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                                I. Konsideran & Pemeriksaan Fakta (Findings of Fact):
                            </span>
                            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                                {dispute.award?.findings_of_fact ??
                                    dispute.note ??
                                    dispute.ruling_note ??
                                    'Berdasarkan pemeriksaan menyeluruh terhadap berkas bukti, riwayat komitmen kerja, dan pembuktian transfer P2P para pihak.'}
                            </p>
                        </div>

                        {/* II. Dasar Hukum Platform (Ratio Decidendi) */}
                        <div className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0d0f17]">
                            <span className="block text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                                II. Dasar Pertimbangan Regulasi Platform (Ratio Decidendi):
                            </span>
                            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed italic">
                                "{dispute.award?.ratio_decidendi ??
                                    'Menimbang integritas penyelesaian deliverable dan kepatuhan kewajiban finansial bilateral P2P (Non-Escrow) platform SkillVentura.'}"
                            </p>
                        </div>

                        {/* III. Amar Putusan Finansial P2P & Gamifikasi */}
                        <div className="space-y-3">
                            <span className="block text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                                III. Diktum Amar Putusan (Orders of the Award):
                            </span>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
                                <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/5 p-4 dark:border-emerald-500/20 dark:bg-emerald-950/30">
                                    <span className="block text-[10px] font-bold text-emerald-800 uppercase dark:text-emerald-400">
                                        Amar Putusan Pokok
                                    </span>
                                    <span className="mt-1 block text-sm font-extrabold text-slate-900 dark:text-white">
                                        {dispute.verdict_label ??
                                            (['refund', 'refund_creator'].includes(dispute.ruling ?? '')
                                                ? 'Pembatalan & Restitusi Penuh Klien'
                                                : ['pay_worker', 'release_payout'].includes(dispute.ruling ?? '')
                                                  ? 'Pelunasan Penuh Pekerja'
                                                  : dispute.ruling === 'split'
                                                    ? `Bagi Hasil Prorata (${dispute.split_percentage}% Pekerja)`
                                                    : dispute.ruling)}
                                    </span>
                                    <span className="mt-1 block text-[10px] text-slate-500 dark:text-slate-400">
                                        Putusan bersifat final dan mengikat
                                    </span>
                                </div>

                                <div className="rounded-xl border border-indigo-500/30 bg-indigo-50/5 p-4 dark:border-indigo-500/20 dark:bg-indigo-950/30">
                                    <span className="block text-[10px] font-bold text-indigo-800 uppercase dark:text-indigo-400">
                                        Kewajiban Transfer P2P
                                    </span>
                                    <span className="mt-1 block text-sm font-extrabold text-slate-900 dark:text-white">
                                        {dispute.award?.financial_order
                                            ? dispute.award.financial_order.paying_party === 'none'
                                                ? 'Tidak Ada Transfer Tambahan'
                                                : `${formatCurrency(dispute.award.financial_order.amount)}`
                                            : ['refund', 'refund_creator'].includes(dispute.ruling ?? '')
                                              ? `Restitusi DP: ${formatCurrency(dpAmount)}`
                                              : ['pay_worker', 'release_payout'].includes(dispute.ruling ?? '')
                                                ? `Pelunasan: ${formatCurrency(remainingContract)}`
                                                : dispute.ruling === 'split'
                                                  ? `Pekerja ${dispute.split_percentage}% / Klien ${100 - (dispute.split_percentage ?? 0)}%`
                                                  : '-'}
                                    </span>
                                    <span className="mt-1 block text-[10px] text-slate-500 dark:text-slate-400">
                                        {dispute.award?.financial_order?.paying_party === 'worker'
                                            ? 'Wajib ditransfer Pekerja ke Klien'
                                            : dispute.award?.financial_order?.paying_party === 'creator'
                                              ? 'Wajib ditransfer Klien ke Pekerja'
                                              : 'Transfer langsung antar rekening bank'}
                                    </span>
                                </div>

                                <div className="rounded-xl border border-purple-500/30 bg-purple-50/5 p-4 dark:border-purple-500/20 dark:bg-purple-950/30">
                                    <span className="block text-[10px] font-bold text-purple-800 uppercase dark:text-purple-400">
                                        Alokasi Reward Gamifikasi
                                    </span>
                                    <span className="mt-1 block text-sm font-extrabold text-purple-700 dark:text-purple-300">
                                        {dispute.award?.platform_reward_order
                                            ? `${dispute.award.platform_reward_order.gold_worker} Gold • ${dispute.award.platform_reward_order.exp_worker} EXP`
                                            : ['pay_worker', 'release_payout'].includes(dispute.ruling ?? '')
                                              ? '100% Dicairkan ke Pekerja'
                                              : ['refund', 'refund_creator'].includes(dispute.ruling ?? '')
                                                ? 'Dibatalkan (0 Dicairkan)'
                                                : dispute.ruling === 'split'
                                                  ? `${dispute.split_percentage}% Dicairkan ke Pekerja`
                                                  : '-'}
                                    </span>
                                    <span className="mt-1 block text-[10px] text-purple-600/80 dark:text-purple-400">
                                        Diproses otomatis oleh sistem platform
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* IV. Sanksi Disiplin Akun jika ada */}
                        {dispute.sanction && dispute.sanction.sanction_type !== 'none' && (
                            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs space-y-1.5">
                                <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold">
                                    <Ban size={15} />
                                    <span className="text-sm">
                                        Sanksi Disiplin Akun: <strong className="uppercase">{dispute.sanction.sanction_type}</strong>
                                    </span>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300">
                                    Diberlakukan terhadap pihak:{' '}
                                    <strong className="uppercase font-bold">
                                        {dispute.sanction.sanction_target === 'creator' ? 'Klien' : 'Pekerja'}
                                    </strong>
                                    .{' '}
                                    {dispute.sanction.sanction_reason && `Alasan penjatuhan sanksi: "${dispute.sanction.sanction_reason}"`}
                                </p>
                            </div>
                        )}

                        {/* V. Memorandum Mediator */}
                        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0d0f17] space-y-1">
                            <span className="block text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                                Memorandum & Catatan Arbiter
                            </span>
                            <p className="text-xs font-semibold text-slate-800 italic dark:text-slate-200">
                                "{dispute.award?.legal_memorandum ?? dispute.note ?? dispute.ruling_note ?? 'Sengketa telah diputus oleh Dewan Mediator.'}"
                            </p>
                        </div>

                        {dispute.legal_disclaimer && (
                            <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 italic text-right border-t border-emerald-500/20 pt-3">
                                {dispute.legal_disclaimer}
                            </p>
                        )}
                    </div>
                ) : isDisputed ? (
                    /* VERDICT FORM (IF DISPUTED) */
                    <form onSubmit={handleArbitrate} className="mt-5 space-y-6">
                        {/* 3 Ruling Choices */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                                1. Pilih Amar Putusan Arbitrase (Ruling) <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                {/* Option 1: Refund */}
                                <label
                                    className={`relative flex cursor-pointer flex-col justify-between rounded-2xl border p-5 transition-all ${
                                        arbitrateForm.data.ruling === 'refund'
                                            ? 'border-red-600 bg-red-500/10 shadow-md dark:border-red-500'
                                            : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-[#030712]'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="ruling"
                                        value="refund"
                                        checked={arbitrateForm.data.ruling === 'refund'}
                                        onChange={() => arbitrateForm.setData('ruling', 'refund')}
                                        className="sr-only"
                                    />
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="rounded-lg bg-red-100 p-2 text-red-600 dark:bg-red-950 dark:text-red-400">
                                                <XCircle size={18} />
                                            </span>
                                            {arbitrateForm.data.ruling === 'refund' && (
                                                <Check size={16} className="text-red-600 dark:text-red-400 font-bold" />
                                            )}
                                        </div>
                                        <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white">
                                            Batalkan & Restitusi Penuh
                                        </h4>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                            Batalkan kontrak P2P & instruksikan restitusi DP ke Klien. Reward platform tidak dicairkan.
                                        </p>
                                    </div>
                                    <div className="mt-4 border-t border-slate-200/60 pt-2 text-[10px] font-bold text-red-600 dark:text-red-400">
                                        Restitusi DP: {formatCurrency(dpAmount)}
                                    </div>
                                </label>

                                {/* Option 2: Pay Worker */}
                                <label
                                    className={`relative flex cursor-pointer flex-col justify-between rounded-2xl border p-5 transition-all ${
                                        arbitrateForm.data.ruling === 'pay_worker'
                                            ? 'border-emerald-600 bg-emerald-500/10 shadow-md dark:border-emerald-500'
                                            : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-[#030712]'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="ruling"
                                        value="pay_worker"
                                        checked={arbitrateForm.data.ruling === 'pay_worker'}
                                        onChange={() => arbitrateForm.setData('ruling', 'pay_worker')}
                                        className="sr-only"
                                    />
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                                                <CheckCircle2 size={18} />
                                            </span>
                                            {arbitrateForm.data.ruling === 'pay_worker' && (
                                                <Check size={16} className="text-emerald-600 dark:text-emerald-400 font-bold" />
                                            )}
                                        </div>
                                        <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white">
                                            Pelunasan Penuh Pekerja
                                        </h4>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                            Klien wajib melunasi sisa kontrak P2P & platform mencairkan 100% reward gamifikasi.
                                        </p>
                                    </div>
                                    <div className="mt-4 border-t border-slate-200/60 pt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                        Pelunasan: {formatCurrency(remainingContract)}
                                    </div>
                                </label>

                                {/* Option 3: Split */}
                                <label
                                    className={`relative flex cursor-pointer flex-col justify-between rounded-2xl border p-5 transition-all ${
                                        arbitrateForm.data.ruling === 'split'
                                            ? 'border-indigo-600 bg-indigo-500/10 shadow-md dark:border-indigo-500'
                                            : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-[#030712]'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="ruling"
                                        value="split"
                                        checked={arbitrateForm.data.ruling === 'split'}
                                        onChange={() => arbitrateForm.setData('ruling', 'split')}
                                        className="sr-only"
                                    />
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                                                <Scale size={18} />
                                            </span>
                                            {arbitrateForm.data.ruling === 'split' && (
                                                <Check size={16} className="text-indigo-600 dark:text-indigo-400 font-bold" />
                                            )}
                                        </div>
                                        <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white">
                                            Bagi Hasil Prorata
                                        </h4>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                            Bagi hak kontrak riil & reward gamifikasi proporsional sesuai persentase progres kerja valid.
                                        </p>
                                    </div>
                                    <div className="mt-4 border-t border-slate-200/60 pt-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                        Pekerja: {arbitrateForm.data.split_percentage}% / Klien: {100 - arbitrateForm.data.split_percentage}%
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Custom Split Slider Controls */}
                        {arbitrateForm.data.ruling === 'split' && (
                            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5 space-y-4 dark:border-indigo-500/30">
                                <label className="block text-xs font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                                    Persentase Hak Pekerja (%) <span className="text-red-500">*</span>
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="1"
                                        max="99"
                                        value={arbitrateForm.data.split_percentage}
                                        onChange={(e) =>
                                            arbitrateForm.setData('split_percentage', parseInt(e.target.value) || 50)
                                        }
                                        className="flex-1 accent-indigo-600"
                                    />
                                    <div className="w-20 shrink-0 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-center text-sm font-extrabold text-slate-900 dark:border-slate-800 dark:bg-[#0d0f17] dark:text-white">
                                        {arbitrateForm.data.split_percentage}%
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                                    <div className="rounded-lg bg-white/70 p-3 dark:bg-black/40 space-y-0.5">
                                        <span className="block text-[10px] text-slate-500 uppercase font-bold">Hak Finansial Pekerja ({splitPct}%)</span>
                                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400 block text-sm">
                                            {formatCurrency(workerSplitShare)}
                                        </span>
                                        <span className="text-[10px] text-purple-600 dark:text-purple-400 block">
                                            + {Math.round(((quest.rewards?.gold ?? 0) * splitPct) / 100)} Gold • {Math.round(((quest.rewards?.exp ?? 0) * splitPct) / 100)} EXP
                                        </span>
                                    </div>
                                    <div className="rounded-lg bg-white/70 p-3 dark:bg-black/40 space-y-0.5">
                                        <span className="block text-[10px] text-slate-500 uppercase font-bold">Hak Finansial Klien ({100 - splitPct}%)</span>
                                        <span className="font-extrabold text-slate-800 dark:text-slate-200 block text-sm">
                                            {formatCurrency(clientSplitShare)}
                                        </span>
                                        <span className="text-[10px] text-slate-500 block">
                                            Total Kontrak: {formatCurrency(contractValue)} (DP: {formatCurrency(dpAmount)})
                                        </span>
                                    </div>
                                </div>
                                {/* Live P2P Settlement Instruction */}
                                <div className="rounded-xl border border-indigo-500/20 bg-white/80 p-3 text-xs dark:bg-[#0d0f17] space-y-1">
                                    <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-300">
                                        <Scale size={14} />
                                        <span>Instruksi Kewajiban Transfer P2P:</span>
                                    </div>
                                    <p className="font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                                        {simulationInstruction}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Account Sanctions Section */}
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-4 dark:border-slate-800 dark:bg-[#030712]">
                            <h4 className="text-xs font-bold tracking-wider text-slate-900 uppercase dark:text-white flex items-center gap-2">
                                <Ban size={16} className="text-red-500" />
                                2. Penetapan Sanksi Disiplin Akun (Opsional)
                            </h4>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Sanction Target */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-600 uppercase dark:text-slate-400">
                                        Pihak Yang Dikenakan Sanksi
                                    </label>
                                    <select
                                        value={arbitrateForm.data.sanction_target}
                                        onChange={(e) => arbitrateForm.setData('sanction_target', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-[#0d0f17] dark:text-white"
                                    >
                                        <option value="worker">Pekerja ({quest.worker?.name ?? 'Freelancer'})</option>
                                        <option value="creator">Klien ({quest.creator?.name ?? 'Pembuat'})</option>
                                    </select>
                                </div>

                                {/* Sanction Type */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-600 uppercase dark:text-slate-400">
                                        Tingkat / Jenis Sanksi
                                    </label>
                                    <select
                                        value={arbitrateForm.data.sanction_type}
                                        onChange={(e) => arbitrateForm.setData('sanction_type', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-[#0d0f17] dark:text-white"
                                    >
                                        <option value="none">Tidak Ada Sanksi (Bebas Sanksi)</option>
                                        <option value="warning">Peringatan Formal (Formal Warning)</option>
                                        <option value="trust_penalty">Penalti Trust Score -20%</option>
                                        <option value="temporary_suspension">Pembekuan Akun Sementara (7 Hari)</option>
                                        <option value="permanent_ban">Pemblokiran Akun Permanen (Banned)</option>
                                    </select>
                                </div>
                            </div>

                            {arbitrateForm.data.sanction_type !== 'none' && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-600 uppercase dark:text-slate-400">
                                        Alasan / Dasar Pelanggaran Sanksi
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Pekerja mangkir dari kewajiban tanpa konfirmasi / Klien membatalkan sepihak tanpa alasan sah"
                                        value={arbitrateForm.data.sanction_reason}
                                        onChange={(e) => arbitrateForm.setData('sanction_reason', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-[#0d0f17] dark:text-white"
                                    />
                                </div>
                            )}
                        </div>

                        {/* 3. Konsideran & Pemeriksaan Fakta (Findings of Fact) */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                                3. Konsideran & Pemeriksaan Fakta (Findings of Fact) <span className="text-slate-400 font-normal">(Opsional)</span>
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Uraikan fakta materiil yang terbukti dari berkas bukti, log obrolan mediasi, dan pemenuhan milestone kerja para pihak..."
                                value={arbitrateForm.data.findings_of_fact}
                                onChange={(e) => arbitrateForm.setData('findings_of_fact', e.target.value)}
                                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-[#0d0f17] dark:text-white"
                            />
                            {arbitrateForm.errors.findings_of_fact && (
                                <p className="text-xs font-semibold text-red-500">{arbitrateForm.errors.findings_of_fact}</p>
                            )}
                        </div>

                        {/* 4. Dasar Pertimbangan Regulasi Platform (Ratio Decidendi) */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                                4. Dasar Pertimbangan Regulasi Platform (Ratio Decidendi) <span className="text-slate-400 font-normal">(Opsional)</span>
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Sebutkan pasal Terms of Service platform, standar kepatuhan P2P, atau pertimbangan hukum yang mendasari amar putusan ini..."
                                value={arbitrateForm.data.ratio_decidendi}
                                onChange={(e) => arbitrateForm.setData('ratio_decidendi', e.target.value)}
                                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-[#0d0f17] dark:text-white"
                            />
                            {arbitrateForm.errors.ratio_decidendi && (
                                <p className="text-xs font-semibold text-red-500">{arbitrateForm.errors.ratio_decidendi}</p>
                            )}
                        </div>

                        {/* 5. Memorandum Putusan & Instruksi Penegakan */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                                5. Memorandum Putusan & Instruksi Penegakan <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                required
                                rows={4}
                                placeholder="Tuliskan berita acara / memorandum resmi keputusan arbitrase ini, alasan pertimbangan bukti, dan instruksi penegakan transfer P2P bagi para pihak..."
                                value={arbitrateForm.data.note}
                                onChange={(e) => arbitrateForm.setData('note', e.target.value)}
                                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-[#0d0f17] dark:text-white"
                            />
                            {arbitrateForm.errors.note && (
                                <p className="text-xs font-semibold text-red-500">{arbitrateForm.errors.note}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={arbitrateForm.processing}
                            className="w-full cursor-pointer rounded-xl bg-red-600 py-3 text-xs font-black tracking-wider text-white uppercase shadow-md transition-colors hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Gavel size={16} />
                            {arbitrateForm.processing
                                ? 'Memproses Putusan Arbitrase...'
                                : 'Tetapkan Putusan Arbitrase Mengikat (Inkracht)'}
                        </button>
                    </form>
                ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-[#030712] dark:text-slate-400">
                        Formulir putusan arbitrase hanya aktif saat status quest berada dalam fase perselisihan (Dispute Aktif).
                    </div>
                )}
            </div>

            {/* 5. FASE 4: PENEGAKAN PUTUSAN, VERIFIKASI P2P & TINDAKAN PEMULIHAN (TIER 4) */}
            <div className="relative space-y-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-gradient-to-b dark:from-[#0e0e1a] dark:to-[#090910]">
                <div className="absolute top-0 right-8 left-8 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
                        <div>
                            <h3 className="text-sm font-extrabold tracking-wider text-slate-900 uppercase dark:text-white">
                                Fase 4: Penegakan Putusan & Tindakan Pemulihan Administratif (Tier 4 Compliance & Recovery)
                            </h3>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                Verifikasi kepatuhan transfer P2P pasca putusan, pembukaan kembali bursa kandidat, atau pembatalan paksa.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Panel 1: Verifikasi Kepatuhan P2P (Post-Ruling Compliance) */}
                    <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-[#030712]">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black tracking-wider text-slate-900 uppercase dark:text-white">
                                    Audit Kepatuhan Transfer P2P
                                </h4>
                                {dispute?.p2p_compliance && (
                                    <span
                                        className={`rounded px-2.5 py-1 text-[10px] font-black uppercase ${
                                            dispute.p2p_compliance.status === 'verified'
                                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                                : dispute.p2p_compliance.status === 'non_compliant'
                                                  ? 'bg-red-500/20 text-red-700 dark:text-red-300'
                                                  : dispute.p2p_compliance.status === 'pending_payment'
                                                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                                    : 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                                        }`}
                                    >
                                        {dispute.p2p_compliance.status === 'verified'
                                            ? 'Patuh (Verified)'
                                            : dispute.p2p_compliance.status === 'non_compliant'
                                              ? 'Wanprestasi (Non-Compliant)'
                                              : dispute.p2p_compliance.status === 'pending_payment'
                                                ? 'Menunggu Transfer P2P'
                                                : 'Menunggu Verifikasi Mediator'}
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                Verifikasi apakah pihak yang diwajibkan telah mentransfer restitusi DP atau pelunasan sisa kontrak P2P sesuai amar putusan arbitrase resmi.
                            </p>

                            {/* Compliance Payment Info */}
                            {dispute?.p2p_compliance && (
                                <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs dark:border-slate-800 dark:bg-[#0d0f17] space-y-2">
                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                        <div>
                                            <span className="text-slate-500 block">Pihak Pembayar:</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                                {(dispute.p2p_compliance.paying_party || dispute.award?.financial_order?.paying_party) === 'creator'
                                                    ? 'Klien (Pembuat Quest)'
                                                    : (dispute.p2p_compliance.paying_party || dispute.award?.financial_order?.paying_party) === 'worker'
                                                      ? 'Pekerja (Freelancer)'
                                                      : '-'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">Nominal Kewajiban:</span>
                                            <span className="font-extrabold text-amber-600 dark:text-amber-400">
                                                {formatCurrency(dispute.p2p_compliance.amount || dispute.award?.financial_order?.amount || 0)}
                                            </span>
                                        </div>
                                    </div>
                                    {dispute.p2p_compliance.payment_deadline && (
                                        <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-1.5 dark:border-slate-800">
                                            Batas Waktu Transfer: <strong className="text-slate-700 dark:text-slate-300">{formatDate(dispute.p2p_compliance.payment_deadline)}</strong>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Uploaded Proof Bank Metadata Card */}
                            {dispute?.p2p_compliance?.proof_file && (
                                <div className="rounded-xl border border-indigo-500/30 bg-indigo-50/10 p-3.5 text-xs dark:bg-indigo-950/20 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                                            <FileText size={14} />
                                            Bukti Transfer Diserahkan
                                        </span>
                                        <span className="text-[10px] text-slate-500">
                                            {dispute.p2p_compliance.proof_uploaded_at && formatDate(dispute.p2p_compliance.proof_uploaded_at)}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-indigo-500/20 pt-2">
                                        <div>
                                            <span className="text-slate-500 block">Bank / E-Wallet:</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                                {dispute.p2p_compliance.bank_source || '-'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">Nama Rekening Tujuan:</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                                {dispute.p2p_compliance.account_name_destination || '-'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">No. Referensi (RRN):</span>
                                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                                {dispute.p2p_compliance.transaction_ref_no || '-'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">Berkas Struk:</span>
                                            <a
                                                href={dispute.p2p_compliance.proof_file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 dark:text-indigo-400"
                                            >
                                                <FileText size={12} />
                                                Lihat Resi <ExternalLink size={10} />
                                            </a>
                                        </div>
                                    </div>

                                    {dispute.p2p_compliance.transfer_note && (
                                        <p className="text-slate-600 dark:text-slate-400 italic text-[10px] pt-1">
                                            "{dispute.p2p_compliance.transfer_note}"
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Verified Audit Note if already audited */}
                            {dispute?.p2p_compliance?.audit_note && (
                                <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-[#0d0f17] space-y-1">
                                    <span className="block text-[10px] font-bold text-slate-500">
                                        Diverifikasi oleh: {dispute.p2p_compliance.verified_by || 'Mediator'} ({formatDate(dispute.p2p_compliance.verified_at)})
                                    </span>
                                    <p className="italic font-semibold text-slate-800 dark:text-slate-200">
                                        "{dispute.p2p_compliance.audit_note}"
                                    </p>
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowComplianceModal(true)}
                            className="w-full cursor-pointer rounded-xl border border-indigo-500/30 bg-indigo-500/10 py-2.5 text-xs font-bold text-indigo-700 uppercase transition-colors hover:bg-indigo-500/20 dark:text-indigo-300 flex items-center justify-center gap-1.5"
                        >
                            <ShieldCheck size={14} />
                            {dispute?.p2p_compliance?.status === 'verified'
                                ? 'Perbarui Audit Kepatuhan P2P'
                                : 'Audit & Verifikasi Kepatuhan P2P'}
                        </button>
                    </div>

                    {/* Panel 2: Quick Recovery Controls */}
                    <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-[#030712]">
                        <div>
                            <h4 className="text-xs font-black tracking-wider text-slate-900 uppercase dark:text-white">
                                Tindakan Pemulihan Administratif
                            </h4>
                            <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                                Gunakan opsi di bawah ini jika kontrak dibatalkan dan quest perlu dibuka kembali ke publik atau ditutup total.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-2 pt-2">
                            <button
                                type="button"
                                onClick={handleReopenBidding}
                                className="w-full cursor-pointer rounded-xl border border-amber-500/30 bg-amber-500/10 py-2.5 text-center text-xs font-bold tracking-wider text-amber-700 uppercase transition-all hover:bg-amber-500/20 dark:text-amber-400 flex items-center justify-center gap-1.5"
                            >
                                <RefreshCw size={14} />
                                Buka Kembali Bidding
                            </button>
                            {openExtendDeadlineModal && (
                                <button
                                    type="button"
                                    onClick={openExtendDeadlineModal}
                                    className="w-full cursor-pointer rounded-xl border border-indigo-500/30 bg-indigo-500/10 py-2.5 text-center text-xs font-bold tracking-wider text-indigo-700 uppercase transition-all hover:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center gap-1.5"
                                >
                                    <Calendar size={14} />
                                    Ubah / Perpanjang Tenggat Waktu
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleForceCancel}
                                className="w-full cursor-pointer rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-center text-xs font-bold tracking-wider text-red-700 uppercase transition-all hover:bg-red-500/20 dark:text-red-400 flex items-center justify-center gap-1.5"
                            >
                                <AlertOctagon size={14} />
                                Batalkan Quest & Batalkan Reward
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 6. QUEST TRANSACTION & GAMIFICATION REWARDS LEDGER */}
            <div className="relative space-y-5 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-gradient-to-b dark:from-[#0e0e1a] dark:to-[#090910]">
                <div className="absolute top-0 right-8 left-8 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                    <h3 className="flex items-center gap-2 text-sm font-extrabold tracking-wider text-slate-900 uppercase dark:text-white">
                        <FolderGit size={16} className="text-purple-600 dark:text-purple-400" />
                        Buku Besar Transaksi Koin Gold & Reward Gamifikasi (Quest Ledger)
                    </h3>
                    <span className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                        {transactions.length} Transaksi
                    </span>
                </div>

                {transactions.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                        <p className="text-xs font-extrabold text-slate-800 uppercase dark:text-slate-300">
                            Belum Ada Catatan Transaksi
                        </p>
                        <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                            Belum ada pergerakan transaksi reward koin Gold yang tercatat pada quest ini.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-300 text-[10px] font-bold text-slate-600 uppercase dark:border-slate-800 dark:text-slate-400">
                                    <th className="py-2.5">Tanggal</th>
                                    <th className="py-2.5">Tipe</th>
                                    <th className="py-2.5">Pihak Terkait</th>
                                    <th className="py-2.5">Jumlah</th>
                                    <th className="py-2.5">Deskripsi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                                {transactions.map((t) => (
                                    <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                                        <td className="py-2.5 font-semibold text-slate-600 dark:text-slate-400">
                                            {formatDate(t.created_at)}
                                        </td>
                                        <td className="py-2.5 text-[10px] font-bold uppercase">
                                            <span
                                                className={`rounded px-2 py-0.5 ${
                                                    t.type === 'hold_escrow'
                                                        ? 'border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                                        : t.type === 'release_payout'
                                                          ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                                          : 'border border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                                                }`}
                                            >
                                                {t.type === 'hold_escrow' && 'Penahanan Reward'}
                                                {t.type === 'release_payout' && 'Pencairan Reward'}
                                                {t.type === 'refund_escrow' && 'Pembatalan Reward'}
                                                {![
                                                    'hold_escrow',
                                                    'release_payout',
                                                    'refund_escrow',
                                                ].includes(t.type) && t.type}
                                            </span>
                                        </td>
                                        <td className="py-2.5 font-bold text-slate-900 dark:text-slate-200">
                                            {t.user?.name ?? 'Sistem Platform'}
                                        </td>
                                        <td className="py-2.5 font-extrabold text-amber-600 dark:text-amber-400">
                                            {t.amount > 0 ? `+${t.amount}` : t.amount} G
                                        </td>
                                        <td className="py-2.5 font-semibold text-slate-600 italic dark:text-slate-400">
                                            {t.description}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL 1: REQUEST ADDITIONAL EVIDENCE */}
            {showEvidenceModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div
                        onClick={() => setShowEvidenceModal(false)}
                        className="absolute inset-0 cursor-pointer bg-black/60 backdrop-blur-sm"
                    />
                    <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 font-['Outfit']">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                            <h3 className="text-sm font-extrabold tracking-wider text-slate-900 uppercase dark:text-white flex items-center gap-2">
                                <PlusCircle size={16} className="text-indigo-600 dark:text-indigo-400" />
                                Minta Bukti Tambahan
                            </h3>
                            <button
                                onClick={() => setShowEvidenceModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleRequestEvidenceSubmit} className="mt-4 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                                    Pihak Yang Diminta Bukti <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={evidenceForm.data.target_party}
                                    onChange={(e) =>
                                        evidenceForm.setData('target_party', e.target.value as any)
                                    }
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-[#0d0f17] dark:text-white"
                                >
                                    <option value="worker">Pekerja ({quest.worker?.name ?? 'Freelancer'}) — Konfidensial</option>
                                    <option value="creator">Klien ({quest.creator?.name ?? 'Pembuat'}) — Konfidensial</option>
                                    <option value="both">Kedua Belah Pihak (Klien & Pekerja)</option>
                                </select>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                    🔒 Permintaan bukti ini bersifat konfidensial antara Dewan Mediator dan pihak target. Pihak lawan tidak akan melihat permintaan maupun berkas yang diserahkan.
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                                    Batas Waktu Pengunggahan <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={evidenceForm.data.deadline_hours}
                                    onChange={(e) =>
                                        evidenceForm.setData(
                                            'deadline_hours',
                                            parseInt(e.target.value) as any,
                                        )
                                    }
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-[#0d0f17] dark:text-white"
                                >
                                    <option value={24}>24 Jam (Mendesak)</option>
                                    <option value={48}>48 Jam (Standar)</option>
                                    <option value={72}>72 Jam (Kompleks)</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                                    Instruksi / Rincian Berkas Bukti <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Jelaskan bukti apa yang harus diunggah (misal: log repositori git, bukti chat di luar platform, rekaman demonstrasi fitur)..."
                                    value={evidenceForm.data.instruction}
                                    onChange={(e) => evidenceForm.setData('instruction', e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-[#0d0f17] dark:text-white"
                                />
                                {evidenceForm.errors.instruction && (
                                    <p className="text-xs font-semibold text-red-500">
                                        {evidenceForm.errors.instruction}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowEvidenceModal(false)}
                                    className="cursor-pointer rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={evidenceForm.processing}
                                    className="cursor-pointer rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white uppercase transition-all hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {evidenceForm.processing ? 'Mengirim...' : 'Kirim Permintaan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: EXTEND DISPUTE SLA */}
            {showSlaModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div
                        onClick={() => setShowSlaModal(false)}
                        className="absolute inset-0 cursor-pointer bg-black/60 backdrop-blur-sm"
                    />
                    <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 font-['Outfit']">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                            <h3 className="text-sm font-extrabold tracking-wider text-slate-900 uppercase dark:text-white flex items-center gap-2">
                                <Clock size={16} className="text-amber-600 dark:text-amber-400" />
                                Perpanjang SLA Arbitrase
                            </h3>
                            <button
                                onClick={() => setShowSlaModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleExtendSlaSubmit} className="mt-4 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                                    Tambahan Waktu SLA <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={slaForm.data.additional_hours}
                                    onChange={(e) =>
                                        slaForm.setData('additional_hours', parseInt(e.target.value) as any)
                                    }
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-amber-600 focus:outline-none dark:border-slate-800 dark:bg-[#0d0f17] dark:text-white"
                                >
                                    <option value={24}>+24 Jam (1 Hari)</option>
                                    <option value={48}>+48 Jam (2 Hari)</option>
                                    <option value={72}>+72 Jam (3 Hari)</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                                    Alasan Perpanjangan SLA <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Jelaskan mengapa waktu respon terlapor diperpanjang (misal: kendala koneksi terlapor yang terverifikasi, libur nasional)..."
                                    value={slaForm.data.reason}
                                    onChange={(e) => slaForm.setData('reason', e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-semibold text-slate-900 focus:border-amber-600 focus:outline-none dark:border-slate-800 dark:bg-[#0d0f17] dark:text-white"
                                />
                                {slaForm.errors.reason && (
                                    <p className="text-xs font-semibold text-red-500">{slaForm.errors.reason}</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowSlaModal(false)}
                                    className="cursor-pointer rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={slaForm.processing}
                                    className="cursor-pointer rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white uppercase transition-all hover:bg-amber-700 disabled:opacity-50"
                                >
                                    {slaForm.processing ? 'Menyimpan...' : 'Perpanjang SLA'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: P2P COMPLIANCE VERIFICATION */}
            {showComplianceModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div
                        onClick={() => setShowComplianceModal(false)}
                        className="absolute inset-0 cursor-pointer bg-black/60 backdrop-blur-sm"
                    />
                    <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 font-['Outfit']">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                            <h3 className="text-sm font-extrabold tracking-wider text-slate-900 uppercase dark:text-white flex items-center gap-2">
                                <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                                Audit Kepatuhan Transfer P2P
                            </h3>
                            <button
                                onClick={() => setShowComplianceModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleComplianceSubmit} className="mt-4 space-y-4">
                            {/* Review Evidence Strip in Modal */}
                            {dispute?.p2p_compliance?.proof_file && (
                                <div className="rounded-xl border border-indigo-500/30 bg-indigo-50/10 p-3 text-xs dark:bg-indigo-950/20 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                                            <FileText size={13} />
                                            Berkas Bukti Pembayaran
                                        </span>
                                        <a
                                            href={dispute.p2p_compliance.proof_file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 text-[11px] dark:text-indigo-400"
                                        >
                                            Buka Resi <ExternalLink size={10} />
                                        </a>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-indigo-500/20 pt-2 text-slate-700 dark:text-slate-300">
                                        <div>
                                            <span className="text-slate-500 block">Bank / E-Wallet:</span>
                                            <span className="font-bold">{dispute.p2p_compliance.bank_source || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">Nama Tujuan:</span>
                                            <span className="font-bold">{dispute.p2p_compliance.account_name_destination || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">No. Ref (RRN):</span>
                                            <span className="font-mono font-bold">{dispute.p2p_compliance.transaction_ref_no || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">Jumlah Mutasi:</span>
                                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(dispute.p2p_compliance.amount ?? 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                                    Status Kepatuhan Para Pihak <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={complianceForm.data.compliance_status}
                                    onChange={(e) =>
                                        complianceForm.setData('compliance_status', e.target.value as any)
                                    }
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-[#0d0f17] dark:text-white"
                                >
                                    <option value="verified">Patuh (Transfer P2P Terverifikasi Tuntas)</option>
                                    <option value="non_compliant">Wanprestasi / Menolak Mematuhi Putusan</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                                    Catatan Audit Kepatuhan <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Tuliskan catatan verifikasi bukti transfer P2P (restitusi DP atau pelunasan sisa) yang telah diperiksa oleh mediator..."
                                    value={complianceForm.data.audit_note}
                                    onChange={(e) => complianceForm.setData('audit_note', e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-[#0d0f17] dark:text-white"
                                />
                                {complianceForm.errors.audit_note && (
                                    <p className="text-xs font-semibold text-red-500">
                                        {complianceForm.errors.audit_note}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowComplianceModal(false)}
                                    className="cursor-pointer rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={complianceForm.processing}
                                    className="cursor-pointer rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white uppercase transition-all hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {complianceForm.processing ? 'Menyimpan...' : 'Simpan Audit Kepatuhan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
