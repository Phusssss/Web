import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { AccountService } from '../account.service';

@Component({
  selector: 'app-qr-manager',
  template: `
    <div class="main-content">
      <div class="container">
        <h2 class="title">Quản lý Tài khoản Ngân hàng</h2>

        <!-- Form thông tin tài khoản ngân hàng -->
        <div class="card mb-4">
          <div class="card-body">
            <h5 class="form-title">{{ bankAccount ? 'Cập nhật' : 'Thiết lập' }} tài khoản ngân hàng</h5>
            <form (ngSubmit)="saveBankAccount()">
              <div class="mb-3">
                <label class="form-label">Tên chủ tài khoản</label>
                <input type="text" class="form-control" [(ngModel)]="bankInfo.accountHolder" name="accountHolder" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Số tài khoản</label>
                <input type="text" class="form-control" [(ngModel)]="bankInfo.accountNumber" name="accountNumber" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Ngân hàng</label>
                <select class="form-control" [(ngModel)]="bankInfo.bankCode" name="bankCode" required>
                  <option value="" disabled>Chọn ngân hàng</option>
                  <option *ngFor="let bank of banks" [value]="bank.code">{{ bank.name }}</option>
                </select>
              </div>
              <button type="submit" class="btn-submit" [disabled]="isSaving">
                {{ bankAccount ? 'Cập nhật' : 'Lưu' }} tài khoản
              </button>
            </form>
          </div>
        </div>

        <!-- Hiển thị thông tin tài khoản đã lưu -->
        <div class="card" *ngIf="bankAccount">
          <div class="card-body">
            <h5 class="table-title">Thông tin tài khoản hiện tại</h5>
            <p><strong>Tài khoản:</strong> {{ bankAccount.accountNumber }}</p>
            <p><strong>Chủ tài khoản:</strong> {{ bankAccount.accountHolder }}</p>
            <p><strong>Ngân hàng:</strong> {{ getBankName(bankAccount.bankCode) }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .main-content {
      margin-left: 250px;
      padding: 3rem 2rem;
      background: #f0f5ff;
      min-height: 100vh;
      transition: margin-left 0.3s ease;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .title {
      text-align: center;
      color: #2c5282;
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 20px;
      position: relative;
      padding-bottom: 15px;
    }

    .title::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 80px;
      height: 4px;
      background: linear-gradient(to right, #2c5282, #38b2ac);
      border-radius: 2px;
    }

    .card {
      background: white;
      padding: 20px;
      border-radius: 15px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      max-width: 500px;
      margin: 0 auto 20px;
    }

    .card:hover {
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    .card-body {
      padding: 0;
    }

    .form-title,
    .table-title {
      color: #2c5282;
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 15px;
    }

    .form-label {
      font-weight: 600;
      color: #2d3748;
    }

    .form-control {
      width: 100%;
      padding: 10px;
      margin-bottom: 15px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 1rem;
      color: #2d3748;
      background: #f7fafc;
      transition: border-color 0.3s ease;
    }

    .form-control:focus {
      border-color: #38b2ac;
      outline: none;
    }

    .btn-submit {
      background: #38b2ac;
      border: none;
      color: white;
      padding: 10px 20px;
      width: 100%;
      border-radius: 5px;
      cursor: pointer;
      font-weight: 600;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    .btn-submit:hover:not(:disabled) {
      background: #2d9c97;
      transform: translateY(-3px);
      box-shadow: 0 7px 10px rgba(0, 0, 0, 0.15);
    }

    .btn-submit:active:not(:disabled) {
      background: #1f7a76;
      transform: translateY(1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .btn-submit:disabled {
      background: #e2e8f0;
      cursor: not-allowed;
    }

    p {
      color: #718096;
      margin: 5px 0;
    }

    p strong {
      color: #2d3748;
    }

    @media (max-width: 768px) {
      .main-content {
        margin-left: 0;
        padding: 1.5rem 1rem;
      }

      .container {
        width: 100%;
        padding: 0;
        max-width: none;
      }

      .card {
        padding: 15px;
        margin-bottom: 15px;
      }
    }
  `]
})
export class QRManagerComponent implements OnInit, OnDestroy {
  bankAccount: any;
  bankInfo = {
    bankCode: '',
    accountNumber: '',
    accountHolder: ''
  };
  isSaving: boolean = false;
  subscription: any;

