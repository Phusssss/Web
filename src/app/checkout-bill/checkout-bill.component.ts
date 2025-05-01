import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BookingService } from '../services/booking.service';
import { VietQRService } from '../viet-qr.service';
import { AccountService } from '../account.service';

@Component({
  selector: 'app-checkout-bill',
  template: `
    <div id="print-bill" class="bill-container">
      <div class="modal-header bg-primary text-white print-condensed">
        <h4 class="modal-title"><i class="fas fa-receipt mr-2"></i> Hóa đơn thanh toán</h4>
        <button type="button" class="btn-close btn-close-white print-hide" (click)="activeModal.dismiss()"></button>
      </div>
      <div class="modal-body p-3 p-print-1">
        <div class="container">
          <!-- Thông tin khách hàng -->
          <div class="card mb-2 shadow-sm print-mb-1">
            <div class="card-header bg-light py-2">
              <h5 class="mb-0 fs-print-small"><i class="fas fa-user mr-2"></i> Thông tin khách hàng</h5>
            </div>
            <div class="card-body py-2">
              <div class="row g-1">
                <div class="col-md-4"><strong>Tên:</strong> {{ booking?.customerName }}</div>
                <div class="col-md-4"><strong>Mã đặt phòng:</strong> <span class="badge bg-info">{{ booking?.id }}</span></div>
                <div class="col-md-4"><strong>Ngày:</strong> {{ currentDate | date:'dd/MM/yyyy HH:mm' }}</div>
              </div>
            </div>
          </div>

          <!-- Chi tiết phòng -->
          <div class="card mb-2 shadow-sm print-mb-1">
            <div class="card-header bg-light py-2">
              <h5 class="mb-0 fs-print-small"><i class="fas fa-bed mr-2"></i> Chi tiết phòng</h5>
            </div>
            <div class="card-body py-2">
              <table class="table table-sm table-striped mb-1">
                <thead>
                  <tr>
                    <th>Phòng</th>
                    <th>Thời gian</th>
                    <th class="text-end">Giá phòng</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let detail of booking?.details">
                    <td>{{ detail.roomName }}</td>
                    <td>{{ detail.checkin.toDate() | date:'dd/MM/yyyy' }} - {{ detail.checkout.toDate() | date:'dd/MM/yyyy' }}</td>
                    <td class="text-end">{{ detail.price | number:'1.0-0' }} ₫</td>
                  </tr>
                </tbody>
              </table>
              <p class="text-end fw-bold text-primary mb-0">Tổng tiền phòng: {{ totalRoomCost | number:'1.0-0' }} ₫</p>
            </div>
          </div>

          <!-- Chi tiết dịch vụ -->
          <div class="card mb-2 shadow-sm print-mb-1" *ngIf="serviceRequests.length > 0">
            <div class="card-header bg-light py-2">
              <h5 class="mb-0 fs-print-small"><i class="fas fa-concierge-bell mr-2"></i> Chi tiết dịch vụ</h5>
            </div>
            <div class="card-body py-2">
              <table class="table table-sm table-striped mb-1">
                <thead>
                  <tr>
                    <th>Dịch vụ</th>
                    <th>SL</th>
                    <th>Đơn giá</th>
                    <th class="text-end">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let service of serviceRequests">
                    <td>{{ service.nameService }}</td>
                    <td>{{ service.quantity }}</td>
                    <td>{{ service.price | number:'1.0-0' }} ₫</td>
                    <td class="text-end">{{ service.quantity * service.price | number:'1.0-0' }} ₫</td>
                  </tr>
                </tbody>
              </table>
              <p class="text-end fw-bold text-primary mb-0">Tổng tiền dịch vụ: {{ totalServiceCost | number:'1.0-0' }} ₫</p>
            </div>
          </div>

          <!-- Tổng cộng -->
          <div class="card shadow-sm mb-2 print-mb-1">
            <div class="card-body py-2 text-end">
              <h4 class="text-danger fw-bold mb-0">
                Tổng cộng: {{ (totalRoomCost + totalServiceCost) | number:'1.0-0' }} ₫
              </h4>
            </div>
          </div>

          <!-- VietQR Payment Section -->
          <div class="mt-2 print-mt-1" *ngIf="!isPaid && bankAccount">
            <div class="card shadow-sm">
              <div class="card-header bg-light py-2">
                <h5 class="mb-0 fs-print-small"><i class="fas fa-qrcode mr-2"></i> Thanh toán qua VietQR</h5>
              </div>
              <div class="card-body py-2 text-center">
                <div *ngIf="isLoading" class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Đang tải...</span>
                </div>
                <div class="row">
                  <div class="col-md-6 print-col-6">
                    <img *ngIf="!isLoading && qrCodeUrl" [src]="qrCodeUrl" alt="QR Code" class="qr-code img-fluid">
                  </div>
                  <div class="col-md-6 print-col-6 d-flex align-items-center">
                    <div *ngIf="countdown > 0" class="w-100">
                      <p class="mb-0 small">Quét mã QR để thanh toán số tiền: {{ (totalRoomCost + totalServiceCost) | number:'1.0-0' }} ₫</p>
                    </div>
                  
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-2 print-hide" *ngIf="!bankAccount">
            <div class="alert alert-danger text-center py-2">
              Vui lòng thiết lập tài khoản ngân hàng trong phần quản lý để tạo mã QR thanh toán.
            </div>
          </div>
          
          <!-- Print Footer -->
          <div class="d-none d-print-block text-center mt-2 small">
            <p class="mb-0">Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!</p>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-footer print-hide bg-light">
      <button type="button" class="btn btn-success" (click)="confirmAndPrint()">
        <i class="fas fa-print mr-2"></i> In hóa đơn
      </button>
      <button type="button" class="btn btn-secondary" (click)="activeModal.dismiss()">
        <i class="fas fa-times mr-2"></i> Đóng
      </button>
    </div>
  `,
  styles: [`
    .bill-container {
      font-family: 'Arial', sans-serif;
    }

    .modal-header {
      border-bottom: none;
    }

    .modal-header .btn-close-white {
      filter: invert(1);
    }

    .card {
      border: none;
      border-radius: 8px;
    }

    .card-header {
      border-bottom: 1px solid #e9ecef;
      border-radius: 8px 8px 0 0;
      padding: 0.75rem 1rem;
    }

    .card-body {
      padding: 1rem;
    }

    .table {
      margin-bottom: 0;
    }

    .table th {
      background-color: #f8f9fa;
      border-top: none;
      font-size: 0.9rem;
    }
    
    .table td {
      padding: 0.5rem;
      font-size: 0.9rem;
    }

    .table-sm th, .table-sm td {
      padding: 0.3rem;
    }

    .text-end {
      text-align: right;
    }

    .fw-bold {
      font-weight: bold;
    }

    .qr-code {
      max-width: 150px;
      border: 1px solid #28a745;
      border-radius: 8px;
      padding: 5px;
      background: #fff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .btn-success {
      background-color: #28a745;
      border: none;
      border-radius: 5px;
      padding: 8px 16px;
    }

    .btn-success:hover {
      background-color: #218838;
    }

    .btn-secondary {
      background-color: #6c757d;
      border: none;
      border-radius: 5px;
      padding: 8px 16px;
    }

    .btn-secondary:hover {
      background-color: #5a6268;
    }

    .mr-2 {
      margin-right: 8px;
    }
    
    .small {
      font-size: 0.875rem;
    }

    @media print {
      body * {
        visibility: hidden;
      }
      #print-bill, #print-bill * {
        visibility: visible;
      }
      #print-bill {
        position: static;
        width: 100%;
        margin: 0;
        padding: 0;
      }
      .print-hide {
        display: none !important;
      }
      .print-condensed {
        padding: 0.5rem !important;
      }
      .p-print-1 {
        padding: 0.25rem !important;
      }
      .print-mb-1 {
        margin-bottom: 0.25rem !important;
      }
      .print-mt-1 {
        margin-top: 0.25rem !important;
      }
      .print-col-6 {
        width: 50% !important;
        float: left !important;
      }
      .fs-print-small {
        font-size: 1rem !important;
      }
      .qr-code {
        max-width: 120px !important;
        border: 1px solid #000 !important;
        box-shadow: none !important;
        padding: 3px !important;
      }
      table {
        page-break-inside: avoid;
        font-size: 0.75rem !important;
      }
      .table td, .table th {
        padding: 0.2rem !important;
      }
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
      .card {
        page-break-inside: avoid;
        border: 1px solid #ddd !important;
        margin-bottom: 0.25rem !important;
        box-shadow: none !important;
      }
      .card-header {
        padding: 0.25rem 0.5rem !important;
        background-color: #f8f9fa !important;
        color: #000 !important;
      }
      .card-body {
        padding: 0.25rem 0.5rem !important;
      }
      h4, h5 {
        margin-bottom: 0 !important;
      }
      .modal-body {
        padding: 0.25rem !important;
        overflow: visible !important;
      }
      .container {
        width: 100% !important;
        max-width: 100% !important;
        padding: 0 !important;
      }
      .badge {
        border: 1px solid #000 !important;
        color: #000 !important;
        background-color: transparent !important;
      }
      p {
        margin-bottom: 0.25rem !important;
      }
      .text-primary, .text-danger {
        color: #000 !important;
      }
    }
  `]
})
export class CheckoutBillComponent implements OnInit, OnDestroy {
  @Input() booking: any;
  @Input() serviceRequests: any[] = [];
  totalRoomCost: number = 0;
  totalServiceCost: number = 0;
  currentDate: Date = new Date();

