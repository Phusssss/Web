import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationPopupComponent } from 'src/app/notification-popup/notification-popup.component';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  email: string = '';
  password: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private modalService: NgbModal
  ) {}

  register() {
    this.isLoading = true;
    this.authService.register(this.email, this.password)
      .then((result) => {
        this.isLoading = false;
        this.showNotification(result.message, 'success');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      })
      .catch(error => {
        this.isLoading = false;
        this.showNotification('Lỗi: ' + error.message, 'error');
      });
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
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