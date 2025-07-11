import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RoomService } from '../services/room.service';
import { LoaiPhongService } from '../services/loaiphong.service';
import { KhuVucService } from '../services/khuvuc.service';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.css']
})
export class RoomComponent implements OnInit {
  // Room properties
  roomForm: FormGroup;
  userRooms: any[] = [];
  filteredRooms: any[] = [];
  paginatedRooms: any[] = [];
  selectedRoomId: string | null = null;
  selectedRoom: any = null;
  roomSearchTerm: string = '';
  isRoomModalOpen: boolean = false;
  isRoomViewModalOpen: boolean = false;
  isRoomEditMode: boolean = false;
  roomCurrentPage: number = 1;
  roomPageSize: number = 10;
  roomTotalPages: number = 1;

  // Room Type properties
  loaiPhongForm: FormGroup;
  userLoaiPhong: any[] = [];
  filteredLoaiPhong: any[] = [];
  paginatedLoaiPhong: any[] = [];
  selectedLoaiPhongId: string | null = null;
  selectedLoaiPhong: any = null;
  loaiPhongSearchTerm: string = '';
  isLoaiPhongModalOpen: boolean = false;
  isLoaiPhongViewModalOpen: boolean = false;
  isLoaiPhongEditMode: boolean = false;
  loaiPhongCurrentPage: number = 1;
  loaiPhongPageSize: number = 10;
  loaiPhongTotalPages: number = 1;

  // Area properties
  khuVucForm: FormGroup;
  areaList: any[] = [];
  filteredAreas: any[] = [];
  paginatedAreas: any[] = [];
  selectedAreaId: string | null = null;
  selectedArea: any = null;
  areaSearchTerm: string = '';
  isKhuVucModalOpen: boolean = false;
  isKhuVucViewModalOpen: boolean = false;
  isKhuVucEditMode: boolean = false;
  areaCurrentPage: number = 1;
  areaPageSize: number = 10;
  areaTotalPages: number = 1;

