import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-notification-popup',
  templateUrl: './notification-popup.component.html',
  styleUrls: ['./notification-popup.component.css']
})
export class NotificationPopupComponent {
  @Input() message: string = '';  // Thông điệp hiển thị
  @Input() type: 'success' | 'error' | 'confirm' = 'success';  // Loại thông báo

  constructor(public activeModal: NgbActiveModal) {}

  confirm() {
    this.activeModal.close('confirm'); // Trả về 'confirm' khi nhấn Xác nhận
  }

  dismiss() {
    this.activeModal.dismiss('cancel'); // Trả về 'cancel' khi nhấn Hủy hoặc Đóng
  }
}