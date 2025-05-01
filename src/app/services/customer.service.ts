import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';  // Thêm map từ rxjs/operators

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  constructor(
    private firestore: AngularFirestore,
    private auth: AngularFireAuth
  ) {}

  // Thêm khách hàng mới
  async addCustomer(
    name: string,
    email: string,
    phone: string,
    address: string,
    status: string,
    cccd: string
  ) {
    const user = await this.auth.currentUser;
    if (!user) throw new Error("Bạn chưa đăng nhập!");

    const customerData = {
      name,
      email,
      phone,
      address,
      status,
      cccd,  // Thêm trường cccd vào dữ liệu khách hàng
      ownerId: user.uid,
      createdAt: new Date()
    };

    return this.firestore.collection('customers').add(customerData);
  }

  // Lấy danh sách khách hàng của user hiện tại
  getUserCustomers(): Observable<any[]> {
    return this.auth.authState.pipe(
      switchMap(user => {
        if (!user) return [];  // Trả về mảng rỗng nếu user chưa đăng nhập
        return this.firestore.collection('customers', ref => ref.where('ownerId', '==', user.uid))
          .valueChanges({ idField: 'id' }) as Observable<any[]>;
      })
    );
  }
  getCustomerNameByBookingId(idBooking: string): Observable<string | null> {
    return this.firestore.collection('booking').doc(idBooking).get().pipe(
      switchMap(bookingDoc => {
        if (!bookingDoc.exists) {
          throw new Error('Không tìm thấy thông tin đặt phòng!');
        }
        const bookingData = bookingDoc.data() as any;
        const customerId = bookingData.customerId;
        
        return this.firestore.collection('customers').doc(customerId).get().pipe(
          map(customerDoc => {
            if (!customerDoc.exists) {
              throw new Error('Không tìm thấy thông tin khách hàng!');
            }
            const customerData = customerDoc.data() as any;
            return customerData.name || null; // Trả về tên khách hàng hoặc null nếu không có
          })
        );
      })
    );
  }
  
  // Chỉnh sửa thông tin khách hàng
  async editCustomer(customerId: string, updatedData: { name?: string; email?: string; phone?: string; address?: string; status?: string; cccd?: string }) {
    const user = await this.auth.currentUser;
    if (!user) throw new Error("Bạn chưa đăng nhập!");

    return this.firestore.collection('customers').doc(customerId).update(updatedData);
  }

  // Xóa khách hàng
  async deleteCustomer(customerId: string) {
    const user = await this.auth.currentUser;
    if (!user) throw new Error("Bạn chưa đăng nhập!");

    return this.firestore.collection('customers').doc(customerId).delete();
  }
}
