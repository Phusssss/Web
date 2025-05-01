import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  constructor(private firestore: AngularFirestore) {}

  generateUid(): string {
    return this.firestore.createId();
  }

  addStaff(staffData: any, uid: string) {
    return this.firestore.collection('users').doc(uid).set(staffData);
  }

  getStaffByParent(parentUid: string) {
    return this.firestore.collection('users', ref => ref.where('parentUid', '==', parentUid))
      .snapshotChanges()
      .pipe(
        map(actions => actions.map(a => {
          const data = a.payload.doc.data() as any;
          const uid = a.payload.doc.id; // Get the document ID (uid)
          return { uid, ...data }; // Combine uid with the document data
        }))
      );
  }

  updateStaff(uid: string, updatedData: any) {
    return this.firestore.collection('users').doc(uid).update(updatedData);
  }

  deleteStaff(uid: string) {
    return this.firestore.collection('users').doc(uid).delete();
  }
}