import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service'; // Điều chỉnh đường dẫn nếu cần
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {
  resetForm: FormGroup;
  message: string = '';
  isError: boolean = false;

  constructor(private authService: AuthService, private fb: FormBuilder) {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {}

  onSubmit() {
    if (this.resetForm.valid) {
      const email = this.resetForm.get('email')?.value;
      this.authService.sendPasswordResetEmail(email).then((result) => {
        this.isError = !result.success;
        this.message = result.message;
      });
    } else {
      this.isError = true;
      this.message = 'Vui lòng nhập địa chỉ email hợp lệ.';
    }
  }
}