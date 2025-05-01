import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-date-modal',
  template: `
    <h1>Ngày được chọn</h1>
    <p>{{ formatDate(data.selectedDate) }}</p>
    
    <div *ngIf="data.bookings.length > 0">
      <h2>Danh sách đặt phòng</h2>
      <div *ngFor="let booking of data.bookings" class="booking-item">
        <p>Mã đặt phòng: {{ booking.id }}</p>
        <p>Trạng thái: {{ booking.status }}</p>
        <p>Tổng tiền: {{ booking.totalCost | number }} VND</p>
        
        <div *ngFor="let detail of booking.details">
          <p>Phòng: {{ detail.nameRoom }}</p>
          <p>Trạng thái phòng: {{ detail.status }}</p>
          <p>Check-in: {{ formatDate(detail.checkin.seconds * 1000) }}</p>
          <p>Check-out: {{ formatDate(detail.checkout.seconds * 1000) }}</p>
        </div>
        <hr>
      </div>
    </div>
    
    <div *ngIf="data.bookings.length === 0">
      <p>Không có đặt phòng nào trong ngày này</p>
    </div>
  `,
  styles: [`
    .booking-item {
      margin-bottom: 20px;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
  `]
})
export class DateModalComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: {
    selectedDate: string;
    bookings: any[];
  }) { }

  formatDate(date: string | number): string {
    const parsedDate = new Date(date);
    const day = String(parsedDate.getDate()).padStart(2, '0');
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const year = parsedDate.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
