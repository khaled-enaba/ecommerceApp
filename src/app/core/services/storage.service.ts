import { Injectable } from '@angular/core';
import { CartItem } from '../../shared/model/cart.model';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly USER_KEY = 'auth-user';
  private readonly TOKEN_KEY = 'auth-token';
  private readonly GUEST_CART = 'guest_cart';
  private readonly USER_CART = 'user_cart';

  saveUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUser(): any {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
  getCart(isLoggedIn: boolean): CartItem[] {
    const key = isLoggedIn ? this.USER_CART : this.GUEST_CART;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  setCart(isLoggedIn: boolean, items: CartItem[]): void {
    const key = isLoggedIn ? this.USER_CART : this.GUEST_CART;
    localStorage.setItem(key, JSON.stringify(items));
  }

  clearGuestCart(): void {
    localStorage.removeItem(this.GUEST_CART);
  }

  clean(): void {
    localStorage.clear();
  }
}
