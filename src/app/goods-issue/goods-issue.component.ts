import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InventoryService, InventoryRecord } from '../services/inventory.service';

@Component({
  selector: 'app-goods-issue',
  templateUrl: './goods-issue.component.html',
  styleUrls: ['./goods-issue.component.css']
})
export class GoodsIssueComponent implements OnInit {
  issueForm: FormGroup;
  issues: any[] = [];
  originalIssues: any[] = [];
  isLoading = false;
  selectedIssueId: string | null = null;
  selectedIssue: any = null;
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
    this.issueForm = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(5)]],
      quantity: ['', [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      date: ['', [Validators.required]],
      createdAt: [{ value: '', disabled: true }],
      updatedAt: [{ value: '', disabled: true }],
    });
  }

  ngOnInit(): void {
    this.getIssues();
  }

  getIssues(): void {
    this.isLoading = true;
    this.inventoryService.getRecords('goodsIssues').subscribe(
      (issues) => {
        this.originalIssues = issues.map((issue) => ({
          id: issue.id,
          ...issue,
          createdAt: issue.date || new Date().toISOString(),
          updatedAt: issue.updatedAt || null,
          userId: issue.userId || 'Unknown',
          selected: false,
        }));
        this.issues = [...this.originalIssues];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Lỗi khi lấy danh sách phiếu xuất hàng:', error);
        this.isLoading = false;
      }
    );
  }

  onSearch(): void {
    this.zone.run(() => {
      if (!this.searchQuery.trim()) {
        this.issues = [...this.originalIssues];
      } else {
        const query = this.searchQuery.trim().toLowerCase();
        this.issues = this.originalIssues.filter((issue) =>
          issue.description.toLowerCase().includes(query)
        );
      }
      this.issues.forEach((iss) => (iss.selected = false));
      this.selectedIssueId = null;
      this.selectedIssue = null;
      this.cdr.detectChanges();
    });
  }

  toggleSelection(issueId: string): void {
    this.zone.run(() => {
      this.issues.forEach((iss) => (iss.selected = false));
      const selectedIssue = this.issues.find((iss) => iss.id === issueId);
      if (selectedIssue) {
        selectedIssue.selected = true;
        this.selectedIssueId = issueId;
        this.selectedIssue = selectedIssue;
      }
      this.cdr.detectChanges();
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.issueForm.reset();
    this.issueForm.patchValue({ date: new Date().toISOString().split('T')[0] });
    this.showModal = true;
  }

  openEditModal(): void {
    if (this.selectedIssueId) {
      this.isEditMode = true;
      const issue = this.issues.find((iss) => iss.id === this.selectedIssueId);
      if (issue) {
        this.issueForm.patchValue({
          description: issue.description,
          quantity: issue.quantity,
          date: new Date(issue.date).toISOString().split('T')[0],
          createdAt: new Date(issue.createdAt).toLocaleString(),
          updatedAt: issue.updatedAt ? new Date(issue.updatedAt).toLocaleString() : 'Chưa cập nhật',
        });
        this.showModal = true;
      }
    }
  }

  openViewModal(): void {
    if (this.selectedIssueId) {
      this.showViewModal = true;
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.issueForm.reset();
    this.isEditMode = false;
  }

  closeViewModal(): void {
    this.showViewModal = false;
  }

  saveIssue(): void {
    if (this.issueForm.valid) {
      this.isLoading = true;
      const formValue = this.issueForm.value;
      if (this.isEditMode && this.selectedIssueId) {
        this.inventoryService
          .updateRecord('goodsIssues', this.selectedIssueId, {
            ...formValue,
            updatedAt: new Date().toISOString(),
          })
          .subscribe(
            () => {
              this.getIssues();
              this.closeModal();
              this.selectedIssueId = null;
              this.selectedIssue = null;
              this.isLoading = false;
            },
            (error) => {
              console.error('Lỗi khi cập nhật phiếu xuất hàng:', error);
              this.isLoading = false;
            }
          );
      } else {
        this.inventoryService
          .addRecord('goodsIssues', {
            ...formValue,
            createdAt: new Date().toISOString(),
            updatedAt: null,
          })
          .subscribe(
            () => {
              this.getIssues();
              this.closeModal();
              this.isLoading = false;
            },
            (error) => {
              console.error('Lỗi khi thêm phiếu xuất hàng:', error);
              this.isLoading = false;
            }
          );
      }
    }
  }

  deleteIssue(): void {
    if (this.selectedIssueId && confirm('Bạn có chắc chắn muốn xóa phiếu xuất hàng này?')) {
      this.isLoading = true;
      this.inventoryService.deleteRecord('goodsIssues', this.selectedIssueId).subscribe(
        () => {
          this.getIssues();
          this.selectedIssueId = null;
          this.selectedIssue = null;
          this.isLoading = false;
        },
        (error) => {
          console.error('Lỗi khi xóa phiếu xuất hàng:', error);
          this.isLoading = false;
        }
      );
    }
  }

  get isEditDeleteDisabled(): boolean {
    return !this.selectedIssueId;
  }

  get isFormInvalid(): boolean {
    return this.issueForm.invalid;
  }

  trackByIssueId(index: number, item: any): string {
    return item.id;
  }
}