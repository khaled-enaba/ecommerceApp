import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from './storage.service';
import { Observable, of, forkJoin } from 'rxjs';
import { tap, switchMap, map } from 'rxjs/operators';
import { signal, computed } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Auth } from './auth';
import { CartItem } from '../../shared/model/cart.model';
import { BehaviorSubject } from 'rxjs';
import { ProductService } from './product.service';
@Injectable({
  providedIn: 'root',
})
export class CartService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.API_URL}cart`;
  private storage = inject(StorageService);
  private auth = inject(Auth);
  private cartItemsSignal = signal<CartItem[]>([]);
  public readonly items = this.cartItemsSignal.asReadonly();
  public readonly cartCount = computed(() => this.cartItemsSignal().length);
  private productService = inject(ProductService);

  constructor() {
    this.loadCart();
  }

  loadCart() {
    console.log('loadCart called');
    if (this.auth.currentUser()) {
      console.log('Loading cart for logged-in user');
      this.http.get<{ items: any[] }>(this.API_URL).pipe(
        tap(res => {
          console.log('API response:', res);
          // Backend returns { items: [...] } not { products: [...] }
          // Check if items array exists
          if (!res || !res.items || !Array.isArray(res.items)) {
            console.warn('Invalid cart response structure, setting empty cart');
            this.cartItemsSignal.set([]);
            return;
          }

          // Backend structure: items[{ productId: {populated product}, quantity, storedPrice }]
          const items = res.items.map((item: any) => ({
            productId: item.productId?._id || item.productId,
            quantity: item.quantity,
            product: item.productId // Backend populates productId with full product details
          }));
          this.cartItemsSignal.set(items);
          console.log('Logged-in user cart loaded:', items);
        })
      ).subscribe({
        error: (err) => {
          console.error('Error loading cart for logged-in user:', err);
          this.cartItemsSignal.set([]);
        }
      });
    } else {
      console.log('Loading cart for guest user');
      const guestCart = this.storage.getCart(false);
      console.log('Guest cart from storage:', guestCart);

      if (guestCart.length === 0) {
        this.cartItemsSignal.set([]);
        console.log('Guest cart is empty');
        return;
      }

      // Fetch product details for each item in the cart
      const productRequests = guestCart.map(item =>
        this.productService.getProductById(item.productId).pipe(
          map(product => ({
            productId: item.productId,
            quantity: item.quantity,
            product: product
          }))
        )
      );

      forkJoin(productRequests).subscribe({
        next: (items) => {
          console.log('Guest cart with product details:', items);
          this.cartItemsSignal.set(items);
        },
        error: (err) => {
          console.error('Error loading guest cart products:', err);
          // If there's an error, still set the cart items without product details
          this.cartItemsSignal.set(guestCart);
        }
      });
    }
  }

  addToCart(productId: string, quantity: number) {
    console.log('CartService.addToCart called with:', { productId, quantity });
    console.log('Current user:', this.auth.currentUser());

    if (this.auth.currentUser()) {
      console.log('User is logged in, making API call to:', `${this.API_URL}/add`);
      this.http.post(`${this.API_URL}/add`, { productId, quantity }).subscribe({
        next: () => {
          console.log('API call successful, reloading cart');
          this.loadCart();
        },
        error: (err) => {
          console.error('Error adding to cart:', err);
        }
      });
    } else {
      console.log('Guest user, updating local cart');
      const guestCart = this.storage.getCart(false);
      console.log('Current cart from storage before update:', guestCart);
      const itemIndex = guestCart.findIndex(i => i.productId === productId);

      if (itemIndex > -1) {
        console.log('Item exists, updating quantity');
        guestCart[itemIndex].quantity += quantity;
      } else {
        console.log('New item, adding to cart');
        guestCart.push({ productId, quantity });
      }

      console.log('Updated cart to save:', guestCart);
      this.storage.setCart(false, guestCart);
      // Reload cart to fetch product details
      this.loadCart();
    }
  }

  mergeCartsAfterLogin() {
    const guestCart = this.storage.getCart(false);
    if (guestCart.length > 0) {
      // Recursively add items or usage promise.all
      // Since /add is one by one
      guestCart.forEach(item => {
        this.addToCart(item.productId, item.quantity);
      });
      this.storage.clearGuestCart();
    }
    this.loadCart();
  }

  getCartCount() {
    return this.cartItemsSignal().length;
  }

  removeFromCart(itemId: string): Observable<any> {
    if (this.auth.currentUser()) {
      return this.http.delete(`${this.API_URL}/remove/${itemId}`).pipe(tap(() => this.loadCart()));
    } else {
      const currentCart = this.cartItemsSignal().filter(i => i.productId !== itemId);
      this.storage.setCart(false, currentCart);
      this.cartItemsSignal.set(currentCart);
      return of(null);
    }
  }

  updateCartItemQuantity(itemId: string, quantity: number): Observable<any> {
    if (this.auth.currentUser()) {
      return this.http.put(`${this.API_URL}/update`, { productId: itemId, quantity }).pipe(tap(() => this.loadCart()));
    } else {
      const currentCart = [...this.cartItemsSignal()];
      const item = currentCart.find(i => i.productId === itemId);
      if (item) {
        item.quantity = quantity;
        this.storage.setCart(false, currentCart);
        this.cartItemsSignal.set(currentCart);
      }
      return of(null);
    }
  }

}
