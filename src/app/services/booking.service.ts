import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, from, of } from 'rxjs';
import { switchMap, map, take, catchError } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { Timestamp } from 'firebase/firestore';
import { AuthService } from './auth.service';
import { forkJoin } from 'rxjs';

// Define interfaces for better type safety
interface User {
  uid: string;
}
interface RevenueStats {
  total: number;
  count: number;
  details: Array<{
    id: string;
    amount: number;
    date: Date;
    roomName?: string;
  }>;
}
interface Invoice {
  id: string;
  date: Date;
  customerName: string;
  totalAmount: number;
  status: string;
  details: Array<{
    roomName: string;
    checkin: Date;
    checkout: Date;
    price: number;
  }>;
}
interface RoomDetail {
  idRoom: string;
  roomName: string;
  price: number;
  checkin: string;
  checkout: string;
}
interface DetailBooking {
  idBooking: string;
  idRoom: string;
  price: number;
  checkin: Timestamp;
  checkout: Timestamp;
  status: string;
}
interface Event {
  roomName: string;
  customerName: string;
  eventType: 'Check-in' | 'Check-out';
  time: Date;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  constructor(
    private firestore: AngularFirestore,
    private auth: AngularFireAuth,
    private authService: AuthService
  ) {}

  checkin(bookingId: string): Observable<any> {
    console.log('checkin called with bookingId:', bookingId);
    return this.firestore.collection('detailbooking', ref =>
      ref.where('idBooking', '==', bookingId)
    ).get().pipe(
      take(1),
      switchMap(snapshot => {
        const updatePromises = snapshot.docs.map(doc => {
          const detailBooking = doc.data() as DetailBooking;
          const roomId = detailBooking.idRoom;
          const roomUpdate = this.firestore.collection('rooms').doc(roomId).update({
            currentBookingId: bookingId,
            status: 'Đã nhận phòng'
          });
          const detailBookingUpdate = this.firestore.collection('detailbooking').doc(doc.id).update({
            status: 'Đã nhận phòng'
          });
          return Promise.all([roomUpdate, detailBookingUpdate]);
        });
        const bookingUpdate = this.firestore.collection('booking')
          .doc(bookingId)
          .update({ status: 'Đã nhận phòng' });
        return from(Promise.all([...updatePromises, bookingUpdate]));
      }),
      map(() => ({
        status: 'success',
        message: 'Check-in completed successfully'
      }))
    );
  }

  deleteBooking(bookingId: string): Observable<any> {
    return from(
      this.firestore
        .collection('detailbooking', ref => ref.where('idBooking', '==', bookingId))
        .get()
    ).pipe(
      switchMap(snapshot => {
        if (!snapshot || snapshot.empty) {
          return of({
            status: 'success',
            message: 'No detail bookings found, deleting main booking only'
          });
        }
        const detailDeletePromises = snapshot.docs.map(doc =>
          this.firestore.collection('detailbooking').doc(doc.id).delete()
        );
        const bookingDelete = this.firestore.collection('booking').doc(bookingId).delete();
        return from(Promise.all([...detailDeletePromises, bookingDelete])).pipe(
          map(() => ({
            status: 'success',
            message: 'Booking and all details deleted successfully'
          })),
          catchError(error => {
            console.error('Error deleting booking:', error);
            throw new Error('Failed to delete booking and details: ' + error.message);
          })
        );
      }),
      catchError(error => {
        console.error('Error querying detail bookings:', error);
        throw new Error('Failed to query detail bookings: ' + error.message);
      })
    );
  }

