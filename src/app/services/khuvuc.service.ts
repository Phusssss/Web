import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class KhuVucService {
  constructor(
    private firestore: AngularFirestore,
    private auth: AngularFireAuth
  ) {}

  // Thêm khu vực mới
  async addKhuVuc(name: string, description: string, sortOrder: number) {
    const user = await this.auth.currentUser;
    if (!user) throw new Error("Bạn chưa đăng nhập!");

    // Kiểm tra sortOrder trùng lặp
    const isDuplicate = await this.checkDuplicateSortOrder(user.uid, sortOrder);
    if (isDuplicate) throw new Error("Số thứ tự sắp xếp đã tồn tại!");

    const khuVucData = {
      name,
      description,
      sortOrder,
      ownerId: user.uid,
      createdAt: new Date(),
    };

    return this.firestore.collection('khuVuc').add(khuVucData);
  }

  // Lấy danh sách khu vực của user hiện tại
  getUserKhuVuc(): Observable<any[]> {
    return this.auth.authState.pipe(
      switchMap(user => {
        if (!user) return [];  // Trả về mảng rỗng nếu user chưa đăng nhập
        return this.firestore.collection('khuVuc', ref => ref.where('ownerId', '==', user.uid))
          .valueChanges({ idField: 'id' }) as Observable<any[]>;
      })
    );
  }

  // Chỉnh sửa khu vực
  async editKhuVuc(khuVucId: string, updatedData: { name?: string; description?: string; sortOrder?: number }) {
    const user = await this.auth.currentUser;
    if (!user) throw new Error("Bạn chưa đăng nhập!");

    // Nếu cập nhật sortOrder, kiểm tra trùng lặp
    if (updatedData.sortOrder !== undefined) {
      const isDuplicate = await this.checkDuplicateSortOrder(user.uid, updatedData.sortOrder, khuVucId);
      if (isDuplicate) throw new Error("Số thứ tự sắp xếp đã tồn tại!");
    }

    return this.firestore.collection('khuVuc').doc(khuVucId).update(updatedData);
  }

  // Xóa khu vực
  async deleteKhuVuc(khuVucId: string) {
    const user = await this.auth.currentUser;
    if (!user) throw new Error("Bạn chưa đăng nhập!");

    return this.firestore.collection('khuVuc').doc(khuVucId).delete();
  }

  // Kiểm tra sortOrder trùng lặp
  private async checkDuplicateSortOrder(ownerId: string, sortOrder: number, excludeId?: string): Promise<boolean> {
    const snapshot = await this.firestore.collection('khuVuc')
      .ref.where('ownerId', '==', ownerId)
      .where('sortOrder', '==', sortOrder)
      .get();
    
    if (excludeId) {
      return snapshot.docs.some(doc => doc.id !== excludeId);
    }
    return !snapshot.empty;
  }
}