import { Injectable } from '@angular/core';

const SESSION_KEY = 'tgk_admin_auth';

// Credentials stored here — change before deployment
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'Taguig@2026';

@Injectable({ providedIn: 'root' })
export class AuthService {

  login(username: string, password: string): boolean {
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      return true;
    }
    return false;
  }

  logout(): void {
    sessionStorage.removeItem(SESSION_KEY);
  }

  isLoggedIn(): boolean {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  }
}