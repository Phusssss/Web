import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { switchMap, map } from 'rxjs/operators'; // Add switchMap and map here
import { from } from 'rxjs'; // Import 'from' for converting promises to observables
import * as QRCode from 'qrcode'; // Import qrcode package

export interface ServiceRequest {
  idBooking: string;
  idRoom: string;
  status: string;
  serviceId: string;
  nameService: string;  // Add this field for the service name
  nameRoom: string;     // Add this field for the room name
  price: number;
  quantity: number;
  totalAmount: number;
  bookingTime: string;
}

interface BookingData {
  totalAmount: number;
}

@Injectable({
  providedIn: 'root'
})
export class DichVuService {
  constructor(private firestore: AngularFirestore, private authService: AuthService) {}

  // Thêm dịch vụ mới
  addDichVu(dichVu: { name: string; description: string; price: number }): Observable<any> {
    return new Observable((observer) => {
      this.authService.getUser().subscribe(user => {
        if (user) {
          const userId = user.uid;  // Lấy ID người dùng từ Firebase Auth
          const dichVuRef = this.firestore.collection('dichvu').doc();  // Tạo ID ngẫu nhiên cho dịch vụ
          const newDichVu = {
            ...dichVu,
            userId  // Lưu ID người dùng vào dịch vụ
          };

          dichVuRef.set(newDichVu).then(() => {
            observer.next({ status: 'success', message: 'Dịch vụ đã được thêm thành công!' });
            observer.complete();
          }).catch((error) => {
            observer.error({ status: 'error', message: error.message });
          });
        } else {
          observer.error({ status: 'error', message: 'Người dùng chưa đăng nhập!' });
        }
      });
    });
  }

  // Lấy danh sách các dịch vụ của người dùng
  getDichVus(): Observable<any[]> {
    return new Observable((observer) => {
      this.authService.getUser().subscribe(user => {
        if (user) {
          const userId = user.uid;
          this.firestore.collection('dichvu', ref => ref.where('userId', '==', userId))
            .snapshotChanges()
            .subscribe(data => {
              observer.next(data);
            }, error => {
              observer.error({ status: 'error', message: error.message });
            });
        } else {
          observer.error({ status: 'error', message: 'Người dùng chưa đăng nhập!' });
        }
      });
    });
  }
// Add the confirmServiceRequest method to the DichVuService class

// Confirm service request
confirmServiceRequest(id: string): Observable<any> {
  return new Observable((observer) => {
    this.authService.getUser().subscribe(user => {
      if (user) {
        const userId = user.uid;
        const serviceRequestRef = this.firestore.collection('serviceRequests').doc(id);

        // Update the service request to reflect confirmation status
        serviceRequestRef.update({
          status: 'confirmed',  // Mark the request as confirmed
          confirmationTime: new Date().toISOString()  // Save the time of confirmation
        }).then(() => {
          observer.next({ status: 'success', message: 'Đơn dịch vụ đã được xác nhận!' });
          observer.complete();
        }).catch((error) => {
          observer.error({ status: 'error', message: error.message });
        });
      } else {
        observer.error({ status: 'error', message: 'Người dùng chưa đăng nhập!' });
      }
    });
  });
}

