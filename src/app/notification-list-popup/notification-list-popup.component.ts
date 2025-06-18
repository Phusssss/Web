import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ThongBaoChungService } from '../services/thongbao.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-notification-list-popup',
  templateUrl: './notification-list-popup.component.html',
  styleUrls: ['./notification-list-popup.component.css']
})
export class NotificationListPopupComponent implements OnInit {
  notifications$: Observable<any[]> | undefined;

  constructor(
    public dialogRef: MatDialogRef<NotificationListPopupComponent>,
    private thongBaoService: ThongBaoChungService
  ) {}

  ngOnInit(): void {
    this.notifications$ = this.thongBaoService.getUserThongBaoChung();
  }

  close(): void {
    this.dialogRef.close();
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      // Update the notification in Firestore to mark as read
      await this.thongBaoService.markAsRead(notificationId);
      alert('Đánh dấu thông báo đã đọc!');
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
    }
  }
}