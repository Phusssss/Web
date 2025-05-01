import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-set-account',
  templateUrl: './set-account.component.html',
  styleUrls: ['./set-account.component.css']
})
export class SetAccountComponent implements OnInit {
  userId: string | null = null;
  pin: string = '';
  hasPin: boolean = false;

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore
  ) {}

  ngOnInit(): void {
    this.afAuth.authState.subscribe(user => {
      this.userId = user ? user.uid : null;
      if (this.userId) {
        this.checkPinStatus();
      }
    });
  }

  async setPin() {
    if (!this.pin) {
      alert('Vui lòng nhập mã PIN!');
      return;
    }
    if (!this.userId) {
      alert('Không tìm thấy người dùng!');
      return;
    }

    try {
      await this.firestore.collection('pins').doc(this.userId).set({
        userId: this.userId,
        pin: this.pin,
        updatedAt: new Date()
      });
      alert('Đặt mã PIN thành công!');
      this.pin = '';
      this.hasPin = true;
    } catch (error) {
      console.error('Lỗi khi đặt mã PIN:', error);
      alert('Có lỗi xảy ra khi đặt mã PIN!');
    }
  }

  async removePin() {
    if (!this.userId) {
      alert('Không tìm thấy người dùng!');
      return;
    }

    try {
      await this.firestore.collection('pins').doc(this.userId).delete();
      alert('Xóa mã PIN thành công!');
      this.hasPin = false;
    } catch (error) {
      console.error('Lỗi khi xóa mã PIN:', error);
      alert('Có lỗi xảy ra khi xóa mã PIN!');
    }
  }

  async checkPinStatus() {
    if (!this.userId) {
      this.hasPin = false;
      return;
    }

    const pinDoc = await this.firestore.collection('pins').doc(this.userId).get().toPromise();
    this.hasPin = pinDoc && pinDoc.exists ? true : false; // Kiểm tra pinDoc trước
  }
}