// pin-modal.component.ts
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-pin-modal',
  templateUrl: './pin-modal.component.html',
  styleUrls: ['./pin-modal.component.css']
})
export class PinModalComponent {
  @Input() staff: any;
  @Input() errorMessage: string | null = null; // Thêm thuộc tính để hiển thị lỗi
  pin: string = '';

  constructor(public activeModal: NgbActiveModal) {}

  submitPin() {
    if (this.pin.length === 4) {
      this.activeModal.close(this.pin);
    }
  }
}