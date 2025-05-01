import { Component, OnInit, OnDestroy } from '@angular/core';
import { NotificationService } from '../notification.service';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationModalComponent } from '../notification-modal/notification-modal.component';

@Component({
  selector: 'app-notifications',
  template: `
    <div class="container mt-4">
      <h2>Thông báo</h2>
      
      <!-- Nút kiểm tra gửi thông báo -->
      <div class="mb-3">
        <button class="btn btn-primary" (click)="sendTestNotification()">Gửi thông báo thử (VNPay)</button>
      </div>

      <!-- Danh sách thông báo -->
      <div class="notification-list">
        <div *ngIf="notifications.length === 0" class="alert alert-info">
          Không có thông báo nào.
        </div>
        <div *ngFor="let notification of notifications" 
             class="notification-item" 
             [ngClass]="{'unread': !notification.isRead}"
             (click)="openNotificationModal(notification)">
          <div class="notification-content">
            <p>{{ notification.message }}</p>
            <small>{{ notification.timestamp | date:'dd/MM/yyyy HH:mm:ss' }}</small>
          </div>
          <span class="badge" *ngIf="!notification.isRead">Chưa đọc</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-list {
      max-width: 600px;
      margin: 0 auto;
    }

    .notification-item {
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 5px;
      margin-bottom: 10px;
      cursor: pointer;
      background: #fff;
      transition: background 0.3s;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .notification-item.unread {
      background: #f8f9fa;
      font-weight: bold;
    }

    .notification-item:hover {
      background: #e9ecef;
    }

    .notification-content {
      flex: 1;
    }

    .badge {
      background: #dc3545;
      color: white;
      padding: 5px 10px;
      border-radius: 12px;
      font-size: 12px;
    }

    small {
      color: #6c757d;
    }
  `]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: any[] = [];
  subscription: Subscription | undefined;

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    this.subscription = this.notificationService.getUserNotifications()
      .subscribe(notifications => {
        this.notifications = notifications;
      });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  markAsRead(notificationId: string) {
    this.notificationService.markAsRead(notificationId);
  }

  sendTestNotification() {
    this.authService.getUser().subscribe(user => {
      if (user) {
        const transactionId = Math.floor(100000 + Math.random() * 900000); // Mã giao dịch ngẫu nhiên
        this.notificationService.sendNotification(
          user.uid,
          `Nhận tiền thành công từ VNPay. Mã GD: ${transactionId}. `
        );
      }
    });
  }

  openNotificationModal(notification: any) {
    const modalRef = this.modalService.open(NotificationModalComponent, { 
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.notification = notification;
  }
}