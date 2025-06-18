import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ThongBaoChungService {
  constructor(
    private firestore: AngularFirestore,
    private auth: AngularFireAuth
  ) {}

  async addThongBaoChung(title: string, content: string) {
    const user = await this.auth.currentUser;
    if (!user) throw new Error("Bạn chưa đăng nhập!");

    const thongBaoData = {
      title,
      content,
      ownerId: user.uid,
      createdAt: new Date(),
      isRead: false // Initialize as unread
    };

    return this.firestore.collection('thongBaoChung').add(thongBaoData);
  }

  getUserThongBaoChung(): Observable<any[]> {
    return this.auth.authState.pipe(
      switchMap(user => {
        if (!user) return of([]);
        return this.firestore.collection('thongBaoChung', ref => 
          ref.where('ownerId', '==', user.uid)
        ).valueChanges({ idField: 'id' }) as Observable<any[]>;
      })
    );
  }

  async markAsRead(notificationId: string): Promise<void> {
    return this.firestore.collection('thongBaoChung').doc(notificationId).update({
      isRead: true
    });
  }
}