  activeTab: string = 'room-types';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private roomService: RoomService,
    private loaiPhongService: LoaiPhongService,
    private khuVucService: KhuVucService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {
    this.roomForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      roomPriceByDay: [0, [Validators.required, Validators.min(0)]],
      roomPriceByHour: [0, [Validators.required, Validators.min(0)]],
      roomTypeId: ['', Validators.required],
      areaId: ['', Validators.required]
    });

    this.loaiPhongForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      maxPeople: [0, [Validators.required, Validators.min(1)]]
    });

    this.khuVucForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      sortOrder: [0, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.loadRooms();
    this.loadLoaiPhong();
    this.loadAreas();
    this.checkScreenSize();
    window.addEventListener('resize', this.checkScreenSize.bind(this));
  }

  // Load methods
  loadRooms(): void {
    this.isLoading = true;
    this.roomService.getUserRooms().subscribe(
      (rooms) => {
        this.userRooms = rooms.map(room => ({ ...room, selected: false }));
        this.filteredRooms = [...this.userRooms];
        this.updateRoomPagination();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      (error) => {
        alert('Không thể tải danh sách phòng: ' + (error.message || 'Vui lòng thử lại.'));
        this.isLoading = false;
      }
    );
  }

  loadLoaiPhong(): void {
    this.loaiPhongService.getUserLoaiPhong().subscribe(
      (loaiPhong) => {
        this.userLoaiPhong = loaiPhong.map(type => ({ ...type, selected: false }));
        this.filteredLoaiPhong = [...this.userLoaiPhong];
        this.updateLoaiPhongPagination();
        this.cdr.detectChanges();
      },
      (error) => {
        alert('Không thể tải danh sách loại phòng: ' + (error.message || 'Vui lòng thử lại.'));
      }
    );
  }

  loadAreas(): void {
    this.khuVucService.getUserKhuVuc().subscribe(
      (areas) => {
        this.areaList = areas.map(area => ({ ...area, selected: false }));
        this.filteredAreas = [...this.areaList];
        this.updateAreaPagination();
        this.cdr.detectChanges();
      },
      (error) => {
        alert('Không thể tải danh sách khu vực: ' + (error.message || 'Vui lòng thử lại.'));
      }
    );
  }

  // Pagination methods
  updateRoomPagination(): void {
    this.roomTotalPages = Math.ceil(this.filteredRooms.length / this.roomPageSize) || 1;
    this.roomCurrentPage = Math.min(this.roomCurrentPage, this.roomTotalPages);
    this.applyRoomPagination();
  }

  applyRoomPagination(): void {
    const startIndex = (this.roomCurrentPage - 1) * this.roomPageSize;
    const endIndex = startIndex + this.roomPageSize;
    this.paginatedRooms = this.filteredRooms.slice(startIndex, endIndex);
    this.paginatedRooms.forEach(room => (room.selected = false));
    this.selectedRoomId = null;
    this.selectedRoom = null;
    this.cdr.detectChanges();
  }

  roomPreviousPage(): void {
    if (this.roomCurrentPage > 1) {
      this.roomCurrentPage--;
      this.applyRoomPagination();
    }
  }

  roomNextPage(): void {
    if (this.roomCurrentPage < this.roomTotalPages) {
      this.roomCurrentPage++;
      this.applyRoomPagination();
    }
  }

  updateLoaiPhongPagination(): void {
    this.loaiPhongTotalPages = Math.ceil(this.filteredLoaiPhong.length / this.loaiPhongPageSize) || 1;
    this.loaiPhongCurrentPage = Math.min(this.loaiPhongCurrentPage, this.loaiPhongTotalPages);
    this.applyLoaiPhongPagination();
  }

  applyLoaiPhongPagination(): void {
    const startIndex = (this.loaiPhongCurrentPage - 1) * this.loaiPhongPageSize;
    const endIndex = startIndex + this.loaiPhongPageSize;
    this.paginatedLoaiPhong = this.filteredLoaiPhong.slice(startIndex, endIndex);
    this.paginatedLoaiPhong.forEach(type => (type.selected = false));
    this.selectedLoaiPhongId = null;
    this.selectedLoaiPhong = null;
    this.cdr.detectChanges();
  }

  loaiPhongPreviousPage(): void {
    if (this.loaiPhongCurrentPage > 1) {
      this.loaiPhongCurrentPage--;
      this.applyLoaiPhongPagination();
    }
  }

  loaiPhongNextPage(): void {
    if (this.loaiPhongCurrentPage < this.loaiPhongTotalPages) {
      this.loaiPhongCurrentPage++;
      this.applyLoaiPhongPagination();
    }
  }

  updateAreaPagination(): void {
    this.areaTotalPages = Math.ceil(this.filteredAreas.length / this.areaPageSize) || 1;
    this.areaCurrentPage = Math.min(this.areaCurrentPage, this.areaTotalPages);
    this.applyAreaPagination();
  }

  applyAreaPagination(): void {
    const startIndex = (this.areaCurrentPage - 1) * this.areaPageSize;
    const endIndex = startIndex + this.areaPageSize;
    this.paginatedAreas = this.filteredAreas.slice(startIndex, endIndex);
    this.paginatedAreas.forEach(area => (area.selected = false));
    this.selectedAreaId = null;
    this.selectedArea = null;
    this.cdr.detectChanges();
  }

  areaPreviousPage(): void {
    if (this.areaCurrentPage > 1) {
      this.areaCurrentPage--;
      this.applyAreaPagination();
    }
  }

  areaNextPage(): void {
    if (this.areaCurrentPage < this.areaTotalPages) {
      this.areaCurrentPage++;
      this.applyAreaPagination();
    }
  }

  // Search methods
  searchRooms(): void {
    this.zone.run(() => {
      this.filteredRooms = this.userRooms.filter(room =>
        room.name.toLowerCase().includes(this.roomSearchTerm.toLowerCase()) ||
        room.description.toLowerCase().includes(this.roomSearchTerm.toLowerCase()) ||
        room.roomtypename.toLowerCase().includes(this.roomSearchTerm.toLowerCase()) ||
        room.khuVucName.toLowerCase().includes(this.roomSearchTerm.toLowerCase())
      );
      this.updateRoomPagination();
    });
  }

  searchLoaiPhong(): void {
    this.zone.run(() => {
      this.filteredLoaiPhong = this.userLoaiPhong.filter(type =>
        type.name.toLowerCase().includes(this.loaiPhongSearchTerm.toLowerCase()) ||
        type.description.toLowerCase().includes(this.loaiPhongSearchTerm.toLowerCase())
      );
      this.updateLoaiPhongPagination();
    });
  }

  searchAreas(): void {
    this.zone.run(() => {
      this.filteredAreas = this.areaList.filter(area =>
        area.name.toLowerCase().includes(this.areaSearchTerm.toLowerCase()) ||
        area.description.toLowerCase().includes(this.areaSearchTerm.toLowerCase())
      );
      this.updateAreaPagination();
    });
  }

  // Screen size and tab management
  checkScreenSize(): void {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      this.switchTab(this.activeTab);
    }
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(button => {
      button.classList.remove('active');
      if (button.getAttribute('data-tab') === tab) {
        button.classList.add('active');
      }
    });
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => {
      content.classList.remove('active');
      if (content.id === tab) {
        content.classList.add('active');
      }
    });
  }

  // Room Management
  toggleRoomSelection(roomId: string): void {
    this.zone.run(() => {
      this.paginatedRooms.forEach(room => (room.selected = false));
      const selectedRoom = this.paginatedRooms.find(room => room.id === roomId);
      if (selectedRoom) {
        selectedRoom.selected = true;
        this.selectedRoomId = roomId;
        this.selectedRoom = selectedRoom;
      } else {
        this.selectedRoomId = null;
        this.selectedRoom = null;
      }
      this.cdr.detectChanges();
    });
  }

  openRoomAddModal(): void {
    this.isRoomEditMode = false;
    this.roomForm.reset();
    this.isRoomModalOpen = true;
  }

  openRoomEditModal(): void {
    if (this.selectedRoomId) {
      this.isRoomEditMode = true;
      const room = this.paginatedRooms.find(room => room.id === this.selectedRoomId);
      if (room) {
        this.roomForm.patchValue({
          name: room.name,
          description: room.description,
          roomPriceByDay: room.roomPriceByDay,
          roomPriceByHour: room.roomPriceByHour,
          roomTypeId: room.roomTypeId,
          areaId: room.areaId
        });
        this.isRoomModalOpen = true;
      }
    } else {
      alert('Vui lòng chọn một phòng để chỉnh sửa.');
    }
  }

  openRoomViewModal(): void {
    if (this.selectedRoomId) {
      this.selectedRoom = this.paginatedRooms.find(room => room.id === this.selectedRoomId);
      this.isRoomViewModalOpen = true;
    } else {
      alert('Vui lòng chọn một phòng để xem chi tiết.');
    }
  }

  closeRoomModal(): void {
    this.isRoomModalOpen = false;
    this.roomForm.reset();
    this.isRoomEditMode = false;
  }

  closeRoomViewModal(): void {
    this.isRoomViewModalOpen = false;
    this.selectedRoom = null;
  }

  async saveRoom(): Promise<void> {
    if (this.roomForm.invalid) {
      this.roomForm.markAllAsTouched();
      alert('Vui lòng nhập đầy đủ và đúng thông tin.');
      return;
    }

    this.isLoading = true;
    const formValue = this.roomForm.getRawValue();
    const roomData = {
      name: formValue.name,
      description: formValue.description,
      roomPriceByDay: formValue.roomPriceByDay,
      roomPriceByHour: formValue.roomPriceByHour,
      roomTypeId: formValue.roomTypeId,
      roomtypename: this.userLoaiPhong.find(type => type.id === formValue.roomTypeId)?.name || '',
      areaId: formValue.areaId,
      khuVucName: this.areaList.find(area => area.id === formValue.areaId)?.name || ''
    };

    try {
      if (this.isRoomEditMode && this.selectedRoomId) {
        await this.roomService.editRoom(this.selectedRoomId, roomData);
        alert('Cập nhật phòng thành công!');
      } else {
        await this.roomService.addRoom(
          roomData.name,
          roomData.description,
          roomData.roomPriceByDay,
          roomData.roomPriceByHour,
          roomData.roomTypeId,
          roomData.roomtypename,
          roomData.areaId,
          roomData.khuVucName
        );
        alert('Thêm phòng thành công!');
      }
      this.closeRoomModal();
      this.selectedRoomId = null;
      this.selectedRoom = null;
      this.loadRooms();
    } catch (error: any) {
      alert('Lỗi khi lưu phòng: ' + (error.message || 'Vui lòng thử lại.'));
    } finally {
      this.isLoading = false;
    }
  }

  async deleteRoom(): Promise<void> {
    if (!this.selectedRoomId) {
      alert('Vui lòng chọn một phòng để xóa.');
      return;
    }

    if (confirm('Bạn có chắc chắn muốn xóa phòng này?')) {
      this.isLoading = true;
      try {
        await this.roomService.deleteRoom(this.selectedRoomId);
        alert('Xóa phòng thành công!');
        this.selectedRoomId = null;
        this.selectedRoom = null;
        this.loadRooms();
      } catch (error: any) {
        alert('Lỗi khi xóa phòng: ' + (error.message || 'Vui lòng thử lại.'));
      } finally {
        this.isLoading = false;
      }
    }
  }

  // Room Type Management
  toggleLoaiPhongSelection(loaiPhongId: string): void {
    this.zone.run(() => {
      this.paginatedLoaiPhong.forEach(type => (type.selected = false));
      const selectedType = this.paginatedLoaiPhong.find(type => type.id === loaiPhongId);
      if (selectedType) {
        selectedType.selected = true;
        this.selectedLoaiPhongId = loaiPhongId;
        this.selectedLoaiPhong = selectedType;
      } else {
        this.selectedLoaiPhongId = null;
        this.selectedLoaiPhong = null;
      }
      this.cdr.detectChanges();
    });
  }

  openLoaiPhongAddModal(): void {
    this.isLoaiPhongEditMode = false;
    this.loaiPhongForm.reset();
    this.isLoaiPhongModalOpen = true;
  }

  openLoaiPhongEditModal(): void {
    if (this.selectedLoaiPhongId) {
      this.isLoaiPhongEditMode = true;
      const type = this.paginatedLoaiPhong.find(type => type.id === this.selectedLoaiPhongId);
      if (type) {
        this.loaiPhongForm.patchValue({
          name: type.name,
          description: type.description,
          maxPeople: type.maxPeople
        });
        this.isLoaiPhongModalOpen = true;
      }
    } else {
      alert('Vui lòng chọn một loại phòng để chỉnh sửa.');
    }
  }

  openLoaiPhongViewModal(): void {
    if (this.selectedLoaiPhongId) {
      this.selectedLoaiPhong = this.paginatedLoaiPhong.find(type => type.id === this.selectedLoaiPhongId);
      this.isLoaiPhongViewModalOpen = true;
    } else {
      alert('Vui lòng chọn một loại phòng để xem chi tiết.');
    }
  }

  closeLoaiPhongModal(): void {
    this.isLoaiPhongModalOpen = false;
    this.loaiPhongForm.reset();
    this.isLoaiPhongEditMode = false;
  }

  closeLoaiPhongViewModal(): void {
    this.isLoaiPhongViewModalOpen = false;
    this.selectedLoaiPhong = null;
  }

  async saveLoaiPhong(): Promise<void> {
    if (this.loaiPhongForm.invalid) {
      this.loaiPhongForm.markAllAsTouched();
      alert('Vui lòng nhập đầy đủ và đúng thông tin.');
      return;
    }

    this.isLoading = true;
    const formValue = this.loaiPhongForm.getRawValue();
    const loaiPhongData = {
      name: formValue.name,
      description: formValue.description,
      maxPeople: formValue.maxPeople
    };

    try {
      if (this.isLoaiPhongEditMode && this.selectedLoaiPhongId) {
        await this.loaiPhongService.editLoaiPhong(this.selectedLoaiPhongId, loaiPhongData);
        alert('Cập nhật loại phòng thành công!');
      } else {
        await this.loaiPhongService.addLoaiPhong(
          loaiPhongData.name,
          loaiPhongData.description,
          loaiPhongData.maxPeople
        );
        alert('Thêm loại phòng thành công!');
      }
      this.closeLoaiPhongModal();
      this.selectedLoaiPhongId = null;
      this.selectedLoaiPhong = null;
      this.loadLoaiPhong();
    } catch (error: any) {
      alert('Lỗi khi lưu loại phòng: ' + (error.message || 'Vui lòng thử lại.'));
    } finally {
      this.isLoading = false;
    }
  }

  async deleteLoaiPhong(): Promise<void> {
    if (!this.selectedLoaiPhongId) {
      alert('Vui lòng chọn một loại phòng để xóa.');
      return;
    }

    if (confirm('Bạn có chắc chắn muốn xóa loại phòng này?')) {
      this.isLoading = true;
      try {
        await this.loaiPhongService.deleteLoaiPhong(this.selectedLoaiPhongId);
        alert('Xóa loại phòng thành công!');
        this.selectedLoaiPhongId = null;
        this.selectedLoaiPhong = null;
        this.loadLoaiPhong();
      } catch (error: any) {
        alert('Lỗi khi xóa loại phòng: ' + (error.message || 'Vui lòng thử lại.'));
      } finally {
        this.isLoading = false;
      }
    }
  }

  // Area Management
  toggleAreaSelection(areaId: string): void {
    this.zone.run(() => {
      this.paginatedAreas.forEach(area => (area.selected = false));
      const selectedArea = this.paginatedAreas.find(area => area.id === areaId);
      if (selectedArea) {
        selectedArea.selected = true;
        this.selectedAreaId = areaId;
        this.selectedArea = selectedArea;
      } else {
        this.selectedAreaId = null;
        this.selectedArea = null;
      }
      this.cdr.detectChanges();
    });
  }

  openKhuVucAddModal(): void {
    this.isKhuVucEditMode = false;
    this.khuVucForm.reset();
    this.isKhuVucModalOpen = true;
  }

  openKhuVucEditModal(): void {
    if (this.selectedAreaId) {
      this.isKhuVucEditMode = true;
      const area = this.paginatedAreas.find(area => area.id === this.selectedAreaId);
      if (area) {
        this.khuVucForm.patchValue({
          name: area.name,
          description: area.description,
          sortOrder: area.sortOrder
        });
        this.isKhuVucModalOpen = true;
      }
    } else {
      alert('Vui lòng chọn một khu vực để chỉnh sửa.');
    }
  }

  openKhuVucViewModal(): void {
    if (this.selectedAreaId) {
      this.selectedArea = this.paginatedAreas.find(area => area.id === this.selectedAreaId);
      this.isKhuVucViewModalOpen = true;
    } else {
      alert('Vui lòng chọn một khu vực để xem chi tiết.');
    }
  }

  closeKhuVucModal(): void {
    this.isKhuVucModalOpen = false;
    this.khuVucForm.reset();
    this.isKhuVucEditMode = false;
  }

  closeKhuVucViewModal(): void {
    this.isKhuVucViewModalOpen = false;
    this.selectedArea = null;
  }

  async saveKhuVuc(): Promise<void> {
    if (this.khuVucForm.invalid) {
      this.khuVucForm.markAllAsTouched();
      alert('Vui lòng nhập đầy đủ và đúng thông tin.');
      return;
    }

    this.isLoading = true;
    const formValue = this.khuVucForm.getRawValue();
    const khuVucData = {
      name: formValue.name,
      description: formValue.description,
      sortOrder: formValue.sortOrder
    };

    try {
      if (this.isKhuVucEditMode && this.selectedAreaId) {
        await this.khuVucService.editKhuVuc(this.selectedAreaId, khuVucData);
        alert('Cập nhật khu vực thành công!');
      } else {
        await this.khuVucService.addKhuVuc(khuVucData.name, khuVucData.description, khuVucData.sortOrder);
        alert('Thêm khu vực thành công!');
      }
      this.closeKhuVucModal();
      this.selectedAreaId = null;
      this.selectedArea = null;
      this.loadAreas();
    } catch (error: any) {
      alert('Lỗi khi lưu khu vực: ' + (error.message || 'Vui lòng thử lại.'));
    } finally {
      this.isLoading = false;
    }
  }

  async deleteKhuVuc(): Promise<void> {
    if (!this.selectedAreaId) {
      alert('Vui lòng chọn một khu vực để xóa.');
      return;
    }

    if (confirm('Bạn có chắc chắn muốn xóa khu vực này?')) {
      this.isLoading = true;
      try {
        await this.khuVucService.deleteKhuVuc(this.selectedAreaId);
        alert('Xóa khu vực thành công!');
        this.selectedAreaId = null;
        this.selectedArea = null;
        this.loadAreas();
      } catch (error: any) {
        alert('Lỗi khi xóa khu vực: ' + (error.message || 'Vui lòng thử lại.'));
      } finally {
        this.isLoading = false;
      }
    }
  }

  // Disabled states for buttons
  get isRoomEditDeleteDisabled(): boolean {
    return !this.selectedRoomId;
  }

  get isLoaiPhongEditDeleteDisabled(): boolean {
    return !this.selectedLoaiPhongId;
  }

  get isKhuVucEditDeleteDisabled(): boolean {
    return !this.selectedAreaId;
  }

  trackById(index: number, item: any): string {
    return item.id;
  }
}