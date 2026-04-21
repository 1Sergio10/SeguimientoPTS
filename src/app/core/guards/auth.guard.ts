import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.autenticado()) return true;
  return router.createUrlTree(['/auth']);
};

export const profesorGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (!auth.autenticado()) return router.createUrlTree(['/auth']);
  if (auth.esProfesor()) return true;
  return router.createUrlTree(['/dashboard']);
};

export const estudianteGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (!auth.autenticado()) return router.createUrlTree(['/auth']);
  if (auth.esEstudiante()) return true;
  return router.createUrlTree(['/dashboard']);
};

export const loginGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (!auth.autenticado()) return true;
  return router.createUrlTree(['/dashboard']);
};
