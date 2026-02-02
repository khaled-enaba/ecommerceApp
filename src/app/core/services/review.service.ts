import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ReviewService {
    private http = inject(HttpClient);
   
    private readonly API_URL = `${environment.API_URL}review`;

    getProductReviews(productId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_URL}/product/${productId}`);
    }

    getRecentReviews(): Observable<{ data: any[] }> {
        return this.http.get<{ data: any[] }>(`${this.API_URL}/recent`);
    }

    addReview(review: { userId: string, productId: string, rating: number, comment: string }): Observable<any> {
        return this.http.post<any>(`${this.API_URL}`, review);
    }

    getUserReviews(): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_URL}/my-reviews`);
    }

    // Admin methods
    getAllReviews(): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_URL}`);
    }

    approveReview(id: string): Observable<any> {
        return this.http.put<any>(`${this.API_URL}/${id}/approve`, {});
    }

    deleteReview(id: string): Observable<any> {
        return this.http.delete<any>(`${this.API_URL}/${id}`);
    }
}
