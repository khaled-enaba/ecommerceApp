import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IOrder } from '../../shared/model/order.model';

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private http = inject(HttpClient);
    private readonly API_URL = `${environment.API_URL}order`;

    // Create new order
    createOrder(orderData: any): Observable<IOrder> {
        return this.http.post<IOrder>(`${this.API_URL}`, orderData);
    }

    // Get current user orders
    getOrders(): Observable<IOrder[]> {
        return this.http.get<IOrder[]>(`${this.API_URL}`);
    }

    // Get all orders (Admin only)
    getAllOrders(): Observable<IOrder[]> {
        return this.http.get<IOrder[]>(`${this.API_URL}/all`);

    }

    // Cancel order
    cancelOrder(orderId: string): Observable<IOrder> {
        return this.http.put<IOrder>(`${this.API_URL}/${orderId}/cancel`, {});
    }

    // Return order
    returnOrder(orderId: string, reason?: string): Observable<IOrder> {
        return this.http.put<IOrder>(`${this.API_URL}/${orderId}/return`, { reason });
    }

    // Handle return request (Admin)
    handleReturnRequest(orderId: string, status: string, response: string): Observable<IOrder> {
        return this.http.put<IOrder>(`${this.API_URL}/${orderId}/handle-return`, { status, response });
    }

    // Update order status
    updateOrderStatus(orderId: string, status: string): Observable<IOrder> {
        return this.http.put<IOrder>(`${this.API_URL}/${orderId}/status`, { status });
    }

    // Get orders by status breakdown (Admin)
    getOrdersByStatus(): Observable<{ pending: number; processing: number; received: number; cancelled: number; returned: number; rejected: number; completed: number }> {
        return this.http.get<any>(`${this.API_URL}/status-breakdown`).pipe(
            // Backend returns { data: { pending, processing, completed, cancelled } }
            // Transform to { pending, processing, received, cancelled }
            map(res => ({
                pending: res.data?.pending || 0,
                processing: res.data?.processing || 0,
                received: res.data?.received || 0,
                cancelled: res.data?.cancelled || 0,
                returned: res.data?.returned || 0,
                rejected: res.data?.rejected || 0,
                completed: res.data?.completed || 0,
            }))
        );
    }
}
