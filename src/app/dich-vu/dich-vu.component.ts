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
  dichVus: any[] = [];
  originalDichVus: any[] = []; // Store the original unfiltered list
  isLoading = false;
  selectedDichVuId: string | null = null;
  selectedDichVu: any = null;
  showModal = false;
  showViewModal = false;
  isEditMode = false;
  searchQuery: string = ''; // Bind to search input

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
        this.originalDichVus = dichVus.map((dichVu) => {
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
        this.dichVus = [...this.originalDichVus]; // Initialize with original list
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Lỗi khi lấy danh sách dịch vụ:', error);
        this.isLoading = false;
      }
    );
  }

  onSearch(): void {
    this.zone.run(() => {
      if (!this.searchQuery.trim()) {
        this.dichVus = [...this.originalDichVus]; // Reset to original list if search is empty
      } else {
        const query = this.searchQuery.trim().toLowerCase();
        this.dichVus = this.originalDichVus.filter((dichVu) =>
          dichVu.name.toLowerCase().includes(query) ||
          dichVu.description.toLowerCase().includes(query)
        );
      }
      // Reset selection when filtering
      this.dichVus.forEach(dv => dv.selected = false);
      this.selectedDichVuId = null;
      this.selectedDichVu = null;
      this.cdr.detectChanges();
    });
  }

  toggleSelection(dichVuId: string): void {
    this.zone.run(() => {
      // Bỏ chọn tất cả trước
      this.dichVus.forEach(dv => dv.selected = false);
      
      // Chọn dịch vụ hiện tại
      const selectedDichVu = this.dichVus.find(dv => dv.id === dichVuId);
      if (selectedDichVu) {
        selectedDichVu.selected = true;
        this.selectedDichVuId = dichVuId;
        this.selectedDichVu = selectedDichVu;
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
      const dichVu = this.dichVus.find((dv) => dv.id === this.selectedDichVuId);
      if (dichVu) {
        this.dichVuForm.patchValue({
          name: dichVu.name,
          description: dichVu.description,
          price: dichVu.price,
          createdAt: new Date(dichVu.createdAt).toLocaleString(),
          updatedAt: dichVu.updatedAt ? new Date(dichVu.updatedAt).toLocaleString() : 'Chưa cập nhật',
        });
        this.showModal = true;
      }
    }
  }

  openViewModal(): void {
    if (this.selectedDichVuId) {
      this.showViewModal = true;
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.dichVuForm.reset();
    this.isEditMode = false;
  }

  closeViewModal(): void {
    this.showViewModal = false;
  }

  saveDichVu(): void {
    if (this.dichVuForm.valid) {
      this.isLoading = true;
      const formValue = this.dichVuForm.value;
      if (this.isEditMode && this.selectedDichVuId) {
        this.dichVuService
          .updateDichVu(this.selectedDichVuId, {
            ...formValue,
            updatedAt: new Date().toISOString(),
          })
          .subscribe(
            () => {
              this.getDichVus();
              this.closeModal();
              this.selectedDichVuId = null;
              this.selectedDichVu = null;
              this.isLoading = false;
            },
            (error) => {
              console.error('Lỗi khi cập nhật dịch vụ:', error);
              this.isLoading = false;
            }
          );
      } else {
        this.dichVuService
          .addDichVu({
            ...formValue,
            createdAt: new Date().toISOString(),
            updatedAt: null,
          })
          .subscribe(
            () => {
              this.getDichVus();
              this.closeModal();
              this.isLoading = false;
            },
            (error) => {
              console.error('Lỗi khi thêm dịch vụ:', error);
              this.isLoading = false;
            }
          );
      }
    }
  }

  deleteDichVu(): void {
    if (this.selectedDichVuId && confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) {
      this.isLoading = true;
      this.dichVuService.deleteDichVu(this.selectedDichVuId).subscribe(
        () => {
          this.getDichVus();
          this.selectedDichVuId = null;
          this.selectedDichVu = null;
          this.isLoading = false;
        },
        (error) => {
          console.error('Lỗi khi xóa dịch vụ:', error);
          this.isLoading = false;
        }
      );
    }
  }

  get isEditDeleteDisabled(): boolean {
    return !this.selectedDichVuId;
  }

  get isFormInvalid(): boolean {
    return this.dichVuForm.invalid;
  }

  trackByDichVuId(index: number, item: any): string {
    return item.id;
  }
}