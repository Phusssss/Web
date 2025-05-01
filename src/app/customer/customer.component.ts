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
  customers: any[] = [];
  originalCustomers: any[] = []; // Store the original unfiltered list
  isLoading = false;
  selectedCustomerId: string | null = null;
  selectedCustomer: any = null;
  showModal = false;
  showViewModal = false;
  isEditMode = false;
  searchQuery: string = ''; // Bind to search input

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
        this.originalCustomers = customers.map((customer: any) => {
          return {
            id: customer.id,
            ...customer,
            createdAt: customer.createdAt || new Date().toISOString(),
            updatedAt: customer.updatedAt || null,
            selected: false,
          };
        });
        this.customers = [...this.originalCustomers]; // Initialize with original list
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Lỗi khi lấy danh sách khách hàng:', error);
        this.isLoading = false;
      }
    );
  }

  onSearch(): void {
    this.zone.run(() => {
      if (!this.searchQuery.trim()) {
        this.customers = [...this.originalCustomers]; // Reset to original list if search is empty
      } else {
        const query = this.searchQuery.trim().toLowerCase();
        this.customers = this.originalCustomers.filter((customer) =>
          customer.name.toLowerCase().includes(query) ||
          customer.email.toLowerCase().includes(query) ||
          customer.phone.includes(query) ||
          customer.address.toLowerCase().includes(query) ||
          customer.cccd.includes(query)
        );
      }
      // Reset selection when filtering
      this.customers.forEach(cust => cust.selected = false);
      this.selectedCustomerId = null;
      this.selectedCustomer = null;
      this.cdr.detectChanges();
    });
  }

  toggleSelection(customerId: string): void {
    this.zone.run(() => {
      // Bỏ chọn tất cả trước
      this.customers.forEach(cust => cust.selected = false);
      
      // Chọn khách hàng hiện tại
      const selectedCustomer = this.customers.find(cust => cust.id === customerId);
      if (selectedCustomer) {
        selectedCustomer.selected = true;
        this.selectedCustomerId = customerId;
        this.selectedCustomer = selectedCustomer;
      }
      
      this.cdr.detectChanges();
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.customerForm.reset();
    // Set default status
    this.customerForm.patchValue({
      status: 'active'
    });
    this.showModal = true;
  }

  openEditModal(): void {
    if (this.selectedCustomerId) {
      this.isEditMode = true;
      const customer = this.customers.find((cust) => cust.id === this.selectedCustomerId);
      if (customer) {
        this.customerForm.patchValue({
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          status: customer.status,
          cccd: customer.cccd,
          createdAt: new Date(customer.createdAt).toLocaleString(),
          updatedAt: customer.updatedAt ? new Date(customer.updatedAt).toLocaleString() : 'Chưa cập nhật',
        });
        this.showModal = true;
      }
    }
  }

  openViewModal(): void {
    if (this.selectedCustomerId) {
      this.showViewModal = true;
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.customerForm.reset();
    this.isEditMode = false;
  }

  closeViewModal(): void {
    this.showViewModal = false;
  }

  saveCustomer(): void {
    if (this.customerForm.valid) {
      this.isLoading = true;
      const formValue = this.customerForm.value;
      if (this.isEditMode && this.selectedCustomerId) {
        this.customerService
          .editCustomer(this.selectedCustomerId, {
            ...formValue,
            updatedAt: new Date().toISOString(),
          })
          .then(() => {
            this.getCustomers();
            this.closeModal();
            this.selectedCustomerId = null;
            this.selectedCustomer = null;
            this.isLoading = false;
          })
          .catch((error) => {
            console.error('Lỗi khi cập nhật khách hàng:', error);
            this.isLoading = false;
          });
      } else {
        this.customerService
          .addCustomer(
            formValue.name,
            formValue.email,
            formValue.phone,
            formValue.address,
            formValue.status,
            formValue.cccd
          )
          .then(() => {
            this.getCustomers();
            this.closeModal();
            this.isLoading = false;
          })
          .catch((error) => {
            console.error('Lỗi khi thêm khách hàng:', error);
            this.isLoading = false;
          });
      }
    }
  }

  deleteCustomer(): void {
    if (this.selectedCustomerId && confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      this.isLoading = true;
      this.customerService.deleteCustomer(this.selectedCustomerId)
        .then(() => {
          this.getCustomers();
          this.selectedCustomerId = null;
          this.selectedCustomer = null;
          this.isLoading = false;
        })
        .catch((error) => {
          console.error('Lỗi khi xóa khách hàng:', error);
          this.isLoading = false;
        });
    }
  }

  get isEditDeleteDisabled(): boolean {
    return !this.selectedCustomerId;
  }

  get isFormInvalid(): boolean {
    return this.customerForm.invalid;
  }

  trackByCustomerId(index: number, item: any): string {
    return item.id;
  }
}