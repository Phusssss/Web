import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Message {
  id: string;
  senderUid: string;
  receiverUid: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(private firestore: AngularFirestore) {}

  getChatRoomId(senderUid: string, receiverUid: string): string {
    return [senderUid, receiverUid].sort().join('_');
  }

  sendMessage(senderUid: string, receiverUid: string, message: string): Promise<any> {
    const chatRoomId = this.getChatRoomId(senderUid, receiverUid);
    const messageData: Omit<Message, 'id'> = {
      senderUid,
      receiverUid,
      message,
      timestamp: new Date(),
      isRead: false
    };
    return this.firestore
      .collection('chats')
      .doc(chatRoomId)
      .collection('messages')
      .add(messageData);
  }

  getMessages(senderUid: string, receiverUid: string): Observable<Message[]> {
    const chatRoomId = this.getChatRoomId(senderUid, receiverUid);
    return this.firestore
      .collection('chats')
      .doc(chatRoomId)
      .collection('messages', ref => ref.orderBy('timestamp', 'asc'))
      .snapshotChanges()
      .pipe(
        map(actions => actions.map(a => {
          const data = a.payload.doc.data() as any;
          const id = a.payload.doc.id;
          const timestamp = data.timestamp instanceof Object && 'toDate' in data.timestamp
            ? data.timestamp.toDate()
            : new Date(data.timestamp);
          return { id, ...data, timestamp } as Message;
        }))
      );
  }

  markMessageAsRead(chatRoomId: string, messageId: string): Promise<void> {
    return this.firestore
      .collection('chats')
      .doc(chatRoomId)
      .collection('messages')
      .doc(messageId)
      .update({ isRead: true });
  }

  getUnreadMessageCount(receiverUid: string): Observable<number> {
    return this.firestore
      .collectionGroup('messages', ref =>
        ref.where('receiverUid', '==', receiverUid).where('isRead', '==', false)
      )
      .snapshotChanges()
      .pipe(
        map(actions => actions.length)
      );
  }

  // Optional: If you need all messages for a user (not just count)
  getAllMessages(receiverUid: string): Observable<Message[]> {
    return this.firestore
      .collectionGroup('messages', ref => ref.where('receiverUid', '==', receiverUid))
      .snapshotChanges()
      .pipe(
        map(actions => actions.map(a => {
          const data = a.payload.doc.data() as any;
          const id = a.payload.doc.id;
          const timestamp = data.timestamp instanceof Object && 'toDate' in data.timestamp
            ? data.timestamp.toDate()
            : new Date(data.timestamp);
          return { id, ...data, timestamp } as Message;
        }))
      );
  }
}