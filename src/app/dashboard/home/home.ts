import { Component, inject, OnInit, signal, computed, ViewChild, OnDestroy, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../core/services/report.service';
import { OrderService } from '../../core/services/order.service';
import { ProductService } from '../../core/services/product.service';
import { Auth } from '../../core/services/auth';
import { NotificationService } from '../../core/services/notification.service';
import { AlertService } from '../../core/services/alert.service';
import { NotificationPanelComponent } from '../../shared/components/notification-panel/notification-panel.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, catchError } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartEvent, ChartType } from 'chart.js';
import { IOrder } from '../../shared/model/order.model';
import { DashboardModule } from "../dashboard.module"; 

// Interface for status breakdown response
interface IStatusBreakdown {
  pending: number;
  processing: number;
  received: number;
  cancelled: number;
  returned: number;
  rejected: number;
  completed: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificationPanelComponent, BaseChartDirective, DashboardModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  constructor(public auth: Auth, public reportService: ReportService, private orderService: OrderService, private productService: ProductService,
    public notifications: NotificationService, public alerts: AlertService) {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.reportService.getDashboardOverview().pipe(
      map(res => res.data),
      catchError(() => of(null))
    ).subscribe(data => this.statsData.set(data));

    this.orderService.getOrdersByStatus().pipe(
      catchError(() => of(null))
    ).subscribe(data => this.ordersStatusData.set(data));

    this.productService.getTopProducts().pipe(
      map(res => res.data || []),
      catchError(() => of([]))
    ).subscribe(data => this.topProductsData.set(data));

    this.productService.getBestSellers().pipe(
      catchError(() => of([]))
    ).subscribe(data => this.bestSellersData.set(data));
  }


  // Main stats
  private statsData = signal<any>(null);
  stats = computed(() => this.statsData() || {
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  });

  private ordersStatusData = signal<IStatusBreakdown | null>(null);
  ordersByStatus = computed(() => this.ordersStatusData() || {
    pending: 0,
    processing: 0,
    received: 0,
    cancelled: 0,
    returned: 0,
    rejected: 0,
    completed: 0
  });

  // Top products
  private topProductsData = signal<any>([]);
  topProducts = computed(() => this.topProductsData());

  // Best sellers (for sales trend chart)
  private bestSellersData = signal<any>([]);
  bestSellers = computed(() => this.bestSellersData());

  isLoading = computed(() => this.statsData() === null);

  getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // ----------------------------------------------------------------------
  // CHART CONFIGURATIONS
  // ----------------------------------------------------------------------

  // 1. Sales Trend Chart (Line)
  public salesTrendOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: {
        tension: 0.4, // Smooth curves
        borderWidth: 3,
        fill: true,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
      }
    },
    plugins: {
      legend: { display: true, position: 'top' },
      title: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' }
      },
      x: {
        grid: { display: false }
      }
    }
  };

  public salesTrendData = computed<ChartData<'line'>>(() => {
    const bestSellersData = this.bestSellers();
    const bestSellers = Array.isArray(bestSellersData) ? bestSellersData.slice(0, 7) : [];

    // Fallback data if empty
    if (bestSellers.length === 0) {
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          data: [1000, 1200, 1100, 1400, 1350, 1500, 1600],
          label: 'Sales Trend',
          borderColor: '#4e73df',
          backgroundColor: 'rgba(78, 115, 223, 0.05)',
          pointBackgroundColor: '#4e73df',
          pointBorderColor: '#fff',
        }]
      };
    }

    // Real data
    return {
      labels: bestSellers.map((p: any) => p.name.substring(0, 10)),
      datasets: [{
        data: bestSellers.map((p: any) => p.soldCount || 0),
        label: 'Best Sellers Trend',
        borderColor: '#4e73df',
        backgroundColor: 'rgba(78, 115, 223, 0.05)',
        pointBackgroundColor: '#4e73df',
        pointBorderColor: '#fff',
      }]
    };
  });

  // 2. Orders Status Chart (Doughnut)
  public ordersStatusOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%', // Donut thickness
    plugins: {
      legend: { position: 'right' }
    }
  };

  public ordersStatusDataConfig = computed<ChartData<'doughnut'>>(() => {
    const status = this.ordersByStatus();
    return {
      labels: ['Pending', 'Processing', 'Received', 'Cancelled', 'Returned', 'Rejected', 'Completed'],
      datasets: [{
        data: [
          status?.pending || 0,
          status?.processing || 0,
          status?.received || 0,
          status?.cancelled || 0,
          status?.returned || 0,
          status?.rejected || 0,
          status?.completed || 0
        ],
        backgroundColor: [
          '#f6c23e', // Pending (Yellow)
          '#4e73df', // Processing (Blue)
          '#36b9cc', // Received (Cyan)
          '#e74a3b', // Cancelled (Red)
          '#fd7e14', // Returned (Orange)
          '#858796', // Rejected (Gray)
          '#1cc88a'  // Completed (Green)
        ],
        hoverOffset: 4
      }]
    };
  });

  // 3. Top Products Chart (Bar)
  public topProductsOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' }
      },
      x: {
        grid: { display: false }
      }
    }
  };

  public topProductsChartDataConfig = computed<ChartData<'bar'>>(() => {
    const products = this.topProducts().slice(0, 5);
    return {
      labels: products.map((p: any) => p.name.substring(0, 15)),
      datasets: [{
        data: products.map((p: any) => p.soldCount),
        label: 'Sales',
        backgroundColor: [
          '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b'
        ],
        borderRadius: 5
      }]
    };
  });

}
