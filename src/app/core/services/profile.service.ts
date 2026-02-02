import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IUserProfile, IAddress, IPasswordChange, IUpdateProfile } from '../../shared/model/profile.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private http = inject(HttpClient);
  private apiUrl = environment.API_URL + 'user';
  private addressUrl = environment.API_URL + 'address';

  // Profile endpoints
  getProfile(): Observable<{ data: IUserProfile }> {
    return this.http.get<{ data: IUserProfile }>(`${this.apiUrl}/profile`);
  }

  updateProfile(data: IUpdateProfile): Observable<{ message: string; data: IUserProfile }> {
    return this.http.put<{ message: string; data: IUserProfile }>(`${this.apiUrl}/profile`, data);
  }

  changePassword(data: IPasswordChange): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/change-password`, data);
  }

  // Address endpoints
  getAddresses(): Observable<{ message: string; data: IAddress[] }> {
    return this.http.get<{ message: string; data: IAddress[] }>(`${this.addressUrl}`);
  }

  getAddressById(id: string): Observable<{ data: IAddress }> {
    return this.http.get<{ data: IAddress }>(`${this.addressUrl}/${id}`);
  }

  addAddress(data: IAddress): Observable<{ message: string; data: IAddress }> {
    return this.http.post<{ message: string; data: IAddress }>(`${this.addressUrl}`, data);
  }

  updateAddress(id: string, data: IAddress): Observable<{ message: string; data: IAddress }> {
    return this.http.put<{ message: string; data: IAddress }>(`${this.addressUrl}/${id}`, data);
  }

  deleteAddress(id: string): Observable<{ message: string; data: IAddress }> {
    return this.http.delete<{ message: string; data: IAddress }>(`${this.addressUrl}/${id}`);
  }

  setDefaultAddress(id: string): Observable<{ message: string; data: IAddress }> {
    return this.http.put<{ message: string; data: IAddress }>(`${this.addressUrl}/${id}/default`, {});
  }
}
