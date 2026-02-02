import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, interval, switchMap, tap, catchError } from 'rxjs';
import { of } from 'rxjs';

export interface StockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  minStockLevel: number;
  status: 'critical' | 'warning' | 'normal';
  lastUpdated: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.API_URL}product`;

  public stockAlertsSignal = signal<StockAlert[]>([]);
  public readonly stockAlerts = this.stockAlertsSignal.asReadonly();

  public readonly criticalAlerts = computed(() =>
    this.stockAlertsSignal().filter(a => a.status === 'critical')
  );

  public readonly warningAlerts = computed(() =>
    this.stockAlertsSignal().filter(a => a.status === 'warning')
  );

  public readonly totalAlerts = computed(() => this.stockAlertsSignal().length);

  private refreshTrigger = new BehaviorSubject<void>(undefined);

  constructor() {
    this.refreshTrigger
      .pipe(
        switchMap(() => this.fetchStockAlerts()),
        tap(alerts => this.stockAlertsSignal.set(alerts)),
        catchError(err => {
          console.error('Error fetching stock alerts:', err);
          return of([]);
        })
      )
      .subscribe();

    // Initial fetch
    this.refreshTrigger.next();

    // Auto-refresh every 60 seconds
    interval(60000).subscribe(() => this.refreshTrigger.next());
  }

  private fetchStockAlerts(): Promise<StockAlert[]> {
    return new Promise((resolve, reject) => {
      this.http
        .get<any>(`${this.API_URL}/low-stock`)
        .pipe(
          catchError(() => of({ data: [] }))
        )
        .subscribe(res => {
          const alerts = (res.data || []).map((product: any) => ({
            productId: product._id,
            productName: product.name,
            currentStock: product.stock,
            minStockLevel: 10,
            status: product.stock === 0 ? 'critical' : product.stock < 5 ? 'warning' : 'normal',
            lastUpdated: new Date()
          }));
          resolve(alerts);
        });
    });
  }

  refresh(): void {
    this.refreshTrigger.next();
  }
}
