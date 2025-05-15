import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StaffService } from '../services/staff.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-staff',
  templateUrl: './staff.component.html',
  styleUrls: ['./staff.component.css']
})
export class StaffComponent implements OnInit {
  staffForm: FormGroup;
  staffList: any[] = [];
  originalStaffList: any[] = [];
  filteredStaffList: any[] = [];
  isLoading = false;
  selectedStaffId: string | null = null;
  selectedStaff: any = null;
  showModal = false;
  showViewModal = false;
  isEditMode = false;
  searchQuery: string = '';
  currentUserUid: string = '';

  // Pagination properties
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  constructor(
    private fb: FormBuilder,
    private staffService: StaffService,
    private afAuth: AngularFireAuth,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {
    this.staffForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]],
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.pattern(/^\d{10,11}$/)]],
      address: [''],
      gender: [''],
      birthday: [''],
      pin: ['', [Validators.pattern(/^\d{4}$/)]],
      createdAt: [{ value: '', disabled: true }],
      updatedAt: [{ value: '', disabled: true }]
    });
  }

  ngOnInit(): void {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.currentUserUid = user.uid;
        this.getStaffs();
      }
    });
  }

  getStaffs(): void {
    this.isLoading = true;
    this.staffService.getStaffByParent(this.currentUserUid).subscribe(
      (staffs) => {
        this.originalStaffList = staffs.map(staff => ({
          uid: staff.uid,
          ...staff,
          createdAt: staff.createdAt || new Date().toISOString(),
          updatedAt: staff.updatedAt || null,
          selected: false
        }));
        this.filteredStaffList = [...this.originalStaffList];
        this.updatePagination();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Lỗi khi lấy danh sách nhân viên:', error);
        alert('Không thể tải danh sách nhân viên. Vui lòng thử lại.');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    );
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredStaffList.length / this.pageSize) || 1;
    this.currentPage = 1;
    this.applyPagination();
  }

  applyPagination(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.staffList = this.filteredStaffList.slice(startIndex, endIndex);
    this.staffList.forEach(staff => (staff.selected = false));
    this.selectedStaffId = null;
    this.selectedStaff = null;
    this.cdr.detectChanges();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyPagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyPagination();
    }
  }

  onSearch(): void {
    this.zone.run(() => {
      const query = this.searchQuery.trim().toLowerCase();
      if (!query) {
        this.filteredStaffList = [...this.originalStaffList];
      } else {
        this.filteredStaffList = this.originalStaffList.filter(staff =>
          (staff.name?.toLowerCase().includes(query) || '') ||
          (staff.email?.toLowerCase().includes(query) || '')
        );
      }
      this.updatePagination();
    });
  }

  toggleSelection(staffId: string): void {
    this.zone.run(() => {
      this.staffList.forEach(staff => (staff.selected = false));
      const selectedStaff = this.staffList.find(staff => staff.uid === staffId);
      if (selectedStaff) {
        selectedStaff.selected = true;
        this.selectedStaffId = staffId;
        this.selectedStaff = selectedStaff;
      } else {
        this.selectedStaffId = null;
        this.selectedStaff = null;
      }
      this.cdr.detectChanges();
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.staffForm.reset();
    this.staffForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.staffForm.get('password')?.updateValueAndValidity();
    this.showModal = true;
  }

  openEditModal(): void {
    if (this.selectedStaffId) {
      this.isEditMode = true;
      const staff = this.staffList.find(staff => staff.uid === this.selectedStaffId);
      if (staff) {
        this.staffForm.patchValue({
          email: staff.email,
          name: staff.name,
          phone: staff.phone,
          address: staff.address,
          gender: staff.gender,
          birthday: staff.birthday ? new Date(staff.birthday).toISOString().split('T')[0] : '',
          pin: staff.pin,
          createdAt: staff.createdAt ? new Date(staff.createdAt).toLocaleString() : '',
          updatedAt: staff.updatedAt ? new Date(staff.updatedAt).toLocaleString() : 'Chưa cập nhật'
        });
        this.staffForm.get('password')?.clearValidators();
        this.staffForm.get('password')?.updateValueAndValidity();
        this.showModal = true;
      }
    } else {
      alert('Vui lòng chọn một nhân viên để chỉnh sửa.');
    }
  }

  openViewModal(): void {
    if (this.selectedStaffId) {
      this.showViewModal = true;
    } else {
      alert('Vui lòng chọn một nhân viên để xem chi tiết.');
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.staffForm.reset();
    this.isEditMode = false;
    this.staffForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.staffForm.get('password')?.updateValueAndValidity();
  }

  closeViewModal(): void {
    this.showViewModal = false;
  }

  async saveStaff(): Promise<void> {
    if (this.staffForm.invalid) {
      this.staffForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.staffForm.getRawValue();
    const staffData = {
      email: formValue.email,
      name: formValue.name,
      phone: formValue.phone,
      address: formValue.address,
      gender: formValue.gender,
      birthday: formValue.birthday,
      pin: formValue.pin,
      role: 'staff',
      parentUid: this.currentUserUid
    };

    try {
      if (this.isEditMode && this.selectedStaffId) {
        await this.staffService.updateStaff(this.selectedStaffId, {
          ...staffData,
          updatedAt: new Date().toISOString()
        });
        alert('Cập nhật nhân viên thành công!');
      } else {
        await this.staffService.addStaff(
          {
            ...staffData,
            password: formValue.password,
            createdAt: new Date().toISOString(),
            updatedAt: null
          },
          this.staffService.generateUid()
        );
        alert('Thêm nhân viên thành công!');
      }
      this.getStaffs();
      this.closeModal();
      this.selectedStaffId = null;
      this.selectedStaff = null;
    } catch (error: any) {
      console.error('Lỗi khi lưu nhân viên:', error);
      alert('Lỗi khi lưu nhân viên: ' + (error.message || 'Vui lòng thử lại.'));
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async deleteStaff(): Promise<void> {
    if (!this.selectedStaffId) {
      alert('Vui lòng chọn một nhân viên để xóa.');
      return;
    }

    if (confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
      this.isLoading = true;
      try {
        await this.staffService.deleteStaff(this.selectedStaffId);
        alert('Xóa nhân viên thành công!');
        this.getStaffs();
        this.selectedStaffId = null;
        this.selectedStaff = null;
      } catch (error: any) {
        console.error('Lỗi khi xóa nhân viên:', error);
        alert('Lỗi khi xóa nhân viên: ' + (error.message || 'Vui lòng thử lại.'));
      } finally {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    }
  }

  get isEditDeleteDisabled(): boolean {
    return !this.selectedStaffId;
  }

  get isFormInvalid(): boolean {
    return this.staffForm.invalid;
  }

  trackByStaffId(index: number, item: any): string {
    return item.uid;
  }
}