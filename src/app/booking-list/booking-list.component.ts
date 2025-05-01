import { Component, OnInit } from '@angular/core';
import { BookingService } from '../services/booking.service';
import { RoomService } from '../services/room.service';
import { CustomerService } from '../services/customer.service';
import { DichVuService } from '../services/dichvu.service';
import { CheckoutBillComponent } from '../checkout-bill/checkout-bill.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationPopupComponent } from '../notification-popup/notification-popup.component';

@Component({
  selector: 'app-booking-list',
  templateUrl: './booking-list.component.html',
  styleUrls: ['./booking-list.component.css']
})
export class BookingListComponent implements OnInit {
  bookings: any[] = [];
  filteredBookings: any[] = [];
  selectedBooking: any | null = null;
  dateFilter: string = '';
  serviceRequests: any[] = [];
  isLoading: boolean = false; // Thêm biến loading

  constructor(
    private bookingService: BookingService,
    private roomService: RoomService,
    private customerService: CustomerService,
    private serviceRequestService: DichVuService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.isLoading = true;
    this.bookingService.getUserBookings().subscribe(
      (bookings) => {
        const activeBookings = bookings.filter(booking => booking.status !== 'Đã thanh toán');

        activeBookings.forEach(booking => {
          booking.details.forEach((detail: any) => {
            this.roomService.getRoomName(detail.idRoom).subscribe(
              roomName => detail.roomName = roomName
            );
          });

        
        });

        this.bookings = activeBookings;
        this.filteredBookings = [...this.bookings];
        this.isLoading = false;
      },
      (error) => {
        this.isLoading = false;
        this.showNotification('Lỗi khi lấy danh sách đặt phòng: ' + error.message, 'error');
      }
    );
  }
  deleteBooking(bookingId: string): void {
    const modalRef = this.modalService.open(NotificationPopupComponent, { centered: true });
    modalRef.componentInstance.message = 'Bạn có chắc chắn muốn xóa hoàn toàn đặt phòng này khỏi hệ thống? Hành động này không thể hoàn tác!';
    modalRef.componentInstance.type = 'confirm';
    modalRef.result.then(
      async (result) => {
        if (result === 'confirm') {
          this.isLoading = true;
          try {
            await this.bookingService.deleteBooking(bookingId).toPromise();
            this.showNotification('Đã xóa đặt phòng thành công!', 'success');
            this.loadBookings();
          } catch (error) {
            this.showNotification('Lỗi khi xóa đặt phòng: ' + (error as any).message, 'error');
          }
          this.isLoading = false;
        }
      },
      () => {} // Khi đóng modal mà không chọn
    );
  }
  async checkout(bookingId: string) {
    this.isLoading = true;
    const booking = this.bookings.find(b => b.id === bookingId);

    this.serviceRequestService.getServiceRequestsByBooking(bookingId).subscribe(
      async (serviceRequests) => {
        const confirmedRequests = serviceRequests.filter((request: any) => request.status === 'confirmed');
        
        const modalRef = this.modalService.open(CheckoutBillComponent, { 
          size: 'lg',
          backdrop: 'static'
        });
        
        modalRef.componentInstance.booking = booking;
        modalRef.componentInstance.serviceRequests = confirmedRequests;

        try {
          await this.roomService.checkoutRoom(bookingId);
          await this.bookingService.markAsPaid(bookingId);
          this.showNotification('Checkout thành công!', 'success');
          this.loadBookings();
        } catch (error) {
          this.showNotification('Lỗi khi checkout: ' + (error as any).message, 'error');
        }
      },
      (error) => {
        this.isLoading = false;
        this.showNotification('Lỗi khi lấy thông tin dịch vụ: ' + error.message, 'error');
      }
    );
  }

  filterTodayBookings(): void {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.dateFilter = `${year}-${month}-${day}`;
    this.filterBookingsByDate();
  }

  filterBookingsByDate(): void {
    if (this.dateFilter) {
      this.filteredBookings = this.bookings.filter((booking) => {
        return booking.status !== 'Đã thanh toán' && booking.details.some((detail: any) => {
          const checkinDate = new Date(detail.checkin.toDate());
          const year = checkinDate.getFullYear();
          const month = String(checkinDate.getMonth() + 1).padStart(2, '0');
          const day = String(checkinDate.getDate()).padStart(2, '0');
          const formattedCheckinDate = `${year}-${month}-${day}`;
          return formattedCheckinDate === this.dateFilter;
        });
      });
    } else {
      this.filteredBookings = this.bookings.filter(booking => booking.status !== 'Đã thanh toán');
    }
  }

  cancelBooking(bookingId: string): void {
    const modalRef = this.modalService.open(NotificationPopupComponent, { centered: true });
    modalRef.componentInstance.message = 'Bạn có chắc chắn muốn hủy đặt phòng này?';
    modalRef.componentInstance.type = 'confirm';
    modalRef.result.then(
      async (result) => {
        if (result === 'confirm') {
          try {
            await this.bookingService.cancelBooking(bookingId);
            this.showNotification('Đã hủy đặt phòng thành công!', 'success');
            this.loadBookings();
          } catch (error) {
            this.showNotification('Lỗi khi hủy đặt phòng: ' + (error as any).message, 'error');
          }
        }
      },
      () => {} // Khi đóng modal mà không chọn
    );
  }

  isCheckInToday(booking: any): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return booking.details.some((detail: any) => {
      const checkinDate = new Date(detail.checkin.toDate());
      checkinDate.setHours(0, 0, 0, 0);
      return checkinDate.getTime() === today.getTime();
    });
  }

  checkinBooking(bookingId: string): void {
    const modalRef = this.modalService.open(NotificationPopupComponent, { centered: true });
    modalRef.componentInstance.message = 'Xác nhận check-in cho đặt phòng này?';
    modalRef.componentInstance.type = 'confirm';
    modalRef.result.then(
      () => {
        this.bookingService.checkin(bookingId).subscribe(
          () => {
            this.showNotification('Check-in thành công!', 'success');
            this.loadBookings();
          },
          (error) => {
            this.showNotification('Lỗi khi check-in: ' + error.message, 'error');
          }
        );
      },
      () => {}
    );
  }

  showBookingDetails(booking: any): void {
    if (this.selectedBooking === booking) {
      this.selectedBooking = null;
    } else {
      this.selectedBooking = booking;
      this.serviceRequestService.getServiceRequestsByBooking(booking.id).subscribe(
        (serviceRequests) => {
          this.serviceRequests = serviceRequests.filter((request: any) => request.status === 'confirmed');
        },
        (error) => {
          this.showNotification('Lỗi khi lấy yêu cầu dịch vụ: ' + error.message, 'error');
        }
      );
    }
  }

  private showNotification(message: string, type: 'success' | 'error' | 'confirm' = 'success') {
    const modalRef = this.modalService.open(NotificationPopupComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.message = message;
    modalRef.componentInstance.type = type;
  }
}