  // Sửa thông tin dịch vụ
  updateDichVu(id: string, dichVu: { name: string; description: string; price: number }): Observable<any> {
    return new Observable((observer) => {
      this.authService.getUser().subscribe(user => {
        if (user) {
          const userId = user.uid;
          const dichVuRef = this.firestore.collection('dichvu').doc(id);
          
          dichVuRef.update({
            ...dichVu,
            userId  // Kiểm tra và lưu ID người dùng vào bản cập nhật
          }).then(() => {
            observer.next({ status: 'success', message: 'Dịch vụ đã được cập nhật!' });
            observer.complete();
          }).catch((error) => {
            observer.error({ status: 'error', message: error.message });
          });
        } else {
          observer.error({ status: 'error', message: 'Người dùng chưa đăng nhập!' });
        }
      });
    });
  }
// Lấy danh sách yêu cầu dịch vụ theo idBooking
getServiceRequestsByBooking(idBooking: string): Observable<ServiceRequest[]> {
  return new Observable((observer) => {
    this.authService.getUser().subscribe(user => {
      if (user) {
        const userId = user.uid;
        this.firestore.collection('serviceRequests', ref => ref.where('userId', '==', userId).where('idBooking', '==', idBooking))
          .snapshotChanges()
          .pipe(
            map(actions => actions.map(a => {
              const data = a.payload.doc.data() as ServiceRequest;
              const id = a.payload.doc.id;
              return { id, ...data };
            }))
          )
          .subscribe(
            (requests) => observer.next(requests),
            (error) => observer.error({ status: 'error', message: error.message })
          );
      } else {
        observer.error({ status: 'error', message: 'Người dùng chưa đăng nhập!' });
      }
    });
  });
}

  // Xóa dịch vụ
  deleteDichVu(id: string): Observable<any> {
    return new Observable((observer) => {
      this.authService.getUser().subscribe(user => {
        if (user) {
          const userId = user.uid;
          const dichVuRef = this.firestore.collection('dichvu').doc(id);

          dichVuRef.delete().then(() => {
            observer.next({ status: 'success', message: 'Dịch vụ đã được xóa!' });
            observer.complete();
          }).catch((error) => {
            observer.error({ status: 'error', message: error.message });
          });
        } else {
          observer.error({ status: 'error', message: 'Người dùng chưa đăng nhập!' });
        }
      });
    });
  }
  
  getServiceRequests(): Observable<ServiceRequest[]> {
    return new Observable((observer) => {
      this.authService.getUser().subscribe(user => {
        if (user) {
          const userId = user.uid;
          this.firestore.collection('serviceRequests', ref => ref.where('userId', '==', userId))
            .snapshotChanges()
            .pipe(
              map(actions => actions.map(a => {
                const data = a.payload.doc.data() as ServiceRequest;
                const id = a.payload.doc.id;
                return { id, ...data };
              }))
            )
            .subscribe(
              (requests) => observer.next(requests),
              (error) => observer.error({ status: 'error', message: error.message })
            );
        } else {
          observer.error({ status: 'error', message: 'Người dùng chưa đăng nhập!' });
        }
      });
    });
  }

  // Đặt yêu cầu dịch vụ
  placeServiceRequest(serviceRequest: ServiceRequest): Observable<any> {
    return new Observable((observer) => {
      this.authService.getUser().subscribe(user => {
        if (user) {
          const userId = user.uid;  // Get the user ID
          const serviceRequestRef = this.firestore.collection('serviceRequests').doc(); // Generate random ID for service request
          const totalAmount = serviceRequest.price * serviceRequest.quantity;  // Calculate total amount
          const newServiceRequest = {
            ...serviceRequest,
            totalAmount,  // Save total amount
            bookingTime: new Date().toISOString(),  // Save booking time
            userId,        // Save user ID
            nameService: serviceRequest.nameService, // Save service name
            nameRoom: serviceRequest.nameRoom        // Save room name
          };

          serviceRequestRef.set(newServiceRequest).then(() => {
            observer.next({ status: 'success', message: 'Yêu cầu dịch vụ đã được đặt!' });
            observer.complete();
          }).catch((error) => {
            observer.error({ status: 'error', message: error.message });
          });
        } else {
          observer.error({ status: 'error', message: 'Người dùng chưa đăng nhập!' });
        }
      });
    });
  }

  // Tạo mã QR cho yêu cầu dịch vụ
  generateQRCode(data: string) {
    return new Observable<string>((observer) => {
      QRCode.toDataURL(data, (err, url) => {
        if (err) {
          observer.error(err);
        } else {
          observer.next(url);
          observer.complete();
        }
      });
    });
  }
}
