import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { map } from 'rxjs/operators';

export interface InventoryRecord {
  id?: string;
  description: string;
  quantity: number;
  date: string;
  userId: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService
  ) {}

  // Add a new record (receipt or issue)
  addRecord(collection: 'goodsReceipts' | 'goodsIssues', record: { description: string; quantity: number; date: string }): Observable<any> {
    return new Observable((observer) => {
      this.authService.getUser().subscribe(user => {
        if (user) {
          const userId = user.uid;
          const recordRef = this.firestore.collection(collection).doc();
          const newRecord = {
            ...record,
            userId,
            date: record.date || new Date().toISOString(),
            updatedAt: null
          };

          recordRef.set(newRecord).then(() => {
            observer.next({ status: 'success', message: 'Đã thêm thành công!' });
            observer.complete();
          }).catch((error) => {
            observer.error({ status: 'error', message: error.message });
          });
        } else {
          observer.error({ status: 'error', message: 'Người dùng chưa đăng nhập!' });
        }
      });
    });
  }

  // Get list of records for the authenticated user
  getRecords(collection: 'goodsReceipts' | 'goodsIssues'): Observable<InventoryRecord[]> {
    return new Observable((observer) => {
      this.authService.getUser().subscribe(user => {
        if (user) {
          const userId = user.uid;
          this.firestore.collection(collection, ref => ref.where('userId', '==', userId))
            .snapshotChanges()
            .pipe(
              map(actions => actions.map(a => {
                const data = a.payload.doc.data() as InventoryRecord;
                const id = a.payload.doc.id;
                return { id, ...data };
              }))
            )
            .subscribe(
              (records) => observer.next(records),
              (error) => observer.error({ status: 'error', message: error.message })
            );
        } else {
          observer.error({ status: 'error', message: 'Người dùng chưa đăng nhập!' });
        }
      });
    });
  }

  // Update an existing record
  updateRecord(collection: 'goodsReceipts' | 'goodsIssues', id: string, record: { description: string; quantity: number; date: string }): Observable<any> {
    return new Observable((observer) => {
      this.authService.getUser().subscribe(user => {
        if (user) {
          const userId = user.uid;
          const recordRef = this.firestore.collection(collection).doc(id);

          recordRef.update({
            ...record,
            userId,
            updatedAt: new Date().toISOString()
          }).then(() => {
            observer.next({ status: 'success', message: 'Đã cập nhật thành công!' });
            observer.complete();
          }).catch((error) => {
            observer.error({ status: 'error', message: error.message });
          });
        } else {
          observer.error({ status: 'error', message: 'Người dùng chưa đăng nhập!' });
        }
      });
    });
  }

  // Delete a record
  deleteRecord(collection: 'goodsReceipts' | 'goodsIssues', id: string): Observable<any> {
    return new Observable((observer) => {
      this.authService.getUser().subscribe(user => {
        if (user) {
          const recordRef = this.firestore.collection(collection).doc(id);

          recordRef.delete().then(() => {
            observer.next({ status: 'success', message: 'Đã xóa thành công!' });
            observer.complete();
          }).catch((error) => {
            observer.error({ status: 'error', message: error.message });
          });
        } else {
          observer.error({ status: 'error', message: 'Người dùng chưa đăng nhập!' });
        }
      });
    });
  }
}