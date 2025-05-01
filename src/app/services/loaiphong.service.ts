import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LoaiPhongService {
  constructor(
    private firestore: AngularFirestore,
    private auth: AngularFireAuth
  ) {}

  async addLoaiPhong(name: string, description: string, maxPeople: number) {
    const user = await this.auth.currentUser;
    if (!user) throw new Error("Bạn chưa đăng nhập!");

    const loaiPhongData = {
      name,
      description,
      ownerId: user.uid,
      createdAt: new Date(),
      maxPeople,
    };

    return this.firestore.collection('loaiPhong').add(loaiPhongData);
  }

  getUserLoaiPhong(): Observable<any[]> {
    return this.auth.authState.pipe(
      switchMap(user => {
        if (!user) return [];
        return this.firestore.collection('loaiPhong', ref => ref.where('ownerId', '==', user.uid))
          .valueChanges({ idField: 'id' }) as Observable<any[]>;
      })
    );
  }

  async editLoaiPhong(loaiPhongId: string, updatedData: { name?: string; description?: string; maxPeople?: number }) {
    const user = await this.auth.currentUser;
    if (!user) throw new Error("Bạn chưa đăng nhập!");

    return this.firestore.collection('loaiPhong').doc(loaiPhongId).update(updatedData);
  }

  async deleteLoaiPhong(loaiPhongId: string) {
    const user = await this.auth.currentUser;
    if (!user) throw new Error("Bạn chưa đăng nhập!");

    return this.firestore.collection('loaiPhong').doc(loaiPhongId).delete();
  }

  getNameTypeRoom(roomTypeId: string): Observable<string> {
    return this.firestore.collection('loaiPhong').doc(roomTypeId).valueChanges().pipe(
      switchMap((loaiPhong: any) => {
        if (loaiPhong && loaiPhong.name) {
          return of(loaiPhong.name);
        }
        return of('Loại phòng không xác định');
      })
    );
  }
}