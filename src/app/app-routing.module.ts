import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { RegisterComponent } from './components/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { RoomComponent } from './room/room.component';
import { LoaiPhongComponent } from './loai-phong/loai-phong.component';
import { CustomerComponent } from './customer/customer.component';
import { RoomSearchComponent } from './room-search/room-search.component';
import { BookingListComponent } from './booking-list/booking-list.component';
import { DichVuComponent } from './dich-vu/dich-vu.component';
import { HomeComponent } from './home/home.component';
import { PlaceServiceRequestComponent } from './place-service-request/place-service-request.component';
import { ServiceRequestComponent } from './service-request/service-request.component';
import { InvoiceComponent } from './invoice/invoice.component';
import { KhuVucComponent } from './khu-vuc/khu-vuc.component';
import { Home1Component } from './honme1/honme1.component';
import { ThangThaiPhongComponent } from './thang-thai-phong/thang-thai-phong.component';
import { AuthGuard } from './auth.guard';
import { QRManagerComponent } from './qrmanager/qrmanager.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { StaffComponent } from './staff/staff.component';
import { SelectStaffComponent } from './select-staff/select-staff.component';
import { SetAccountComponent } from './set-account/set-account.component';
import { ChatComponent } from './chat/chat.component';
import { ExpenseManagementComponent } from './expense-management/expense-management.component';
import { FundStatisticsComponent } from './fund-statistics/fund-statistics.component';
import { GoodsReceiptComponent } from './goods-receipt/goods-receipt.component';
import { GoodsIssueComponent } from './goods-issue/goods-issue.component';
import { ChangePasswordComponent } from './change-password/change-password.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'set-account', component: SetAccountComponent },
      { path: 'loaiphong', component: LoaiPhongComponent },
      { path: 'khachhang', component: CustomerComponent },
      { path: 'booking', component: RoomSearchComponent },
      { path: 'bookinglist', component: BookingListComponent },
      { path: 'staff', component: StaffComponent },
      { path: 'staff', component: StaffComponent },
      { path: 'select-staff', component: SelectStaffComponent },
      { path: 'dichvu', component: DichVuComponent },
      { path: 'home', component: HomeComponent },
      { path: 'servicerequest', component: PlaceServiceRequestComponent },
      { path: 'servicerequests', component: ServiceRequestComponent },
      { path: 'invoice', component: InvoiceComponent },
      { path: 'khuvuc', component: KhuVucComponent },
      { path: 'home1', component: Home1Component },
      { path: 'trangthai', component: ThangThaiPhongComponent },
      { path: 'rooms', component: RoomComponent },
      { path: 'qrmanager', component: QRManagerComponent },
      { path: 'notifications', component: NotificationsComponent },
      { path: '', redirectTo: 'home1', pathMatch: 'full' } ,// Trang mặc định khi đăng nhập
      { path: 'chat', component: ChatComponent }, // Add chat route with recipientId param
      { path: 'expense-management', component: ExpenseManagementComponent }, 
      { path: 'fund-statistics', component: FundStatisticsComponent },
      { path: 'goods-receipt', component: GoodsReceiptComponent },
            { path: 'change-password', component: ChangePasswordComponent },

  { path: 'goods-issue', component: GoodsIssueComponent },
    ]
  },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}