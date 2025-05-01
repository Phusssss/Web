import { Component, OnInit } from '@angular/core';
import { DichVuService } from '../services/dichvu.service';  // Import dịch vụ DichVuService
import { ServiceRequest } from '../services/dichvu.service';  // Import model ServiceRequest
import { RoomService } from '../services/room.service';  // Import dịch vụ RoomService
import { AuthService } from '../services/auth.service';  // Import dịch vụ AuthService
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-place-service-request',
  templateUrl: './place-service-request.component.html',
  styleUrls: ['./place-service-request.component.css']
})
export class PlaceServiceRequestComponent implements OnInit {
  serviceRequest: ServiceRequest = {
    idBooking: '',
    idRoom: '',
    status: 'pending',
    serviceId: '',
    nameService: '',
    nameRoom: '',
    price: 0,
    quantity: 1,
    totalAmount: 0,
    bookingTime: ''
  };
  
  availableServices: any[] = [];
  availableRooms: any[] = [];
  serviceRequests: any[] = [];
  
  // Phân trang
  currentPage: number = 1; // Trang hiện tại
  itemsPerPage: number = 5; // Số lượng yêu cầu mỗi trang
  totalPages: number = 1; // Tổng số trang

  constructor(
    private dichVuService: DichVuService,
    private roomService: RoomService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.dichVuService.getDichVus().subscribe({
      next: (response) => {
        this.availableServices = response.map((item: any) => {
          return {
            id: item.payload.doc.id,
            name: item.payload.doc.data().name,
            price: item.payload.doc.data().price
          };
        });
      },
      error: (err) => {
        console.error('Error fetching services:', err);
      }
    });
  
    this.getUserRooms().subscribe({
      next: (rooms) => {
        this.availableRooms = rooms;
      },
      error: (err) => {
        console.error('Error fetching rooms:', err);
      }
    });
  
    // Fetch service requests
    this.dichVuService.getServiceRequests().subscribe({
      next: (requests) => {
        // Sắp xếp yêu cầu theo thời gian đặt gần đây nhất
        this.serviceRequests = requests.sort((a: any, b: any) => {
          const dateA = new Date(a.bookingTime);
          const dateB = new Date(b.bookingTime);
          return dateB.getTime() - dateA.getTime(); // Sắp xếp từ mới nhất đến cũ nhất
        });
  
        // Cập nhật tổng số trang
        this.totalPages = Math.ceil(this.serviceRequests.length / this.itemsPerPage);
      },
      error: (err) => {
        console.error('Error fetching service requests:', err);
      }
    });
  }
  

  // Phân trang: lấy danh sách yêu cầu của trang hiện tại
  get paginatedRequests(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.serviceRequests.slice(start, end);
  }

  // Thay đổi trang
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;  // Kiểm tra nếu trang hợp lệ
    this.currentPage = page;
  }

  // Phương thức xác nhận yêu cầu dịch vụ
  confirmServiceRequest(requestId: string): void {
    this.dichVuService.confirmServiceRequest(requestId).subscribe({
      next: (response) => {
        console.log('Service request confirmed:', response);
        alert('Dịch vụ đã được xác nhận!');
        
        const updatedRequest = this.serviceRequests.find(request => request.id === requestId);
        if (updatedRequest) {
          updatedRequest.status = 'confirmed';  // Cập nhật trạng thái
        }
      },
      error: (err) => {
        console.error('Error confirming service request:', err);
        alert('Lỗi khi xác nhận dịch vụ!');
      }
    });
  }

  // Phương thức để lấy danh sách phòng của người dùng
  getUserRooms(): Observable<any[]> {
    return this.authService.getUser().pipe(
      switchMap(user => {
        if (!user) return [];  // Return empty array if user is not logged in
        return this.roomService.getUserRooms();
      })
    );
  }

  onRoomSelect(roomId: string): void {
    const selectedRoom = this.availableRooms.find(room => room.id === roomId);
    
    if (selectedRoom) {
      this.serviceRequest.idRoom = selectedRoom.id;
      this.serviceRequest.idBooking = selectedRoom.currentBookingId;
      this.serviceRequest.nameRoom = selectedRoom.name;
    }
  }

  onServiceSelect(serviceId: string): void {
    const selectedService = this.availableServices.find(service => service.id === serviceId);
    if (selectedService) {
      this.serviceRequest.price = selectedService.price;
      this.updateTotalAmount();
    }
  }

  updateTotalAmount(): void {
    this.serviceRequest.totalAmount = this.serviceRequest.price * this.serviceRequest.quantity;
  }

  placeRequest(): void {
    if (!this.serviceRequest.idRoom) {
      alert('Vui lòng chọn một phòng trước khi đặt yêu cầu!');
      return;
    }
  
    const selectedService = this.availableServices.find(service => service.id === this.serviceRequest.serviceId);
    this.serviceRequest.nameService = selectedService ? selectedService.name : '';
    
    this.dichVuService.placeServiceRequest(this.serviceRequest).subscribe({
      next: (response) => {
        alert('Yêu cầu dịch vụ đã được đặt thành công!');
      },
      error: (err) => {
        alert('Lỗi khi đặt yêu cầu dịch vụ!');
      }
    });
  }
}


