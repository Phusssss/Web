// src/app/types/booking.types.ts

import { Timestamp } from 'firebase/firestore';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  cccd: string;
  ownerId: string;
  createdAt: Timestamp;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  roomPriceByDay: number;
  roomPriceByHour: number;
  roomTypeId: string;
  ownerId: string;
  createdAt: Timestamp;
}

export interface BookingDetail {
  idRoom: string;
  price: number;
  checkin: Timestamp;
  checkout: Timestamp;
  room?: Room;
}

export interface Booking {
  id: string;
  totalCost: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'checked-in';
  date: Timestamp;
  customerId: string;
  customer?: Customer;
  details: BookingDetail[];
  ownerId: string;
}