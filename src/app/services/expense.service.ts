import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { map } from 'rxjs/operators';

export interface Expense {
  id?: string;
  name: string;
  description: string;
  amount: number;
  date: string;
  userId: string;
  updatedAt?: string; // Added optional updatedAt field
}

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService
  ) {}

  // Add a new expense
  addExpense(expense: { name: string; description: string; amount: number; date: string }): Observable<any> {
    return new Observable((observer) => {
      this.authService.getUser().subscribe(user => {
        if (user) {
          const userId = user.uid;
          const expenseRef = this.firestore.collection('expenses').doc();
          const newExpense = {
            ...expense,
            userId,
            date: expense.date || new Date().toISOString(),
            updatedAt: null // Initialize updatedAt as null
          };

          expenseRef.set(newExpense).then(() => {
            observer.next({ status: 'success', message: 'Chi tiêu đã được thêm thành công!' });
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

  // Get list of expenses for the authenticated user
  getExpenses(): Observable<Expense[]> {
    return new Observable((observer) => {
      this.authService.getUser().subscribe(user => {
        if (user) {
          const userId = user.uid;
          this.firestore.collection('expenses', ref => ref.where('userId', '==', userId))
            .snapshotChanges()
            .pipe(
              map(actions => actions.map(a => {
                const data = a.payload.doc.data() as Expense;
                const id = a.payload.doc.id;
                return { id, ...data };
              }))
            )
            .subscribe(
              (expenses) => observer.next(expenses),
              (error) => observer.error({ status: 'error', message: error.message })
            );
        } else {
          observer.error({ status: 'error', message: 'Người dùng chưa đăng nhập!' });
        }
      });
    });
  }

  // Update an existing expense
  updateExpense(id: string, expense: { name: string; description: string; amount: number; date: string }): Observable<any> {
    return new Observable((observer) => {
      this.authService.getUser().subscribe(user => {
        if (user) {
          const userId = user.uid;
          const expenseRef = this.firestore.collection('expenses').doc(id);

          expenseRef.update({
            ...expense,
            userId,
            updatedAt: new Date().toISOString() // Set updatedAt on update
          }).then(() => {
            observer.next({ status: 'success', message: 'Chi tiêu đã được cập nhật!' });
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

  // Delete an expense
  deleteExpense(id: string): Observable<any> {
    return new Observable((observer) => {
      this.authService.getUser().subscribe(user => {
        if (user) {
          const userId = user.uid;
          const expenseRef = this.firestore.collection('expenses').doc(id);

          expenseRef.delete().then(() => {
            observer.next({ status: 'success', message: 'Chi tiêu đã được xóa!' });
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