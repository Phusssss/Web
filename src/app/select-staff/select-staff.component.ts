import { Component, OnInit } from '@angular/core';
import { StaffService } from '../services/staff.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationPopupComponent } from '../notification-popup/notification-popup.component';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { PinModalComponent } from '../pin-modal/pin-modal.component';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-select-staff',
  templateUrl: './select-staff.component.html',
  styleUrls: ['./select-staff.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('listAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class SelectStaffComponent implements OnInit {
  staffList: any[] = [];
  currentUserUid: string = '';
  selectedStaff: any = null;
  pinInput: string = '';
  loading: boolean = true;
  error: string = '';

  constructor(
    private staffService: StaffService,
    private modalService: NgbModal,
    private afAuth: AngularFireAuth,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.currentUserUid = user.uid;
        this.loadStaffList();
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  loadStaffList() {
    this.loading = true;
    this.error = '';
    
    this.staffService.getStaffByParent(this.currentUserUid).subscribe(
      data => {
        this.staffList = data;
        this.loading = false;
      },
      error => {
        console.error('Error loading staff list:', error);
        this.error = 'Không thể tải danh sách nhân viên. Vui lòng thử lại sau.';
        this.loading = false;
      }
    );
  }

  selectStaff(staff: any) {
    this.selectedStaff = staff;
    this.pinInput = '';
    this.openPinModal();
  }

  openPinModal() {
    const modalRef = this.modalService.open(PinModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'pin-modal'
    });
    
    modalRef.componentInstance.staff = this.selectedStaff;
    
    modalRef.result.then((pin: string) => {
      this.verifyPin(pin);
    }, () => {
      this.selectedStaff = null;
    });
  }

  verifyPin(pin: string) {
    if (this.selectedStaff && pin === this.selectedStaff.pin) {
      // Store the selected staff data in localStorage
      localStorage.setItem('selectedStaff', JSON.stringify(this.selectedStaff));
      // Store the staff UID separately in localStorage
      localStorage.setItem('staffUid', this.selectedStaff.uid);
  
      this.showNotification('Đăng nhập nhân viên thành công!', 'success');
      setTimeout(() => {
        this.router.navigate(['/home1']).then(() => {
          window.location.reload();
        });
      }, 1500);
    } else {
      this.showNotification('Mã PIN không đúng!', 'error');
    }
  }

  private showNotification(message: string, type: 'success' | 'error') {
    const modalRef = this.modalService.open(NotificationPopupComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'notification-modal'
    });
    
    modalRef.componentInstance.message = message;
    modalRef.componentInstance.type = type;
  }

  refreshList() {
    this.loadStaffList();
  }

  // Helper method to get a random icon for each staff
  getStaffIcon(staff: any): string {
    // You can later implement logic to assign different icons based on staff roles or other properties
    return 'fas fa-user-circle';
  }
}