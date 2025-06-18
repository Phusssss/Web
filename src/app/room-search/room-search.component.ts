import { Component, OnInit, OnDestroy } from '@angular/core';
import { BookingService } from '../services/booking.service';
import { LoaiPhongService } from '../services/loaiphong.service';
import { CustomerService } from '../services/customer.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

interface BookingRequest {
  id: string;
  checkinDate: Date;
  checkoutDate: Date;
  roomTypeId: string;
  customerId: string;
}

interface Room {
  id: string;
  name: string;
  roomTypeId: string;
  roomPriceByDay: number;
  roomPriceByHour: number;
  totalGapDays: number;
}

interface Chromosome {
  assignments: { [bookingId: string]: string | null };
  fitness: number;
}

@Component({
  selector: 'app-room-search',
  templateUrl: './room-search.component.html',
  styleUrls: ['./room-search.component.css']
})
export class RoomSearchComponent implements OnInit, OnDestroy {
  customers: any[] = [];
  filteredCustomers: any[] = [];
  selectedCustomerId: string = '';
  customerSearchTerm: string = '';
  private customerSubscription?: Subscription;
  numberOfNights: number = 0;
  showAddCustomerForm: boolean = false;
  newCustomer = { name: '', email: '', phone: '', address: '', status: 'active', cccd: '' };
  roomTypes: any[] = [];
  rooms: any[] = [];
  selectedRoomTypeId: string = '';
  selectedRooms: any[] = [];
  totalCost: number = 0;
  checkinDate: string = '';
  checkoutDate: string = '';
  todayDate: string = new Date().toISOString().split('T')[0];
  isBookingInProgress: boolean = false;
  isSearching: boolean = false;
  isOptimizing: boolean = false;
  optimizationProgress: number = 0;
  recommendedRoomIds: string[] = [];
  private roomSubscription?: Subscription;

  private populationSize = 100;
  private maxGenerations = 100;
  private mutationRate = 0.1;

