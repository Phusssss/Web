// byHour.service.ts
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

interface ServiceRequest {
  bookingTime: string;
  confirmationTime: string;
  idBooking: string;
  idRoom: string;
  nameRoom: string;
  nameService: string;
  price: number;
  quantity: number;
  serviceId: string;
  status: string;
  totalAmount: number;
  userId: string;
}

interface BillByHour {
  roomId: string;
  roomName: string;
  startTime: string;
  endTime: string | null;
  totalHours: number | null;
  totalAmount: number | null;
  serviceCharges: number | null;
  finalAmount: number | null;
  status: 'Đang thuê' | 'Đã thanh toán';
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class BillByHourService {
  constructor(
    private firestore: AngularFirestore,
    private auth: AngularFireAuth
  ) {}

  async createInitialBill(roomId: string, roomName: string): Promise<string> {
    const bill: BillByHour = {
      roomId,
      roomName,
      startTime: new Date().toISOString(),
      endTime: null,
      totalHours: null,
      totalAmount: null,
      serviceCharges: null,
      finalAmount: null,
      status: 'Đang thuê',
      createdAt: new Date().toISOString()
    };
    
    const docRef = await this.firestore.collection('BillByHour').add(bill);
    return docRef.id;
  }

  // Lấy tất cả dịch vụ đã xác nhận cho một booking
  getConfirmedServices(bookingId: string): Observable<ServiceRequest[]> {
    return this.firestore
      .collection<ServiceRequest>('serviceRequests', ref => 
        ref.where('idBooking', '==', bookingId)
           .where('status', '==', 'confirmed')
      )
      .valueChanges();
  }

  // Cập nhật hóa đơn khi trả phòng, bao gồm cả phí dịch vụ
  updateBillOnCheckout(
    billId: string,
    endTime: string,
    totalHours: number,
    roomAmount: number,
    serviceCharges: number
  ): Promise<void> {
    const finalAmount = roomAmount + serviceCharges;
    
    return this.firestore.collection('BillByHour').doc(billId).update({
      endTime,
      totalHours,
      totalAmount: roomAmount,
      serviceCharges,
      finalAmount,
      status: 'Đã thanh toán'
    });
  }

  getCurrentBillByRoomId(roomId: string): Observable<(BillByHour & { id: string }) | null> {
    return this.firestore
      .collection('BillByHour', ref => 
        ref.where('roomId', '==', roomId)
           .where('status', '==', 'Đang thuê')
           .limit(1)
      )
      .snapshotChanges()
      .pipe(
        map(actions => {
          if (actions.length === 0) return null;
          const doc = actions[0];
          return {
            id: doc.payload.doc.id,
            ...(doc.payload.doc.data() as BillByHour)
          };
        })
      );
  }

  getBills(): Observable<(BillByHour & { id: string })[]> {
    return this.firestore
      .collection('BillByHour', ref => ref.orderBy('createdAt', 'desc'))
      .snapshotChanges()
      .pipe(
        map(actions =>
          actions.map(a => ({
            id: a.payload.doc.id,
            ...(a.payload.doc.data() as BillByHour)
          }))
        )
      );
  }
}
