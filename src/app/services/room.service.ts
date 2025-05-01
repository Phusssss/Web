import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  constructor(
    private firestore: AngularFirestore,
    private auth: AngularFireAuth
  ) {}

  // Thêm phương thức getRoom để lấy thông tin phòng
  getRoom(roomId: string): Observable<any> {
    return this.firestore.collection('rooms').doc(roomId).valueChanges().pipe(
      map((room: any) => room || {})
    );
  }

  updateRoomStatus(roomId: string, data: any) {
    return this.firestore.collection('rooms').doc(roomId).update(data);
  }

  updateRoomStatusAndBooking(roomId: string, data: {
    status: string;
    startTime: string | null;
    currentBookingId?: string | null;
  }): Promise<void> {
    return this.firestore.collection('rooms').doc(roomId).update(data);
  }

  async addRoom(
    name: string,
    description: string,
    roomPriceByDay: number,
    roomPriceByHour: number,
    roomTypeId: string,
    roomtypename: string,
    khuVucId: string,
    khuVucName: string
  ) {
    const user = await this.auth.currentUser;
    if (!user) throw new Error("Bạn chưa đăng nhập!");
    
    const roomData = {
      name,
      description,
      ownerId: user.uid,
      createdAt: new Date(),
      roomPriceByDay,
      roomPriceByHour,
      roomTypeId,
      roomtypename,
      khuVucId,
      khuVucName,
      status: "Trống"
    };
  
    return this.firestore.collection('rooms').add(roomData);
  }

  getUserRooms(): Observable<any[]> {
    return this.auth.authState.pipe(
      switchMap(user => {
        if (!user) return [];
        return this.firestore.collection('rooms', ref => ref.where('ownerId', '==', user.uid))
          .valueChanges({ idField: 'id' }) as Observable<any[]>;
      })
    );
  }

  getRoomName(roomId: string): Observable<string> {
    return this.firestore.collection('rooms').doc(roomId).valueChanges().pipe(
      switchMap((room: any) => {
        if (room && room.name) {
          return of(room.name);
        }
        return of('Phòng không xác định');
      })
    );
  }

  async editRoom(
    roomId: string,
    updatedData: {
      name?: string;
      description?: string;
      roomPriceByDay?: number;
      roomPriceByHour?: number;
      roomTypeId?: string;
      bookingId?: string | null;
      khuVucName?: string;
    }
  ) {
    const user = await this.auth.currentUser;
    if (!user) throw new Error("Bạn chưa đăng nhập!");
  
    return this.firestore.collection("rooms").doc(roomId).update(updatedData);
  }

  async cleanRoom(roomId: string): Promise<void> {
    return this.firestore.collection('rooms').doc(roomId).update({
      status: 'Trống',
      startTime: null,
      currentBookingId: null
    });
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

  async checkoutRoom(bookingId: string) {
    const user = await this.auth.currentUser;
    if (!user) throw new Error("Bạn chưa đăng nhập!");
  
    const roomsSnapshot = await this.firestore.collection('rooms', ref => ref.where('currentBookingId', '==', bookingId)).get().toPromise();
  
    if (!roomsSnapshot || roomsSnapshot.empty) {
      throw new Error("Không tìm thấy phòng nào với bookingId này!");
    }
  
    const batch = this.firestore.firestore.batch();
  
    roomsSnapshot.forEach(doc => {
      const roomRef = this.firestore.collection('rooms').doc(doc.id).ref;
      batch.update(roomRef, { status: 'Dơ', currentBookingId: null });
    });
  
    await batch.commit();
  }

  async deleteRoom(roomId: string) {
    const user = await this.auth.currentUser;
    if (!user) throw new Error("Bạn chưa đăng nhập!");

    return this.firestore.collection('rooms').doc(roomId).delete();
  }
}