  qrCodeUrl: string = '';
  countdown: number = 900;
  timer: any;
  isLoading: boolean = true;
  isPaid: boolean = false;
  bankAccount: any;

  constructor(
    public activeModal: NgbActiveModal,
    private bookingService: BookingService,
    private vietQRService: VietQRService,
    private accountService: AccountService
  ) {}

  ngOnInit() {
    this.calculateTotals();
    this.accountService.getUserBankAccount().subscribe(bankAccount => {
      this.bankAccount = bankAccount;
      if (bankAccount) {
        this.generateQR();
        this.startCountdown();
      } else {
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  calculateTotals() {
    this.totalRoomCost = this.booking.details.reduce((total: number, detail: any) => total + detail.price, 0);
    this.totalServiceCost = this.serviceRequests.reduce((total: number, service: any) => total + (service.price * service.quantity), 0);
  }

  generateQR(): void {
    if (!this.bankAccount) return;

    this.isLoading = true;
    const totalAmount = this.totalRoomCost + this.totalServiceCost;
    const memo = `Thanh toan hoa don ${this.booking.id}`;

    this.vietQRService.generateQRCode(
      this.bankAccount.accountNumber,
      totalAmount,
      memo,
      this.bankAccount.accountHolder,
      this.bankAccount.bankCode
    ).subscribe({
      next: (response) => {
        this.qrCodeUrl = response.data.qrDataURL;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  startCountdown(): void {
    this.timer = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;
      }
    }, 1000);
  }

  get formattedTime(): string {
    const minutes = Math.floor(this.countdown / 60);
    const seconds = this.countdown % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  refreshQR(): void {
    this.countdown = 900;
    this.generateQR();
    this.startCountdown();
  }

  confirmAndPrint() {
    this.isPaid = true; // Giả sử đã thanh toán để in
    const printContent = document.getElementById('print-bill');
    const originalContent = document.body.innerHTML;
    if (printContent) {
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    }
    this.activeModal.close('printed');
  }
}