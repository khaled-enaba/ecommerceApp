import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

/**
 * Functional Auth Guard to protect routes from unauthenticated users.
 */
export const authGuard: CanActivateFn = (route, state) => {
    const auth = inject(Auth);
    const router = inject(Router);

    if (auth.isLoggedIn()) {
        return true;
    }

    // Redirect to login if not authenticated
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
};

/**
 * Admin Guard to protect admin-only routes like the Dashboard.
 */
export const adminGuard: CanActivateFn = (route, state) => {
    const auth = inject(Auth);
    const router = inject(Router);

    if (auth.isLoggedIn() && auth.isAdmin()) {
        return true;
    }

    // Redirect to home if not an admin
    router.navigate(['/']);
    return false;
};
