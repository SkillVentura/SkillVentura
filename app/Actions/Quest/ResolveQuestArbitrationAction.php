<?php

namespace App\Actions\Quest;

use App\Enums\QuestBidStatus;
use App\Enums\QuestStatus;
use App\Models\Notification;
use App\Models\Quest;
use App\Models\QuestBid;
use App\Models\User;
use App\Models\UserStat;
use Illuminate\Support\Str;

class ResolveQuestArbitrationAction
{
    public function __construct(
        protected AwardQuestRewardsAction $awardQuestRewardsAction,
        protected RecordQuestTransactionAction $recordTransactionAction
    ) {}

    /**
     * Execute the action to resolve arbitration for the quest.
     */
    public function execute(
        Quest $quest,
        string $ruling,
        ?string $note,
        ?int $splitPercentage = null,
        ?array $sanctionData = null,
        ?string $findingsOfFact = null,
        ?string $ratioDecidendi = null
    ): void {
        $currentStatus = $quest->status instanceof QuestStatus ? $quest->status->value : $quest->status;

        if ($currentStatus !== QuestStatus::DISPUTED->value) {
            abort(400, 'Hanya quest berstatus disputed yang dapat diarbiatrase.');
        }

        $acceptedBid = QuestBid::where('quest_id', $quest->_id)->where('status', QuestBidStatus::ACCEPTED->value)->first();
        $bidAmount = $acceptedBid ? (int) $acceptedBid->bid_amount : (int) $quest->max_budget;
        $contractAmount = (int) ($quest->accepted_bid_amount ?? $bidAmount);
        $dpPercentage = (int) ($quest->dp_percentage ?? 10);
        $dpAmount = (int) ($quest->dp_amount ?? round(($contractAmount * $dpPercentage) / 100));
        $remainingBalance = max(0, $contractAmount - $dpAmount);

        $dispute = $quest->dispute ?? [];
        $dispute['status'] = 'resolved_'.$ruling;
        $dispute['ruling'] = $ruling;
        $dispute['ruling_note'] = $note;
        $dispute['note'] = $note;
        $dispute['resolved_at'] = now()->toIso8601String();
        $dispute['ruled_at'] = now()->toIso8601String();
        $awardNumber = 'ARB-'.date('Ymd').'-'.strtoupper(Str::random(6));
        $dispute['memo_number'] = $dispute['memo_number'] ?? $awardNumber;
        $dispute['legal_disclaimer'] = 'Putusan arbitrase ini diterbitkan secara sah oleh Administrator Platform SkillVentura sebagai putusan final dan mengikat sesuai kesepakatan para pihak.';

        if ($sanctionData && ! empty($sanctionData['sanction_type']) && $sanctionData['sanction_type'] !== 'none') {
            $targetUserId = ($sanctionData['sanction_target'] ?? 'worker') === 'worker' ? $quest->worker_id : $quest->creator_id;
            $targetUserName = ($sanctionData['sanction_target'] ?? 'worker') === 'worker' ? ($quest->worker?->name ?? 'Pekerja') : ($quest->creator?->name ?? 'Klien');

            $dispute['sanction'] = [
                'type' => $sanctionData['sanction_type'],
                'sanction_type' => $sanctionData['sanction_type'],
                'target' => $sanctionData['sanction_target'] ?? 'worker',
                'sanction_target' => $sanctionData['sanction_target'] ?? 'worker',
                'target_name' => $targetUserName,
                'reason' => $sanctionData['sanction_reason'] ?? $note,
                'sanction_reason' => $sanctionData['sanction_reason'] ?? $note,
                'imposed_at' => now()->toIso8601String(),
            ];

            if ($targetUserId) {
                Notification::create([
                    'notifiable_type' => User::class,
                    'notifiable_id' => $targetUserId,
                    'data' => [
                        'quest_id' => $quest->_id,
                        'quest_slug' => $quest->slug ?: Str::slug($quest->title),
                        'title' => 'Sanksi Pelanggaran Arbitrase',
                        'message' => "Akun Anda menerima sanksi [{$sanctionData['sanction_type']}] atas putusan arbitrase quest '{$quest->title}'. Alasan: ".($sanctionData['sanction_reason'] ?? $note),
                        'type' => 'account_sanction',
                    ],
                    'read_at' => null,
                ]);
            }
        }

        // Calculate financial order
        $financialOrder = [
            'paying_party' => 'none',
            'receiving_party' => 'none',
            'amount' => 0,
            'currency' => 'IDR',
            'payment_deadline' => now()->addHours(72)->toIso8601String(),
        ];

        if ($ruling === 'release_payout') {
            $dispute['verdict_label'] = 'Kemenangan Pekerja: Hak Kontrak Riil Wajib Dilunasi & Reward Platform Diberikan';
            $financialOrder['paying_party'] = 'creator';
            $financialOrder['receiving_party'] = 'worker';
            $financialOrder['amount'] = $remainingBalance;
        } elseif ($ruling === 'refund_creator') {
            $dispute['verdict_label'] = 'Kemenangan Pembuat Quest: Kontrak Dibatalkan & Uang Muka Wajib Dikembalikan';
            $financialOrder['paying_party'] = 'worker';
            $financialOrder['receiving_party'] = 'creator';
            $financialOrder['amount'] = $dpAmount;
        } elseif ($ruling === 'split') {
            $splitPercentage = (int) $splitPercentage;
            $dispute['split_percentage'] = $splitPercentage;
            $dispute['verdict_label'] = "Kesepakatan Damai Prorata: Hak Pekerja {$splitPercentage}%";

            $workerShare = (int) round(($contractAmount * $splitPercentage) / 100);
            if ($workerShare > $dpAmount) {
                $financialOrder['paying_party'] = 'creator';
                $financialOrder['receiving_party'] = 'worker';
                $financialOrder['amount'] = $workerShare - $dpAmount;
            } elseif ($workerShare < $dpAmount) {
                $financialOrder['paying_party'] = 'worker';
                $financialOrder['receiving_party'] = 'creator';
                $financialOrder['amount'] = $dpAmount - $workerShare;
            }
        }

        // Formal Arbitration Award Certificate
        $rewards = $this->awardQuestRewardsAction->getRewardsForQuest($quest);
        $workerAwardedGold = 0;
        $workerAwardedExp = 0;
        if ($ruling === 'release_payout') {
            $workerAwardedGold = (int) ($rewards['gold'] ?? 0);
            $workerAwardedExp = (int) ($rewards['exp'] ?? 0);
        } elseif ($ruling === 'split' && $splitPercentage) {
            $workerAwardedGold = (int) round((($rewards['gold'] ?? 0) * $splitPercentage) / 100);
            $workerAwardedExp = (int) round((($rewards['exp'] ?? 0) * $splitPercentage) / 100);
        }

        $dispute['award'] = [
            'award_number' => $awardNumber,
            'ruled_at' => now()->toIso8601String(),
            'arbiter_name' => 'Dewan Arbitrase SkillVentura',
            'ruling_type' => $ruling,
            'split_percentage' => $splitPercentage ? (int) $splitPercentage : null,
            'findings_of_fact' => $findingsOfFact ?: ($note ?: 'Berdasarkan pemeriksaan dokumen bukti, riwayat komunikasi, dan pembuktian kontrak para pihak.'),
            'ratio_decidendi' => $ratioDecidendi ?: 'Menimbang ketentuan kontrak kerja P2P dan standar kepatuhan eksekusi hasil pekerjaan platform SkillVentura.',
            'financial_order' => $financialOrder,
            'platform_reward_order' => [
                'gold_creator' => 0,
                'gold_worker' => $workerAwardedGold,
                'exp_worker' => $workerAwardedExp,
            ],
            'sanction_order' => $dispute['sanction'] ?? null,
            'legal_memorandum' => $note,
        ];

        // Initialize P2P compliance tracking
        if ($financialOrder['paying_party'] !== 'none' && $financialOrder['amount'] > 0) {
            $dispute['p2p_compliance'] = [
                'status' => 'pending_payment',
                'amount' => $financialOrder['amount'],
                'payment_deadline' => $financialOrder['payment_deadline'],
                'paying_party' => $financialOrder['paying_party'],
                'receiving_party' => $financialOrder['receiving_party'],
            ];
        } else {
            $dispute['p2p_compliance'] = [
                'status' => 'verified',
                'audit_note' => 'Tidak diperlukan transfer P2P tambahan berdasarkan amar putusan.',
                'verified_at' => now()->toIso8601String(),
                'verified_by' => 'Sistem Arbitrase SkillVentura',
            ];
        }

        if ($ruling === 'release_payout') {
            $quest->update([
                'status' => QuestStatus::COMPLETED->value,
                'completed_at' => now(),
                'dispute' => $dispute,
            ]);

            if ($quest->worker_id) {
                // Award EXP, Gold, and ERP platform rewards
                $this->awardQuestRewardsAction->execute($quest, $quest->worker_id);

                // Record P2P contract settlement ledger
                $contractAmount = (int) ($quest->accepted_bid_amount ?? $bidAmount);
                if ($contractAmount > 0) {
                    $this->recordTransactionAction->execute(
                        (string) $quest->_id,
                        (string) $quest->worker_id,
                        $contractAmount,
                        'p2p_contract_settlement',
                        "Penyelesaian arbitrase kontrak p2p quest: {$quest->title} senilai Rp ".number_format($contractAmount, 0, ',', '.')
                    );
                }
            }
        } elseif ($ruling === 'refund_creator') {
            $quest->update([
                'status' => QuestStatus::CANCELLED->value,
                'completed_at' => now(),
                'dispute' => $dispute,
            ]);

            $dpAmount = (int) ($quest->dp_amount ?? 0);
            if ($dpAmount > 0 && $quest->creator_id) {
                $this->recordTransactionAction->execute(
                    (string) $quest->_id,
                    (string) $quest->creator_id,
                    $dpAmount,
                    'p2p_dp_refund_order',
                    "Instruksi restitusi pengembalian DP sengketa quest: {$quest->title} senilai Rp ".number_format($dpAmount, 0, ',', '.')
                );
            }
        } elseif ($ruling === 'split') {
            $splitPercentage = (int) $splitPercentage;

            $quest->update([
                'status' => QuestStatus::COMPLETED->value,
                'completed_at' => now(),
                'dispute' => $dispute,
            ]);

            if ($quest->worker_id) {
                $contractAmount = (int) ($quest->accepted_bid_amount ?? $bidAmount);
                $workerShareAmount = (int) round(($contractAmount * $splitPercentage) / 100);
                if ($workerShareAmount > 0) {
                    $this->recordTransactionAction->execute(
                        (string) $quest->_id,
                        (string) $quest->worker_id,
                        $workerShareAmount,
                        'p2p_contract_split_settlement',
                        "Penyelesaian sengketa prorata ({$splitPercentage}%) kontrak p2p quest: {$quest->title} senilai Rp ".number_format($workerShareAmount, 0, ',', '.')
                    );
                }

                $progress = UserStat::firstOrCreate([
                    'user_id' => $quest->worker_id,
                    'course_id' => 'quest_rewards',
                ], [
                    'completed_modules' => [],
                    'completed_paths' => [],
                    'exp' => 0,
                    'gold' => 0,
                    'erp' => 0,
                    'level' => 1,
                    'path_stats' => [],
                ]);

                $pathStats = $progress->path_stats ?? [];
                if (is_string($pathStats)) {
                    $pathStats = json_decode($pathStats, true) ?: [];
                } else {
                    $pathStats = (array) $pathStats;
                }

                $questKey = (string) $quest->_id;
                if (! isset($pathStats[$questKey])) {
                    $rewards = $this->awardQuestRewardsAction->getRewardsForQuest($quest);
                    $partialExp = (int) round(($rewards['exp'] * $splitPercentage) / 100);
                    $partialGold = (int) round(($rewards['gold'] * $splitPercentage) / 100);
                    $partialErp = (int) round(($rewards['erp'] * $splitPercentage) / 100);

                    $pathStats[$questKey] = [
                        'exp' => $partialExp,
                        'gold' => $partialGold,
                        'quiz_score' => $partialErp,
                    ];

                    $progress->path_stats = $pathStats;
                    $progress->exp = (int) ($progress->exp ?? 0) + $partialExp;
                    $progress->erp = (int) ($progress->erp ?? 0) + $partialErp;
                    $progress->level = (int) max(($progress->level ?? 1), floor($progress->exp / 500) + 1);
                    $progress->save();

                    $this->recordTransactionAction->execute($quest->_id, $quest->worker_id, $partialGold, 'release_payout', "Split payout release (Share: {$splitPercentage}%) for quest: {$quest->title}");
                }
            }
        }

        if ($quest->creator_id) {
            Notification::create([
                'notifiable_type' => User::class,
                'notifiable_id' => $quest->creator_id,
                'data' => [
                    'quest_id' => $quest->_id,
                    'quest_slug' => $quest->slug ?: Str::slug($quest->title),
                    'title' => $quest->title,
                    'message' => "Arbitrase quest '{$quest->title}' telah diputuskan oleh Admin: ".strtoupper(str_replace('_', ' ', $ruling)).'.',
                    'type' => 'quest_arbitrated',
                ],
                'read_at' => null,
            ]);
        }

        if ($quest->worker_id) {
            Notification::create([
                'notifiable_type' => User::class,
                'notifiable_id' => $quest->worker_id,
                'data' => [
                    'quest_id' => $quest->_id,
                    'quest_slug' => $quest->slug ?: Str::slug($quest->title),
                    'title' => $quest->title,
                    'message' => "Arbitrase quest '{$quest->title}' telah diputuskan oleh Admin: ".strtoupper(str_replace('_', ' ', $ruling)).'.',
                    'type' => 'quest_arbitrated',
                ],
                'read_at' => null,
            ]);
        }
    }
}
