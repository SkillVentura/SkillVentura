<?php

namespace App\Services\Quest;

use App\Actions\Quest\AcceptQuestBidAction;
use App\Actions\Quest\ApproveQuestWorkAction;
use App\Actions\Quest\AwardQuestRewardsAction;
use App\Actions\Quest\ConfirmFinalDeliveryAction;
use App\Actions\Quest\ConfirmQuestDownPaymentAction;
use App\Actions\Quest\CreateQuestAction;
use App\Actions\Quest\ExtendQuestDeadlineAction;
use App\Actions\Quest\FileQuestDisputeAction;
use App\Actions\Quest\PlaceQuestBidAction;
use App\Actions\Quest\RecordQuestTransactionAction;
use App\Actions\Quest\RejectQuestWorkAction;
use App\Actions\Quest\RequestFinalZipRevisionAction;
use App\Actions\Quest\RequestMutualCancellationAction;
use App\Actions\Quest\RequestQuestExtensionAction;
use App\Actions\Quest\RequestQuestRevisionAction;
use App\Actions\Quest\ResolveQuestArbitrationAction;
use App\Actions\Quest\RespondMutualCancellationAction;
use App\Actions\Quest\RespondQuestExtensionAction;
use App\Actions\Quest\SubmitFinalZipAction;
use App\Actions\Quest\SubmitQuestWorkAction;
use App\Actions\Quest\UploadQuestDownPaymentProofAction;
use App\Actions\Quest\UploadQuestPaymentProofAction;
use App\Enums\QuestBidStatus;
use App\Enums\QuestStatus;
use App\Models\Notification;
use App\Models\Quest;
use App\Models\QuestBid;
use App\Models\QuestMessage;
use App\Models\QuestTransaction;
use App\Models\User;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class QuestService
{
    public function __construct(
        protected CreateQuestAction $createQuestAction,
        protected PlaceQuestBidAction $placeQuestBidAction,
        protected AcceptQuestBidAction $acceptQuestBidAction,
        protected AwardQuestRewardsAction $awardQuestRewardsAction,
        protected FileQuestDisputeAction $fileQuestDisputeAction,
        protected ResolveQuestArbitrationAction $resolveQuestArbitrationAction,
        protected RecordQuestTransactionAction $recordQuestTransactionAction,
        protected SubmitQuestWorkAction $submitQuestWorkAction,
        protected ApproveQuestWorkAction $approveQuestWorkAction,
        protected RejectQuestWorkAction $rejectQuestWorkAction,
        protected UploadQuestPaymentProofAction $uploadQuestPaymentProofAction,
        protected UploadQuestDownPaymentProofAction $uploadQuestDownPaymentProofAction,
        protected ConfirmQuestDownPaymentAction $confirmQuestDownPaymentAction,
        protected SubmitFinalZipAction $submitFinalZipAction,
        protected ConfirmFinalDeliveryAction $confirmFinalDeliveryAction,
        protected RequestFinalZipRevisionAction $requestFinalZipRevisionAction,
        protected RequestQuestRevisionAction $requestQuestRevisionAction,
        protected ExtendQuestDeadlineAction $extendQuestDeadlineAction,
        protected RequestQuestExtensionAction $requestQuestExtensionAction,
        protected RespondQuestExtensionAction $respondQuestExtensionAction,
        protected RequestMutualCancellationAction $requestMutualCancellationAction,
        protected RespondMutualCancellationAction $respondMutualCancellationAction
    ) {}

    /**
     * Get list of quests with filters.
     */
    public function listQuests(?string $search = null, ?string $status = null, ?int $limit = null): array
    {
        // On-the-fly expiration check for open quests
        $expiredQuests = Quest::where('status', QuestStatus::OPEN->value)
            ->where('deadline', '<', now())
            ->get();

        foreach ($expiredQuests as $eq) {
            $eq->status = QuestStatus::EXPIRED->value;
            $eq->save();

            if ($eq->creator_id) {
                Notification::create([
                    'notifiable_type' => User::class,
                    'notifiable_id' => $eq->creator_id,
                    'data' => [
                        'quest_id' => $eq->_id,
                        'title' => $eq->title,
                        'message' => "Quest Anda '{$eq->title}' telah kadaluarsa karena tidak ada pekerja yang dipilih hingga melewati batas tenggat waktu.",
                        'type' => 'quest_expired_creator',
                    ],
                    'read_at' => null,
                ]);
            }
        }

        $query = Quest::with('creator')
            ->whereNotIn('status', [QuestStatus::DRAFT->value, QuestStatus::REJECTED->value]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        $total = $query->count();

        if ($limit) {
            $query->limit($limit);
        }

        $quests = $query->latest()->get();
        $questIds = $quests->pluck('_id')->map(fn ($id) => (string) $id)->toArray();
        $bidCounts = QuestBid::whereIn('quest_id', $questIds)->get()->groupBy('quest_id')->map->count();

        $items = $quests->map(function ($quest) use ($bidCounts) {
            $statusVal = $quest->status instanceof QuestStatus ? $quest->status->value : $quest->status;

            return [
                '_id' => (string) $quest->_id,
                'id' => (string) $quest->_id,
                'slug' => $quest->slug ?: Str::slug($quest->title),
                'title' => $quest->title,
                'description' => $quest->description,
                'min_budget' => $quest->min_budget,
                'max_budget' => $quest->max_budget,
                'min_salary' => $quest->min_budget,
                'max_salary' => $quest->max_budget,
                'deadline' => $quest->deadline?->toISOString(),
                'status' => $statusVal,
                'creator_id' => $quest->creator_id ? (string) $quest->creator_id : null,
                'worker_id' => $quest->worker_id ? (string) $quest->worker_id : null,
                'creator' => [
                    'name' => $quest->creator?->name ?? 'Unknown User',
                    'role' => $quest->creator?->role ?? 'unknown',
                ],
                'bids_count' => $bidCounts[(string) $quest->_id] ?? 0,
            ];
        })->toArray();

        return [
            'items' => $items,
            'total' => $total,
        ];
    }

    /**
     * Get detailed quest by instance, ID, or slug.
     */
    public function getQuestDetails(Quest|string $questOrId, ?User $currentUser = null)
    {
        $quest = $questOrId instanceof Quest
            ? $questOrId->loadMissing(['creator', 'worker'])
            : Quest::with(['creator', 'worker'])
                ->where('_id', $questOrId)
                ->orWhere('slug', $questOrId)
                ->firstOrFail();

        $statusVal = $quest->status instanceof QuestStatus ? $quest->status->value : $quest->status;

        if ($statusVal === QuestStatus::OPEN->value && $quest->deadline < now()) {
            $quest->status = QuestStatus::EXPIRED->value;
            $quest->save();
            $statusVal = QuestStatus::EXPIRED->value;

            if ($quest->creator_id) {
                Notification::create([
                    'notifiable_type' => User::class,
                    'notifiable_id' => $quest->creator_id,
                    'data' => [
                        'quest_id' => $quest->_id,
                        'title' => $quest->title,
                        'message' => "Quest Anda '{$quest->title}' telah kadaluarsa karena tidak ada pekerja yang dipilih hingga melewati batas tenggat waktu.",
                        'type' => 'quest_expired_creator',
                    ],
                    'read_at' => null,
                ]);
            }
        }

        if ($statusVal === QuestStatus::ONGOING->value && $quest->deadline < now()) {
            $alreadyNotified = Notification::where('notifiable_id', $quest->creator_id)
                ->where('data.quest_id', $quest->_id)
                ->where('data.type', 'quest_overdue_creator')
                ->exists();

            if (! $alreadyNotified && $quest->creator_id) {
                Notification::create([
                    'notifiable_type' => User::class,
                    'notifiable_id' => $quest->creator_id,
                    'data' => [
                        'quest_id' => $quest->_id,
                        'title' => $quest->title,
                        'message' => "Pengerjaan quest '{$quest->title}' telah melewati batas tenggat waktu. Apakah Anda ingin memperpanjang tenggat waktu atau mengajukan dispute?",
                        'type' => 'quest_overdue_creator',
                    ],
                    'read_at' => null,
                ]);
            }
        }

        $bids = QuestBid::with('student')
            ->where('quest_id', (string) $quest->_id)
            ->latest()
            ->get()
            ->map(function ($bid) use ($currentUser) {
                $unreadCount = 0;
                if ($currentUser) {
                    $cUserId = (string) $currentUser->_id;
                    $unreadCount = QuestMessage::where('quest_bid_id', (string) $bid->_id)
                        ->where('sender_id', '!=', $cUserId)
                        ->where('read_by', '!=', $cUserId)
                        ->count();
                }

                $bidStatusVal = $bid->status instanceof QuestBidStatus ? $bid->status->value : $bid->status;

                return [
                    '_id' => (string) $bid->_id,
                    'bid_amount' => $bid->bid_amount,
                    'cv' => $bid->cv,
                    'portfolio' => $bid->portfolio,
                    'proposal' => $bid->proposal,
                    'status' => $bidStatusVal,
                    'created_at' => $bid->created_at->toISOString(),
                    'student' => [
                        '_id' => (string) ($bid->student?->_id ?? ''),
                        'name' => $bid->student?->name ?? 'Deleted User',
                        'email' => $bid->student?->email ?? '',
                    ],
                    'unread_messages_count' => $unreadCount,
                ];
            });

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('s3');
        $resolvedImages = array_map(function ($img) use ($disk) {
            return [
                'name' => $img['name'] ?? 'image.jpg',
                'url' => isset($img['path']) ? $disk->url($img['path']) : '',
            ];
        }, $quest->images ?? []);

        $resolvedFiles = array_map(function ($file) use ($disk) {
            return [
                'name' => $file['name'] ?? 'file.dat',
                'url' => isset($file['path']) ? $disk->url($file['path']) : '',
                'size' => $file['size'] ?? 0,
            ];
        }, $quest->files ?? []);

        $resolvedSubmissionFile = null;
        if ($quest->submission_file && isset($quest->submission_file['path'])) {
            $resolvedSubmissionFile = [
                'name' => $quest->submission_file['name'] ?? 'deliverable.zip',
                'url' => $disk->url($quest->submission_file['path']),
                'size' => $quest->submission_file['size'] ?? 0,
            ];
        }

        $resolvedPaymentProof = null;
        if ($quest->payment_proof && isset($quest->payment_proof['path'])) {
            $resolvedPaymentProof = [
                'name' => $quest->payment_proof['name'] ?? 'receipt.png',
                'url' => $disk->url($quest->payment_proof['path']),
                'size' => $quest->payment_proof['size'] ?? 0,
            ];
        }

        $resolvedDpProof = null;
        if ($quest->dp_proof && isset($quest->dp_proof['path'])) {
            $resolvedDpProof = [
                'name' => $quest->dp_proof['name'] ?? 'dp_receipt.png',
                'url' => $disk->url($quest->dp_proof['path']),
                'size' => $quest->dp_proof['size'] ?? 0,
            ];
        }

        $resolvedSubmissionHistory = array_map(function ($sub) use ($disk) {
            return [
                'version' => $sub['version'] ?? 1,
                'submitted_at' => $sub['submitted_at'] ?? null,
                'submission_link' => $sub['submission_link'] ?? null,
                'submission_note' => $sub['submission_note'] ?? null,
                'submission_file' => isset($sub['submission_file']['path']) ? [
                    'name' => $sub['submission_file']['name'] ?? 'deliverable.zip',
                    'url' => $disk->url($sub['submission_file']['path']),
                    'size' => $sub['submission_file']['size'] ?? 0,
                ] : null,
            ];
        }, $quest->submission_history ?? []);

        $rewards = $this->getRewardsForQuest($quest);

        $acceptedBid = QuestBid::where('quest_id', $quest->_id)->where('status', QuestBidStatus::ACCEPTED->value)->first();
        $acceptedBidAmount = $acceptedBid ? (int) $acceptedBid->bid_amount : null;

        return [
            'quest' => [
                '_id' => (string) $quest->_id,
                'id' => (string) $quest->_id,
                'slug' => $quest->slug ?: Str::slug($quest->title),
                'title' => $quest->title,
                'description' => $quest->description,
                'min_budget' => $quest->min_budget,
                'max_budget' => $quest->max_budget,
                'min_salary' => $quest->min_budget,
                'max_salary' => $quest->max_budget,
                'deadline' => $quest->deadline?->toISOString(),
                'status' => $statusVal,
                'creator_id' => $quest->creator_id,
                'creator' => [
                    'name' => $quest->creator?->name ?? 'Unknown User',
                    'role' => $quest->creator?->role ?? 'unknown',
                ],
                'worker' => $quest->worker ? [
                    'name' => $quest->worker->name,
                    'email' => $quest->worker->email,
                ] : null,
                'worker_id' => $quest->worker_id,
                'submission_link' => $quest->submission_link,
                'submission_note' => $quest->submission_note,
                'submitted_at' => $quest->submitted_at ? $quest->submitted_at->toISOString() : null,
                'completed_at' => $quest->completed_at ? $quest->completed_at->toISOString() : null,
                'revision_note' => $quest->revision_note,
                'revisions' => $quest->revisions ?? [],
                'rejection_note' => $quest->rejection_note,
                'rating' => $quest->rating,
                'rating_comment' => $quest->rating_comment,
                'images' => $resolvedImages,
                'files' => $resolvedFiles,
                'submission_file' => $resolvedSubmissionFile,
                'tier' => $quest->tier ?? 'C',
                'custom_rewards' => $quest->custom_rewards,
                'dispute' => ($currentUser && (
                    (string) $quest->creator_id === (string) $currentUser->_id ||
                    (string) $quest->worker_id === (string) $currentUser->_id ||
                    (method_exists($currentUser, 'isAdmin') && $currentUser->isAdmin())
                )) ? $this->resolveDispute($quest, $currentUser) : null,
                'submission_history' => $resolvedSubmissionHistory,
                'rewards' => $rewards,
                'accepted_bid_amount' => $acceptedBidAmount,
                'dp_percentage' => $quest->dp_percentage ?? 10,
                'dp_amount' => $quest->dp_amount,
                'dp_proof' => $resolvedDpProof,
                'dp_uploaded_at' => $quest->dp_uploaded_at ? $quest->dp_uploaded_at->toISOString() : null,
                'dp_confirmed_at' => $quest->dp_confirmed_at ? $quest->dp_confirmed_at->toISOString() : null,
                'payment_proof' => $resolvedPaymentProof,
                'payment_uploaded_at' => $quest->payment_uploaded_at ? $quest->payment_uploaded_at->toISOString() : null,
                'payment_confirmed_at' => $quest->payment_confirmed_at ? $quest->payment_confirmed_at->toISOString() : null,
                'rounds' => $quest->rounds ?? [],
                'max_revisions' => $quest->max_revisions ?? 2,
                'resolution_requests' => $quest->resolution_requests ?? [],
            ],
            'bids' => $bids,
        ];
    }

    /**
     * Resolve and format dispute details for frontend compatibility.
     */
    public function resolveDispute(Quest $quest, ?User $currentUser = null): ?array
    {
        if (! $quest->dispute) {
            return null;
        }

        $disputer = User::find($quest->dispute['disputer_id'] ?? $quest->dispute['filer_id'] ?? null);

        $disk = Storage::disk('s3');
        $resolvedEvidenceFiles = array_map(function ($file) use ($disk) {
            return [
                'name' => $file['name'] ?? 'evidence.dat',
                'url' => isset($file['path']) ? $disk->temporaryUrl($file['path'], now()->addMinutes(60)) : ($file['url'] ?? ''),
                'size' => $file['size'] ?? 0,
            ];
        }, $quest->dispute['evidence_files'] ?? []);

        $response = $quest->dispute['response'] ?? null;
        if ($response && isset($response['evidence_files']) && is_array($response['evidence_files'])) {
            $response['evidence_files'] = array_map(function ($file) use ($disk) {
                return [
                    'name' => $file['name'] ?? 'evidence.dat',
                    'url' => isset($file['path']) ? $disk->temporaryUrl($file['path'], now()->addMinutes(60)) : ($file['url'] ?? ''),
                    'size' => $file['size'] ?? 0,
                ];
            }, $response['evidence_files']);
        }

        // Confidential Discovery Requests by Mediator
        $evidenceRequests = $quest->dispute['evidence_requests'] ?? [];
        if (is_array($evidenceRequests)) {
            $isAdmin = $currentUser && method_exists($currentUser, 'isAdmin') && $currentUser->isAdmin();
            if ($currentUser && ! $isAdmin) {
                $isCreator = (string) $quest->creator_id === (string) $currentUser->_id;
                $isWorker = (string) $quest->worker_id === (string) $currentUser->_id;

                $evidenceRequests = array_values(array_filter($evidenceRequests, function ($req) use ($isCreator, $isWorker) {
                    $target = $req['target_party'] ?? 'both';
                    if ($target === 'both') {
                        return true;
                    }
                    if ($target === 'creator' && $isCreator) {
                        return true;
                    }
                    if ($target === 'worker' && $isWorker) {
                        return true;
                    }

                    return false;
                }));
            }

            // Resolve temporary URLs for files in each evidence request
            $evidenceRequests = array_map(function ($req) use ($disk) {
                if (isset($req['files']) && is_array($req['files'])) {
                    $req['files'] = array_map(function ($file) use ($disk) {
                        return [
                            'name' => $file['name'] ?? 'evidence.dat',
                            'url' => isset($file['path']) ? $disk->temporaryUrl($file['path'], now()->addMinutes(60)) : ($file['url'] ?? ''),
                            'size' => $file['size'] ?? 0,
                        ];
                    }, $req['files']);
                }

                return $req;
            }, $evidenceRequests);
        }

        $resolvedDispute = array_merge([
            'status' => $quest->dispute['status'] ?? 'pending',
            'reason' => $quest->dispute['reason'] ?? '',
            'disputed_at' => $quest->dispute['disputed_at'] ?? null,
            'resolved_at' => $quest->dispute['resolved_at'] ?? null,
            'ruled_at' => $quest->dispute['ruled_at'] ?? $quest->dispute['resolved_at'] ?? null,
            'ruling_note' => $quest->dispute['ruling_note'] ?? null,
            'note' => $quest->dispute['note'] ?? $quest->dispute['ruling_note'] ?? null,
            'split_percentage' => $quest->dispute['split_percentage'] ?? null,
            'disputer_id' => $quest->dispute['disputer_id'] ?? null,
            'filer_id' => $quest->dispute['filer_id'] ?? $quest->dispute['disputer_id'] ?? null,
            'filer_name' => $quest->dispute['filer_name'] ?? ($disputer ? $disputer->name : 'User'),
            'ruling' => $quest->dispute['ruling'] ?? null,
        ], $quest->dispute);

        $resolvedDispute['evidence_files'] = $resolvedEvidenceFiles;
        if ($response) {
            $resolvedDispute['response'] = $response;
        }
        $resolvedDispute['evidence_requests'] = $evidenceRequests;

        $acceptedBid = QuestBid::where('quest_id', $quest->_id)->where('status', QuestBidStatus::ACCEPTED->value)->first();
        $contractAmount = $acceptedBid ? (int) $acceptedBid->bid_amount : (int) ($quest->accepted_bid_amount ?? $quest->max_budget ?? $quest->max_salary ?? 0);
        $dpPercentage = (int) ($quest->dp_percentage ?? 10);
        $dpAmount = (int) ($quest->dp_amount ?? round(($contractAmount * $dpPercentage) / 100));
        $remainingBalance = max(0, $contractAmount - $dpAmount);
        $disputedAmount = $quest->dispute['disputed_amount'] ?? $contractAmount;

        $splitPct = (int) ($quest->dispute['split_percentage'] ?? 50);
        $workerShareSplit = (int) round(($contractAmount * $splitPct) / 100);
        $splitPayingParty = 'none';
        $splitReceivingParty = 'none';
        $splitTransferAmount = 0;
        $splitDesc = 'Tidak ada transfer tambahan yang diperlukan.';

        if ($workerShareSplit > $dpAmount) {
            $splitPayingParty = 'creator';
            $splitReceivingParty = 'worker';
            $splitTransferAmount = $workerShareSplit - $dpAmount;
            $splitDesc = 'Klien wajib mentransfer sisa Rp '.number_format($splitTransferAmount, 0, ',', '.')." ke Pekerja (Hak Pekerja: {$splitPct}% = Rp ".number_format($workerShareSplit, 0, ',', '.').' dikurangi DP Rp '.number_format($dpAmount, 0, ',', '.').').';
        } elseif ($workerShareSplit < $dpAmount) {
            $splitPayingParty = 'worker';
            $splitReceivingParty = 'creator';
            $splitTransferAmount = $dpAmount - $workerShareSplit;
            $splitDesc = 'Pekerja wajib mengembalikan Rp '.number_format($splitTransferAmount, 0, ',', '.').' ke Klien (Uang Muka Rp '.number_format($dpAmount, 0, ',', '.')." dikurangi Hak Pekerja {$splitPct}% = Rp ".number_format($workerShareSplit, 0, ',', '.').').';
        }

        $p2pLedger = [
            'contract_amount' => $contractAmount,
            'dp_percentage' => $dpPercentage,
            'dp_amount' => $dpAmount,
            'remaining_balance' => $remainingBalance,
            'disputed_amount' => $disputedAmount,
            'ruling_simulation' => [
                'refund_creator' => [
                    'paying_party' => 'worker',
                    'receiving_party' => 'creator',
                    'amount' => $dpAmount,
                    'description' => 'Pekerja wajib mentransfer restitusi Uang Muka (DP) 100% sebesar Rp '.number_format($dpAmount, 0, ',', '.').' kembali ke Klien.',
                ],
                'release_payout' => [
                    'paying_party' => 'creator',
                    'receiving_party' => 'worker',
                    'amount' => $remainingBalance,
                    'description' => 'Klien wajib mentransfer pelunasan sisa kontrak 100% sebesar Rp '.number_format($remainingBalance, 0, ',', '.').' ke Pekerja.',
                ],
                'split' => [
                    'split_percentage' => $splitPct,
                    'paying_party' => $splitPayingParty,
                    'receiving_party' => $splitReceivingParty,
                    'amount' => $splitTransferAmount,
                    'description' => $splitDesc,
                ],
            ],
        ];

        $resolvedDispute['p2p_ledger'] = $p2pLedger;

        // Resolve P2P compliance proof URL if uploaded
        if (isset($resolvedDispute['p2p_compliance']['proof_file']['path'])) {
            $resolvedDispute['p2p_compliance']['proof_file']['url'] = $disk->temporaryUrl(
                $resolvedDispute['p2p_compliance']['proof_file']['path'],
                now()->addMinutes(60)
            );
        }

        if (empty($resolvedDispute['ruling']) && isset($quest->dispute['status']) && str_starts_with($quest->dispute['status'], 'resolved_')) {
            $rulingRaw = substr($quest->dispute['status'], 9);
            $resolvedDispute['ruling'] = $rulingRaw;
        }

        if (($resolvedDispute['ruling'] ?? '') === 'pay_worker') {
            $resolvedDispute['ruling'] = 'release_payout';
        }
        if (($resolvedDispute['ruling'] ?? '') === 'refund') {
            $resolvedDispute['ruling'] = 'refund_creator';
        }

        return $resolvedDispute;
    }

    /**
     * Create a new Quest.
     */
    public function createQuest(User $creator, array $data): Quest
    {
        return $this->createQuestAction->execute($creator, $data);
    }

    /**
     * Submit a bid/application for a quest.
     */
    public function placeBid(User $student, Quest $quest, array $data): QuestBid
    {
        return $this->placeQuestBidAction->execute($student, $quest, $data);
    }

    /**
     * Accept a bid on a quest (and reject all other bids).
     */
    public function acceptBid(User $creator, Quest $quest, string $bidId): void
    {
        $this->acceptQuestBidAction->execute($creator, $quest, $bidId);
    }

    /**
     * Get calculated/custom rewards based on tier or user overrides.
     */
    public function getRewardsForQuest(Quest $quest): array
    {
        return $this->awardQuestRewardsAction->getRewardsForQuest($quest);
    }

    /**
     * Award gamification rewards to worker.
     */
    public function awardQuestRewards(Quest $quest, string $workerId): void
    {
        $this->awardQuestRewardsAction->execute($quest, $workerId);
    }

    /**
     * File a formal dispute for the quest.
     */
    public function fileDispute(Quest $quest, User $user, string $reason, ?string $category = null, array $evidenceFiles = []): Quest
    {
        return $this->fileQuestDisputeAction->execute($quest, $user, $reason, $category, $evidenceFiles);
    }

    /**
     * Respond to a dispute with counter-evidence.
     */
    public function respondDispute(Quest $quest, User $user, string $responseNote, array $evidenceFiles = []): Quest
    {
        return $this->fileQuestDisputeAction->respond($quest, $user, $responseNote, $evidenceFiles);
    }

    /**
     * Request deadline extension by worker.
     */
    public function requestExtension(User $worker, Quest $quest, string $proposedDeadline, string $reason): Quest
    {
        return $this->requestQuestExtensionAction->execute($worker, $quest, $proposedDeadline, $reason);
    }

    /**
     * Respond to deadline extension request by creator.
     */
    public function respondExtension(User $creator, Quest $quest, string $requestId, bool $accept, ?string $responseNote = null): Quest
    {
        return $this->respondQuestExtensionAction->execute($creator, $quest, $requestId, $accept, $responseNote);
    }

    /**
     * Request mutual cancellation of the quest.
     */
    public function requestMutualCancellation(User $actor, Quest $quest, string $reason, string $dpHandling = 'refund_creator', ?int $splitPercentage = null): Quest
    {
        return $this->requestMutualCancellationAction->execute($actor, $quest, $reason, $dpHandling, $splitPercentage);
    }

    /**
     * Respond to mutual cancellation request.
     */
    public function respondMutualCancellation(User $actor, Quest $quest, string $requestId, bool $accept, ?string $responseNote = null): Quest
    {
        return $this->respondMutualCancellationAction->execute($actor, $quest, $requestId, $accept, $responseNote);
    }

    public function resolveArbitration(
        Quest $quest,
        string $ruling,
        ?string $note,
        ?int $splitPercentage = null,
        ?array $sanctionData = null,
        ?string $findingsOfFact = null,
        ?string $ratioDecidendi = null
    ): void {
        $this->resolveQuestArbitrationAction->execute(
            $quest,
            $ruling,
            $note,
            $splitPercentage,
            $sanctionData,
            $findingsOfFact,
            $ratioDecidendi
        );
    }

    /**
     * Record a transaction and adjust the target user's Gold balance.
     */
    public function recordTransaction(string $questId, string $userId, int $amount, string $type, string $description): QuestTransaction
    {
        return $this->recordQuestTransactionAction->execute($questId, $userId, $amount, $type, $description);
    }

    /**
     * Submit preview work by worker.
     */
    public function submitWork(User $worker, Quest $quest, array $data): Quest
    {
        return $this->submitQuestWorkAction->execute($worker, $quest, $data);
    }

    /**
     * Approve preview work submitted by worker.
     */
    public function approveWork(User $actor, Quest $quest, array $data = []): Quest
    {
        return $this->approveQuestWorkAction->execute($actor, $quest, $data);
    }

    /**
     * Request revision on submitted work by creator or admin.
     */
    public function requestRevision(User $actor, Quest $quest, array $data): Quest
    {
        return $this->requestQuestRevisionAction->execute($actor, $quest, $data);
    }

    /**
     * Request revision on submitted work (legacy alias).
     */
    public function rejectWork(User $actor, Quest $quest, array $data): Quest
    {
        return $this->requestRevision($actor, $quest, $data);
    }

    /**
     * Upload down payment (DP) proof receipt by creator or admin.
     */
    public function uploadDownPaymentProof(User $actor, Quest $quest, UploadedFile $file): Quest
    {
        return $this->uploadQuestDownPaymentProofAction->execute($actor, $quest, $file);
    }

    /**
     * Confirm receipt of down payment (DP) by worker or admin.
     */
    public function confirmDownPayment(User $actor, Quest $quest): Quest
    {
        return $this->confirmQuestDownPaymentAction->execute($actor, $quest);
    }

    /**
     * Upload payment proof receipt by creator or admin.
     */
    public function uploadPaymentProof(User $actor, Quest $quest, UploadedFile $file): Quest
    {
        return $this->uploadQuestPaymentProofAction->execute($actor, $quest, $file);
    }

    /**
     * Submit final master ZIP archive by worker.
     */
    public function submitFinalZip(User $worker, Quest $quest, UploadedFile $file): Quest
    {
        return $this->submitFinalZipAction->execute($worker, $quest, $file);
    }

    /**
     * Confirm final delivery and complete the quest with optional review/rating.
     */
    public function confirmFinalDelivery(User $actor, Quest $quest, array $data = []): Quest
    {
        return $this->confirmFinalDeliveryAction->execute($actor, $quest, $data);
    }

    /**
     * Request revision / re-upload of final master ZIP archive.
     */
    public function requestFinalZipRevision(User $actor, Quest $quest, string $revisionNote): Quest
    {
        return $this->requestFinalZipRevisionAction->execute($actor, $quest, $revisionNote);
    }

    /**
     * Extend quest deadline by creator or admin.
     */
    public function extendDeadline(User $actor, Quest $quest, string $newDeadline): Quest
    {
        return $this->extendQuestDeadlineAction->execute($actor, $quest, $newDeadline);
    }

    /**
     * Get quest history (taken / bidded / completed) for a student.
     */
    public function getStudentQuestHistory(User $user)
    {
        $bids = QuestBid::where('student_id', (string) $user->_id)->get();
        $biddedQuestIds = $bids->pluck('quest_id')->toArray();

        $quests = Quest::with(['creator', 'worker'])
            ->where(function ($query) use ($user, $biddedQuestIds) {
                $query->where('worker_id', (string) $user->_id)
                    ->orWhere('creator_id', (string) $user->_id)
                    ->orWhereIn('_id', $biddedQuestIds);
            })
            ->latest()
            ->get();

        return $quests->map(function ($quest) use ($user, $bids) {
            $myBid = $bids->firstWhere('quest_id', (string) $quest->_id);

            $submissionFile = null;
            if ($quest->submission_file) {
                /** @var FilesystemAdapter $disk */
                $disk = Storage::disk('s3');
                $subFile = $quest->submission_file;
                $submissionFile = [
                    'name' => $subFile['name'] ?? 'project.zip',
                    'size' => $subFile['size'] ?? 0,
                    'url' => isset($subFile['path']) ? $disk->url($subFile['path']) : null,
                ];
            }

            $rewards = $this->getRewardsForQuest($quest);

            $statusVal = $quest->status instanceof QuestStatus ? $quest->status->value : $quest->status;
            $myBidStatusVal = $myBid?->status instanceof QuestBidStatus ? $myBid->status->value : $myBid?->status;

            return [
                '_id' => (string) $quest->_id,
                'title' => $quest->title,
                'description' => $quest->description,
                'min_budget' => $quest->min_budget,
                'max_budget' => $quest->max_budget,
                'min_salary' => $quest->min_budget,
                'max_salary' => $quest->max_budget,
                'deadline' => $quest->deadline?->toISOString(),
                'status' => $statusVal,
                'creator' => [
                    'name' => $quest->creator?->name ?? 'Unknown User',
                    'role' => $quest->creator?->role ?? 'unknown',
                ],
                'worker' => $quest->worker ? [
                    'name' => $quest->worker->name,
                    'email' => $quest->worker->email,
                ] : null,
                'worker_id' => $quest->worker_id,
                'is_worker' => $quest->worker_id === (string) $user->_id,
                'is_creator' => $quest->creator_id === (string) $user->_id,
                'my_bid' => $myBid ? [
                    'bid_amount' => $myBid->bid_amount,
                    'status' => $myBidStatusVal,
                    'proposal' => $myBid->proposal,
                    'cv' => $myBid->cv,
                    'portfolio' => $myBid->portfolio,
                ] : null,
                'submission_link' => $quest->submission_link,
                'submission_note' => $quest->submission_note,
                'submission_file' => $submissionFile,
                'submitted_at' => $quest->submitted_at?->toISOString(),
                'completed_at' => $quest->completed_at?->toISOString(),
                'rating' => $quest->rating,
                'rating_comment' => $quest->rating_comment,
                'revision_note' => $quest->revision_note,
                'rejection_note' => $quest->rejection_note,
                'rewards' => $rewards,
                'dispute' => ($user && (
                    (string) $quest->creator_id === (string) $user->_id ||
                    (string) $quest->worker_id === (string) $user->_id ||
                    (method_exists($user, 'isAdmin') && $user->isAdmin())
                )) ? $this->resolveDispute($quest, $user) : null,
            ];
        });
    }
}
