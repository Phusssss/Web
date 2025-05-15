import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InventoryService, InventoryRecord } from '../services/inventory.service';

@Component({
  selector: 'app-goods-receipt',
  templateUrl: './goods-receipt.component.html',
  styleUrls: ['./goods-receipt.component.css']
})
export class GoodsReceiptComponent implements OnInit {
  receiptForm: FormGroup;
  receipts: any[] = [];
  originalReceipts: any[] = [];
  isLoading = false;
  selectedReceiptId: string | null = null;
  selectedReceipt: any = null;
  showModal = false;
  showViewModal = false;
  isEditMode = false;
  searchQuery: string = '';

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {
    this.receiptForm = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(5)]],
      quantity: ['', [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      date: ['', [Validators.required]],
      createdAt: [{ value: '', disabled: true }],
      updatedAt: [{ value: '', disabled: true }],
    });
  }

  ngOnInit(): void {
    this.getReceipts();
  }

  getReceipts(): void {
    this.isLoading = true;
    this.inventoryService.getRecords('goodsReceipts').subscribe(
      (receipts) => {
        this.originalReceipts = receipts.map((receipt) => ({
          id: receipt.id,
          ...receipt,
          createdAt: receipt.date || new Date().toISOString(),
          updatedAt: receipt.updatedAt || null,
          userId: receipt.userId || 'Unknown',
          selected: false,
        }));
        this.receipts = [...this.originalReceipts];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Lỗi khi lấy danh sách phiếu nhập hàng:', error);
        this.isLoading = false;
      }
    );
  }

  onSearch(): void {
    this.zone.run(() => {
      if (!this.searchQuery.trim()) {
        this.receipts = [...this.originalReceipts];
      } else {
        const query = this.searchQuery.trim().toLowerCase();
        this.receipts = this.originalReceipts.filter((receipt) =>
          receipt.description.toLowerCase().includes(query)
        );
      }
      this.receipts.forEach((rec) => (rec.selected = false));
      this.selectedReceiptId = null;
      this.selectedReceipt = null;
      this.cdr.detectChanges();
    });
  }

  toggleSelection(receiptId: string): void {
    this.zone.run(() => {
      this.receipts.forEach((rec) => (rec.selected = false));
      const selectedReceipt = this.receipts.find((rec) => rec.id === receiptId);
      if (selectedReceipt) {
        selectedReceipt.selected = true;
        this.selectedReceiptId = receiptId;
        this.selectedReceipt = selectedReceipt;
      }
      this.cdr.detectChanges();
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.receiptForm.reset();
    this.receiptForm.patchValue({ date: new Date().toISOString().split('T')[0] });
    this.showModal = true;
  }

  openEditModal(): void {
    if (this.selectedReceiptId) {
      this.isEditMode = true;
      const receipt = this.receipts.find((rec) => rec.id === this.selectedReceiptId);
      if (receipt) {
        this.receiptForm.patchValue({
          description: receipt.description,
          quantity: receipt.quantity,
          date: new Date(receipt.date).toISOString().split('T')[0],
          createdAt: new Date(receipt.createdAt).toLocaleString(),
          updatedAt: receipt.updatedAt ? new Date(receipt.updatedAt).toLocaleString() : 'Chưa cập nhật',
        });
        this.showModal = true;
      }
    }
  }

  openViewModal(): void {
    if (this.selectedReceiptId) {
      this.showViewModal = true;
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.receiptForm.reset();
    this.isEditMode = false;
  }

  closeViewModal(): void {
    this.showViewModal = false;
  }

  saveReceipt(): void {
    if (this.receiptForm.valid) {
      this.isLoading = true;
      const formValue = this.receiptForm.value;
      if (this.isEditMode && this.selectedReceiptId) {
        this.inventoryService
          .updateRecord('goodsReceipts', this.selectedReceiptId, {
            ...formValue,
            updatedAt: new Date().toISOString(),
          })
          .subscribe(
            () => {
              this.getReceipts();
              this.closeModal();
              this.selectedReceiptId = null;
              this.selectedReceipt = null;
              this.isLoading = false;
            },
            (error) => {
              console.error('Lỗi khi cập nhật phiếu nhập hàng:', error);
              this.isLoading = false;
            }
          );
      } else {
        this.inventoryService
          .addRecord('goodsReceipts', {
            ...formValue,
            createdAt: new Date().toISOString(),
            updatedAt: null,
          })
          .subscribe(
            () => {
              this.getReceipts();
              this.closeModal();
              this.isLoading = false;
            },
            (error) => {
              console.error('Lỗi khi thêm phiếu nhập hàng:', error);
              this.isLoading = false;
            }
          );
      }
    }
  }

  deleteReceipt(): void {
    if (this.selectedReceiptId && confirm('Bạn có chắc chắn muốn xóa phiếu nhập hàng này?')) {
      this.isLoading = true;
      this.inventoryService.deleteRecord('goodsReceipts', this.selectedReceiptId).subscribe(
        () => {
          this.getReceipts();
          this.selectedReceiptId = null;
          this.selectedReceipt = null;
          this.isLoading = false;
        },
        (error) => {
          console.error('Lỗi khi xóa phiếu nhập hàng:', error);
          this.isLoading = false;
        }
      );
    }
  }

  get isEditDeleteDisabled(): boolean {
    return !this.selectedReceiptId;
  }

  get isFormInvalid(): boolean {
    return this.receiptForm.invalid;
  }

  trackByReceiptId(index: number, item: any): string {
    return item.id;
  }
}