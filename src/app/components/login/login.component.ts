import { Component, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationPopupComponent } from 'src/app/notification-popup/notification-popup.component';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements AfterViewInit {
  email: string = '';
  password: string = '';
  isFormFilled: boolean = false;
  isFormIncomplete: boolean = false;
  isLoading: boolean = false; // Biến để kiểm soát trạng thái loading

  constructor(
    private authService: AuthService,
    private router: Router,
    private modalService: NgbModal
  ) {}

  ngAfterViewInit() {
    this.onInputChange();
  }

  login() {
    this.isLoading = true;
    this.authService.login(this.email, this.password)
      .then(() => {
        localStorage.setItem('email', this.email);
        this.isLoading = false;
        this.showNotification('Đăng nhập thành công!', 'success');
        setTimeout(() => {
          this.router.navigate(['/home1']).then(() => {
            window.location.reload();
          });
        }, 1500);
      })
      .catch(error => {
        this.isLoading = false;
        this.showNotification('Lỗi: ' + error.message, 'error');
      });
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  onInputChange() {
    this.isFormFilled = this.email.length > 0 && this.password.length > 0;
    this.isFormIncomplete = !this.isFormFilled;
  }

  private showNotification(message: string, type: 'success' | 'error') {
    const modalRef = this.modalService.open(NotificationPopupComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.message = message;
    modalRef.componentInstance.type = type;
  }
}