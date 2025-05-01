import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore
  ) {}

  // Thêm thông tin tài khoản ngân hàng cho user
  async addBankAccount(bankInfo: {
    bankCode: string;
    accountNumber: string;
    accountHolder: string;
  }): Promise<void> {
    const user = await this.afAuth.currentUser;
    if (!user) throw new Error('No user logged in');

    return this.firestore
      .collection('bankAccounts')
      .doc(user.uid)
      .set({
        ...bankInfo,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
  }

  // Lấy thông tin tài khoản ngân hàng của user hiện tại
  getUserBankAccount(): Observable<any> {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (!user) return [];
        return this.firestore
          .collection('bankAccounts')
          .doc(user.uid)
          .valueChanges();
      })
    );
  }

  // Cập nhật thông tin tài khoản ngân hàng
  async updateBankAccount(bankInfo: {
    bankCode: string;
    accountNumber: string;
    accountHolder: string;
  }): Promise<void> {
    const user = await this.afAuth.currentUser;
    if (!user) throw new Error('No user logged in');

    return this.firestore
      .collection('bankAccounts')
      .doc(user.uid)
      .update({
        ...bankInfo,
        updatedAt: new Date().toISOString()
      });
  }
}