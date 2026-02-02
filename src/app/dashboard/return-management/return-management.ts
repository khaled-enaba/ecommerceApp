import { Component, inject, signal, computed, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { OrderService } from '../../core/services/order.service';
import { Auth } from '../../core/services/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, catchError, of, BehaviorSubject, map } from 'rxjs';
import { DashboardModule } from "../dashboard.module";
import { IOrder } from '../../shared/model/order.model';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-return-management',
    standalone: true,
    imports: [CommonModule, DashboardModule, FormsModule],
    templateUrl: './return-management.html',
    styleUrl: './return-management.css',
})
export class ReturnManagement implements OnInit {
    private cdr = inject(ChangeDetectorRef);
    private orderService = inject(OrderService);
    public auth = inject(Auth);
    private toastr = inject(ToastrService);

    ngOnInit() {
        this.reloadTrigger.next();
        this.cdr.detectChanges();
    }

    // State Signals
    private reloadTrigger = new BehaviorSubject<void>(undefined);
    private operatingOrderId = signal<string | null>(null);

    // Response input state
    adminResponse = signal<string>('');
    selectedOrderId = signal<string | null>(null);

    // Reactive orders loading (only return-requested)
    private ordersData = toSignal(
        this.reloadTrigger.pipe(
            switchMap(() => this.orderService.getAllOrders()),
            map(res => {
                const allOrders = Array.isArray(res) ? res : [];
                // Filter only orders with return requests or returned/rejected for history
                return allOrders.filter((o: any) =>
                    o.status === 'return-requested' || o.status === 'returned' || o.status === 'return-rejected'
                );
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

    isOperating = (orderId: string) => this.operatingOrderId() === orderId;

    getImageUrl(filename: string | undefined): string {
        if (!filename) return '';
        return `${environment.STATIC_URL}${filename}`;
    }

    getStatusColor(status: string): string {
        const colors: { [key: string]: string } = {
            'return-requested': '#ff9800', 
            'returned': '#4caf50', 
            'return-rejected': '#f44336' 
        };
        return colors[status] || '#757575';
    }

    // Actions
    selectOrderForResponse(orderId: string) {
        this.selectedOrderId.set(orderId);
        this.adminResponse.set('');
    }

    cancelResponse() {
        this.selectedOrderId.set(null);
        this.adminResponse.set('');
    }

    approveReturn(orderId: string) {
        this.processReturn(orderId, 'returned');
    }

    rejectReturn(orderId: string) {
        if (!this.adminResponse()) {
            this.toastr.warning('Please provide a reason for rejection in the response field.');
            return;
        }
        this.processReturn(orderId, 'return-rejected');
    }

    private processReturn(orderId: string, status: string) {
        this.operatingOrderId.set(orderId);

        this.orderService.handleReturnRequest(orderId, status, this.adminResponse()).subscribe({
            next: () => {
                this.toastr.success(`Return ${status === 'returned' ? 'Approved' : 'Rejected'} successfully`);
                this.operatingOrderId.set(null);
                this.selectedOrderId.set(null);
                this.reloadTrigger.next();
            },
            error: (err) => {
                this.operatingOrderId.set(null);
                this.toastr.error('Error: ' + (err.error?.message || 'Failed to process return'));
            }
        });
    }
}
