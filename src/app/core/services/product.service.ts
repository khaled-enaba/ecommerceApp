import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs';
import { IProductRes, IProductsRes, Product } from '../../shared/model/product.model';


@Injectable({
  providedIn: 'root',
})
export class ProductService {

  private apiURL = environment.API_URL + 'product';

  constructor(private _http: HttpClient) { }

  getBestSellers(params?: any) {
    return this._http.get<Product[]>(this.apiURL + '/best-sellers', { params });
  }

  getNewArrivals(params?: any) {
    return this._http.get<Product[]>(this.apiURL + '/new-arrivals', { params });
  }

  getProducts(params?: any) {
    return this._http.get<IProductsRes>(this.apiURL, { params });
  }


  getProductBySlug(slug: string) {
    return this._http.get<IProductRes>(this.apiURL + `/${slug}`);
  }

  getRelatedProducts(id: string) {
    return this._http.get<IProductsRes>(this.apiURL + '/related/' + id);
  }

  createProduct(data: FormData) {
    return this._http.post<any>(this.apiURL, data);
  }

  updateProduct(id: string, data: FormData) {
    return this._http.put<any>(`${this.apiURL}/${id}`, data);
  }

  getProductById(id: string) {
    return this._http.get<IProductRes>(this.apiURL + '/id/' + id).pipe(
      map(res => res.data)
    );
  }

  deleteProduct(id: string) {
    return this._http.delete<any>(`${this.apiURL}/${id}`);
  }

  getTopProducts(limit: number = 5) {
    return this._http.get<any>(`${this.apiURL}/top-products`, { 
      params: { limit } 
    });
  }

  getLowStockProducts(threshold: number = 10) {
    return this._http.get<any>(`${this.apiURL}/low-stock`, { 
      params: { threshold } 
    });
  }
}
