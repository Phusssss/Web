import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class KhuVucService {
  constructor(
    private firestore: AngularFirestore,
    private auth: AngularFireAuth
  ) {}

  // Thêm khu vực mới
  async addKhuVuc(name: string, description: string) {
    const user = await this.auth.currentUser;
    if (!user) throw new Error("Bạn chưa đăng nhập!");

    const khuVucData = {
      name,
      description,
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
  async editKhuVuc(khuVucId: string, updatedData: { name?: string; description?: string }) {
    const user = await this.auth.currentUser;
    if (!user) throw new Error("Bạn chưa đăng nhập!");

    return this.firestore.collection('khuVuc').doc(khuVucId).update(updatedData);
  }

  // Xóa khu vực
  async deleteKhuVuc(khuVucId: string) {
    const user = await this.auth.currentUser;
    if (!user) throw new Error("Bạn chưa đăng nhập!");

    return this.firestore.collection('khuVuc').doc(khuVucId).delete();
  }
}
