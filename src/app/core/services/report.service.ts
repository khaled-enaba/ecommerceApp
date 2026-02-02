import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ReportService {
    private http = inject(HttpClient);
    private readonly API_URL = `${environment.API_URL}report`;

    getDashboardOverview(): Observable<any> {
        return this.http.get<any>(`${this.API_URL}/overview`);
    }

    getSalesReport(params?: any): Observable<any> {
        return this.http.get<any>(`${this.API_URL}/sales`, { params });
    }

    getProductStats(): Observable<any> {
        return this.http.get<any>(`${this.API_URL}/products`);
    }

    getUserStats(params?: any): Observable<any> {
        return this.http.get<any>(`${this.API_URL}/users`, { params });
    }

    getOrderStats(): Observable<any> {
        return this.http.get<any>(`${this.API_URL}/orders`);
    }

    // New methods for enhanced dashboard
    getOrdersByStatus(): Observable<any> {
        return this.http.get<any>(`${this.API_URL}/orders-by-status`);
    }

    getSalesTrends(days: number = 7): Observable<any> {
        return this.http.get<any>(`${this.API_URL}/sales-trends`, { 
            params: { days } 
        });
    }

    getStockAlerts(): Observable<any> {
        return this.http.get<any>(`${this.API_URL}/stock-alerts`);
    }

    getPendingOrders(): Observable<any> {
        return this.http.get<any>(`${this.API_URL}/orders/pending`);
    }

    getPendingReviews(): Observable<any> {
        return this.http.get<any>(`${this.API_URL}/reviews/pending`);
    }

    getUnreadMessages(): Observable<any> {
        return this.http.get<any>(`${this.API_URL}/messages/unread`);
    }
}
