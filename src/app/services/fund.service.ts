import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Invoice {
  id?: string;
  totalAmount: number;
  date: string;
  userId: string;
  description: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class FundService {
  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService
  ) {}

  // Get fund statistics (balance and transactions)
  getFundStatistics(startDate?: string, endDate?: string): Observable<{ balance: number; transactions: Transaction[] }> {
    return new Observable((observer) => {
      this.authService.getUser().subscribe(user => {
        if (user) {
          const userId = user.uid;

          // Fetch invoices (income)
          let invoicesQuery = this.firestore.collection('invoices', ref => 
            ref.where('userId', '==', userId)
          );
          let expensesQuery = this.firestore.collection('expenses', ref => 
            ref.where('userId', '==', userId)
          );

          // Apply date filters if provided
          if (startDate && endDate) {
            invoicesQuery = this.firestore.collection('invoices', ref => 
              ref.where('userId', '==', userId)
                 .where('date', '>=', startDate)
                 .where('date', '<=', endDate)
            );
            expensesQuery = this.firestore.collection('expenses', ref => 
              ref.where('userId', '==', userId)
                 .where('date', '>=', startDate)
                 .where('date', '<=', endDate)
            );
          }

          // Combine invoices and expenses
          combineLatest([
            invoicesQuery.snapshotChanges().pipe(
              map(actions => actions.map(a => {
                const data = a.payload.doc.data() as Invoice;
                return {
                  id: a.payload.doc.id,
                  type: 'income' as const,
                  amount: data.totalAmount,
                  date: data.date,
                  description: data.description || 'Hóa đơn'
                };
              }))
            ),
            expensesQuery.snapshotChanges().pipe(
              map(actions => actions.map(a => {
                const data = a.payload.doc.data() as any;
                return {
                  id: a.payload.doc.id,
                  type: 'expense' as const,
                  amount: data.amount,
                  date: data.date,
                  description: data.description || 'Chi tiêu'
                };
              }))
            )
          ]).subscribe(
            ([incomes, expenses]) => {
              const transactions = [...incomes, ...expenses].sort((a, b) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
              );

              const balance = incomes.reduce((sum, t) => sum + t.amount, 0) - 
                             expenses.reduce((sum, t) => sum + t.amount, 0);

              observer.next({ balance, transactions });
              observer.complete();
            },
            (error) => observer.error({ status: 'error', message: error.message })
          );
        } else {
          observer.error({ status: 'error', message: 'Người dùng chưa đăng nhập!' });
        }
      });
    });
  }
}