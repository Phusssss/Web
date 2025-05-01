import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VietQRService {
  private apiUrl = 'https://api.vietqr.io/v2/generate';

  constructor(private http: HttpClient) {}

  generateQRCode(accountNo: string, amount: number, memo: string, accountName: string, bankCode: string): Observable<any> {
    const payload = {
      accountNo: accountNo,
      accountName: accountName,
      acqId: bankCode,
      amount: amount,
      addInfo: memo,
      format: 'png',
      template: 'compact'
    };

    return this.http.post(this.apiUrl, payload);
  }
}