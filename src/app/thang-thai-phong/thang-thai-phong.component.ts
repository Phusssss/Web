import { Component, OnInit } from '@angular/core';
import { RoomService } from '../services/room.service';
import { BillByHourService } from '../services/byHour.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationPopupComponent } from '../notification-popup/notification-popup.component';

@Component({
  selector: 'app-thang-thai-phong',
  templateUrl: './thang-thai-phong.component.html',
  styleUrls: ['./thang-thai-phong.component.css']
})
export class ThangThaiPhongComponent implements OnInit {
  rooms: any[] = [];
  filteredRooms: any[] = []; // Danh sách phòng đã lọc
  isLoading: boolean = false;

  // Các giá trị lọc
  selectedStatus: string = 'Tất cả';
  selectedFloor: string = 'Tất cả';
  selectedRoomType: string = 'Tất cả';

  // Danh sách tùy chọn lọc
  statuses: string[] = ['Tất cả', 'Trống', 'Dơ', 'Đang thuê'];
  floors: string[] = ['Tất cả']; // Sẽ cập nhật từ dữ liệu
  roomTypes: string[] = ['Tất cả']; // Sẽ cập nhật từ dữ liệu

  constructor(
    private roomService: RoomService,
    private billByHourService: BillByHourService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadRooms();
  }

  loadRooms() {
    this.isLoading = true;
    this.roomService.getUserRooms().subscribe({
      next: (data) => {
        this.rooms = data;
        this.filteredRooms = [...this.rooms]; // Khởi tạo danh sách đã lọc
        this.updateFilterOptions(); // Cập nhật tùy chọn lọc
        this.applyFilters(); // Áp dụng lọc ban đầu
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.showNotification('Lỗi khi tải danh sách phòng: ' + error.message, 'error');
      }
    });
  }

  // Cập nhật danh sách tầng và loại phòng từ dữ liệu
  updateFilterOptions() {
    const uniqueFloors = [...new Set(this.rooms.map(room => room.floor || 'Không xác định'))];
    const uniqueRoomTypes = [...new Set(this.rooms.map(room => room.roomtypename))];
    this.floors = ['Tất cả', ...uniqueFloors];
    this.roomTypes = ['Tất cả', ...uniqueRoomTypes];
  }

  // Áp dụng bộ lọc
  applyFilters() {
    this.filteredRooms = this.rooms.filter(room => {
      const statusMatch = this.selectedStatus === 'Tất cả' || room.status === this.selectedStatus;
      const floorMatch = this.selectedFloor === 'Tất cả' || room.floor === this.selectedFloor;
      const roomTypeMatch = this.selectedRoomType === 'Tất cả' || room.roomtypename === this.selectedRoomType;
      return statusMatch && floorMatch && roomTypeMatch;
    });
  }

  // Xử lý khi thay đổi bộ lọc
  onFilterChange() {
    this.applyFilters();
  }

  async rentByHour(roomId: string, roomName: string) {
    this.isLoading = true;
    try {
      const startTime = new Date();
      const billId = await this.billByHourService.createInitialBill(roomId, roomName);

      await this.roomService.updateRoomStatusAndBooking(roomId, {
        status: 'Đang thuê',
        startTime: startTime.toISOString(),
        currentBookingId: billId
      });

      this.showNotification(`Phòng đã được thuê từ ${startTime.toLocaleString()}`, 'success');
      this.loadRooms();
    } catch (error) {
      this.isLoading = false;
      this.showNotification('Lỗi khi thuê phòng: ' + (error as any).message, 'error');
    }
  }

  async cleanRoom(roomId: string) {
    this.isLoading = true;
    try {
      await this.roomService.cleanRoom(roomId);
      this.showNotification('Phòng đã được dọn sạch và sẵn sàng cho thuê!', 'success');
      this.loadRooms();
    } catch (error) {
      this.isLoading = false;
      this.showNotification('Có lỗi xảy ra khi dọn phòng: ' + (error as any).message, 'error');
    }
  }

  async checkoutRoom(roomId: string, roomPriceByHour: number) {
    this.isLoading = true;
    try {
      const room = this.rooms.find(r => r.id === roomId);
      if (!room || !room.currentBookingId) {
        this.isLoading = false;
        this.showNotification('Không tìm thấy thông tin đặt phòng!', 'error');
        return;
      }

      const billId = room.currentBookingId;
      const startTime = new Date(room.startTime);
      const endTime = new Date();
      const diffMs = endTime.getTime() - startTime.getTime();

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const hoursRented = Math.ceil(diffMs / (1000 * 60 * 60));
      const roomCost = hoursRented * roomPriceByHour;

      this.billByHourService.getConfirmedServices(billId).subscribe({
        next: async (services) => {
          const serviceCharges = services.reduce((total, service) => total + service.totalAmount, 0);

          await this.billByHourService.updateBillOnCheckout(
            billId,
            endTime.toISOString(),
            hoursRented,
            roomCost,
            serviceCharges
          );

          await this.roomService.updateRoomStatusAndBooking(roomId, {
            status: 'Dơ',
            startTime: null,
            currentBookingId: null
          });

          let serviceList = services.length > 0
            ? services.map(service => `- ${service.nameService}: ${service.totalAmount.toLocaleString()} VND`).join("\n")
            : "Không có dịch vụ nào.";

          this.showNotification(
            `Phòng đã trả.\n` +
            `Thời gian thuê: ${hours} giờ ${minutes} phút.\n` +
            `Tiền phòng: ${roomCost.toLocaleString()} VND\n` +
            `Tiền dịch vụ: ${serviceCharges.toLocaleString()} VND\n` +
            `Danh sách dịch vụ:\n${serviceList}\n` +
            `Tổng cộng: ${(roomCost + serviceCharges).toLocaleString()} VND`,
            'success'
          );
          this.loadRooms();
        },
        error: (error) => {
          this.isLoading = false;
          this.showNotification('Lỗi khi lấy danh sách dịch vụ: ' + error.message, 'error');
        }
      });
    } catch (error) {
      this.isLoading = false;
      this.showNotification('Lỗi khi trả phòng: ' + (error as any).message, 'error');
    }
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