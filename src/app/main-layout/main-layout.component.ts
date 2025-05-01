// main-layout.component.ts
import { Component, OnInit, OnDestroy, HostListener, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../notification.service';
import { Subscription } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TemplateRef } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('notificationModal') notificationModal!: TemplateRef<any>;
  @ViewChild('notificationSound') notificationSound!: any;

  isSidebarCollapsed = false;
  isMobileMenuOpen = false;
  isMobileView = window.innerWidth <= 768;
  userEmail: string | null = null;
  selectedStaffName: string | null = null;
  selectedStaffUid: string | null = null;
  notifications: any[] = [];
  showNotifications = false;
  subscription: Subscription | undefined;
  latestNotification: any;
  private previousNotifications: any[] = [];
  activeGroup: string | null = null;
  userId: string | null = null;
  hasPin: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService,
    private modalService: NgbModal,
    private firestore: AngularFirestore
  ) {}

  ngOnInit() {
    this.authService.getUser().subscribe(user => {
      this.userEmail = user ? user.email : null;
      this.userId = user ? user.uid : null;
      const selectedStaff = JSON.parse(localStorage.getItem('selectedStaff') || '{}');
      this.selectedStaffName = selectedStaff?.name || null;
      this.selectedStaffUid = localStorage.getItem('staffUid') || selectedStaff?.uid || null;
      this.checkPinStatus();
    });
    this.updateSidebarState();

    this.subscription = this.notificationService.getUserNotifications()
      .subscribe(notifications => {
        this.notifications = notifications.slice(0, 5);
        const unreadNotifications = notifications.filter(n => !n.isRead);
        if (unreadNotifications.length > 0) {
          const newNotification = unreadNotifications[0];
          if (!this.previousNotifications.some(n => n.id === newNotification.id)) {
            this.latestNotification = newNotification;
            this.playNotificationSound();
            this.openNotificationModal(newNotification, this.notificationModal);
          }
        }
        this.previousNotifications = [...notifications];
      });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
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

  private updateSidebarState() {
    if (this.isMobileView) {
      this.isSidebarCollapsed = false; // No collapse on mobile
      this.isMobileMenuOpen = false; // Ensure menu is closed initially
    } else {
      // Allow sidebar to be collapsed or open on desktop
    }
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  markAsRead(notificationId: string) {
    this.notificationService.markAsRead(notificationId);
    this.showNotifications = false;
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
      this.promptForPin(group);
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

  private async promptForPin(group: string) {
    if (!this.userId) return;

    const pinDoc = await this.firestore.collection('pins').doc(this.userId).get().toPromise();
    if (pinDoc && pinDoc.exists) {
      const pinData = pinDoc.data() as { pin: string };
      const userPin = pinData.pin;
      const inputPin = prompt('Vui lòng nhập mã PIN để truy cập chức năng Quản lý:');
      if (inputPin === userPin) {
        this.setActiveGroup(group);
      } else {
        alert('Mã PIN không đúng!');
      }
    } else {
      alert('Bạn chưa đặt mã PIN!');
    }
  }
}