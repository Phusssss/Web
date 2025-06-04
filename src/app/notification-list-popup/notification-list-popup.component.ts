import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-notification-list-popup',
  templateUrl: './notification-list-popup.component.html',
  styleUrls: ['./notification-list-popup.component.css']
})
export class NotificationListPopupComponent {
  constructor(
    public dialogRef: MatDialogRef<NotificationListPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { events: any[] }
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  markAsRead(eventId: string): void {
    // Logic để đánh dấu thông báo đã đọc (có thể cập nhật trạng thái trong service hoặc backend)
    console.log(`Đánh dấu thông báo ${eventId} đã đọc`);
    // Gọi service để cập nhật trạng thái nếu cần
  }
}