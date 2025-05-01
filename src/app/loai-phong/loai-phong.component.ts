import { Component, OnInit } from '@angular/core';
import { LoaiPhongService } from '../services/loaiphong.service';

@Component({
  selector: 'app-loai-phong',
  templateUrl: './loai-phong.component.html',
  styleUrls: ['./loai-phong.component.css']
})
export class LoaiPhongComponent implements OnInit {
  loaiPhongName: string = '';
  description: string = '';
  maxPeople: number | null = null;  // Thêm trường maxPeople
  userLoaiPhong: any[] = [];

  // Thêm biến cho modal
  isModalOpen: boolean = false;
  editLoaiPhongName: string = '';
  editLoaiPhongDescription: string = '';
  editMaxPeople: number | null = null;  // Thêm trường maxPeople khi chỉnh sửa

  constructor(private loaiPhongService: LoaiPhongService) {}

  async addLoaiPhong() {
    if (this.maxPeople === null || this.maxPeople <= 0) {
      alert("Số người tối đa phải là một số dương.");
      return;
    }

    try {
      await this.loaiPhongService.addLoaiPhong(this.loaiPhongName, this.description, this.maxPeople);
      alert("Thêm loại phòng thành công!");
      this.loaiPhongName = '';
      this.description = '';
      this.maxPeople = null;
      this.loadLoaiPhong();
    } catch (error: any) {
      alert(error.message);
    }
  }

  loadLoaiPhong() {
    this.loaiPhongService.getUserLoaiPhong().subscribe(loaiPhong => {
      this.userLoaiPhong = loaiPhong;
    });
  }

  openEditModal(loaiPhong: any) {
    this.editLoaiPhongName = loaiPhong.name;
    this.editLoaiPhongDescription = loaiPhong.description;
    this.editMaxPeople = loaiPhong.maxPeople;  // Đặt giá trị maxPeople khi mở modal
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  async saveEdit() {
    // Kiểm tra nếu editMaxPeople là null, gán giá trị mặc định là 0
    const updatedLoaiPhong = {
      name: this.editLoaiPhongName,
      description: this.editLoaiPhongDescription,
      maxPeople: this.editMaxPeople ?? 0  // Nếu editMaxPeople là null, sẽ gán giá trị 0
    };
  
    try {
      await this.loaiPhongService.editLoaiPhong(this.editLoaiPhongName, updatedLoaiPhong);
      alert("Cập nhật loại phòng thành công!");
      this.loadLoaiPhong();
      this.closeModal();
    } catch (error: any) {
      alert(error.message);
    }
  }
  

  async deleteLoaiPhong(loaiPhongId: string) {
    try {
      await this.loaiPhongService.deleteLoaiPhong(loaiPhongId);
      alert("Xóa loại phòng thành công!");
      this.loadLoaiPhong();
    } catch (error: any) {
      alert(error.message);
    }
  }

  ngOnInit() {
    this.loadLoaiPhong();
  }
}
