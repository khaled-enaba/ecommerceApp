import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ILogin, ILoginResponse, IStats, IUserData } from '../../shared/model/user.model';
import { environment } from '../../../environments/environment';
import { jwtDecode } from 'jwt-decode';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class Auth {

  private http = inject(HttpClient);
  private router = inject(Router);
  private storage = inject(StorageService);

  private readonly API_URL = `${environment.API_URL}auth`;

  private userSubject = new BehaviorSubject<IUserData | null>(this.getDecodedUser());
  currentUser$ = this.userSubject.asObservable();

  // Reusable Signal for all components
  currentUser = signal<IUserData | null>(this.getDecodedUser());
  isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  /* ================= AUTH ================= */

  login(credentials: ILogin): Observable<ILoginResponse> {
    return this.http
      .post<ILoginResponse>(`${this.API_URL}/login`, credentials)
      .pipe(tap(res => this.handleAuthentication(res.token)));
  }

  register(data: ILogin): Observable<ILoginResponse> {
    return this.http
      .post<ILoginResponse>(`${this.API_URL}/register`, data)
      .pipe(tap(res => this.handleAuthentication(res.token)));
  }

  logout(): void {
    this.storage.clean();
    this.userSubject.next(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  /* ================= HELPERS ================= */

  private handleAuthentication(token: string): void {
    this.storage.saveToken(token);

    const decoded = this.decodeToken(token);
    if (decoded) {
      console.log('User Authenticated. Role:', decoded.role);
      this.userSubject.next(decoded);
      this.currentUser.set(decoded);
      this.redirectByUserRole(decoded.role);
    }
  }

  private redirectByUserRole(role: string): void {
    role === 'ADMIN'
      ? this.router.navigate(['/dashboard'])
      : this.router.navigate(['/']);
  }

  private getDecodedUser(): IUserData | null {
    const token = this.storage.getToken();
    const user = token ? this.decodeToken(token) : null;
    if (user) console.log('Session Restored. Role:', user.role);
    return user;
  }

  decodeToken(token: string): IUserData | null {
    try {
      const decoded = jwtDecode<IUserData>(token);
      const isExpired = decoded.exp * 1000 < Date.now();

      if (isExpired) {
        this.logout();
        return null;
      }

      return decoded;
    } catch {
      return null;
    }
  }

  /* ================= GUARD / INTERCEPTOR ================= */

  isLoggedIn(): boolean {
    return !!this.userSubject.value;
  }

  getToken(): string | null {
    return this.storage.getToken();
  }

  get user(): IUserData | null {
    return this.userSubject.value;
  }

  refreshUser(): void {
    const user = this.getDecodedUser();
    this.userSubject.next(user);
    this.currentUser.set(user);
  }
}
