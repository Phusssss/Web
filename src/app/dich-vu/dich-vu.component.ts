import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DichVuService } from '../services/dichvu.service';

@Component({
  selector: 'app-dich-vu',
  templateUrl: './dich-vu.component.html',
  styleUrls: ['./dich-vu.component.css'],
})
export class DichVuComponent implements OnInit {
  dichVuForm: FormGroup;
  originalDichVus: any[] = [];
  filteredDichVus: any[] = [];
  paginatedDichVus: any[] = [];
  isLoading: boolean = false;
  selectedDichVuId: string | null = null;
  selectedDichVu: any = null;
  showModal: boolean = false;
  showViewModal: boolean = false;
  isEditMode: boolean = false;
  searchQuery: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  constructor(
    private fb: FormBuilder,
    private dichVuService: DichVuService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {
    this.dichVuForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(5)]],
      price: ['', [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      createdAt: [{ value: '', disabled: true }],
      updatedAt: [{ value: '', disabled: true }],
    });
  }

  ngOnInit(): void {
    this.getDichVus();
  }

  getDichVus(): void {
    this.isLoading = true;
    this.dichVuService.getDichVus().subscribe(
      (dichVus) => {
        this.originalDichVus = dichVus.map((dichVu: any) => {
          const data = dichVu.payload.doc.data();
          return {
            id: dichVu.payload.doc.id,
            ...data,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || null,
            userId: data.userId || 'Unknown',
            selected: false,
          };
        });
        this.filteredDichVus = [...this.originalDichVus];
        this.updatePagination();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      (error) => {
        alert('Không thể tải danh sách dịch vụ: ' + (error.message || 'Vui lòng thử lại.'));
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    );
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredDichVus.length / this.pageSize) || 1;
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    this.applyPagination();
  }

  applyPagination(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedDichVus = this.filteredDichVus.slice(startIndex, endIndex);
    this.paginatedDichVus.forEach(dv => (dv.selected = false));
    this.selectedDichVuId = null;
    this.selectedDichVu = null;
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
      if (!this.searchQuery.trim()) {
        this.filteredDichVus = [...this.originalDichVus];
      } else {
        const query = this.searchQuery.trim().toLowerCase();
        this.filteredDichVus = this.originalDichVus.filter(
          (dichVu) =>
            dichVu.name.toLowerCase().includes(query) ||
            dichVu.description.toLowerCase().includes(query)
        );
      }
      this.currentPage = 1;
      this.updatePagination();
    });
  }

  toggleSelection(dichVuId: string): void {
    this.zone.run(() => {
      this.paginatedDichVus.forEach(dv => (dv.selected = false));
      const selectedDichVu = this.paginatedDichVus.find(dv => dv.id === dichVuId);
      if (selectedDichVu) {
        selectedDichVu.selected = true;
        this.selectedDichVuId = dichVuId;
        this.selectedDichVu = selectedDichVu;
      } else {
        this.selectedDichVuId = null;
        this.selectedDichVu = null;
      }
      this.cdr.detectChanges();
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.dichVuForm.reset();
    this.showModal = true;
  }

  openEditModal(): void {
    if (this.selectedDichVuId) {
      this.isEditMode = true;
      const dichVu = this.paginatedDichVus.find((dv) => dv.id === this.selectedDichVuId);
      if (dichVu) {
        this.dichVuForm.patchValue({
          name: dichVu.name,
          description: dichVu.description,
          price: dichVu.price,
          createdAt: dichVu.createdAt ? new Date(dichVu.createdAt).toLocaleString() : '',
          updatedAt: dichVu.updatedAt ? new Date(dichVu.updatedAt).toLocaleString() : 'Chưa cập nhật',
        });
        this.showModal = true;
      } else {
        alert('Không tìm thấy dịch vụ để chỉnh sửa.');
      }
    } else {
      alert('Vui lòng chọn một dịch vụ để chỉnh sửa.');
    }
  }

  openViewModal(): void {
    if (this.selectedDichVuId) {
      this.selectedDichVu = this.paginatedDichVus.find(dv => dv.id === this.selectedDichVuId);
      this.showViewModal = true;
    } else {
      alert('Vui lòng chọn một dịch vụ để xem chi tiết.');
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.dichVuForm.reset();
    this.isEditMode = false;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedDichVu = null;
  }

  saveDichVu(): void {
    if (this.dichVuForm.invalid) {
      this.dichVuForm.markAllAsTouched();
      alert('Vui lòng nhập đầy đủ và đúng thông tin.');
      return;
    }

    this.isLoading = true;
    const formValue = this.dichVuForm.getRawValue();
    const dichVuData = {
      name: formValue.name,
      description: formValue.description,
      price: parseInt(formValue.price, 10),
      createdAt: this.isEditMode ? undefined : new Date().toISOString(),
      updatedAt: this.isEditMode ? new Date().toISOString() : null,
    };

    const operation = this.isEditMode && this.selectedDichVuId
      ? this.dichVuService.updateDichVu(this.selectedDichVuId, dichVuData)
      : this.dichVuService.addDichVu(dichVuData);

    operation.subscribe(
      () => {
        alert(this.isEditMode ? 'Cập nhật dịch vụ thành công!' : 'Thêm dịch vụ thành công!');
        this.getDichVus();
        this.closeModal();
        this.selectedDichVuId = null;
        this.selectedDichVu = null;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      (error) => {
        alert('Lỗi khi lưu dịch vụ: ' + (error.message || 'Vui lòng thử lại.'));
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    );
  }

  deleteDichVu(): void {
    if (!this.selectedDichVuId) {
      alert('Vui lòng chọn một dịch vụ để xóa.');
      return;
    }

    if (confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) {
      this.isLoading = true;
      this.dichVuService.deleteDichVu(this.selectedDichVuId).subscribe(
        () => {
          alert('Xóa dịch vụ thành công!');
          this.getDichVus();
          this.selectedDichVuId = null;
          this.selectedDichVu = null;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        (error) => {
          alert('Lỗi khi xóa dịch vụ: ' + (error.message || 'Vui lòng thử lại.'));
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      );
    }
  }

  get isEditDeleteDisabled(): boolean {
    return !this.selectedDichVuId;
  }

  trackByDichVuId(index: number, item: any): string {
    return item.id;
  }
}