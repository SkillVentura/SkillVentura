import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import {
    ShieldAlert,
    Scale,
    Lock,
    Clock,
    FileText,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ExternalLink,
    Upload,
    Award,
    DollarSign,
    UserCheck,
    MessageSquare,
    Users,
    Briefcase,
    Ban,
    ShieldCheck,
    AlertOctagon,
    Check,
    PlusCircle,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import QuestChatPanel from '@/components/Quest/QuestChatPanel';
import { Quest, Bid, QuestEvidenceRequest } from '@/types/quest';

interface Props {
    quest: Quest;
    bids: Bid[];
    isCreator: boolean;
    isWorker: boolean;
}

export default function MediationWarRoom({
    quest,
    bids,
    isCreator,
    isWorker,
}: Props) {
    const dispute = quest.dispute;
    const isDisputeResolved = Boolean(dispute?.status?.startsWith('resolved') || dispute?.ruling);
    const isFiler = dispute?.filer_id === (isCreator ? quest.creator_id : quest.worker_id);
    const canRespondDispute = !isDisputeResolved && !isFiler && !dispute?.response;

    // Modals
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [showEvidenceUploadModal, setShowEvidenceUploadModal] = useState(false);
    const [selectedEvidenceRequest, setSelectedEvidenceRequest] = useState<QuestEvidenceRequest | null>(null);
    const [showComplianceUploadModal, setShowComplianceUploadModal] = useState(false);
    const [showBilateralDetails, setShowBilateralDetails] = useState(false);

    // Form: Respond to Dispute
    const disputeResponseForm = useForm<{
        response_note: string;
        evidence_files: File[];
    }>({
        response_note: '',
        evidence_files: [],
    });

    // Form: Submit requested evidence
    const evidenceSubmitForm = useForm<{
        request_id: string;
        notes: string;
        evidence_files: File[];
    }>({
        request_id: '',
        notes: '',
        evidence_files: [],
    });

    // Form: Upload P2P Compliance Proof
    const complianceProofForm = useForm<{
        compliance_proof: File | null;
        transfer_note: string;
        bank_source: string;
        account_name_destination: string;
        transaction_ref_no: string;
        transferred_at: string;
        amount: string;
    }>({
        compliance_proof: null,
        transfer_note: '',
        bank_source: '',
        account_name_destination: '',
        transaction_ref_no: '',
        transferred_at: '',
        amount: '',
    });

    const acceptedBid = bids.find(
        (b) =>
            b.status === 'accepted' ||
            (quest.worker_id && b.student?._id === quest.worker_id),
    ) || bids[0];

    const agreedPrice = quest.accepted_bid_amount ?? acceptedBid?.bid_amount ?? quest.max_salary ?? quest.max_budget ?? 0;
    const dpAmount = quest.dp_amount || 0;
    const dpPercentage = quest.dp_percentage || 0;
    const remainingContract = Math.max(0, agreedPrice - dpAmount);

    const filerName = dispute?.filer_name || (dispute?.filer_id === quest.creator_id ? (quest.creator?.name || 'Klien') : (quest.worker?.name || 'Pekerja'));
    const defendantName = dispute?.filer_id === quest.creator_id ? (quest.worker?.name || 'Pekerja') : (quest.creator?.name || 'Klien');

    // Check if current user is the party that needs to pay post-ruling
    const ruling = dispute?.ruling;
    const awardFinancialOrder = dispute?.award?.financial_order;
    const p2pCompliance = dispute?.p2p_compliance;

    const isPayingParty =
        isDisputeResolved &&
        ((awardFinancialOrder?.paying_party === 'worker' && isWorker) ||
            (awardFinancialOrder?.paying_party === 'creator' && isCreator) ||
            (p2pCompliance?.paying_party === 'worker' && isWorker) ||
            (p2pCompliance?.paying_party === 'creator' && isCreator) ||
            (['refund', 'refund_creator'].includes(ruling ?? '') && isWorker) ||
            (['pay_worker', 'release_payout'].includes(ruling ?? '') && isCreator));

    // Submit Dispute Response
    const handleDisputeResponseSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        disputeResponseForm.post(`/quests/${quest.slug}/respond-dispute`, {
            onSuccess: () => {
                setShowResponseModal(false);
                disputeResponseForm.reset();
            },
        });
    };

    // Submit Evidence Request
    const handleEvidenceSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        evidenceSubmitForm.post(`/quests/${quest.slug}/submit-evidence-request`, {
            onSuccess: () => {
                setShowEvidenceUploadModal(false);
                setSelectedEvidenceRequest(null);
                evidenceSubmitForm.reset();
            },
        });
    };

    // Submit P2P Compliance Proof
    const handleComplianceProofSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        complianceProofForm.post(`/quests/${quest.slug}/upload-p2p-compliance-proof`, {
            onSuccess: () => {
                setShowComplianceUploadModal(false);
                complianceProofForm.reset();
            },
        });
    };

    const formatCurrency = (num: number | null) => {
        if (num === null || num === undefined) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(num);
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <div className="w-full space-y-8 font-['Outfit']">
            {/* 1. TOP PRIVACY & CASE METADATA HEADER */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-gradient-to-b dark:from-[#0e0e1a] dark:to-[#090910]">
                <div className="absolute top-0 right-8 left-8 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5 dark:border-slate-800/80">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <span className="font-mono text-xs font-black tracking-widest text-amber-600 uppercase dark:text-amber-400">
                                {dispute?.memo_number ?? `KASUS #DSP-${(quest.slug || quest.id || quest._id).substring(0, 8).toUpperCase()}`}
                            </span>
                            <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                    isDisputeResolved
                                        ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                        : 'border border-red-500/40 bg-red-500/10 text-red-700 animate-pulse dark:text-red-400'
                                }`}
                            >
                                {isDisputeResolved ? 'Putusan Inkracht (Selesai)' : 'Sengketa Aktif (Fase Mediasi Tripartit)'}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[9px] font-extrabold uppercase text-amber-900 dark:border-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                                <Lock size={9} />
                                Akses Tertutup & Terisolasi
                            </span>
                        </div>
                        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Ruang Sidang Mediasi & Arbitrase Privat
                        </h2>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Ruangan ini diisolasi secara penuh dari publik. Hanya Pembuat Quest, Kontraktor Ditunjuk, dan Tim Dewan Arbitrase SkillVentura yang memiliki hak akses.
                        </p>
                    </div>

                    {/* SLA Status Pill */}
                    <div className="flex items-center gap-3">
                        {!isDisputeResolved && (
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
                            {formatCurrency(agreedPrice)}
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
                            {isCreator ? 'ANDA' : 'KL'}
                        </div>
                        <div className="min-w-0">
                            <span className="block text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                                {isCreator ? 'Anda (Klien / Pembuat Quest)' : 'Pihak Klien (Pembuat Quest)'}
                            </span>
                            <span className="block truncate text-xs font-bold text-slate-900 dark:text-white">
                                {quest.creator?.name ?? 'Unknown'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-[#030712]">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                            {isWorker ? 'ANDA' : 'PK'}
                        </div>
                        <div className="min-w-0">
                            <span className="block text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                                {isWorker ? 'Anda (Pekerja / Freelancer)' : 'Pihak Pekerja (Freelancer)'}
                            </span>
                            <span className="block truncate text-xs font-bold text-slate-900 dark:text-white">
                                {quest.worker?.name ?? 'Belum Ada Pekerja'}
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
                                Jejak musyawarah dan negosiasi langsung antara Klien dan Pekerja sebelum eskalasi sengketa ke Dewan Arbitrase.
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
                        Kedua belah pihak tidak menempuh resolusi bilateral mandiri dan langsung mengajukan eskalasi ke Dewan Arbitrase Admin.
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
                            Pemeriksaan berkas bukti digital, hak sanggah terlapor, dan saluran mediasi 3-arah bersama Dewan Arbitrase.
                        </p>
                    </div>
                </div>

                {/* 2-Column Layout */}
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                    {/* LEFT COLUMN: EVIDENCE DOSSIER & DISCOVERY REQUESTS (lg:col-span-7) */}
                    <div className="space-y-6 lg:col-span-7">
                        {/* Dossier Gugatan Pelapor */}
                        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 dark:border-red-500/30 dark:bg-red-950/20 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-500/20 pb-3 text-xs font-semibold">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 dark:text-white">
                                        Gugatan Diajukan Oleh:{' '}
                                        <strong className="text-red-700 dark:text-red-300">
                                            {filerName} {isFiler ? '(Anda)' : ''}
                                        </strong>
                                    </span>
                                    {dispute?.category_label && (
                                        <span className="rounded-md border border-red-500/40 bg-red-500/20 px-2 py-0.5 text-[10px] font-extrabold text-red-700 uppercase dark:text-red-300">
                                            {dispute.category_label}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] text-slate-500">
                                    Waktu: {dispute?.ruled_at ? formatDate(dispute.ruled_at) : 'Dispute Aktif'}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                                    Argumen & Narasi Gugatan:
                                </span>
                                <p className="rounded-xl border border-slate-300/80 bg-white p-3.5 text-xs font-semibold text-slate-800 italic dark:border-slate-800 dark:bg-[#0d0f17] dark:text-slate-200">
                                    "{dispute?.reason || 'Tidak ada uraian kronologi.'}"
                                </p>
                            </div>

                            {/* Evidence files */}
                            {dispute?.evidence_files && dispute.evidence_files.length > 0 && (
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

                        {/* Tanggapan Pihak Terlapor */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0d0f17] space-y-3">
                            <h4 className="border-b border-slate-200 pb-2 text-xs font-bold tracking-wider text-slate-900 uppercase dark:border-slate-800 dark:text-white">
                                Klarifikasi & Bukti Tandingan Pihak Terlapor
                            </h4>

                            {dispute?.response ? (
                                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                                            <CheckCircle2 size={14} />
                                            Tanggapan Resmi: {dispute.response.responder_name} {!isFiler ? '(Anda)' : ''}
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

                                    {/* Counter evidence files */}
                                    {(dispute.response as any).evidence_files && (dispute.response as any).evidence_files.length > 0 && (
                                        <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                                                Berkas Bukti Tandingan:
                                            </span>
                                            <div className="flex flex-wrap gap-2">
                                                {(dispute.response as any).evidence_files.map((file: any, idx: number) => (
                                                    <a
                                                        key={idx}
                                                        href={file.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-indigo-600 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0d0f17] dark:text-indigo-400 dark:hover:bg-slate-800/80"
                                                    >
                                                        <FileText size={13} />
                                                        <span className="max-w-[200px] truncate">{file.name}</span>
                                                        <ExternalLink size={11} />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : canRespondDispute ? (
                                <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200">
                                    <div className="flex items-start gap-3">
                                        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                                        <div>
                                            <span className="block font-bold">
                                                Hak Sanggah & Klarifikasi Anda (SLA 48 Jam)
                                            </span>
                                            <p className="mt-1 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                                                Anda terdaftar sebagai pihak terlapor dalam gugatan sengketa ini. Silakan sampaikan kronologi versi Anda dan unggah berkas bukti tandingan sebelum Dewan Arbitrase menjatuhkan putusan mengikat.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setShowResponseModal(true)}
                                            className="cursor-pointer rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-indigo-700"
                                        >
                                            Beri Tanggapan Resmi & Unggah Bukti Tandingan
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
                                    <Clock size={16} className="text-slate-400" />
                                    <span>Menunggu tanggapan resmi dan bukti tandingan dari pihak terlapor (SLA 48 jam).</span>
                                </div>
                            )}
                        </div>

                        {/* Confidential Discovery Requests by Mediator */}
                        {(() => {
                            const myEvidenceRequests = (dispute?.evidence_requests || []).filter((req) =>
                                req.target_party === 'both' ||
                                (req.target_party === 'creator' && isCreator) ||
                                (req.target_party === 'worker' && isWorker)
                            );

                            if (myEvidenceRequests.length === 0) return null;

                            return (
                                <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5 dark:border-indigo-500/30 dark:bg-indigo-950/20 space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-500/20 pb-3">
                                        <div className="flex items-center gap-2">
                                            <ShieldAlert size={16} className="text-indigo-600 dark:text-indigo-400" />
                                            <h4 className="text-xs font-bold tracking-wider text-indigo-950 uppercase dark:text-indigo-200">
                                                Permintaan Bukti Tambahan dari Dewan Mediator ({myEvidenceRequests.length})
                                            </h4>
                                        </div>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                                            <Lock size={10} />
                                            Konfidensial: Hanya Anda & Mediator
                                        </span>
                                    </div>

                                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                        Instruksi dan berkas yang Anda serahkan pada bagian ini bersifat tertutup antara Anda dan Dewan Mediator. Pihak lawan tidak memiliki akses terhadap permintaan maupun berkas yang Anda berikan.
                                    </p>

                                    <div className="space-y-3 pt-1">
                                        {myEvidenceRequests.map((req) => (
                                            <div
                                                key={req.id}
                                                className="rounded-xl border border-slate-200 bg-white p-4 text-xs shadow-sm dark:border-slate-800 dark:bg-[#0d0f17] space-y-2"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="inline-flex items-center gap-1 rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                                                        <Lock size={10} />
                                                        {req.target_party === 'both' ? 'Instruksi Bersama' : 'Khusus Untuk Anda'}
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
                                                            {req.status === 'submitted' ? 'Telah Diserahkan' : 'Menunggu Anda'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <p className="font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                                                    "{req.instruction}"
                                                </p>

                                                {/* If current user is target and not yet submitted */}
                                                {req.status !== 'submitted' && !isDisputeResolved && (
                                                    <div className="pt-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedEvidenceRequest(req);
                                                                evidenceSubmitForm.setData('request_id', req.id);
                                                                setShowEvidenceUploadModal(true);
                                                            }}
                                                            className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                                                        >
                                                            <Upload size={13} />
                                                            Unggah Bukti Tambahan Yang Diminta
                                                        </button>
                                                    </div>
                                                )}

                                                {/* If submitted, show files */}
                                                {req.status === 'submitted' && (
                                                    <div className="space-y-1.5 border-t border-slate-100 pt-2 dark:border-slate-800">
                                                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                                                            <span>Berkas Bukti Diserahkan ({req.submitted_by}):</span>
                                                            <span className="text-emerald-600 dark:text-emerald-400">
                                                                Terkirim ke Mediator
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
                            );
                        })()}
                    </div>

                    {/* RIGHT COLUMN: EMBEDDED TRIPARTITE CHAT (lg:col-span-5) */}
                    <div className="lg:col-span-5 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
                            <span className="flex items-center gap-1.5">
                                <MessageSquare size={14} className="text-indigo-600 dark:text-indigo-400" />
                                Ruang Mediasi Tripartit
                            </span>
                            <span className="text-[10px] font-normal text-slate-500">
                                Klien • Pekerja • Mediator
                            </span>
                        </div>
                        {acceptedBid ? (
                            <QuestChatPanel
                                bidId={acceptedBid._id}
                                questTitle={quest.title}
                                targetUserName={isCreator ? (quest.worker?.name || 'Pekerja') : (quest.creator?.name || 'Klien')}
                                isDisputed={true}
                                creatorId={quest.creator_id}
                                workerId={quest.worker_id ?? undefined}
                                embedded={true}
                                className="h-[650px] w-full"
                                isLocked={isDisputeResolved}
                                lockedReason="Ruang mediasi tripartit ditutup permanen karena amar putusan arbitrase telah ditetapkan dan berkekuatan hukum tetap."
                            />
                        ) : (
                            <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-slate-300 bg-white p-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-[#0d1117]">
                                <MessageSquare className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                                <p>Thread obrolan mediasi tidak tersedia karena belum ada penawaran kontrak yang diterima.</p>
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
                        <Award size={18} className="text-purple-600 dark:text-purple-400" />
                        <div>
                            <h3 className="text-sm font-extrabold tracking-wider text-slate-900 uppercase dark:text-white">
                                Fase 3: Putusan Arbitrase Mengikat (Tier 3 Binding Arbitration Ruling)
                            </h3>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                Penetapan vonis resmi oleh Dewan Mediator yang mengikat kedua belah pihak secara hukum dan operasional.
                            </p>
                        </div>
                    </div>
                </div>

                {isDisputeResolved && dispute ? (
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
                                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 dark:border-emerald-500/20 dark:bg-emerald-950/30">
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

                                <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4 dark:border-indigo-500/20 dark:bg-indigo-950/30">
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

                                <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4 dark:border-purple-500/20 dark:bg-purple-950/30">
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

                        {dispute.legal_disclaimer && (
                            <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 italic text-right border-t border-emerald-500/20 pt-3">
                                {dispute.legal_disclaimer}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-[#030712] dark:text-slate-400">
                        Kasus saat ini sedang dalam proses pemeriksaan bukti dan mediasi aktif oleh Dewan Mediator. Putusan mengikat akan diterbitkan setelah masa penyelidikan selesai.
                    </div>
                )}
            </div>

            {/* 5. FASE 4: PENEGAKAN PUTUSAN & KEPATUHAN TRANSFER P2P (TIER 4) */}
            {isDisputeResolved && (
                <div className="relative space-y-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-gradient-to-b dark:from-[#0e0e1a] dark:to-[#090910]">
                    <div className="absolute top-0 right-8 left-8 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
                            <div>
                                <h3 className="text-sm font-extrabold tracking-wider text-slate-900 uppercase dark:text-white">
                                    Fase 4: Penegakan Putusan & Kepatuhan Transfer P2P (Tier 4 Compliance)
                                </h3>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                    Pelaksanaan transfer pemenuhan putusan arbitrase secara peer-to-peer dan audit forensik bukti mutasi perbankan.
                                </p>
                            </div>
                        </div>
                        {dispute?.p2p_compliance && (
                            <span
                                className={`rounded px-2.5 py-1 text-xs font-black uppercase ${
                                    dispute.p2p_compliance.status === 'verified'
                                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                        : dispute.p2p_compliance.status === 'non_compliant'
                                          ? 'bg-red-500/20 text-red-700 dark:text-red-300'
                                          : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                }`}
                            >
                                {dispute.p2p_compliance.status === 'verified'
                                    ? 'Patuh (Verified)'
                                    : dispute.p2p_compliance.status === 'non_compliant'
                                      ? 'Wanprestasi (Non-Compliant)'
                                      : dispute.p2p_compliance.status === 'pending_payment'
                                        ? 'Menunggu Pembayaran P2P'
                                        : 'Menunggu Verifikasi Mediator'}
                            </span>
                        )}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-[#030712] space-y-4">
                        {isPayingParty ? (
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-300">
                                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                                    <div className="space-y-1">
                                        <span className="font-extrabold text-sm block">
                                            Kewajiban Eksekusi Transfer P2P Anda
                                        </span>
                                        <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                                            Sesuai amar putusan arbitrase resmi, Anda diwajibkan melakukan transfer penyelesaian sebesar{' '}
                                            <strong className="text-amber-900 dark:text-amber-200 font-black">
                                                {formatCurrency(
                                                    dispute?.award?.financial_order?.amount ??
                                                        dispute?.p2p_compliance?.amount ??
                                                        (['refund', 'refund_creator'].includes(ruling ?? '')
                                                            ? dpAmount
                                                            : remainingContract)
                                                )}
                                            </strong>{' '}
                                            kepada pihak lawan dalam batas waktu maksimal 72 jam.
                                        </p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                                            ⚠️ Kelalaian dalam melakukan transfer atau pengunggahan struk palsu akan memicu sanksi wanprestasi otomatis (pemblokiran akun permanen & blacklist identitas/rekening).
                                        </p>
                                    </div>
                                </div>

                                {dispute?.p2p_compliance?.proof_file ? (
                                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 text-sm">
                                                <CheckCircle2 size={16} />
                                                Bukti Transfer Telah Anda Unggah
                                            </span>
                                            <span className="text-[10px] text-slate-500">
                                                {formatDate(dispute.p2p_compliance.proof_uploaded_at)}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4 border-t border-emerald-500/20 text-[11px]">
                                            <div>
                                                <span className="text-slate-500 block">Bank Pengirim:</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                                    {dispute.p2p_compliance.bank_source || '-'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 block">Rekening Tujuan:</span>
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
                                                <span className="text-slate-500 block">Berkas Resi:</span>
                                                <a
                                                    href={dispute.p2p_compliance.proof_file.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 dark:text-indigo-400"
                                                >
                                                    <FileText size={12} />
                                                    Lihat Struk <ExternalLink size={10} />
                                                </a>
                                            </div>
                                        </div>

                                        {dispute.p2p_compliance.transfer_note && (
                                            <p className="text-slate-600 dark:text-slate-300 italic text-[11px] pt-1">
                                                "{dispute.p2p_compliance.transfer_note}"
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setShowComplianceUploadModal(true)}
                                        className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-all"
                                    >
                                        <Upload size={15} />
                                        Unggah Bukti Transfer Kepatuhan P2P & Data Perbankan
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3 text-xs">
                                <span className="font-bold text-slate-800 dark:text-white block text-sm">
                                    Status Pelaksanaan Putusan Oleh Pihak Terkait:
                                </span>
                                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                                    {dispute?.p2p_compliance?.status === 'verified'
                                        ? 'Pihak terkait telah melakukan transfer P2P dan telah diverifikasi sah oleh Dewan Mediator.'
                                        : dispute?.p2p_compliance?.status === 'pending_verification'
                                          ? 'Pihak terkait telah mengunggah bukti mutasi transfer perbankan. Dewan Mediator sedang melakukan audit nomor referensi (RRN) dan keaslian transaksi.'
                                          : 'Pihak terkait sedang dalam tenggat waktu (72 jam) untuk melaksanakan kewajiban transfer P2P sesuai amar putusan.'}
                                </p>

                                {dispute?.p2p_compliance?.proof_file && (
                                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-[#0d0f17] space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-700 dark:text-slate-300">
                                                Metadata Bukti Transfer Yang Dilaporkan:
                                            </span>
                                            <a
                                                href={dispute.p2p_compliance.proof_file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 dark:text-indigo-400 text-xs"
                                            >
                                                <FileText size={12} />
                                                Lihat Resi <ExternalLink size={10} />
                                            </a>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-3">
                                            <div>
                                                <span className="text-slate-500 block">Bank:</span>
                                                <span className="font-semibold">{dispute.p2p_compliance.bank_source || '-'}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 block">Nama Tujuan:</span>
                                                <span className="font-semibold">{dispute.p2p_compliance.account_name_destination || '-'}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 block">No. Ref (RRN):</span>
                                                <span className="font-mono font-semibold">{dispute.p2p_compliance.transaction_ref_no || '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {dispute?.p2p_compliance?.audit_note && (
                                    <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-[#0d0f17]">
                                        <span className="block text-[10px] font-bold text-slate-500 uppercase">
                                            Catatan Audit Mediator:
                                        </span>
                                        <p className="italic text-slate-800 dark:text-slate-200">
                                            "{dispute.p2p_compliance.audit_note}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL 1: SUBMIT COUNTER-RESPONSE & EVIDENCE */}
            {showResponseModal && (
                <Modal
                    open={showResponseModal}
                    onClose={() => setShowResponseModal(false)}
                    title="Beri Tanggapan Resmi & Bukti Tandingan"
                >
                    <form onSubmit={handleDisputeResponseSubmit} className="space-y-4">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Berikan argumen tandingan dan bukti digital pendukung untuk dipertimbangkan oleh Administrator sebelum putusan akhir diterbitkan.
                        </p>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Uraian Klarifikasi & Pembelaan <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={disputeResponseForm.data.response_note}
                                onChange={(e) => disputeResponseForm.setData('response_note', e.target.value)}
                                rows={4}
                                required
                                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                placeholder="Jelaskan fakta pengerjaan, alasan keterlambatan, kesesuaian revisi, atau bukti kesepakatan obrolan..."
                            />
                            {disputeResponseForm.errors.response_note && (
                                <p className="mt-1 text-xs text-red-500">{disputeResponseForm.errors.response_note}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Berkas Bukti Tandingan (Maks. 5 file, maks 10MB per file)
                            </label>
                            <input
                                type="file"
                                multiple
                                onChange={(e) => {
                                    if (e.target.files) {
                                        disputeResponseForm.setData('evidence_files', Array.from(e.target.files));
                                    }
                                }}
                                className="mt-1 block w-full text-xs text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-950 dark:file:text-indigo-400"
                            />
                            {disputeResponseForm.errors.evidence_files && (
                                <p className="mt-1 text-xs text-red-500">{disputeResponseForm.errors.evidence_files}</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-3">
                            <button
                                type="button"
                                onClick={() => setShowResponseModal(false)}
                                className="rounded-lg bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={disputeResponseForm.processing}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {disputeResponseForm.processing ? 'Mengirimkan...' : 'Kirim Tanggapan Resmi'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* MODAL 2: SUBMIT REQUESTED EVIDENCE */}
            {showEvidenceUploadModal && selectedEvidenceRequest && (
                <Modal
                    open={showEvidenceUploadModal}
                    onClose={() => setShowEvidenceUploadModal(false)}
                    title="Unggah Bukti Tambahan Yang Diminta Mediator"
                >
                    <form onSubmit={handleEvidenceSubmit} className="space-y-4 font-['Outfit']">
                        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3.5 text-xs">
                            <span className="block text-[10px] font-bold text-indigo-700 uppercase dark:text-indigo-300">
                                Instruksi Dari Mediator:
                            </span>
                            <p className="mt-1 font-semibold text-slate-800 dark:text-slate-200 italic">
                                "{selectedEvidenceRequest.instruction}"
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Catatan Klarifikasi Berkas
                            </label>
                            <textarea
                                value={evidenceSubmitForm.data.notes}
                                onChange={(e) => evidenceSubmitForm.setData('notes', e.target.value)}
                                rows={3}
                                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                placeholder="Jelaskan berkas apa yang Anda lampirkan sesuai permintaan mediator..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Berkas Bukti (Maks. 5 file, maks 10MB per file) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="file"
                                multiple
                                required
                                onChange={(e) => {
                                    if (e.target.files) {
                                        evidenceSubmitForm.setData('evidence_files', Array.from(e.target.files));
                                    }
                                }}
                                className="mt-1 block w-full text-xs text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-950 dark:file:text-indigo-400"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-3">
                            <button
                                type="button"
                                onClick={() => setShowEvidenceUploadModal(false)}
                                className="rounded-lg bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={evidenceSubmitForm.processing}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {evidenceSubmitForm.processing ? 'Mengunggah...' : 'Kirim Berkas Bukti'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* MODAL 3: UPLOAD P2P COMPLIANCE PROOF */}
            {showComplianceUploadModal && (
                <Modal
                    open={showComplianceUploadModal}
                    onClose={() => setShowComplianceUploadModal(false)}
                    title="Unggah Bukti Transfer Kepatuhan P2P"
                >
                    <form onSubmit={handleComplianceProofSubmit} className="space-y-3.5 font-['Outfit']">
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs">
                            <span className="block font-bold text-emerald-800 dark:text-emerald-300">
                                Audit Forensik Perbankan P2P (Non-Escrow)
                            </span>
                            <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                                Harap lengkapi rincian mutasi transfer bank secara presisi. Data ini akan diverifikasi oleh Dewan Mediator untuk memastikan keaslian transaksi.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Bank / E-Wallet Pengirim <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={complianceProofForm.data.bank_source}
                                    onChange={(e) => complianceProofForm.setData('bank_source', e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    placeholder="Contoh: BCA, Mandiri, BRI, GoPay"
                                />
                                {complianceProofForm.errors.bank_source && (
                                    <p className="mt-1 text-xs text-red-500">{complianceProofForm.errors.bank_source}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Nama Pemilik Rekening Tujuan <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={complianceProofForm.data.account_name_destination}
                                    onChange={(e) => complianceProofForm.setData('account_name_destination', e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    placeholder="Nama pemilik rekening penerima"
                                />
                                {complianceProofForm.errors.account_name_destination && (
                                    <p className="mt-1 text-xs text-red-500">{complianceProofForm.errors.account_name_destination}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Nomor Referensi Transaksi (RRN) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={complianceProofForm.data.transaction_ref_no}
                                    onChange={(e) => complianceProofForm.setData('transaction_ref_no', e.target.value)}
                                    className="mt-1 w-full font-mono rounded-lg border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    placeholder="Contoh: 2026092012345678"
                                />
                                {complianceProofForm.errors.transaction_ref_no && (
                                    <p className="mt-1 text-xs text-red-500">{complianceProofForm.errors.transaction_ref_no}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Nominal Transfer (Rp)
                                </label>
                                <input
                                    type="number"
                                    value={complianceProofForm.data.amount}
                                    onChange={(e) => complianceProofForm.setData('amount', e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    placeholder={String(
                                        dispute?.award?.financial_order?.amount ??
                                            dispute?.p2p_compliance?.amount ??
                                            0
                                    )}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Keterangan Tambahan / Berita Transfer <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={complianceProofForm.data.transfer_note}
                                onChange={(e) => complianceProofForm.setData('transfer_note', e.target.value)}
                                rows={2}
                                required
                                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                placeholder="Tuliskan berita transfer sesuai struk m-banking..."
                            />
                            {complianceProofForm.errors.transfer_note && (
                                <p className="mt-1 text-xs text-red-500">{complianceProofForm.errors.transfer_note}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Berkas Resi / Struk Mutasi M-Banking (JPG, PNG, PDF maks 10MB) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="file"
                                required
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        complianceProofForm.setData('compliance_proof', e.target.files[0]);
                                    }
                                }}
                                className="mt-1 block w-full text-xs text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-950 dark:file:text-emerald-400"
                            />
                            {complianceProofForm.errors.compliance_proof && (
                                <p className="mt-1 text-xs text-red-500">{complianceProofForm.errors.compliance_proof}</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowComplianceUploadModal(false)}
                                className="rounded-lg bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={complianceProofForm.processing}
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                            >
                                {complianceProofForm.processing ? 'Mengunggah...' : 'Kirim Bukti Kepatuhan'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