  constructor(
    private bookingService: BookingService,
    private loaiPhongService: LoaiPhongService,
    private authService: AuthService,
    private router: Router,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    this.authService.getUser().subscribe(user => {
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }
    });
    this.customerSubscription = this.customerService.getUserCustomers().subscribe(customers => {
      console.log('Customers loaded:', customers);
      this.customers = customers;
      this.filteredCustomers = [...customers];
    });
    this.loaiPhongService.getUserLoaiPhong().subscribe((roomTypes) => {
      console.log('Room types loaded:', roomTypes);
      this.roomTypes = roomTypes;
    });
  }

  filterCustomers(): void {
    console.log('Filtering customers with term:', this.customerSearchTerm);
    if (!this.customerSearchTerm) {
      this.filteredCustomers = [...this.customers];
    } else {
      const searchTerm = this.customerSearchTerm.toLowerCase();
      this.filteredCustomers = this.customers.filter(customer =>
        (customer.name || '').toLowerCase().includes(searchTerm) ||
        (customer.email || '').toLowerCase().includes(searchTerm)
      );
    }
  }

  onCustomerSelect(): void {
    console.log('Selected customer ID:', this.selectedCustomerId);
    this.customerSearchTerm = '';
    this.filterCustomers();
  }

  calculateNights(): void {
    console.log('Checkin:', this.checkinDate, 'Checkout:', this.checkoutDate);
    if (this.checkinDate && this.checkoutDate) {
      const checkin = new Date(this.checkinDate);
      const checkout = new Date(this.checkoutDate);
      if (checkout > checkin) {
        this.numberOfNights = Math.ceil((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        this.numberOfNights = 0;
      }
    } else {
      this.numberOfNights = 0;
    }
    this.calculateTotalCost();
  }

  findRoomsByType(): void {
    if (!this.selectedRoomTypeId || !this.checkinDate || !this.checkoutDate) {
      alert("Vui lòng chọn loại phòng và nhập ngày!");
      return;
    }

    const checkin = new Date(this.checkinDate);
    const checkout = new Date(this.checkoutDate);

    if (checkin >= checkout) {
      alert("Ngày trả phòng phải sau ngày nhận phòng!");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxBookingDays = 30;
    const daysDifference = Math.ceil((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDifference > maxBookingDays) {
      alert(`Không thể đặt phòng quá ${maxBookingDays} ngày!`);
      return;
    }

    this.isSearching = true;
    if (this.roomSubscription) {
      this.roomSubscription.unsubscribe();
    }

    this.roomSubscription = this.bookingService.getAvailableRooms(
      this.selectedRoomTypeId,
      checkin,
      checkout
    ).subscribe(
      availableRooms => {
        this.rooms = availableRooms;
        this.isSearching = false;
      
      },
      error => {
        console.error('Lỗi khi lấy danh sách phòng:', error);
        this.isSearching = false;
        alert("Đã xảy ra lỗi khi tìm phòng. Vui lòng thử lại sau!");
      }
    );
  }

  optimizeWithGA(): void {
    if (!this.rooms.length) {
      alert("Vui lòng tìm phòng trước!");
      return;
    }

    this.isOptimizing = true;
    this.optimizationProgress = 0;
    const bookingRequest: BookingRequest = {
      id: 'booking1',
      checkinDate: new Date(this.checkinDate),
      checkoutDate: new Date(this.checkoutDate),
      roomTypeId: this.selectedRoomTypeId,
      customerId: this.selectedCustomerId
    };

    const progressInterval = setInterval(() => {
      this.optimizationProgress = Math.min(this.optimizationProgress + 10, 90);
    }, 200);

    setTimeout(() => {
      const optimalAssignment = this.runGeneticAlgorithm([bookingRequest], this.rooms);
      this.selectedRooms = optimalAssignment
        .filter(assignment => assignment.roomId)
        .map(assignment => this.rooms.find(room => room.id === assignment.roomId));
      this.recommendedRoomIds = optimalAssignment
        .filter(assignment => assignment.roomId)
        .map(assignment => assignment.roomId!);
      this.calculateTotalCost();
      clearInterval(progressInterval);
      this.optimizationProgress = 100;
      setTimeout(() => {
        this.isOptimizing = false;
      }, 500);
    }, 2000);
  }

  isRecommendedRoom(room: Room): boolean {
    return this.recommendedRoomIds.includes(room.id);
  }

  private runGeneticAlgorithm(bookings: BookingRequest[], rooms: Room[]): { bookingId: string, roomId: string | null }[] {
    let population: Chromosome[] = this.initializePopulation(bookings, rooms);

    for (let generation = 0; generation < this.maxGenerations; generation++) {
      population = population.map(chromosome => ({
        assignments: chromosome.assignments,
        fitness: this.calculateFitness(chromosome, bookings, rooms)
      }));

      population.sort((a, b) => b.fitness - a.fitness);

      if (population[0].fitness >= 0) {
        break;
      }

      const newPopulation: Chromosome[] = [];
      const eliteCount = Math.floor(this.populationSize * 0.1);
      newPopulation.push(...population.slice(0, eliteCount));

      while (newPopulation.length < this.populationSize) {
        const parent1 = this.tournamentSelection(population);
        const parent2 = this.tournamentSelection(population);
        let child = this.crossover(parent1, parent2, bookings);
        if (Math.random() < this.mutationRate) {
          child = this.mutate(child, rooms);
        }
        child = this.repairChromosome(child, bookings, rooms);
        newPopulation.push(child);
      }

      population = newPopulation;
    }

    const bestChromosome = population.sort((a, b) => b.fitness - a.fitness)[0];
    return Object.entries(bestChromosome.assignments).map(([bookingId, roomId]) => ({
      bookingId,
      roomId
    }));
  }

  private initializePopulation(bookings: BookingRequest[], rooms: Room[]): Chromosome[] {
    const population: Chromosome[] = [];
    for (let i = 0; i < this.populationSize; i++) {
      const assignments: { [bookingId: string]: string | null } = {};
      bookings.forEach(booking => {
        const availableRooms = rooms.filter(room => room.roomTypeId === booking.roomTypeId);
        if (availableRooms.length > 0 && Math.random() > 0.2) {
          assignments[booking.id] = availableRooms[Math.floor(Math.random() * availableRooms.length)].id;
        } else {
          assignments[booking.id] = null;
        }
      });
      population.push({ assignments, fitness: 0 });
    }
    return population;
  }

  private calculateFitness(chromosome: Chromosome, bookings: BookingRequest[], rooms: Room[]): number {
    let fitness = 0;
    const usedRooms: { [roomId: string]: { checkin: Date, checkout: Date }[] } = {};

    for (const booking of bookings) {
      const roomId = chromosome.assignments[booking.id];
      if (!roomId) {
        fitness -= 1000;
        continue;
      }

      const room = rooms.find(r => r.id === roomId);
      if (!room || room.roomTypeId !== booking.roomTypeId) {
        fitness -= 1000;
        continue;
      }

      if (!usedRooms[roomId]) {
        usedRooms[roomId] = [];
      }
      const hasConflict = usedRooms[roomId].some(used => {
        return !(booking.checkoutDate <= used.checkin || booking.checkinDate >= used.checkout);
      });
      if (hasConflict) {
        fitness -= 1000;
        continue;
      }

      usedRooms[roomId].push({ checkin: booking.checkinDate, checkout: booking.checkoutDate });

      const nights = Math.ceil((booking.checkoutDate.getTime() - booking.checkinDate.getTime()) / (1000 * 60 * 60 * 24));
      fitness += room.roomPriceByDay * nights;
      fitness -= room.totalGapDays * 10;
    }

    return fitness;
  }

  private tournamentSelection(population: Chromosome[]): Chromosome {
    const tournamentSize = 5;
    const tournament = population
      .slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, tournamentSize);
    return tournament.reduce((best, chromosome) => chromosome.fitness > best.fitness ? chromosome : best);
  }

  private crossover(parent1: Chromosome, parent2: Chromosome, bookings: BookingRequest[]): Chromosome {
    const childAssignments: { [bookingId: string]: string | null } = {};
    bookings.forEach(booking => {
      childAssignments[booking.id] = Math.random() < 0.5 ? parent1.assignments[booking.id] : parent2.assignments[booking.id];
    });
    return { assignments: childAssignments, fitness: 0 };
  }

  private mutate(chromosome: Chromosome, rooms: Room[]): Chromosome {
    const bookingIds = Object.keys(chromosome.assignments);
    const randomBookingId = bookingIds[Math.floor(Math.random() * bookingIds.length)];
    const availableRooms = rooms.filter(room => room.roomTypeId === this.selectedRoomTypeId);
    chromosome.assignments[randomBookingId] =
      availableRooms.length > 0 ? availableRooms[Math.floor(Math.random() * availableRooms.length)].id : null;
    return chromosome;
  }

  private repairChromosome(chromosome: Chromosome, bookings: BookingRequest[], rooms: Room[]): Chromosome {
    const usedRooms: { [roomId: string]: { checkin: Date, checkout: Date }[] } = {};
    const repairedAssignments: { [bookingId: string]: string | null } = {};

    bookings.forEach(booking => {
      const roomId = chromosome.assignments[booking.id];
      if (!roomId) {
        repairedAssignments[booking.id] = null;
        return;
      }

      const room = rooms.find(r => r.id === roomId);
      if (!room || room.roomTypeId !== booking.roomTypeId) {
        repairedAssignments[booking.id] = null;
        return;
      }

      if (!usedRooms[roomId]) {
        usedRooms[roomId] = [];
      }
      const hasConflict = usedRooms[roomId].some(used => {
        return !(booking.checkoutDate <= used.checkin || booking.checkinDate >= used.checkout);
      });

      if (!hasConflict) {
        repairedAssignments[booking.id] = roomId;
        usedRooms[roomId].push({ checkin: booking.checkinDate, checkout: booking.checkoutDate });
      } else {
        const availableRoom = rooms.find(r =>
          r.roomTypeId === booking.roomTypeId &&
          (!usedRooms[r.id] || !usedRooms[r.id].some(used =>
            !(booking.checkoutDate <= used.checkin || booking.checkinDate >= used.checkout)
          ))
        );
        repairedAssignments[booking.id] = availableRoom ? availableRoom.id : null;
        if (availableRoom) {
          if (!usedRooms[availableRoom.id]) {
            usedRooms[availableRoom.id] = [];
          }
          usedRooms[availableRoom.id].push({ checkin: booking.checkinDate, checkout: booking.checkoutDate });
        }
      }
    });

    return { assignments: repairedAssignments, fitness: 0 };
  }

  toggleRoomSelection(room: any): void {
    const isSelected = this.selectedRooms.find((selectedRoom) => selectedRoom.id === room.id);
    if (isSelected) {
      this.selectedRooms = this.selectedRooms.filter((selectedRoom) => selectedRoom.id !== room.id);
    } else {
      this.selectedRooms.push(room);
    }
    this.calculateTotalCost();
  }

  calculateTotalCost(): void {
    if (this.numberOfNights > 0) {
      this.totalCost = this.selectedRooms.reduce((total, room) => {
        return total + (room.roomPriceByDay * this.numberOfNights);
      }, 0);
    } else {
      this.totalCost = 0;
    }
  }

  toggleAddCustomerForm(): void {
    this.showAddCustomerForm = !this.showAddCustomerForm;
  }

  addNewCustomer(): void {
    if (!this.newCustomer.name || !this.newCustomer.email || !this.newCustomer.phone) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }

    this.customerService.addCustomer(
      this.newCustomer.name,
      this.newCustomer.email,
      this.newCustomer.phone,
      this.newCustomer.address,
      this.newCustomer.status,
      this.newCustomer.cccd
    ).then((docRef) => {
      alert('Thêm khách hàng thành công!');
      this.selectedCustomerId = docRef.id;
      this.toggleAddCustomerForm();
      this.resetNewCustomerForm();
      this.customers.push({ id: docRef.id, ...this.newCustomer });
      this.filterCustomers();
    }).catch(error => {
      console.error('Lỗi khi thêm khách hàng:', error);
      alert('Có lỗi xảy ra khi thêm khách hàng. Vui lòng thử lại!');
    });
  }

  private resetNewCustomerForm(): void {
    this.newCustomer = {
      name: '',
      email: '',
      phone: '',
      address: '',
      status: 'active',
      cccd: ''
    };
  }

  createBooking(): void {
    if (!this.selectedCustomerId) {
      alert('Vui lòng chọn khách hàng hoặc thêm khách hàng mới trước khi đặt phòng.');
      return;
    }

    if (this.selectedRooms.length === 0) {
      alert('Vui lòng chọn ít nhất một phòng.');
      return;
    }

    if (this.isBookingInProgress) {
      return;
    }

    this.isBookingInProgress = true;

    const selectedCustomer = this.customers.find(customer => customer.id === this.selectedCustomerId);
    const customerName = selectedCustomer ? selectedCustomer.name : '';

    const roomDetails = this.selectedRooms.map(room => ({
      idRoom: room.id,
      roomName: room.name,
      price: room.roomPriceByDay,
      checkin: this.checkinDate,
      checkout: this.checkoutDate,
    }));

    this.bookingService.createBooking(roomDetails, this.totalCost, this.selectedCustomerId, customerName).subscribe(
      (bookingResponse) => {
        console.log('Đặt phòng thành công:', bookingResponse);
        alert('Đặt phòng thành công!');
      },
      (error) => {
        console.error('Lỗi khi đặt phòng:', error);
        alert('Có lỗi xảy ra khi đặt phòng. Vui lòng thử lại!');
        this.isBookingInProgress = false;
      }
    );
  }

  private resetBookingForm(): void {
    this.selectedRooms = [];
    this.rooms = [];
    this.totalCost = 0;
    this.checkinDate = '';
    this.checkoutDate = '';
    this.selectedRoomTypeId = '';
    this.isBookingInProgress = false;
    this.numberOfNights = 0;
    this.recommendedRoomIds = [];
  }

  ngOnDestroy(): void {
    if (this.roomSubscription) {
      this.roomSubscription.unsubscribe();
    }
    if (this.customerSubscription) {
      this.customerSubscription.unsubscribe();
    }
  }
}