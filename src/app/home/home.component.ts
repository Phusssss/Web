import { Component, OnInit } from '@angular/core';
import { Product, ProductService } from '../services/product.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  products: Product[] = [];
  newProduct: Product = {
    name: '',
    category: '',
    price: 0,
    imageUrl: '',
    description: ''
  };
  successMessage: string | null = null; // Add success message
  errorMessage: string | null = null; // Add error message

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe(products => {
      this.products = products;
    });
  }

  onAddProduct(): void {
    if (this.newProduct.name && this.newProduct.category && this.newProduct.price && this.newProduct.imageUrl && this.newProduct.description) {
      this.productService.addProduct(this.newProduct).then(() => {
        this.successMessage = 'Product added successfully!';
        this.errorMessage = null;
        this.newProduct = { name: '', category: '', price: 0, imageUrl: '', description: '' }; // Reset form
        this.loadProducts(); // Reload products to reflect changes
        setTimeout(() => this.successMessage = null, 3000); // Clear message after 3 seconds
      }).catch(error => {
        this.errorMessage = 'Failed to add product: ' + error.message;
        this.successMessage = null;
        console.error('Failed to add product:', error);
      });
    } else {
      this.errorMessage = 'Please fill in all fields.';
      this.successMessage = null;
    }
  }

  addToCart(product: Product): void {
    console.log('Added to cart:', product);
  }
}