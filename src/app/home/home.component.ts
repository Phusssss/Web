import { Component, OnInit } from '@angular/core';
import { RoomService } from '../services/room.service';
import { CustomerService } from '../services/customer.service';
import { BookingService } from '../services/booking.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  rooms: any[] = [];
  filteredRooms: any[] = []; // Store filtered rooms
  isLoading: boolean = true;
  selectedRoomDetails: any[] = [];
  
  selectedRoomType: string = ''; // Filter by room type
  selectedRoomStatus: string = ''; // Filter by room status
  roomNameFilter: string = ''; // Filter by room name
  selectedRoomArea: string = ''; // Bộ lọc khu vực
  roomAreas: string[] = []; // Danh sách khu vực
  roomTypes: string[] = []; // Store available room types

  constructor(
    private roomService: RoomService,
    private customerService: CustomerService,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    this.loadRooms();
  }

  loadRooms(): void {
    this.roomService.getUserRooms().subscribe({
      next: (data) => {
        this.rooms = data;
        this.isLoading = false;
  
        // Lấy danh sách loại phòng và khu vực
        this.roomTypes = [...new Set(this.rooms.map(room => room.roomType))];
        this.roomAreas = [...new Set(this.rooms.map(room => room.khuVucName))];
  
        this.applyFilters();
  
        this.rooms.forEach(room => {
          this.roomService.getNameTypeRoom(room.roomTypeId).subscribe({
            next: (name) => {
              room.loaiPhongName = name;
            },
            error: (err) => {
              console.error('Lỗi lấy tên loại phòng:', err);
            }
          });
  
          if (room.currentBookingId) {
            this.customerService.getCustomerNameByBookingId(room.currentBookingId).subscribe({
              next: (customerName) => {
                room.customerName = customerName || 'Không có khách hàng';
              },
              error: (err) => {
                console.error('Lỗi lấy tên khách hàng:', err);
                room.customerName = 'Lỗi tải dữ liệu';
              }
            });
          } else {
            room.customerName = 'Chưa đặt phòng';
          }
        });
      },
      error: (err) => {
        console.error("Lỗi lấy danh sách phòng:", err);
        this.isLoading = false;
      }
    });
  }
  applyFilters(): void {
    this.filteredRooms = this.rooms.filter(room => {
      const matchesRoomType = this.selectedRoomType ? room.roomType === this.selectedRoomType : true;
      const matchesRoomStatus = this.selectedRoomStatus ? room.status === this.selectedRoomStatus : true;
      const matchesRoomName = this.roomNameFilter ? room.name.toLowerCase().includes(this.roomNameFilter.toLowerCase()) : true;
      const matchesRoomArea = this.selectedRoomArea ? room.khuVucName === this.selectedRoomArea : true;
  
      return matchesRoomType && matchesRoomStatus && matchesRoomName && matchesRoomArea;
    });
  }

  viewRoomDetails(bookingId: string): void {
    this.bookingService.getDetailBookingById(bookingId).subscribe({
      next: (details) => {
        this.selectedRoomDetails = details;
        console.log('Room Booking Details:', this.selectedRoomDetails);
      },
      error: (err) => {
        console.error('Error fetching room booking details:', err);
      }
    });
  }

  closeModal(): void {
    this.selectedRoomDetails = [];
  }
}
