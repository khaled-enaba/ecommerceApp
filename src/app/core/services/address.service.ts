import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AddressService {
    private http = inject(HttpClient);
    private readonly API_URL = `${environment.API_URL}address`;

    getAddresses(): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_URL}`);
    }

    addAddress(address: any): Observable<any> {
        return this.http.post<any>(`${this.API_URL}`, address);
    }

    updateAddress(id: string, address: any): Observable<any> {
        return this.http.put<any>(`${this.API_URL}/${id}`, address);
    }

    removeAddress(id: string): Observable<any> {
        return this.http.delete<any>(`${this.API_URL}/${id}`);
    }
}
