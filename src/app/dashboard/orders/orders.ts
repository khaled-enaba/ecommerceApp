import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { OrderService } from '../../core/services/order.service';
import { Auth } from '../../core/services/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, catchError, of, BehaviorSubject, map } from 'rxjs';
import { DashboardModule } from "../dashboard.module";
import { IOrder } from '../../shared/model/order.model';
import { NotificationService } from '../../core/services/notification.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, DashboardModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements OnInit {
  private orderService = inject(OrderService);
  public auth = inject(Auth);
  public notificationService = inject(NotificationService);
  private toastr = inject(ToastrService);

  ngOnInit() {
    // Trigger initial order load
    console.log('Orders component loaded. isAdmin:', this.auth.isAdmin());
    this.reloadTrigger.next();
  }

  // State Signals
  private reloadTrigger = new BehaviorSubject<void>(undefined);
  private operatingOrderId = signal<string | null>(null);

  // Reactive orders loading
  private ordersData = toSignal(
    this.reloadTrigger.pipe(
      switchMap(() => {
        const isAdmin = this.auth.isAdmin();
        console.log('Fetching orders. isAdmin:', isAdmin);
        const endpoint = isAdmin
          ? this.orderService.getAllOrders()
          : this.orderService.getOrders();
        return endpoint;
      }),
      map(res => {
        console.log('Orders received:', res);
        return Array.isArray(res) ? res : [];
      }),
      catchError(err => {
        console.error('Error loading orders:', err);
        return of([]);
      })
    ),
    { initialValue: null }
  );

  // Computed Signals
  orders = computed<IOrder[]>(() => this.ordersData() || []);
  isLoading = computed(() => this.ordersData() === null);
  isAdmin = computed(() => this.auth.isAdmin());

  // Check if operation is in progress for specific order
  isOperating = (orderId: string) => this.operatingOrderId() === orderId;

  // Get Status Text (English)
  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pending',
      'preparing': 'Preparing',
      'shipped': 'Shipped',
      'received': 'Received',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  }

  getImageUrl(filename: string | undefined): string {
    if (!filename) return '';
    return `${environment.STATIC_URL}${filename}`;
  }

  // Cancel Order
  cancelOrder(orderId: string) {
    this.operatingOrderId.set(orderId);

    this.orderService.cancelOrder(orderId).subscribe({
      next: () => {
        this.operatingOrderId.set(null);
        this.reloadTrigger.next();
      },
      error: (err) => {
        this.operatingOrderId.set(null);
        this.toastr.error('Error: ' + (err.error?.message || 'Failed to cancel order'));
      }
    });
  }

  // Mark Order as Received
  markAsReceived(orderId: string) {
    this.operatingOrderId.set(orderId);

    this.orderService.updateOrderStatus(orderId, 'received').subscribe({
      next: () => {
        this.operatingOrderId.set(null);
        this.reloadTrigger.next();
      },
      error: (err) => {
        this.operatingOrderId.set(null);
        this.toastr.error('Error: ' + (err.error?.message || 'Failed to update order'));
      }
    });
  }
}
