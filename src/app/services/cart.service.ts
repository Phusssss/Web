import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartCountSubject = new BehaviorSubject<number>(0);
  
  getCartCount() {
    return this.cartCountSubject.asObservable();
  }

  updateCartCount(count: number) {
    this.cartCountSubject.next(count);
  }
}