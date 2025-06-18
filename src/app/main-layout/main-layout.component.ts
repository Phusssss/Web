
import { Component, OnInit, OnDestroy, HostListener, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ThongBaoChungService } from '../services/thongbao.service';
import { Subscription } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TemplateRef } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MatDialog } from '@angular/material/dialog';
import { NotificationListPopupComponent } from '../notification-list-popup/notification-list-popup.component';

@Component({
  selector: 'app-main-panel',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('notificationModal') notificationModal!: TemplateRef<any>;
  @ViewChild('notificationSound') notificationSound!: any;
  isAccountDropdownOpen = false;
  isSidebarCollapsed = false;
  isMobileMenuOpen = false;
  isMobileView = window.innerWidth <= 768;
  userEmail: string | null = null;
  selectedStaffName: string | null = null;
  selectedStaffUid: string | null = null;
  notifications: any[] = [];
  subscription: Subscription | undefined;
  latestNotification: any;
  private previousNotifications: any[] = [];
  activeGroup: string | null = null;
  userId: string | null = null;
  hasPin: boolean = false;
  currentTheme: 'light' | 'dark' = 'light';
  searchKeyword = '';
  filteredMenuItems: any[] = [];
  menuItems = [
    { label: 'Trang Chủ', route: '/home1', icon: 'fas fa-home' },
    { label: 'Booking', route: '/booking', icon: 'fas fa-calendar-alt', group: 'staff' },
    { label: 'Trạng Thái Phòng', route: '/trangthai', icon: 'fas fa-bed', group: 'staff' },
    { label: 'Chat', route: '/chat', icon: 'fas fa-comment', group: 'staff' },
    { label: 'Đơn Đặt Phòng', route: '/bookinglist', icon: 'fas fa-list', group: 'staff' },
    { label: 'Đặt Dịch Vụ', route: '/servicerequest', icon: 'fas fa-concierge-bell', group: 'staff' },
    { label: 'Quản Lý Phòng', route: '/rooms', icon: 'fas fa-door-open', group: 'manager' },
    { label: 'Quản Lý Nhân Viên', route: '/staff', icon: 'fas fa-user', group: 'manager' },
    { label: 'Danh Sách Khách Hàng', route: '/khachhang', icon: 'fas fa-users', group: 'manager' },
    { label: 'Danh Sách Dịch Vụ', route: '/dichvu', icon: 'fas fa-bell', group: 'manager' },
    { label: 'Thông báo chung', route: '/thongbaochung', icon: 'fas fa-file-invoice', group: 'manager' },
    { label: 'Hóa Đơn & Doanh Thu', route: '/invoice', icon: 'fas fa-file-invoice', group: 'manager' },
    { label: 'Cài Đặt Thanh toán', route: '/qrmanager', icon: 'fas fa-qrcode', group: 'manager' },
    { label: 'Cài Đặt Mã PIN', route: '/set-account', icon: 'fas fa-key', group: 'manager' },
    { label: 'Chi tiêu', route: '/expense-management', icon: 'fas fa-wallet', group: 'expense' },
    { label: 'Thống kê tồn quỹ', route: '/fund-statistics', icon: 'fas fa-chart-line', group: 'expense' },
    { label: 'Phiếu nhập hàng', route: '/goods-receipt', icon: 'fas fa-arrow-down', group: 'inventory' },
    { label: 'Phiếu xuất hàng', route: '/goods-issue', icon: 'fas fa-arrow-up', group: 'inventory' },
    { label: 'Đăng Xuất', route: '/logout', icon: 'fas fa-sign-out-alt' },
    { label: 'Đổi Nhân Viên', route: '/select-staff', icon: 'fas fa-user' }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private thongBaoService: ThongBaoChungService,
    private modalService: NgbModal,
    private firestore: AngularFirestore,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

 ngOnInit() {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
  this.currentTheme = savedTheme || 'light';
  document.documentElement.setAttribute('data-theme', this.currentTheme);

  this.authService.getUser().subscribe(user => {
    this.userEmail = user ? user.email : null;
    this.userId = user ? user.uid : null;
    const selectedStaff = JSON.parse(localStorage.getItem('selectedStaff') || '{}');
    this.selectedStaffName = selectedStaff?.name || null;
    this.selectedStaffUid = localStorage.getItem('staffUid') || selectedStaff?.uid || null;
    this.checkPinStatus();
    this.cdr.detectChanges();
  });
  this.updateSidebarState();

  this.subscription = this.thongBaoService.getUserThongBaoChung()
    .subscribe(notifications => {
      this.notifications = notifications.slice(0, 5);
      if (notifications.length > 0) {
        // Sắp xếp theo createdAt giảm dần để lấy thông báo mới nhất
        this.latestNotification = notifications.sort((a, b) => 
          b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
        )[0];
        if (!this.previousNotifications.some(n => n.id === this.latestNotification.id)) {
          this.playNotificationSound();
        }
      } else {
        this.latestNotification = null; // Xóa marquee nếu không có thông báo
      }
      this.previousNotifications = [...notifications];
      this.cdr.detectChanges();
    });
}

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.account-dropdown')) {
      this.closeAccountDropdown();
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobileView = window.innerWidth <= 768;
    if (!this.isMobileView) {
      this.isMobileMenuOpen = false;
    }
    this.updateSidebarState();
  }

  toggleSidebar() {
    if (this.isMobileView) {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
    } else {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  logout(event: Event) {
    event.preventDefault();
    this.authService.logout().then(() => {
      localStorage.removeItem('email');
      localStorage.removeItem('selectedStaff');
      localStorage.removeItem('staffUid');
      this.userEmail = null;
      this.selectedStaffName = null;
      this.selectedStaffUid = null;
      this.userId = null;
      this.hasPin = false;
      this.router.navigate(['/login']);
      this.closeMobileMenu();
    });
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    localStorage.setItem('theme', this.currentTheme);
  }

  private updateSidebarState() {
    if (this.isMobileView) {
      this.isSidebarCollapsed = false;
      this.isMobileMenuOpen = false;
    }
  }

  toggleNotifications() {
    this.dialog.open(NotificationListPopupComponent, {
      width: '600px',
      data: { notifications: this.notifications }
    });
  }

  async markAsRead(notificationId: string) {
    try {
      await this.thongBaoService.markAsRead(notificationId);
      this.cdr.detectChanges();
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  openNotificationModal(notification: any, content: TemplateRef<any>) {
    this.latestNotification = notification;
    this.modalService.open(content, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    }).result.then(() => {}, () => {});
  }

  playNotificationSound() {
    if (this.notificationSound) {
      this.notificationSound.nativeElement.play().catch((error: any) => {
        console.log('Error playing sound:', error);
      });
    }
  }

  toggleGroup(group: string) {
    if (group === 'manager' && this.hasPin) {
      this.promptForPin(group, () => this.setActiveGroup(group));
    } else {
      this.setActiveGroup(group);
    }
  }

  private setActiveGroup(group: string) {
    if (this.activeGroup === group) {
      this.activeGroup = null;
    } else {
      this.activeGroup = group;
    }
  }

  private async checkPinStatus() {
    if (!this.userId) {
      this.hasPin = false;
      return;
    }

    const pinDoc = await this.firestore.collection('pins').doc(this.userId).get().toPromise();
    this.hasPin = pinDoc && pinDoc.exists ? true : false;
  }

  toggleAccountDropdown() {
    this.isAccountDropdownOpen = !this.isAccountDropdownOpen;
  }

  closeAccountDropdown() {
    this.isAccountDropdownOpen = false;
  }

  private async promptForPin(group: string, onSuccess: () => void) {
    if (!this.userId) return;

    const pinDoc = await this.firestore.collection('pins').doc(this.userId).get().toPromise();
    if (pinDoc && pinDoc.exists) {
      const pinData = pinDoc.data() as { pin: string };
      const userPin = pinData.pin;
      const inputPin = prompt('Vui lòng nhập mã PIN để truy cập chức năng Quản lý:');
      if (inputPin === userPin) {
        onSuccess();
      } else {
        alert('Mã PIN không đúng!');
      }
    } else {
      alert('Bạn chưa đặt mã PIN!');
    }
  }

  searchMenu() {
    const keyword = this.searchKeyword.toLowerCase().trim();
    if (keyword === '') {
      this.filteredMenuItems = [];
      return;
    }
    this.filteredMenuItems = this.menuItems.filter(item =>
      item.label.toLowerCase().includes(keyword)
    );
  }

  navigateTo(route: string) {
    const menuItem = this.menuItems.find(item => item.route === route);
    if (route === '/select-staff') {
      localStorage.removeItem('selectedStaff');
      localStorage.removeItem('staffUid');
      this.selectedStaffName = null;
      this.selectedStaffUid = null;
      this.router.navigate(['/select-staff']).then(() => {
        window.location.reload();
      });
    } else if (menuItem?.group === 'manager' && this.hasPin) {
      this.promptForPin('manager', () => {
        this.performNavigation(route);
      });
    } else {
      this.performNavigation(route);
    }
  }

  private performNavigation(route: string) {
    if (route === '/logout') {
      this.logout(new Event('click'));
    } else {
      this.router.navigate([route]);
      this.closeMobileMenu();
      this.searchKeyword = '';
      this.filteredMenuItems = [];
    }
  }
}
