import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth
  ) {}

  // Gửi thông báo đến một user cụ thể
  async sendNotification(userId: string, message: string): Promise<void> {
    await this.firestore.collection('notifications').add({
      userId: userId,
      message: message,
      timestamp: new Date().toISOString(),
      isRead: false
    });
    // Không cần return gì cả, hàm sẽ tự trả về void
  }

  // Lấy danh sách thông báo theo userId của người dùng hiện tại
  getUserNotifications(): Observable<any[]> {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (!user) return [];
        return this.firestore
          .collection('notifications', ref =>
            ref.where('userId', '==', user.uid).orderBy('timestamp', 'desc')
          )
          .snapshotChanges()
          .pipe(
            map(actions => actions.map(a => {
              const data = a.payload.doc.data() as any;
              const id = a.payload.doc.id;
              return { id, ...data };
            }))
          );
      })
    );
  }

  // Đánh dấu thông báo là đã đọc
  async markAsRead(notificationId: string): Promise<void> {
    return this.firestore
      .collection('notifications')
      .doc(notificationId)
      .update({ isRead: true });
  }
}