import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, interval } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface Notification {
  id: string;
  type: 'order' | 'stock' | 'review' | 'message';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.API_URL}report`;

  private notificationsSignal = signal<Notification[]>([]);
  public readonly notifications = this.notificationsSignal.asReadonly();

  public readonly unreadCount = computed(() =>
    this.notificationsSignal().filter(n => !n.read).length
  );

  public readonly newOrders = computed(() =>
    this.notificationsSignal()
      .filter(n => n.type === 'order')
      .slice(0, 5)
  );

  public readonly stockAlerts = computed(() =>
    this.notificationsSignal()
      .filter(n => n.type === 'stock')
      .slice(0, 5)
  );

  public readonly newReviews = computed(() =>
    this.notificationsSignal()
      .filter(n => n.type === 'review')
      .slice(0, 5)
  );

  public readonly messages = computed(() =>
    this.notificationsSignal()
      .filter(n => n.type === 'message')
      .slice(0, 5)
  );

  private refreshTrigger = new BehaviorSubject<void>(undefined);

  constructor() {
    // Auto-refresh notifications every 30 seconds
    this.refreshTrigger
      .pipe(
        switchMap(() => this.fetchNotifications()),
        tap(notifications => this.notificationsSignal.set(notifications)),
        catchError(err => {
          console.error('Error fetching notifications:', err);
          return of([]);
        })
      )
      .subscribe();

    // Trigger initial fetch and set up interval
    this.refreshTrigger.next();
    interval(30000).subscribe(() => this.refreshTrigger.next());
  }

  private fetchNotifications(): Promise<Notification[]> {
    return new Promise(resolve => {
      // Combine all notification sources
      Promise.all([
        this.fetchNewOrders(),
        this.fetchStockAlerts(),
        this.fetchNewReviews(),
        this.fetchMessages()
      ]).then(([orders, stocks, reviews, messages]) => {
        const allNotifications = [
          ...orders,
          ...stocks,
          ...reviews,
          ...messages
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        resolve(allNotifications);
      });
    });
  }

  private fetchNewOrders(): Promise<Notification[]> {
    return new Promise(resolve => {
      this.http
        .get<any>(`${this.API_URL}/orders/pending`)
        .pipe(
          catchError(() => of({ data: [] }))
        )
        .subscribe(res => {
          const orders = (res.data || []).slice(0, 3).map((order: any) => ({
            id: order._id,
            type: 'order' as const,
            title: `New Order #${order.orderNumber}`,
            message: `${order.items.length} items - Total: $${order.totalAmount}`,
            timestamp: new Date(order.createdAt),
            read: false,
            data: order
          }));
          resolve(orders);
        });
    });
  }

  private fetchStockAlerts(): Promise<Notification[]> {
    return new Promise(resolve => {
      this.http
        .get<any>(`${this.API_URL}/stock-alerts`)
        .pipe(
          catchError(() => of({ data: [] }))
        )
        .subscribe(res => {
          const alerts = (res.data || []).slice(0, 3).map((product: any) => ({
            id: product._id,
            type: 'stock' as const,
            title: `Low Stock: ${product.name}`,
            message: `Only ${product.stock} units remaining`,
            timestamp: new Date(),
            read: false,
            data: product
          }));
          resolve(alerts);
        });
    });
  }

  private fetchNewReviews(): Promise<Notification[]> {
    return new Promise(resolve => {
      this.http
        .get<any>(`${this.API_URL}/reviews/pending`)
        .pipe(
          catchError(() => of({ data: [] }))
        )
        .subscribe(res => {
          const reviews = (res.data || []).slice(0, 3).map((review: any) => ({
            id: review._id,
            type: 'review' as const,
            title: `New Review - ${review.productName}`,
            message: `"${review.comment.substring(0, 50)}..." - ${review.rating}⭐`,
            timestamp: new Date(review.createdAt),
            read: false,
            data: review
          }));
          resolve(reviews);
        });
    });
  }

  private fetchMessages(): Promise<Notification[]> {
    return new Promise(resolve => {
      this.http
        .get<any>(`${this.API_URL}/messages/unread`)
        .pipe(
          catchError(() => of({ data: [] }))
        )
        .subscribe(res => {
          const messages = (res.data || []).slice(0, 3).map((msg: any) => ({
            id: msg._id,
            type: 'message' as const,
            title: `Message from ${msg.senderName}`,
            message: msg.content.substring(0, 50) + '...',
            timestamp: new Date(msg.createdAt),
            read: false,
            data: msg
          }));
          resolve(messages);
        });
    });
  }

  markAsRead(notificationId: string): void {
    const notifications = this.notificationsSignal();
    const updated = notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    this.notificationsSignal.set(updated);
  }

  markAllAsRead(): void {
    const notifications = this.notificationsSignal();
    const updated = notifications.map(n => ({ ...n, read: true }));
    this.notificationsSignal.set(updated);
  }

  clearNotifications(): void {
    this.notificationsSignal.set([]);
  }

  refresh(): void {
    this.refreshTrigger.next();
  }
}
