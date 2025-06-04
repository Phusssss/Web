import { Component, OnInit } from '@angular/core';
import { BookingService } from '../services/booking.service';
import DayGridPlugin from '@fullcalendar/daygrid';
import InteractionPlugin from '@fullcalendar/interaction';
import { MatDialog } from '@angular/material/dialog';
import { DateModalComponent } from '../date-modal/date-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationPopupComponent } from '../notification-popup/notification-popup.component';

@Component({
  selector: 'app-home',
  templateUrl: './home1.component.html',
  styleUrls: ['./home1.component.css']
})
export class Home1Component implements OnInit {
  bookings: any[] = [];
  todayCheckins: any[] = [];
  todayCheckouts: any[] = [];
  overnightRooms: any[] = [];
  todayEvents: any[] = [];
  totalCheckins: number = 0;
  totalCheckouts: number = 0;
  isLoading: boolean = false;

  calendarOptions: any = {
    initialView: 'dayGridMonth',
    locale: 'vi',
    events: [],
    dateClick: this.onDateClick.bind(this),
    plugins: [DayGridPlugin, InteractionPlugin],
    displayEventTime: false,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: ''
    }
  };

  constructor(
    private bookingService: BookingService,
    public dialog: MatDialog,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadBookings();
    this.loadTodayEvents();
  }

  loadBookings(): void {
    this.isLoading = true;
    this.bookingService.getUserBookings().subscribe(
      (bookings: any[]) => {
        this.bookings = bookings;
        this.updateCalendarEvents();
        this.calculateRoomStats();
        this.isLoading = false;
      },
      (error) => {
        this.isLoading = false;
        this.showNotification('Lỗi khi tải danh sách đặt phòng: ' + error.message, 'error');
      }
    );
  }

  loadTodayEvents(): void {
    this.isLoading = true;
    this.bookingService.getTodayCheckInOut().subscribe({
      next: (events) => {
        this.todayEvents = events;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.showNotification('Lỗi khi tải thông báo check-in/check-out: ' + error.message, 'error');
      }
    });
  }

  updateCalendarEvents(): void {
    const events = this.bookings.flatMap(booking =>
      booking.details.map((detail: any) => ({
        title: `Phòng ${detail.nameRoom}`,
        start: new Date(detail.checkin.seconds * 1000),
        end: new Date(detail.checkout.seconds * 1000),
        color: this.getStatusColor(booking.status)
      }))
    );
    this.calendarOptions.events = events;
  }

  calculateRoomStats(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.todayCheckins = [];
    this.todayCheckouts = [];
    this.overnightRooms = [];

    this.bookings.forEach(booking => {
      booking.details.forEach((detail: any) => {
        const checkinDate = new Date(detail.checkin.seconds * 1000);
        checkinDate.setHours(0, 0, 0, 0);

        const checkoutDate = new Date(detail.checkout.seconds * 1000);
        checkoutDate.setHours(0, 0, 0, 0);

        if (checkinDate.getTime() === today.getTime()) {
          this.todayCheckins.push(detail);
        }

        if (checkoutDate.getTime() === today.getTime()) {
          this.todayCheckouts.push(detail);
        }

        if (checkinDate.getTime() < today.getTime() && checkoutDate.getTime() > today.getTime()) {
          this.overnightRooms.push(detail);
        }
      });
    });

    this.totalCheckins = this.todayCheckins.length;
    this.totalCheckouts = this.todayCheckouts.length;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Đã thanh toán': return '#38b2ac';
      case 'Đã nhận phòng': return '#2c5282';
      case 'Đang chờ xử lý': return '#ed8936';
      default: return '#9E9E9E';
    }
  }

  onDateClick(date: any): void {
    const selectedDate = new Date(date.dateStr);
    selectedDate.setHours(0, 0, 0, 0);

    const filteredBookings = this.bookings.filter(booking =>
      booking.details.some((detail: any) => {
        const checkinDate = new Date(detail.checkin.seconds * 1000);
        checkinDate.setHours(0, 0, 0, 0);
        return checkinDate.getTime() === selectedDate.getTime();
      })
    );

    this.dialog.open(DateModalComponent, {
      data: {
        selectedDate: date.dateStr,
        bookings: filteredBookings
      },
      width: '500px'
    });
  }

  private showNotification(message: string, type: 'success' | 'error') {
    const modalRef = this.modalService.open(NotificationPopupComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.message = message;
    modalRef.componentInstance.type = type;
  }
}