import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import firebase from 'firebase/compat/app';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private afAuth: AngularFireAuth, private router: Router) {}

  // Đăng ký tài khoản mới và gửi email xác nhận
  register(email: string, password: string) {
    return this.afAuth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Gửi email xác nhận
        const user = userCredential.user;
        if (user) {
          return user.sendEmailVerification()
            .then(() => {
              return { success: true, message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.' };
            })
            .catch((error) => {
              throw new Error('Lỗi khi gửi email xác nhận: ' + error.message);
            });
        } else {
          throw new Error('Không thể tạo tài khoản.');
        }
      })
      .catch((error) => {
        let errorMessage = 'Có lỗi xảy ra khi đăng ký.';
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'Email này đã được sử dụng.';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Địa chỉ email không hợp lệ.';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.';
        }
        throw new Error(errorMessage);
      });
  }

  // Đăng nhập với email & password
  login(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        if (user && !user.emailVerified) {
          throw new Error('Vui lòng xác nhận email trước khi đăng nhập.');
        }
        return userCredential;
      });
  }

  // Đăng xuất
  logout() {
    return this.afAuth.signOut().then(() => {
      this.router.navigate(['/login']);
    });
  }

  // Kiểm tra người dùng đã đăng nhập chưa
  getUser() {
    return this.afAuth.authState;
  }

  // Gửi email đặt lại mật khẩu
  sendPasswordResetEmail(email: string) {
    return this.afAuth.sendPasswordResetEmail(email)
      .then(() => {
        return { success: true, message: 'Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.' };
      })
      .catch((error) => {
        let errorMessage = 'Có lỗi xảy ra khi gửi email đặt lại mật khẩu.';
        if (error.code === 'auth/invalid-email') {
          errorMessage = 'Địa chỉ email không hợp lệ.';
        } else if (error.code === 'auth/user-not-found') {
          errorMessage = 'Không tìm thấy tài khoản với email này.';
        }
        return { success: false, message: errorMessage };
      });
  }
}