  getAvailableRooms(
    roomTypeId: string, 
    checkinDate: Date, 
    checkoutDate: Date
  ): Observable<any[]> {
    const roomsQuery = this.firestore.collection('rooms', ref =>
      ref.where('roomTypeId', '==', roomTypeId)
    ).snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as any;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
    const bookingsQuery = this.firestore.collection('detailbooking').snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as any;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
    return combineLatest([roomsQuery, bookingsQuery]).pipe(
      map(([rooms, bookings]) => {
        const checkinTimestamp = Timestamp.fromDate(checkinDate);
        const checkoutTimestamp = Timestamp.fromDate(checkoutDate);
        const availableRooms = rooms.filter(room => {
          const roomBookings = bookings.filter(booking => booking.idRoom === room.id);
          const hasBookingWithValidStatus = roomBookings.some(booking => 
            booking.status === 'Đã thanh toán' || booking.status === 'cancelled'
          );
          if (hasBookingWithValidStatus) {
            return true;
          }
          const hasOverlap = roomBookings.some(booking => {
            const bookingCheckin = booking.checkin.toDate();
            const bookingCheckout = booking.checkout.toDate();
            return !(checkoutDate <= bookingCheckin || checkinDate >= bookingCheckout);
          });
          return !hasOverlap;
        });
        const optimizedRooms = availableRooms.map(room => {
          const roomBookings = bookings
            .filter(booking => booking.idRoom === room.id && booking.status !== 'cancelled')
            .map(booking => ({
              checkin: booking.checkin.toDate(),
              checkout: booking.checkout.toDate()
            }))
            .sort((a, b) => a.checkin.getTime() - b.checkin.getTime());
          let totalGapDays = 0;
          let previousCheckout = new Date();
          previousCheckout.setHours(0, 0, 0, 0);
          const newBooking = { checkin: checkinDate, checkout: checkoutDate };
          const allBookings = [...roomBookings, newBooking].sort((a, b) => a.checkin.getTime() - b.checkin.getTime());
          for (let i = 0; i < allBookings.length; i++) {
            const currentBooking = allBookings[i];
            if (i === 0) {
              previousCheckout = currentBooking.checkout;
              continue;
            }
            const gapDays = Math.ceil(
              (currentBooking.checkin.getTime() - previousCheckout.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (gapDays > 0) {
              totalGapDays += gapDays;
            }
            previousCheckout = currentBooking.checkout;
          }
          return { ...room, totalGapDays };
        });
        return optimizedRooms.sort((a, b) => a.totalGapDays - b.totalGapDays);
      })
    );
  }

  getUserBookings(): Observable<any[]> {
    return this.authService.getUser().pipe(
      take(1),
      switchMap((user: User | null) => {
        if (!user) {
          throw new Error('Vui lòng đăng nhập để xem danh sách đặt phòng!');
        }
        return this.firestore.collection('booking', ref => 
          ref.where('idUser', '==', user.uid)
        ).snapshotChanges().pipe(
          switchMap((actions) => {
            const bookings = actions.map(a => {
              const data = a.payload.doc.data() as any;
              const id = a.payload.doc.id;
              return { id, ...data };
            });
            return combineLatest(
              bookings.map((booking) =>
                this.firestore.collection('detailbooking', ref =>
                  ref.where('idBooking', '==', booking.id)
                ).snapshotChanges().pipe(
                  map(actions => {
                    const details = actions.map(a => a.payload.doc.data());
                    return { ...booking, details };
                  })
                )
              )
            );
          })
        );
      })
    );
  }

  markAsPaid(bookingId: string): Promise<void> {
    return this.firestore.collection('booking').doc(bookingId).update({
      status: 'Đã thanh toán'
    });
  }

  cancelBooking(bookingId: string): Promise<void> {
    return this.firestore.collection('detailbooking', ref =>
      ref.where('idBooking', '==', bookingId)
    ).get().toPromise().then(snapshot => {
      if (!snapshot || !snapshot.docs) {
        throw new Error('Không tìm thấy thông tin chi tiết đặt phòng');
      }
      const updatePromises = snapshot.docs.map(doc => {
        return this.firestore.collection('detailbooking').doc(doc.id).update({
          status: 'cancelled'
        });
      });
      const bookingUpdate = this.firestore.collection('booking').doc(bookingId).update({
        status: 'cancelled'
      });
      return Promise.all([...updatePromises, bookingUpdate]).then(() => {
        console.log('Booking and detail bookings have been cancelled.');
      });
    }).catch(error => {
      console.error('Error cancelling booking:', error);
      throw new Error('Lỗi khi hủy đặt phòng');
    });
  }

  getDetailBookingById(bookingId: string): Observable<any[]> {
    return this.firestore.collection('detailbooking', ref =>
      ref.where('idBooking', '==', bookingId)
    ).snapshotChanges().pipe(
      switchMap(actions => {
        const detailsObservable = actions.map(a => {
          const data = a.payload.doc.data() as any;
          const id = a.payload.doc.id;
          const roomObservable = this.firestore.collection('rooms').doc(data.idRoom).get().pipe(
            map(roomDoc => {
              if (roomDoc.exists) {
                const roomData = roomDoc.data() as { name: string };
                return roomData?.name || 'Room not found';
              } else {
                return 'Room not found';
              }
            })
          );
          return roomObservable.pipe(
            map(roomName => {
              data.roomName = roomName;
              return { id, ...data };
            })
          );
        });
        return forkJoin(detailsObservable);
      })
    );
  }

  createBooking(
    roomDetails: RoomDetail[],
    totalCost: number,
    customerId: string,
    customerName: string
  ): Observable<any> {
    return this.authService.getUser().pipe(
      take(1),
      switchMap((user: User | null) => {
        if (!user) {
          throw new Error('Vui lòng đăng nhập để đặt phòng!');
        }
        const date = new Date();
        const roomDetailsWithTimestamp = roomDetails.map(roomDetail => ({
          ...roomDetail,
          checkin: Timestamp.fromDate(new Date(roomDetail.checkin)),
          checkout: Timestamp.fromDate(new Date(roomDetail.checkout)),
        }));
        const bookingRef = this.firestore.collection('booking').doc();
        const bookingData = {
          date: date,
          totalCost: totalCost,
          idUser: user.uid,
          status: 'Đang chờ xử lý',
          customerId: customerId,
          customerName: customerName
        };
        return from(bookingRef.set(bookingData)).pipe(
          switchMap(() => {
            const detailBookingsPromises = roomDetailsWithTimestamp.map((roomDetail) => {
              const detailBookingData = {
                idBooking: bookingRef.ref.id,
                idRoom: roomDetail.idRoom,
                nameRoom: roomDetail.roomName,
                price: roomDetail.price,
                checkin: roomDetail.checkin,
                checkout: roomDetail.checkout,
                status: 'Chờ xác nhận'
              };
              return this.firestore.collection('detailbooking').add(detailBookingData);
            });
            return from(Promise.all(detailBookingsPromises)).pipe(
              map(() => ({
                bookingId: bookingRef.ref.id,
                status: 'Booking created successfully'
              }))
            );
          })
        );
      })
    );
  }

  getTodayCheckInOut(): Observable<Event[]> {
    return this.authService.getUser().pipe(
      take(1),
      switchMap((user: User | null) => {
        if (!user) {
          throw new Error('Vui lòng đăng nhập để xem thông báo check-in/check-out!');
        }
        const today = new Date(); // Fixed date based on context
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        const startTimestamp = Timestamp.fromDate(startOfDay);
        const endTimestamp = Timestamp.fromDate(endOfDay);
        return this.firestore.collection('detailbooking', ref =>
          ref.where('checkin', '>=', startTimestamp)
             .where('checkin', '<=', endTimestamp)
        ).snapshotChanges().pipe(
          switchMap(checkinActions => {
            const checkinEvents = checkinActions.map(a => {
              const data = a.payload.doc.data() as any;
              return { idBooking: data.idBooking, idRoom: data.idRoom, eventType: 'Check-in' as const, time: data.checkin };
            });
            return this.firestore.collection('detailbooking', ref =>
              ref.where('checkout', '>=', startTimestamp)
                 .where('checkout', '<=', endTimestamp)
            ).snapshotChanges().pipe(
              switchMap(checkoutActions => {
                const checkoutEvents = checkoutActions.map(a => {
                  const data = a.payload.doc.data() as any;
                  return { idBooking: data.idBooking, idRoom: data.idRoom, eventType: 'Check-out' as const, time: data.checkout };
                });
                const allEvents = [...checkinEvents, ...checkoutEvents];
                if (!allEvents.length) {
                  return of([] as Event[]);
                }
                const eventObservables = allEvents.map(event =>
                  combineLatest([
                    this.firestore.collection('rooms').doc(event.idRoom).get().pipe(
                      map(roomDoc => {
                        if (roomDoc.exists) {
                          const roomData = roomDoc.data() as { name: string };
                          return roomData?.name || 'Room not found';
                        }
                        return 'Room not found';
                      })
                    ),
                    this.firestore.collection('booking').doc(event.idBooking).get().pipe(
                      map(bookingDoc => {
                        if (bookingDoc.exists) {
                          const bookingData = bookingDoc.data() as { customerName: string };
                          return bookingData?.customerName || 'Unknown Customer';
                        }
                        return 'Unknown Customer';
                      })
                    )
                  ]).pipe(
                    map(([roomName, customerName]) => ({
                      roomName,
                      customerName,
                      eventType: event.eventType,
                      time: event.time.toDate(),
                    } as Event))
                  )
                );
                return forkJoin(eventObservables);
              })
            );
          }),
          map((events: Event[]) => events.sort((a: Event, b: Event) => a.time.getTime() - b.time.getTime()))
        );
      })
    );
  }
}