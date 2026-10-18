<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Quest;
use App\Models\QuestBid;
use App\Models\QuestMessage;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use MongoDB\BSON\ObjectId;

class QuestMessageController extends Controller
{
    /**
     * Get messages for a specific quest bid (thread).
     */
    public function getMessages(Request $request, string $bidId): JsonResponse
    {
        $user = $request->user();
        $bid = QuestBid::with('quest')->findOrFail($bidId);

        // Authorization check: user must be admin, quest creator, or bid applicant
        $isCreator = $bid->quest->creator_id === $user->_id;
        $isApplicant = $bid->student_id === $user->_id;
        $isAdmin = $user->isAdmin();

        if (! $isCreator && ! $isApplicant && ! $isAdmin) {
            return response()->json(['error' => 'Unauthorized access to this chat.'], 403);
        }

        $channelType = $request->query('channel_type', 'tripartite');
        if (! in_array($channelType, ['tripartite', 'caucus_creator', 'caucus_worker'], true)) {
            return response()->json(['error' => 'Tipe saluran chat tidak valid.'], 400);
        }

        // Channel-specific authorization (Bilateral Caucus Isolation)
        if ($channelType === 'caucus_creator' && ! $isAdmin && ! $isCreator) {
            return response()->json(['error' => 'Akses ditolak. Sesi kaukus ini bersifat konfidensial antara Klien dan Mediator.'], 403);
        }

        if ($channelType === 'caucus_worker' && ! $isAdmin && ! $isApplicant) {
            return response()->json(['error' => 'Akses ditolak. Sesi kaukus ini bersifat konfidensial antara Pekerja dan Mediator.'], 403);
        }

        // Read-only access is allowed for rejected bids, but we don't block getMessages

        // Mark messages as read by the current user for the active channel
        $userId = (string) $user->_id;
        $unreadQuery = QuestMessage::where('quest_bid_id', $bidId)
            ->where('sender_id', '!=', $userId)
            ->where('read_by', '!=', $userId);

        if ($channelType === 'tripartite') {
            $unreadQuery->where(function ($q) {
                $q->where('channel_type', 'tripartite')
                    ->orWhereNull('channel_type')
                    ->orWhere('channel_type', '');
            });
        } else {
            $unreadQuery->where('channel_type', $channelType);
        }

        $unreadMessages = $unreadQuery->get();

        foreach ($unreadMessages as $msg) {
            $readBy = $msg->read_by ?: [];
            if (! in_array($userId, $readBy, true)) {
                $readBy[] = $userId;
                $msg->update(['read_by' => array_values(array_unique($readBy))]);
            }
        }

        $query = QuestMessage::where('quest_bid_id', $bidId);

        if ($channelType === 'tripartite') {
            $query->where(function ($q) {
                $q->where('channel_type', 'tripartite')
                    ->orWhereNull('channel_type')
                    ->orWhere('channel_type', '');
            });
        } else {
            $query->where('channel_type', $channelType);
        }

        if ($request->filled('after_id')) {
            try {
                $afterObjId = new ObjectId($request->after_id);
                $query->where('_id', '>', $afterObjId)->orderBy('_id', 'asc');
            } catch (\Throwable $e) {
                $refMsg = QuestMessage::find($request->after_id);
                if ($refMsg && $refMsg->created_at) {
                    $query->where('created_at', '>', $refMsg->created_at)->orderBy('created_at', 'asc');
                }
            }
        } else {
            $query->latest('created_at')->limit(50);
        }

        $messages = $query->with('sender')->get();

        if (! $request->filled('after_id')) {
            $messages = $messages->reverse()->values();
        }

        $data = $messages->map(function ($msg) {
            /** @var FilesystemAdapter $disk */
            $disk = Storage::disk('s3');

            return [
                'id' => (string) $msg->_id,
                'channel_type' => $msg->channel_type ?? 'tripartite',
                'message' => $msg->message,
                'created_at' => $msg->created_at->toIso8601String(),
                'sender' => [
                    'id' => (string) ($msg->sender?->_id ?? ''),
                    'name' => $msg->sender?->name ?? 'Unknown User',
                    'role' => $msg->sender?->role ?? 'unknown',
                ],
                'file' => $msg->file && isset($msg->file['path']) ? [
                    'name' => $msg->file['name'] ?? 'attachment.dat',
                    'url' => $disk->url($msg->file['path']),
                    'size' => $msg->file['size'] ?? 0,
                ] : null,
            ];
        });

        return response()->json($data);
    }

