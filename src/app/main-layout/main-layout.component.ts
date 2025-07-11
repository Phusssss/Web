import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-main-panel',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit {
  userEmail: string | null = null;
  currentTheme: 'light' | 'dark' = 'light';
  searchKeyword = '';
  isMobileMenuOpen = false;
  cartCount: number = 0;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cartService: CartService
  ) {}

  ngOnInit() {
    // Theme initialization
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    this.currentTheme = savedTheme || 'light';
    document.documentElement.setAttribute('data-theme', this.currentTheme);

    // User authentication
    this.authService.getUser().subscribe(user => {
      this.userEmail = user ? user.email : null;
    });

    // Cart count subscription
    this.cartService.getCartCount().subscribe(count => {
      this.cartCount = count;
    });
  }

  logout(event: Event) {
    event.preventDefault();
    this.authService.logout().then(() => {
      localStorage.removeItem('email');
      this.userEmail = null;
      this.router.navigate(['/login']);
    });
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    localStorage.setItem('theme', this.currentTheme);
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  searchProducts() {
    if (this.searchKeyword.trim()) {
      this.router.navigate(['/products'], { queryParams: { search: this.searchKeyword } });
    }
  }
}