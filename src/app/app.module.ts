import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AngularFireModule } from '@angular/fire/compat';
import { environment } from 'src/environments/environment';
import { RegisterComponent } from './components/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { RoomComponent } from './room/room.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoaiPhongComponent } from './loai-phong/loai-phong.component';
import { CustomerComponent } from './customer/customer.component';
import { BookingComponent } from './booking/booking.component';
import { RoomSearchComponent } from './room-search/room-search.component';
import { BookingListComponent } from './booking-list/booking-list.component';
import { DichVuComponent } from './dich-vu/dich-vu.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HomeComponent } from './home/home.component';
import { PlaceServiceRequestComponent } from './place-service-request/place-service-request.component';
import { ServiceRequestComponent } from './service-request/service-request.component';
import { CheckoutBillComponent } from './checkout-bill/checkout-bill.component';
import { InvoiceComponent } from './invoice/invoice.component';
import { KhuVucComponent } from './khu-vuc/khu-vuc.component';
import { Home1Component } from './honme1/honme1.component'; // Typo? Should it be 'home1'?
import { FullCalendarModule } from '@fullcalendar/angular';
import { DateModalComponent } from './date-modal/date-modal.component';
import { ThangThaiPhongComponent } from './thang-thai-phong/thang-thai-phong.component';
import { HttpClientModule } from '@angular/common/http'; // Required for VietQRService
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'; // Required for NgbActiveModal
// FullCalendar plugins (optional, only if you're using them elsewhere)
import DayGridPlugin from '@fullcalendar/daygrid';
import InteractionPlugin from '@fullcalendar/interaction';
import { QRManagerComponent } from './qrmanager/qrmanager.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { NotificationModalComponent } from './notification-modal/notification-modal.component';
import { TextFieldComponent } from './text-field/text-field.component';
import { ButtonComponent } from './button/button.component';
import { TableComponent } from './table/table.component';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { NotificationPopupComponent } from './notification-popup/notification-popup.component';
import { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';
import { StaffComponent } from './staff/staff.component';
import { SelectStaffComponent } from './select-staff/select-staff.component';
import { PinModalComponent } from './pin-modal/pin-modal.component';
import { SetAccountComponent } from './set-account/set-account.component';
import { ChatComponent } from './chat/chat.component';
import { ExpenseManagementComponent } from './expense-management/expense-management.component';
import { FundStatisticsComponent } from './fund-statistics/fund-statistics.component';
import { GoodsReceiptComponent } from './goods-receipt/goods-receipt.component';
import { GoodsIssueComponent } from './goods-issue/goods-issue.component';

@NgModule({
  declarations: [
    AppComponent,
    RegisterComponent,
    LoginComponent,
    RoomComponent,
    LoaiPhongComponent,
    CustomerComponent,
    BookingComponent,
    RoomSearchComponent,
    BookingListComponent,
    DichVuComponent,
    HomeComponent,
    PlaceServiceRequestComponent,
    ServiceRequestComponent,
    CheckoutBillComponent, // Already correctly declared
    InvoiceComponent,
    KhuVucComponent,
    Home1Component,
    DateModalComponent,
    ThangThaiPhongComponent,
    QRManagerComponent,
    NotificationsComponent,
    NotificationModalComponent,
    TextFieldComponent,
    ButtonComponent,
    TableComponent,
    MainLayoutComponent,
    NotificationPopupComponent,
    LoadingSpinnerComponent,
    StaffComponent,
    SelectStaffComponent,
    PinModalComponent,
    SetAccountComponent,
    ChatComponent,
    ExpenseManagementComponent,
    FundStatisticsComponent,
    GoodsReceiptComponent,
    GoodsIssueComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    AngularFireModule.initializeApp(environment.firebase),
    BrowserAnimationsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    FullCalendarModule,
    HttpClientModule, // Already included, necessary for VietQRService
    NgbModule // Already included, necessary for CheckoutBillComponent
  ],
  providers: [], // VietQRService uses providedIn: 'root', so no need to list here
  bootstrap: [AppComponent]
})
export class AppModule { }