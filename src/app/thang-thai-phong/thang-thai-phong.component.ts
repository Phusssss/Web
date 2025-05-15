import { Component, OnInit, HostListener } from '@angular/core';
import { RoomService } from '../services/room.service';
import { BillByHourService } from '../services/byHour.service';
import { KhuVucService } from '../services/khuvuc.service';
import { BookingService } from '../services/booking.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationPopupComponent } from '../notification-popup/notification-popup.component';

@Component({
  selector: 'app-thang-thai-phong',
  templateUrl: './thang-thai-phong.component.html',
  styleUrls: ['./thang-thai-phong.component.css']
})
export class ThangThaiPhongComponent implements OnInit {
  rooms: any[] = [];
  filteredRooms: any[] = [];
  groupedKhuVucs: { khuVucName: string, sortOrder: number, rooms: any[] }[] = [];
  khuVucs: any[] = [];
  isLoading: boolean = false;
  todayEvents: any[] = [];

  selectedStatus: string = 'Tất cả';
  selectedRoomType: string = 'Tất cả';
  selectedKhuVuc: string = 'Tất cả';

  statuses: string[] = ['Tất cả', 'Trống', 'Dơ', 'Đang thuê', 'Đã nhận phòng'];
  roomTypes: string[] = ['Tất cả'];
  khuVucsFilter: string[] = ['Tất cả'];

  // Room statistics
  roomStats = {
    total: 0,
    empty: 0,
    occupied: 0,
    dirty: 0
  };

  // Context menu variables
  contextMenuVisible: boolean = false;
  contextMenuPosition = { x: 0, y: 0 };
  selectedRoom: any = null;

  constructor(
    private roomService: RoomService,
    private billByHourService: BillByHourService,
    private khuVucService: KhuVucService,
    private bookingService: BookingService,
    private auth: AngularFireAuth,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.auth.authState.subscribe(user => {
      if (!user) {
        this.showNotification('Vui lòng đăng nhập để xem danh sách khu vực và phòng.', 'error');
        return;
      }
      this.loadRooms();
      this.loadTodayEvents();
    });

    // Close context menu when clicking anywhere
    document.addEventListener('click', () => this.hideContextMenu());
  }

  loadTodayEvents() {
    this.bookingService.getTodayCheckInOut().subscribe({
      next: (events) => {
        this.todayEvents = events;
      },
      error: (error) => {
        this.showNotification('Lỗi khi tải thông báo check-in/check-out: ' + error.message, 'error');
      }
    });
  }

  // Calculate room statistics
  private calculateRoomStats() {
    this.roomStats = {
      total: this.filteredRooms.length,
      empty: this.filteredRooms.filter(room => room.status === 'Trống').length,
      occupied: this.filteredRooms.filter(room => room.status === 'Đang thuê' || room.status === 'Đã nhận phòng').length,
      dirty: this.filteredRooms.filter(room => room.status === 'Dơ').length
    };
  }

  // Context menu methods
  showContextMenu(event: MouseEvent, room: any) {
    this.selectedRoom = room;
    this.contextMenuVisible = true;
    
    // Adjust position if near window edge
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const menuWidth = 180; // Approximate width of context menu
    const menuHeight = 150; // Approximate height of context menu
    
    this.contextMenuPosition = {
      x: event.clientX + menuWidth > windowWidth ? windowWidth - menuWidth - 10 : event.clientX,
      y: event.clientY + menuHeight > windowHeight ? windowHeight - menuHeight - 10 : event.clientY
    };
    
    event.preventDefault();
  }

  hideContextMenu() {
    this.contextMenuVisible = false;
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.hideContextMenu();
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.hideContextMenu();
  }

  loadRooms() {
    this.isLoading = true;
    this.roomService.getUserRooms().subscribe({
      next: (rooms) => {
        this.khuVucService.getUserKhuVuc().subscribe({
          next: (khuVucs) => {
            this.khuVucs = khuVucs;
            this.khuVucsFilter = ['Tất cả', ...this.khuVucs.map(k => k.name)];
            this.rooms = rooms.map(room => ({
              ...room,
              khuVucName: khuVucs.find(k => k.id === room.khuVucId)?.name || 'Không xác định',
              khuVucSortOrder: khuVucs.find(k => k.id === room.khuVucId)?.sortOrder || 9999
            }));
            this.filteredRooms = [...this.rooms];
            this.updateFilterOptions();
            this.applyFilters();
            this.calculateRoomStats();
            this.isLoading = false;
          },
          error: (error) => {
            this.isLoading = false;
            this.showNotification('Lỗi khi tải danh sách khu vực: ' + error.message, 'error');
          }
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.showNotification('Lỗi khi tải danh sách phòng: ' + error.message, 'error');
      }
    });
  }

  updateFilterOptions() {
    const uniqueRoomTypes = [...new Set(this.rooms.map(room => room.roomtypename))];
    this.roomTypes = ['Tất cả', ...uniqueRoomTypes.sort()];
  }

  applyFilters() {
    this.filteredRooms = this.rooms.filter(room => {
      const statusMatch = this.selectedStatus === 'Tất cả' || room.status === this.selectedStatus;
      const roomTypeMatch = this.selectedRoomType === 'Tất cả' || room.roomtypename === this.selectedRoomType;
      const khuVucMatch = this.selectedKhuVuc === 'Tất cả' || room.khuVucName === this.selectedKhuVuc;
      return statusMatch && roomTypeMatch && khuVucMatch;
    });

    const khuVucMap = new Map<string, { sortOrder: number, rooms: any[] }>();
    this.filteredRooms.forEach(room => {
      const khuVucName = room.khuVucName;
      if (!khuVucMap.has(khuVucName)) {
        khuVucMap.set(khuVucName, { sortOrder: room.khuVucSortOrder, rooms: [] });
      }
      khuVucMap.get(khuVucName)!.rooms.push(room);
    });

    this.groupedKhuVucs = Array.from(khuVucMap.entries())
      .map(([khuVucName, data]) => ({
        khuVucName,
        sortOrder: data.sortOrder,
        rooms: data.rooms.sort((a, b) => a.name.localeCompare(b.name))
      }))
      .sort((a, b) => (a.sortOrder || 9999) - (b.sortOrder || 9999));

    this.calculateRoomStats();
  }

  onFilterChange() {
    this.applyFilters();
  }

  async rentByHour(roomId: string, roomName: string) {
    this.isLoading = true;
    this.hideContextMenu();
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
      this.loadTodayEvents();
    } catch (error) {
      this.isLoading = false;
      this.showNotification('Lỗi khi thuê phòng: ' + (error as any).message, 'error');
    }
  }

  async cleanRoom(roomId: string) {
    this.isLoading = true;
    this.hideContextMenu();
    try {
      await this.roomService.cleanRoom(roomId);
      this.showNotification('Phòng đã được dọn sạch và sẵn sàng cho thuê!', 'success');
      this.loadRooms();
      this.loadTodayEvents();
    } catch (error) {
      this.isLoading = false;
      this.showNotification('Có lỗi xảy ra khi dọn phòng: ' + (error as any).message, 'error');
    }
  }

  async checkoutRoom(roomId: string, roomPriceByHour: number) {
    this.isLoading = true;
    this.hideContextMenu();
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
            ? services.map(service => `- ${service.nameService}: ${service.totalAmount.toLocaleString()} VND`).join('\n')
            : 'Không có dịch vụ nào.';
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
          this.loadTodayEvents();
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