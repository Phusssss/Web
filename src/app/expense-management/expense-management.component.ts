import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExpenseService, Expense } from '../services/expense.service';

@Component({
  selector: 'app-expense-management',
  templateUrl: './expense-management.component.html',
  styleUrls: ['./expense-management.component.css']
})
export class ExpenseManagementComponent implements OnInit {
  expenseForm: FormGroup;
  expenses: any[] = [];
  originalExpenses: any[] = [];
  isLoading = false;
  selectedExpenseId: string | null = null;
  selectedExpense: any = null;
  showModal = false;
  showViewModal = false;
  isEditMode = false;
  searchQuery: string = '';

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {
    this.expenseForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(5)]],
      amount: ['', [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      date: ['', [Validators.required]],
      createdAt: [{ value: '', disabled: true }],
      updatedAt: [{ value: '', disabled: true }],
    });
  }

  ngOnInit(): void {
    this.getExpenses();
  }

  getExpenses(): void {
    this.isLoading = true;
    this.expenseService.getExpenses().subscribe(
      (expenses) => {
        this.originalExpenses = expenses.map((expense) => {
          return {
            id: expense.id,
            ...expense,
            createdAt: expense.date || new Date().toISOString(),
            updatedAt: expense.updatedAt || null,
            userId: expense.userId || 'Unknown',
            selected: false,
          };
        });
        this.expenses = [...this.originalExpenses];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Lỗi khi lấy danh sách chi tiêu:', error);
        this.isLoading = false;
      }
    );
  }

  onSearch(): void {
    this.zone.run(() => {
      if (!this.searchQuery.trim()) {
        this.expenses = [...this.originalExpenses];
      } else {
        const query = this.searchQuery.trim().toLowerCase();
        this.expenses = this.originalExpenses.filter((expense) =>
          expense.name.toLowerCase().includes(query) ||
          expense.description.toLowerCase().includes(query)
        );
      }
      this.expenses.forEach(exp => exp.selected = false);
      this.selectedExpenseId = null;
      this.selectedExpense = null;
      this.cdr.detectChanges();
    });
  }

  toggleSelection(expenseId: string): void {
    this.zone.run(() => {
      this.expenses.forEach(exp => exp.selected = false);
      const selectedExpense = this.expenses.find(exp => exp.id === expenseId);
      if (selectedExpense) {
        selectedExpense.selected = true;
        this.selectedExpenseId = expenseId;
        this.selectedExpense = selectedExpense;
      }
      this.cdr.detectChanges();
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.expenseForm.reset();
    this.expenseForm.patchValue({ date: new Date().toISOString().split('T')[0] });
    this.showModal = true;
  }

  openEditModal(): void {
    if (this.selectedExpenseId) {
      this.isEditMode = true;
      const expense = this.expenses.find((exp) => exp.id === this.selectedExpenseId);
      if (expense) {
        this.expenseForm.patchValue({
          name: expense.name,
          description: expense.description,
          amount: expense.amount,
          date: new Date(expense.date).toISOString().split('T')[0],
          createdAt: new Date(expense.createdAt).toLocaleString(),
          updatedAt: expense.updatedAt ? new Date(expense.updatedAt).toLocaleString() : 'Chưa cập nhật',
        });
        this.showModal = true;
      }
    }
  }

  openViewModal(): void {
    if (this.selectedExpenseId) {
      this.showViewModal = true;
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.expenseForm.reset();
    this.isEditMode = false;
  }

  closeViewModal(): void {
    this.showViewModal = false;
  }

  saveExpense(): void {
    if (this.expenseForm.valid) {
      this.isLoading = true;
      const formValue = this.expenseForm.value;
      if (this.isEditMode && this.selectedExpenseId) {
        this.expenseService
          .updateExpense(this.selectedExpenseId, {
            ...formValue,
            updatedAt: new Date().toISOString(),
          })
          .subscribe(
            () => {
              this.getExpenses();
              this.closeModal();
              this.selectedExpenseId = null;
              this.selectedExpense = null;
              this.isLoading = false;
            },
            (error) => {
              console.error('Lỗi khi cập nhật chi tiêu:', error);
              this.isLoading = false;
            }
          );
      } else {
        this.expenseService
          .addExpense({
            ...formValue,
            createdAt: new Date().toISOString(),
            updatedAt: null,
          })
          .subscribe(
            () => {
              this.getExpenses();
              this.closeModal();
              this.isLoading = false;
            },
            (error) => {
              console.error('Lỗi khi thêm chi tiêu:', error);
              this.isLoading = false;
            }
          );
      }
    }
  }

  deleteExpense(): void {
    if (this.selectedExpenseId && confirm('Bạn có chắc chắn muốn xóa chi tiêu này?')) {
      this.isLoading = true;
      this.expenseService.deleteExpense(this.selectedExpenseId).subscribe(
        () => {
          this.getExpenses();
          this.selectedExpenseId = null;
          this.selectedExpense = null;
          this.isLoading = false;
        },
        (error) => {
          console.error('Lỗi khi xóa chi tiêu:', error);
          this.isLoading = false;
        }
      );
    }
  }

  get isEditDeleteDisabled(): boolean {
    return !this.selectedExpenseId;
  }

  get isFormInvalid(): boolean {
    return this.expenseForm.invalid;
  }

  trackByExpenseId(index: number, item: any): string {
    return item.id;
  }
}