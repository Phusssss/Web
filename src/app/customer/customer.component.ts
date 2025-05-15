import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from '../services/customer.service';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css'],
})
export class CustomerComponent implements OnInit {
  customerForm: FormGroup;
  originalCustomers: any[] = [];
  filteredCustomers: any[] = [];
  paginatedCustomers: any[] = [];
  isLoading: boolean = false;
  selectedCustomerId: string | null = null;
  selectedCustomer: any = null;
  showModal: boolean = false;
  showViewModal: boolean = false;
  isEditMode: boolean = false;
  searchQuery: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {
    this.customerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]],
      address: ['', [Validators.required]],
      status: ['active', [Validators.required]],
      cccd: ['', [Validators.required, Validators.pattern(/^[0-9]{9,12}$/)]],
      createdAt: [{ value: '', disabled: true }],
      updatedAt: [{ value: '', disabled: true }],
    });
  }

  ngOnInit(): void {
    this.getCustomers();
  }

  getCustomers(): void {
    this.isLoading = true;
    this.customerService.getUserCustomers().subscribe(
      (customers) => {
        this.originalCustomers = customers.map((customer: any) => ({
          id: customer.id,
          ...customer,
          createdAt: customer.createdAt || new Date().toISOString(),
          updatedAt: customer.updatedAt || null,
          selected: false,
        }));
        this.filteredCustomers = [...this.originalCustomers];
        this.updatePagination();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      (error) => {
        alert('Không thể tải danh sách khách hàng: ' + (error.message || 'Vui lòng thử lại.'));
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    );
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCustomers.length / this.pageSize) || 1;
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    this.applyPagination();
  }

  applyPagination(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedCustomers = this.filteredCustomers.slice(startIndex, endIndex);
    this.paginatedCustomers.forEach(cust => (cust.selected = false));
    this.selectedCustomerId = null;
    this.selectedCustomer = null;
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
        this.filteredCustomers = [...this.originalCustomers];
      } else {
        const query = this.searchQuery.trim().toLowerCase();
        this.filteredCustomers = this.originalCustomers.filter(
          (customer) =>
            customer.name.toLowerCase().includes(query) ||
            customer.email.toLowerCase().includes(query) ||
            customer.phone.includes(query) ||
            customer.address.toLowerCase().includes(query) ||
            customer.cccd.includes(query)
        );
      }
      this.currentPage = 1;
      this.updatePagination();
    });
  }

  toggleSelection(customerId: string): void {
    this.zone.run(() => {
      this.paginatedCustomers.forEach(cust => (cust.selected = false));
      const selectedCustomer = this.paginatedCustomers.find(cust => cust.id === customerId);
      if (selectedCustomer) {
        selectedCustomer.selected = true;
        this.selectedCustomerId = customerId;
        this.selectedCustomer = selectedCustomer;
      } else {
        this.selectedCustomerId = null;
        this.selectedCustomer = null;
      }
      this.cdr.detectChanges();
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.customerForm.reset();
    this.customerForm.patchValue({
      status: 'active',
    });
    this.showModal = true;
  }

  openEditModal(): void {
    if (this.selectedCustomerId) {
      this.isEditMode = true;
      const customer = this.paginatedCustomers.find((cust) => cust.id === this.selectedCustomerId);
      if (customer) {
        this.customerForm.patchValue({
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          status: customer.status,
          cccd: customer.cccd,
          createdAt: customer.createdAt ? new Date(customer.createdAt).toLocaleString() : '',
          updatedAt: customer.updatedAt ? new Date(customer.updatedAt).toLocaleString() : 'Chưa cập nhật',
        });
        this.showModal = true;
      } else {
        alert('Không tìm thấy khách hàng để chỉnh sửa.');
      }
    } else {
      alert('Vui lòng chọn một khách hàng để chỉnh sửa.');
    }
  }

  openViewModal(): void {
    if (this.selectedCustomerId) {
      this.selectedCustomer = this.paginatedCustomers.find(cust => cust.id === this.selectedCustomerId);
      this.showViewModal = true;
    } else {
      alert('Vui lòng chọn một khách hàng để xem chi tiết.');
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.customerForm.reset();
    this.isEditMode = false;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedCustomer = null;
  }

  async saveCustomer(): Promise<void> {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      alert('Vui lòng nhập đầy đủ và đúng thông tin.');
      return;
    }

    this.isLoading = true;
    const formValue = this.customerForm.getRawValue();
    const customerData = {
      name: formValue.name,
      email: formValue.email,
      phone: formValue.phone,
      address: formValue.address,
      status: formValue.status,
      cccd: formValue.cccd,
      updatedAt: this.isEditMode ? new Date().toISOString() : undefined,
    };

    try {
      if (this.isEditMode && this.selectedCustomerId) {
        await this.customerService.editCustomer(this.selectedCustomerId, customerData);
        alert('Cập nhật khách hàng thành công!');
      } else {
        await this.customerService.addCustomer(
          customerData.name,
          customerData.email,
          customerData.phone,
          customerData.address,
          customerData.status,
          customerData.cccd
        );
        alert('Thêm khách hàng thành công!');
      }
      this.closeModal();
      this.selectedCustomerId = null;
      this.selectedCustomer = null;
      this.getCustomers();
    } catch (error: any) {
      alert('Lỗi khi lưu khách hàng: ' + (error.message || 'Vui lòng thử lại.'));
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async deleteCustomer(): Promise<void> {
    if (!this.selectedCustomerId) {
      alert('Vui lòng chọn một khách hàng để xóa.');
      return;
    }

    if (confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      this.isLoading = true;
      try {
        await this.customerService.deleteCustomer(this.selectedCustomerId);
        alert('Xóa khách hàng thành công!');
        this.selectedCustomerId = null;
        this.selectedCustomer = null;
        this.getCustomers();
      } catch (error: any) {
        alert('Lỗi khi xóa khách hàng: ' + (error.message || 'Vui lòng thử lại.'));
      } finally {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    }
  }

  get isEditDeleteDisabled(): boolean {
    return !this.selectedCustomerId;
  }

  trackByCustomerId(index: number, item: any): string {
    return item.id;
  }
}