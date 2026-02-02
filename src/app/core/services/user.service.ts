import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private http = inject(HttpClient);
    private readonly API_URL = `${environment.API_URL}user`;

    getUsers(): Observable<any> {
        return this.http.get<any>(`${this.API_URL}`);
    }

    getUserById(id: string): Observable<any> {
        return this.http.get<any>(`${this.API_URL}/${id}`);
    }

    createUser(userData: any): Observable<any> {
        return this.http.post<any>(`${this.API_URL}/createuser`, userData);
    }

    createAdmin(adminData: any): Observable<any> {
        return this.http.post<any>(`${this.API_URL}/createadmin`, adminData);
    }

    updateUser(id: string, userData: any): Observable<any> {
        return this.http.put<any>(`${this.API_URL}/${id}`, userData);
    }

    resetPassword(id: string, password: string): Observable<any> {
        return this.http.put<any>(`${this.API_URL}/${id}/reset-password`, { password });
    }

    deleteUser(id: string): Observable<any> {
        return this.http.delete<any>(`${this.API_URL}/${id}`);
    }

}
