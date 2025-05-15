import { Component, OnInit } from '@angular/core';
import { KhuVucService } from '../services/khuvuc.service'; // Import KhuVucService
import { Observable } from 'rxjs';

@Component({
  selector: 'app-khu-vuc',
  templateUrl: './khu-vuc.component.html',
  styleUrls: ['./khu-vuc.component.css']
})
export class KhuVucComponent implements OnInit {
  khuVucList$: Observable<any[]> = this.khuVucService.getUserKhuVuc();
  name: string = '';
  description: string = '';
  editingKhuVucId: string | null = null;

  constructor(private khuVucService: KhuVucService) {}

  ngOnInit(): void {}

  // Hàm thêm khu vực mới


  // Hàm chỉnh sửa khu vực
  async editKhuVuc() {
    if (this.editingKhuVucId && this.name && this.description) {
      try {
        await this.khuVucService.editKhuVuc(this.editingKhuVucId, {
          name: this.name,
          description: this.description,
        });
        this.resetForm();
      } catch (error) {
        console.error('Error editing KhuVuc:', error);
      }
    } else {
      alert('Vui lòng nhập đủ thông tin khu vực để chỉnh sửa!');
    }
  }

  // Hàm xóa khu vực
  async deleteKhuVuc(khuVucId: string) {
    try {
      await this.khuVucService.deleteKhuVuc(khuVucId);
    } catch (error) {
      console.error('Error deleting KhuVuc:', error);
    }
  }

  // Reset form after adding or editing
  resetForm() {
    this.name = '';
    this.description = '';
    this.editingKhuVucId = null;
  }

  // Chọn khu vực để chỉnh sửa
  selectKhuVucToEdit(khuVuc: any) {
    this.name = khuVuc.name;
    this.description = khuVuc.description;
    this.editingKhuVucId = khuVuc.id;
  }
}
