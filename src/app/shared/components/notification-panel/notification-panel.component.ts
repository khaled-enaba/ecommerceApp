import { Component, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-wrapper">
      <!-- Notification Bell Icon -->
      <div class="notification-bell" (click)="togglePanel()">
        <span class="bell-icon">🔔</span>
        <span class="badge" *ngIf="unreadCount() > 0">
          {{ unreadCount() }}
        </span>
      </div>

      <!-- Notification Panel -->
      <div class="notification-panel" *ngIf="isPanelOpen()">
        <div class="panel-header">
          <h3>Notifications</h3>
          <div class="panel-actions">
            <button (click)="markAllRead()" class="btn-small" title="Mark all as read">✓</button>
            <button (click)="refresh()" class="btn-small" title="Refresh">↻</button>
          </div>
        </div>

        <!-- Tabs -->
        <div class="notification-tabs">
          <button 
            *ngFor="let tab of tabs"
            [class.active]="activeTab() === tab"
            (click)="activeTab.set(tab)"
            class="tab-btn">
            {{ tab }}
          </button>
        </div>

        <!-- All Notifications -->
        <div class="notification-list" *ngIf="activeTab() === 'All'">
          <div class="notification-item" 
               *ngFor="let notif of notifications()"
               [class.unread]="!notif.read"
               (click)="markRead(notif.id)">
            <div class="notif-icon">{{ getIcon(notif.type) }}</div>
            <div class="notif-content">
              <div class="notif-title">{{ notif.title }}</div>
              <div class="notif-message">{{ notif.message }}</div>
              <div class="notif-time">{{ formatTime(notif.timestamp) }}</div>
            </div>
          </div>
          <div class="empty-state" *ngIf="notifications().length === 0">
            No notifications
          </div>
        </div>

        <!-- New Orders -->
        <div class="notification-list" *ngIf="activeTab() === 'Orders'">
          <div class="notification-item" 
               *ngFor="let order of newOrders()"
               [class.unread]="!order.read"
               (click)="markRead(order.id)">
            <div class="notif-icon">📦</div>
            <div class="notif-content">
              <div class="notif-title">{{ order.title }}</div>
              <div class="notif-message">{{ order.message }}</div>
              <div class="notif-time">{{ formatTime(order.timestamp) }}</div>
            </div>
          </div>
          <div class="empty-state" *ngIf="newOrders().length === 0">
            No new orders
          </div>
        </div>

        <!-- Stock Alerts -->
        <div class="notification-list" *ngIf="activeTab() === 'Stock'">
          <div class="notification-item" 
               *ngFor="let stock of stockAlerts()"
               [class.unread]="!stock.read"
               (click)="markRead(stock.id)">
            <div class="notif-icon">⚠️</div>
            <div class="notif-content">
              <div class="notif-title">{{ stock.title }}</div>
              <div class="notif-message">{{ stock.message }}</div>
              <div class="notif-time">{{ formatTime(stock.timestamp) }}</div>
            </div>
          </div>
          <div class="empty-state" *ngIf="stockAlerts().length === 0">
            No stock alerts
          </div>
        </div>

        <!-- Reviews -->
        <div class="notification-list" *ngIf="activeTab() === 'Reviews'">
          <div class="notification-item" 
               *ngFor="let review of newReviews()"
               [class.unread]="!review.read"
               (click)="markRead(review.id)">
            <div class="notif-icon">⭐</div>
            <div class="notif-content">
              <div class="notif-title">{{ review.title }}</div>
              <div class="notif-message">{{ review.message }}</div>
              <div class="notif-time">{{ formatTime(review.timestamp) }}</div>
            </div>
          </div>
          <div class="empty-state" *ngIf="newReviews().length === 0">
            No new reviews
          </div>
        </div>

        <!-- Messages -->
        <div class="notification-list" *ngIf="activeTab() === 'Messages'">
          <div class="notification-item" 
               *ngFor="let msg of messages()"
               [class.unread]="!msg.read"
               (click)="markRead(msg.id)">
            <div class="notif-icon">💬</div>
            <div class="notif-content">
              <div class="notif-title">{{ msg.title }}</div>
              <div class="notif-message">{{ msg.message }}</div>
              <div class="notif-time">{{ formatTime(msg.timestamp) }}</div>
            </div>
          </div>
          <div class="empty-state" *ngIf="messages().length === 0">
            No messages
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-wrapper {
      position: relative;
    }

    .notification-bell {
      position: relative;
      cursor: pointer;
      font-size: 24px;
      padding: 8px;
      transition: transform 0.2s;
    }

    .notification-bell:hover {
      transform: scale(1.1);
    }

    .badge {
      position: absolute;
      top: 0;
      right: 0;
      background: #ff4444;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
    }

    .notification-panel {
      position: absolute;
      top: 50px;
      right: 0;
      width: 400px;
      max-height: 600px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .panel-header {
      padding: 16px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .panel-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .panel-actions {
      display: flex;
      gap: 8px;
    }

    .btn-small {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 18px;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .btn-small:hover {
      background: #f0f0f0;
    }

    .notification-tabs {
      display: flex;
      border-bottom: 1px solid #eee;
      overflow-x: auto;
    }

    .tab-btn {
      flex: 1;
      padding: 12px;
      border: none;
      background: none;
      cursor: pointer;
      font-size: 13px;
      white-space: nowrap;
      border-bottom: 3px solid transparent;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      background: #f9f9f9;
    }

    .tab-btn.active {
      border-bottom-color: #007bff;
      color: #007bff;
      font-weight: 600;
    }

    .notification-list {
      overflow-y: auto;
      flex: 1;
      max-height: 400px;
    }

    .notification-item {
      display: flex;
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background 0.2s;
    }

    .notification-item:hover {
      background: #f9f9f9;
    }

    .notification-item.unread {
      background: #f0f7ff;
    }

    .notif-icon {
      font-size: 20px;
      margin-right: 12px;
      min-width: 24px;
    }

    .notif-content {
      flex: 1;
      min-width: 0;
    }

    .notif-title {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .notif-message {
      font-size: 13px;
      color: #666;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .notif-time {
      font-size: 12px;
      color: #999;
    }

    .empty-state {
      padding: 40px 16px;
      text-align: center;
      color: #999;
      font-size: 14px;
    }
  `]
})
export class NotificationPanelComponent {
  private notificationService = inject(NotificationService);
  private alertService = inject(AlertService);

  isPanelOpen = signal(false);
  activeTab = signal<'All' | 'Orders' | 'Stock' | 'Reviews' | 'Messages'>('All');
  
  tabs: ('All' | 'Orders' | 'Stock' | 'Reviews' | 'Messages')[] = ['All', 'Orders', 'Stock', 'Reviews', 'Messages'];

  notifications = this.notificationService.notifications;
  unreadCount = this.notificationService.unreadCount;
  newOrders = this.notificationService.newOrders;
  stockAlerts = this.notificationService.stockAlerts;
  newReviews = this.notificationService.newReviews;
  messages = this.notificationService.messages;

  togglePanel(): void {
    this.isPanelOpen.update(v => !v);
  }

  markRead(id: string): void {
    this.notificationService.markAsRead(id);
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead();
  }

  refresh(): void {
    this.notificationService.refresh();
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      order: '📦',
      stock: '⚠️',
      review: '⭐',
      message: '💬'
    };
    return icons[type] || '🔔';
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(date).toLocaleDateString();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-wrapper')) {
      this.isPanelOpen.set(false);
    }
  }
}