  banks = [
    { code: '970422', name: 'MB Bank (Ngân hàng Quân đội)' },
    { code: '970416', name: 'Ngân hàng Á Châu (ACB)' },
    { code: '970409', name: 'Ngân hàng Bắc Á (BAB)' },
    { code: '970418', name: 'Ngân hàng Đầu tư và Phát triển Việt Nam (BIDV)' },
    { code: '970438', name: 'Ngân hàng Bảo Việt (BVB)' },
    { code: '970432', name: 'Ngân hàng Việt Nam Thịnh Vượng (VPBank)' },
    { code: '970423', name: 'Ngân hàng Tiên Phong (TPBank)' },
    { code: '970436', name: 'Ngân hàng Vietcombank' },
    { code: '970422', name: 'Ngân hàng MB (Ngân hàng Quân đội)' },
    { code: '970426', name: 'Ngân hàng Hàng Hải (MSB)' },
    { code: '970428', name: 'Ngân hàng Nam Á (Nam A Bank)' },
    { code: '970448', name: 'Ngân hàng Phương Đông (OCB)' },
    { code: '970429', name: 'Ngân hàng Sài Gòn (SCB)' },
    { code: '970440', name: 'Ngân hàng Đông Nam Á (SeABank)' },
    { code: '970403', name: 'Ngân hàng Sài Gòn Thương Tín (Sacombank)' },
    { code: '970407', name: 'Ngân hàng Kỹ Thương Việt Nam (Techcombank)' },
    { code: '970427', name: 'Ngân hàng Việt Á (VietABank)' },
    { code: '970419', name: 'Ngân hàng Quốc Dân (NCB)' },
    { code: '970430', name: 'Ngân hàng Xăng dầu Petrolimex (PGBank)' },
    { code: '970412', name: 'Ngân hàng Đại Chúng Việt Nam (PVcomBank)' },
    { code: '970443', name: 'Ngân hàng Sài Gòn - Hà Nội (SHB)' },
    { code: '970406', name: 'Ngân hàng Đông Á (DongA Bank)' },
    { code: '970437', name: 'Ngân hàng Phát triển Thành phố Hồ Chí Minh (HDBank)' },
    { code: '970400', name: 'Ngân hàng Sài Gòn Công Thương (Saigonbank)' },
    { code: '970452', name: 'Ngân hàng Kiên Long (Kienlongbank)' },
    { code: '970454', name: 'Ngân hàng Bản Việt (Viet Capital Bank)' },
    { code: '970433', name: 'Ngân hàng Việt Nam Thương Tín (VietBank)' }
  ];

  constructor(
    private authService: AuthService,
    private accountService: AccountService
  ) {}

  ngOnInit() {
    this.subscription = this.accountService.getUserBankAccount()
      .subscribe(bankAccount => {
        this.bankAccount = bankAccount;
        if (bankAccount) {
          this.bankInfo = {
            bankCode: bankAccount.bankCode,
            accountNumber: bankAccount.accountNumber,
            accountHolder: bankAccount.accountHolder
          };
        }
      });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  saveBankAccount() {
    this.isSaving = true;
    const savePromise = this.bankAccount
      ? this.accountService.updateBankAccount(this.bankInfo)
      : this.accountService.addBankAccount(this.bankInfo);

    savePromise
      .then(() => {
        this.isSaving = false;
      })
      .catch(error => {
        console.error('Error saving bank account:', error);
        this.isSaving = false;
      });
  }

  getBankName(bankCode: string): string {
    const bank = this.banks.find(b => b.code === bankCode);
    return bank ? bank.name : 'Không xác định';
  }
}