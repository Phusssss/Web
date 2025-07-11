import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Product {
  id?: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(private firestore: AngularFirestore) {}

  // Get all products or filter by category
  getProducts(category?: string): Observable<Product[]> {
    return this.firestore
      .collection<Product>('products', ref => 
        category ? ref.where('category', '==', category) : ref
      )
      .snapshotChanges()
      .pipe(
        map(actions => 
          actions.map(a => {
            const data = a.payload.doc.data() as Product;
            const id = a.payload.doc.id;
            return { id, ...data };
          })
        )
      );
  }

  // Add a new product
  async addProduct(product: Product): Promise<void> {
    try {
      await this.firestore.collection('products').add(product);
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  }
}