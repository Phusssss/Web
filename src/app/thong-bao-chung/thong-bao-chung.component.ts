import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ThongBaoChungService } from '../services/thongbao.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-thong-bao-chung',
  templateUrl: './thong-bao-chung.component.html',
  styleUrls: ['./thong-bao-chung.component.css']
})
export class ThongBaoChungComponent implements OnInit {
  thongBaoForm: FormGroup;
  isSubmitting = false;
  thongBaoList$: Observable<any[]> | undefined;

  constructor(
    private fb: FormBuilder,
    private thongBaoService: ThongBaoChungService
  ) {
    this.thongBaoForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      content: ['', [Validators.required, Validators.maxLength(1000)]]
    });
  }

  ngOnInit(): void {
    this.thongBaoList$ = this.thongBaoService.getUserThongBaoChung();
  }

  async onSubmit() {
    if (this.thongBaoForm.invalid) {
      this.thongBaoForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    try {
      await this.thongBaoService.addThongBaoChung(
        this.thongBaoForm.value.title,
        this.thongBaoForm.value.content
      );
      alert('Thêm thông báo thành công!');
      this.thongBaoForm.reset();
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
    } finally {
      this.isSubmitting = false;
    }
  }
}