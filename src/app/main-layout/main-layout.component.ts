import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-main-panel',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit {
  userEmail: string | null = null;
  currentTheme: 'light' | 'dark' = 'light';
  searchKeyword = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    this.currentTheme = savedTheme || 'light';
    document.documentElement.setAttribute('data-theme', this.currentTheme);

    this.authService.getUser().subscribe(user => {
      this.userEmail = user ? user.email : null;
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

  searchProducts() {
    if (this.searchKeyword.trim()) {
      this.router.navigate(['/products'], { queryParams: { search: this.searchKeyword } });
    }
  }
}