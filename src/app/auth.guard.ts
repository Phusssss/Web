import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    // Kiểm tra xem người dùng đã đăng nhập chưa (dựa trên localStorage hoặc logic của bạn)
    const isLoggedIn = !!localStorage.getItem('email');

    if (isLoggedIn) {
      return true; // Cho phép truy cập nếu đã đăng nhập
    } else {
      // Chuyển hướng về trang đăng nhập nếu chưa đăng nhập
      this.router.navigate(['/login']);
      return false;
    }
  }
}