import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../core/services/report.service';
import { DataExporter } from '../../shared/components/data-exporter/data-exporter';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, DataExporter],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports implements OnInit {
  reportService = inject(ReportService);

  activeTab = signal<'sales' | 'products' | 'users' | 'orders'>('sales');
  reportData = signal<any[]>([]);
  reportColumns: { header: string, key: string }[] = [];
  isLoading = signal(false);

  ngOnInit() {
    this.loadReport();
  }

  switchTab(tab: 'sales' | 'products' | 'users' | 'orders') {
    this.activeTab.set(tab);
    this.loadReport();
  }

  loadReport() {
    this.isLoading.set(true);
    this.reportData.set([]);

    const tab = this.activeTab();

    switch (tab) {
      case 'sales':
        this.reportColumns = [
          { header: 'Date', key: 'createdAt' },
          { header: 'Order #', key: 'orderNumber' },
          { header: 'Amount', key: 'totalAmount' },
          { header: 'Status', key: 'status' }
        ];
        this.reportService.getOrderStats().subscribe({
          next: (res) => {
            this.reportData.set(res.data.recentOrders);
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false)
        });
        break;

      case 'products':
        this.reportColumns = [
          { header: 'Product Name', key: 'name' },
          { header: 'Price', key: 'price' },
          { header: 'Sold', key: 'soldCount' },
          { header: 'Stock', key: 'stock' }
        ];
        this.reportService.getProductStats().subscribe({
          next: (res) => {
            this.reportData.set(res.data.bestSellers);
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false)
        });
        break;

      case 'users':
        this.reportColumns = [
          { header: 'Name', key: 'name' },
          { header: 'Email', key: 'email' },
          { header: 'Role', key: 'role' },
          { header: 'Joined', key: 'createdAt' }
        ];
        this.reportService.getUserStats().subscribe({
          next: (res) => {
            this.reportData.set(res.data.users || []);
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false)
        });
        break;

      case 'orders':
        this.reportColumns = [
          { header: 'Order #', key: 'orderNumber' },
          { header: 'User', key: 'userName' },
          { header: 'Amount', key: 'totalAmount' },
          { header: 'Status', key: 'status' }
        ];
        this.reportService.getOrderStats().subscribe({
          next: (res) => {
            this.reportData.set(res.data.recentOrders.map((o: any) => ({
              ...o,
              userName: o.user?.name || 'Guest'
            })));
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false)
        });
        break;
    }
  }
}
