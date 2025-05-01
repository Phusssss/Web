import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private afAuth: AngularFireAuth, private router: Router) {}

  // Đăng ký tài khoản mới
  register(email: string, password: string) {
    return this.afAuth.createUserWithEmailAndPassword(email, password);
  }

  // Đăng nhập với email & password
  login(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  // Đăng xuất
  logout() {
    return this.afAuth.signOut().then(() => {
      this.router.navigate(['/login']); // Chuyển hướng về trang login sau khi đăng xuất
    });
  }

  // Kiểm tra người dùng đã đăng nhập chưa
  getUser() {
    return this.afAuth.authState;
  }
}
