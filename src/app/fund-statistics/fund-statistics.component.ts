import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FundService, Transaction } from '../services/fund.service';

@Component({
  selector: 'app-fund-statistics',
  templateUrl: './fund-statistics.component.html',
  styleUrls: ['./fund-statistics.component.css']
})
export class FundStatisticsComponent implements OnInit {
  fundForm: FormGroup;
  balance: number = 0;
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  isLoading = false;
  searchQuery: string = '';

  constructor(
    private fb: FormBuilder,
    private fundService: FundService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {
    this.fundForm = this.fb.group({
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void {
    this.getFundStatistics();
  }

  getFundStatistics(): void {
    this.isLoading = true;
    const { startDate, endDate } = this.fundForm.value;
    this.fundService.getFundStatistics(startDate, endDate).subscribe(
      ({ balance, transactions }) => {
        this.balance = balance;
        this.transactions = transactions;
        this.filteredTransactions = [...transactions];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Lỗi khi lấy thống kê tồn quỹ:', error);
        this.isLoading = false;
      }
    );
  }

  onSearch(): void {
    this.zone.run(() => {
      if (!this.searchQuery.trim()) {
        this.filteredTransactions = [...this.transactions];
      } else {
        const query = this.searchQuery.trim().toLowerCase();
        this.filteredTransactions = this.transactions.filter((transaction) =>
          transaction.description.toLowerCase().includes(query)
        );
      }
      this.cdr.detectChanges();
    });
  }

  onFilter(): void {
    this.getFundStatistics();
  }

  resetFilter(): void {
    this.fundForm.reset();
    this.searchQuery = '';
    this.getFundStatistics();
  }

  trackByTransactionId(index: number, item: Transaction): string {
    return item.id;
  }
}