import { Injectable, inject } from '@angular/core';
import { Observable, tap, catchError, throwError, of } from 'rxjs';
import { ApiService } from './api-service';
import {
  LoginCredentials,
  AuthResponse,
  RegisterCredentials,
} from '../models/auth';
import { UserStore } from '../store/user.store';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from './toast-service';

@Injectable({
  providedIn: 'root',
})
export class AuthService extends ApiService {
  private userStore = inject(UserStore);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private translate = inject(TranslateService);

  constructor() {
    super();
    this.checkExistingToken();
  }

  changePassword(
    currentPassword: string,
    password: string,
    passwordConfirmation: string,
  ): Observable<AuthResponse> {
    return this.post<AuthResponse>(`auth/change-password`, {
      currentPassword,
      password,
      passwordConfirmation,
    }).pipe(
      tap((response) => {
        localStorage.setItem('jwt_token', response.jwt);
        this.toastService.successToast(
          this.translate.instant('changePassword.passwordChangedSuccess'),
        );
      }),
      catchError((error) => {
        this.toastService.errorToast(error.error.error.message);
        return throwError(() => new Error(error.error.error.message));
      }),
    );
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.post<AuthResponse>('auth/local', credentials).pipe(
      tap((response: AuthResponse) => {
        localStorage.setItem('jwt_token', response.jwt);
        this.router.navigate(['/']);
      }),
      catchError((error) => {
        const message =
          error?.error?.error?.message ||
          'login.loginError';
        return throwError(() => new Error(message));
      }),
    );
  }

  register(credentials: RegisterCredentials): Observable<AuthResponse> {
    return this.post<AuthResponse>('auth/local/register', credentials).pipe(
      tap((response: AuthResponse) => {
        this.toastService.successToast(
          this.translate.instant('auth.registerSuccess', {
            username: response.user.username,
          }),
        );
        this.router.navigate(['/login']);
      }),
      catchError((error) => {
        const message =
          error?.error?.error?.message ||
          'register.registerError';
        return throwError(() => new Error(message));
      }),
    );
  }

  logout(): void {
    localStorage.removeItem('jwt_token');
    this.userStore.setMe(null);
    this.router.navigate(['/login']);
  }

  getAuthState(): Observable<boolean> {
    const token = this.getToken();

    if (token && this.isTokenValid(token)) {
      return of(true);
    }

    if (token) {
      this.logout();
    }
    return of(false);
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  private checkExistingToken(): void {
    const token = this.getToken();
    if (token && !this.isTokenValid(token)) {
      this.logout();
    }
  }

  private isTokenValid(token: string): boolean {
    try {
      // Decode the JWT token (base64 decode the payload)
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));

      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (decodedPayload.exp && decodedPayload.exp < currentTime) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error decoding token:', error);
      return false;
    }
  }
}
