<?php

namespace App\Http\Middleware;

use App\Models\Quest;
use App\Services\FooterService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [

            'name' => config('app.name'),

            'auth' => [
                'user' => $request->user()
                    ? [
                        'id' => (string) $request->user()->_id,
                        'name' => $request->user()->name,
                        'email' => $request->user()->email,
                        'role' => $request->user()->role,
                        'signature_url' => $request->user()->signature_url,
                    ]
                    : null,
            ],

            // ✅ Ziggy (STABIL, NO SPREAD)
            'ziggy' => function () use ($request) {
                return array_merge(
                    app('router')->getRoutes()->getRoutesByName(),
                    [
                        'location' => $request->url(),
                    ]
                );
            },

            'sidebarOpen' => ! $request->hasCookie('sidebar_state')
                || $request->cookie('sidebar_state') === 'true',

            'pendingCounts' => fn () => $request->user()?->isAdmin() ? [
                'quests' => Quest::whereIn('status', ['draft', 'pending_approval'])->count(),
            ] : [],

            'footer' => fn () => app(FooterService::class)->getPublicFooterData(),

            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'message' => fn () => $request->session()->get('message'),
            ],
        ]);
    }
}
