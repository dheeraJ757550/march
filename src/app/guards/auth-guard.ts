import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const token = localStorage.getItem('token');

  if (token) {
    return true; // User is authenticated, allow access
  }
  else {
    alert('Please login to access this page.');
     window.location.href = '/login';
    return false; // User is not authenticated, deny access
  }
};

