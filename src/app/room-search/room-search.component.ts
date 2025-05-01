import { Component, OnInit, OnDestroy } from '@angular/core';
import { BookingService } from '../services/booking.service';
import { LoaiPhongService } from '../services/loaiphong.service';
import { CustomerService } from '../services/customer.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-room-search',
  templateUrl: './room-search.component.html',
  styleUrls: ['./room-search.component.css']
})
export class RoomSearchComponent implements OnInit, OnDestroy {
  customers: any[] = [];
  filteredCustomers: any[] = [];
  selectedCustomerId: string = '';
  customerSearchTerm: string = '';
  private customerSubscription?: Subscription;
  numberOfNights: number = 0;

  showAddCustomerForm: boolean = false;
  newCustomer = {
    name: '',
    email: '',
    phone: '',
    address: '',
    status: 'active',
    cccd: ''
  };

  roomTypes: any[] = [];
  rooms: any[] = [];
  selectedRoomTypeId: string = '';
  selectedRooms: any[] = [];
  totalCost: number = 0;
  checkinDate: string = '';
  checkoutDate: string = '';
  isBookingInProgress: boolean = false;
  private roomSubscription?: Subscription;

  constructor(
    private bookingService: BookingService,
    private loaiPhongService: LoaiPhongService,
    private authService: AuthService,
    private router: Router,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    this.authService.getUser().subscribe(user => {
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }
    });
    this.customerSubscription = this.customerService.getUserCustomers().subscribe(customers => {
      this.customers = customers;
      this.filteredCustomers = [...customers];
    });
    this.loaiPhongService.getUserLoaiPhong().subscribe((roomTypes) => {
      this.roomTypes = roomTypes;
    });
  }

  // Lọc danh sách khách hàng dựa trên từ khóa tìm kiếm
  filterCustomers(): void {
    if (!this.customerSearchTerm) {
      this.filteredCustomers = [...this.customers];
    } else {
      const searchTerm = this.customerSearchTerm.toLowerCase();
      this.filteredCustomers = this.customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm)
      );
    }
  }

  // Khi chọn khách hàng từ danh sách
  onCustomerSelect(): void {
    this.customerSearchTerm = '';
    this.filterCustomers();
  }

  calculateNights() {
    if (this.checkinDate && this.checkoutDate) {
      const checkin = new Date(this.checkinDate);
      const checkout = new Date(this.checkoutDate);
      if (checkout > checkin) {
        this.numberOfNights = Math.ceil((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        this.numberOfNights = 0;
      }
    } else {
      this.numberOfNights = 0;
    }
    this.calculateTotalCost();
  }

  ngOnDestroy(): void {
    if (this.roomSubscription) {
      this.roomSubscription.unsubscribe();
    }
    if (this.customerSubscription) {
      this.customerSubscription.unsubscribe();
    }
  }

  findRoomsByType() {
    if (!this.selectedRoomTypeId || !this.checkinDate || !this.checkoutDate) {
      alert("Vui lòng chọn loại phòng và nhập ngày!");
      return;
    }
  
    const checkin = new Date(this.checkinDate);
    const checkout = new Date(this.checkoutDate);
    
    if (checkin >= checkout) {
      alert("Ngày trả phòng phải sau ngày nhận phòng!");
      return;
    }
  
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    const maxBookingDays = 30;
    const daysDifference = Math.ceil((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDifference > maxBookingDays) {
      alert(`Không thể đặt phòng quá ${maxBookingDays} ngày!`);
      return;
    }
  
    if (this.roomSubscription) {
      this.roomSubscription.unsubscribe();
    }
    
    this.roomSubscription = this.bookingService.getAvailableRooms(
      this.selectedRoomTypeId,
      checkin,
      checkout
    ).subscribe(
      availableRooms => {
        this.rooms = availableRooms;
        if (availableRooms.length > 0) {
          alert(`Phòng được đề xuất: ${availableRooms[0].name} (ít ngày trống nhất: ${availableRooms[0].totalGapDays} ngày)`);
        }
      },
      error => {
        console.error('Error fetching available rooms:', error);
        alert("Đã xảy ra lỗi khi tìm phòng. Vui lòng thử lại sau!");
      }
    );
  }

  toggleRoomSelection(room: any): void {
    const isSelected = this.selectedRooms.find((selectedRoom) => selectedRoom.id === room.id);
    if (isSelected) {
      this.selectedRooms = this.selectedRooms.filter((selectedRoom) => selectedRoom.id !== room.id);
    } else {
      this.selectedRooms.push(room);
    }
    this.calculateTotalCost();
  }

  calculateTotalCost(): void {
    if (this.numberOfNights > 0) {
      this.totalCost = this.selectedRooms.reduce((total, room) => {
        return total + (room.roomPriceByDay * this.numberOfNights);
      }, 0);
    } else {
      this.totalCost = 0;
    }
  }

  toggleAddCustomerForm(): void {
    this.showAddCustomerForm = !this.showAddCustomerForm;
  }

  addNewCustomer(): void {
    if (!this.newCustomer.name || !this.newCustomer.email || !this.newCustomer.phone) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }

    this.customerService.addCustomer(
      this.newCustomer.name,
      this.newCustomer.email,
      this.newCustomer.phone,
      this.newCustomer.address,
      this.newCustomer.status,
      this.newCustomer.cccd
    ).then((docRef) => {
      alert('Thêm khách hàng thành công!');
      this.selectedCustomerId = docRef.id;
      this.toggleAddCustomerForm();
      this.resetNewCustomerForm();
      this.customers.push({ id: docRef.id, ...this.newCustomer });
      this.filterCustomers();
    }).catch(error => {
      console.error('Error adding customer:', error);
      alert('Có lỗi xảy ra khi thêm khách hàng. Vui lòng thử lại!');
    });
  }

  private resetNewCustomerForm(): void {
    this.newCustomer = {
      name: '',
      email: '',
      phone: '',
      address: '',
      status: 'active',
      cccd: ''
    };
  }

  createBooking(): void {
    if (!this.selectedCustomerId) {
      alert('Vui lòng chọn khách hàng hoặc thêm khách hàng mới trước khi đặt phòng.');
      return;
    }
  
    if (this.selectedRooms.length === 0) {
      alert('Vui lòng chọn ít nhất một phòng.');
      return;
    }
  
    if (this.isBookingInProgress) {
      return;
    }
  
    this.isBookingInProgress = true;
  
    // Lấy tên khách hàng từ danh sách customers dựa trên selectedCustomerId
    const selectedCustomer = this.customers.find(customer => customer.id === this.selectedCustomerId);
    const customerName = selectedCustomer ? selectedCustomer.name : '';
  
    const roomDetails = this.selectedRooms.map(room => ({
      idRoom: room.id,
      roomName: room.name,
      price: room.roomPriceByDay,
      checkin: this.checkinDate,
      checkout: this.checkoutDate,
    }));
  
    // Truyền thêm customerName vào createBooking
    this.bookingService.createBooking(roomDetails, this.totalCost, this.selectedCustomerId, customerName).subscribe(
      (bookingResponse) => {
        console.log('Booking created successfully:', bookingResponse);
        alert('Đặt phòng thành công!');
        this.resetBookingForm();
      },
      (error) => {
        console.error('Error creating booking:', error);
        alert('Có lỗi xảy ra khi đặt phòng. Vui lòng thử lại!');
        this.isBookingInProgress = false;
      }
    );
  }
  private resetBookingForm(): void {
    this.selectedRooms = [];
    this.rooms = [];
    this.totalCost = 0;
    this.checkinDate = '';
    this.checkoutDate = '';
    this.selectedRoomTypeId = '';
    this.isBookingInProgress = false;
    this.numberOfNights = 0;
  }
}