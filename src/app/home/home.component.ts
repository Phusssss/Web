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
  successMessage: string | null = null;
  errorMessage: string | null = null;

  // Define categories and their images to match StyleHub
  categories: string[] = ['Women', 'Men', 'Accessories', 'Shoes'];
  categoryImages: { [key: string]: string } = {
    Women: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCVXrWdF6ZewrfjPu7rFpDMf9agt8b8qOprNLEypQDk5D2p6bCib8_n646NjyX0NRUgH26fTaDjC0F65KOCvopVDFuVBpfJk212qIEVUEXCGmcc1sPIy0BVVMEjTAjoHAiot_5IqOyObov8lS0fRXmnD0t57q6g6BmWaPABKS3steRQUPZWCEolmXNbJc2ptg5aFGxu_Tveklmz4_Is3IwueUL3xZuGEWgFLufM2Vz0J3aQ_C4QdOvKcMCeIAVkxWAs_VgIM81M2uY")',
    Men: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuATNMb6IP-aoXAyS0c_GWmn5HyxSXmX1Erh7uCf7KTHuUk-Tnovj8MsSafn0zt81DyojdNMZ5egnpbEzFw9iB5YSXdUlDZN4-n6vIpNFxllhsUNeSsnhL9b3ejscW3YqFtDsPOg4y_KoqMTodbg6rk7p-eYCQSo1-kn7R9sokK5Dn830w62t5Xiyzv2-LDp9U_HCqo1hjK4gPtANYuOxjGuIM0twa-1IT0WJLj3SQGev6FkLQSso2JFHzPAJp2LqsyEy85NojETaKQ")',
    Accessories: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAcxvAeAQ8aQ1RVInj3H_FJfuwB9EoQpCXVygv0ZX6UjdVowA2WniZ2-h2wpMFJvp5T32M6ykbeXaeUQ-D0-sAER1EkoFj26OUiDQbmb6HXX5cQ8UVg43Y4SrrAtPpNKWlGDZzSCtjxHzhoeZwWfqk1p4sam5g4xF_8oECYmTFZKa4qKz6fMEBRJzAhf4jvr8qUjY-VSf2ftFFxN7mOp8NcLR9Du4eMko4Uv8KsoRt7NmdwuOS-bdgT9OuAEr2WlG8Ms-vqQDBrM1o")',
    Shoes: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAsD796EeKTsRbavOR8HaHN7P8rf3ngAG1x0IKGsIcFijXSFTLiOjtVZTyadkMf-7X0wdKgYIpcJQ4yONa50r9VSOD0lxhCIWwhTCeOqLKsQ_mmStiNsr5rBcaGkXZD_4enUNQVy1PdNdsTs2DFxhLsdl2BY7x5iUmBEXY_PBBv8ooUgbF2K0hIIEFTlSTg-1APPqWap6GIb4PYFAWaHHfnEd4VtbH_JjF8pllw6u2__vWOURNqCLk_wzrIW9b7WTWhoH0869E8-Sk")'
  };

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
        this.newProduct = { name: '', category: '', price: 0, imageUrl: '', description: '' };
        this.loadProducts();
        setTimeout(() => this.successMessage = null, 3000);
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
    // Assuming cartService.addToCart exists to handle cart updates
  }
}