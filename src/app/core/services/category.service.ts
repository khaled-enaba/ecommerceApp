import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class CategoryService {
    private http = inject(HttpClient);
    private readonly API_URL = `${environment.API_URL}category`; // /api/category
    // Note: App.js mounts /api/subcategory also to category route, but usually we access via /api/category for sub creation?
    // Routes: POST / (create cat), GET / (get cats), POST /sub (create sub), GET /:catId/sub

    getCategories(): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_URL}`);
    }

    getSubCategories(categoryId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_URL}/${categoryId}/sub`);
    }

    // Admin
    createCategory(data: any): Observable<any> {
        return this.http.post<any>(`${this.API_URL}`, data);
    }

    createSubCategory(data: any): Observable<any> {
        return this.http.post<any>(`${this.API_URL}/sub`, data);
    }

    updateCategory(id: string, data: any): Observable<any> {
        return this.http.put<any>(`${this.API_URL}/${id}`, data);
    }

    deleteCategory(id: string): Observable<any> {
        return this.http.delete<any>(`${this.API_URL}/${id}`);
    }
}
