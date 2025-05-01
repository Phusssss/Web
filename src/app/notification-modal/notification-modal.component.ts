import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-notification-modal',
  template: `
    <div class="modal-header custom-header">
      <h5 class="modal-title"><i class="fas fa-bell mr-2"></i> Thông báo mới</h5>
      <button type="button" class="btn-close" (click)="activeModal.dismiss()"></button>
    </div>
    <div class="modal-body custom-body">
      <div class="notification-icon">
        <i class="fas fa-check-circle text-success"></i>
      </div>
      <p class="message"><strong>Thông điệp:</strong> {{ notification?.message }}</p>
      <p class="timestamp"><strong>Thời gian:</strong> {{ notification?.timestamp | date:'dd/MM/yyyy HH:mm:ss' }}</p>
      <p class="status"><strong>Trạng thái:</strong> {{ notification?.isRead ? 'Đã đọc' : 'Chưa đọc' }}</p>
    </div>
    <div class="modal-footer custom-footer">
      <button class="btn btn-success" 
              (click)="markAsRead(notification.id); activeModal.close()"
              *ngIf="!notification?.isRead">
        <i class="fas fa-check mr-2"></i> Đánh dấu đã đọc
      </button>
      <button class="btn btn-secondary" (click)="activeModal.close()">
        <i class="fas fa-times mr-2"></i> Đóng
      </button>
    </div>
  `,
  styles: [`
    .custom-header {
      background: linear-gradient(90deg, #28a745, #20c997);
      color: white;
      border-bottom: none;
    }

    .custom-header .btn-close {
      filter: invert(1);
    }

    .custom-body {
      padding: 20px;
      text-align: center;
    }

    .notification-icon {
      font-size: 40px;
      margin-bottom: 15px;
    }

    .message, .timestamp, .status {
      margin: 10px 0;
      text-align: left;
      font-size: 16px;
    }

    .message {
      font-weight: bold;
      color: #333;
    }

    .custom-footer {
      border-top: none;
      justify-content: center;
      gap: 10px;
    }

    .btn-success {
      background-color: #28a745;
      border: none;
    }

    .btn-success:hover {
      background-color: #218838;
    }

    .btn-secondary {
      background-color: #6c757d;
      border: none;
    }

    .btn-secondary:hover {
      background-color: #5a6268;
    }

    .mr-2 {
      margin-right: 8px;
    }
  `]
})
export class NotificationModalComponent {
  @Input() notification: any;

  constructor(
    public activeModal: NgbActiveModal,
    private notificationService: NotificationService
  ) {}

  markAsRead(notificationId: string) {
    this.notificationService.markAsRead(notificationId);
  }
}