    /**
     * Store a new quest chat message.
     */
    public function store(Request $request, string $bidId): JsonResponse
    {
        $user = $request->user();
        $bid = QuestBid::with('quest')->findOrFail($bidId);

        // Authorization check
        $isCreator = $bid->quest->creator_id === $user->_id;
        $isApplicant = $bid->student_id === $user->_id;
        $isAdmin = $user->isAdmin();

        if (! $isCreator && ! $isApplicant && ! $isAdmin) {
            return response()->json(['error' => 'Unauthorized access to this chat.'], 403);
        }

        $channelType = $request->input('channel_type', 'tripartite');
        if (! in_array($channelType, ['tripartite', 'caucus_creator', 'caucus_worker'], true)) {
            return response()->json(['error' => 'Tipe saluran chat tidak valid.'], 400);
        }

        // Channel-specific authorization (Bilateral Caucus Isolation)
        if ($channelType === 'caucus_creator' && ! $isAdmin && ! $isCreator) {
            return response()->json(['error' => 'Akses ditolak. Sesi kaukus ini bersifat konfidensial antara Klien dan Mediator.'], 403);
        }

        if ($channelType === 'caucus_worker' && ! $isAdmin && ! $isApplicant) {
            return response()->json(['error' => 'Akses ditolak. Sesi kaukus ini bersifat konfidensial antara Pekerja dan Mediator.'], 403);
        }

        // Restrict sending new messages if bid is rejected
        if ($bid->status === 'rejected') {
            return response()->json(['error' => 'Penawaran ini telah selesai atau ditolak. Obrolan bersifat hanya-baca (read-only).'], 422);
        }

        $request->validate([
            'message' => 'nullable|string|max:10000',
            'file' => 'nullable|file|max:10240',
            'channel_type' => 'nullable|string|in:tripartite,caucus_creator,caucus_worker',
        ]);

        if (empty($request->message) && ! $request->hasFile('file')) {
            return response()->json(['error' => 'Pesan atau file wajib diisi.'], 422);
        }

        $fileData = null;
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $originalName = $file->getClientOriginalName();
            $path = $file->store('quests/chats', 's3');
            $size = $file->getSize();

            $fileData = [
                'name' => $originalName,
                'path' => $path,
                'size' => $size,
            ];
        }

        $msg = QuestMessage::create([
            'quest_bid_id' => $bidId,
            'sender_id' => $user->_id,
            'channel_type' => $channelType,
            'message' => $request->message ?? '',
            'read_by' => [(string) $user->_id],
            'file' => $fileData,
        ]);

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('s3');

        return response()->json([
            'id' => (string) $msg->_id,
            'channel_type' => $msg->channel_type ?? 'tripartite',
            'message' => $msg->message,
            'created_at' => $msg->created_at->toIso8601String(),
            'sender' => [
                'id' => (string) $user->_id,
                'name' => $user->name,
                'role' => $user->role,
            ],
            'file' => $msg->file && isset($msg->file['path']) ? [
                'name' => $msg->file['name'] ?? 'attachment.dat',
                'url' => $disk->url($msg->file['path']),
                'size' => $msg->file['size'] ?? 0,
            ] : null,
        ]);
    }

    /**
     * Get real-time unread messages count for a quest.
     */
    public function getUnreadStatus(Request $request, string $questId): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['bids' => [], 'my_bid_unread' => 0]);
        }

        $quest = Quest::where('slug', $questId)->orWhere('_id', $questId)->first();
        if (! $quest) {
            return response()->json(['bids' => [], 'my_bid_unread' => 0]);
        }

        $userId = (string) $user->_id;
        $bids = QuestBid::where('quest_id', (string) $quest->_id)->get();
        $bidIds = $bids->pluck('_id')->map(fn ($id) => (string) $id)->toArray();

        $unreadMessages = QuestMessage::whereIn('quest_bid_id', $bidIds)
            ->where('sender_id', '!=', $userId)
            ->where('read_by', '!=', $userId)
            ->get(['quest_bid_id', 'channel_type']);

        $bidsUnreadCounts = [];
        foreach ($bidIds as $bId) {
            $bidsUnreadCounts[$bId] = 0;
        }

        $isCreator = (string) $quest->creator_id === $userId;
        $isAdmin = $user->isAdmin();

        foreach ($unreadMessages as $msg) {
            $bId = (string) $msg->quest_bid_id;
            $cType = $msg->channel_type ?? 'tripartite';

            if ($cType === 'caucus_creator' && ! $isAdmin && ! $isCreator) {
                continue;
            }

            $bidObj = $bids->firstWhere('_id', $bId);
            $isApplicant = $bidObj && (string) $bidObj->student_id === $userId;
            if ($cType === 'caucus_worker' && ! $isAdmin && ! $isApplicant) {
                continue;
            }

            $bidsUnreadCounts[$bId] = ($bidsUnreadCounts[$bId] ?? 0) + 1;
        }

        $myBidRecord = $bids->firstWhere('student_id', $userId);
        $myBidUnread = $myBidRecord ? ($bidsUnreadCounts[(string) $myBidRecord->_id] ?? 0) : 0;

        return response()->json([
            'bids' => $bidsUnreadCounts,
            'my_bid_unread' => $myBidUnread,
        ]);
    }

    /**
     * Explicitly mark messages as read for a specific bid thread.
     */
    public function markAsRead(Request $request, string $bidId): JsonResponse
    {
        $user = $request->user();
        $userId = (string) $user->_id;
        $channelType = $request->input('channel_type', 'tripartite');

        $unreadQuery = QuestMessage::where('quest_bid_id', $bidId)
            ->where('sender_id', '!=', $userId)
            ->where('read_by', '!=', $userId);

        if ($channelType === 'tripartite') {
            $unreadQuery->where(function ($q) {
                $q->where('channel_type', 'tripartite')
                    ->orWhereNull('channel_type')
                    ->orWhere('channel_type', '');
            });
        } else {
            $unreadQuery->where('channel_type', $channelType);
        }

        $unreadMessages = $unreadQuery->get();
        foreach ($unreadMessages as $msg) {
            $readBy = $msg->read_by ?: [];
            if (! in_array($userId, $readBy, true)) {
                $readBy[] = $userId;
                $msg->update(['read_by' => array_values(array_unique($readBy))]);
            }
        }

        return response()->json(['success' => true]);
    }
}
