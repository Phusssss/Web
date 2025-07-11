
import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { BookingService } from '../services/booking.service';
import { DichVuService, ServiceRequest } from '../services/dichvu.service';
import { RoomService } from '../services/room.service';
import { CustomerService } from '../services/customer.service';
import { LoaiPhongService } from '../services/loaiphong.service';
import { ExpenseService, Expense } from '../services/expense.service';
import { Timestamp } from 'firebase/firestore';
import { Chart, ChartConfiguration } from 'chart.js';
import { LineController, BarController, PieController, ScatterController, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, TooltipItem } from 'chart.js';

Chart.register(LineController, BarController, PieController, ScatterController, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

interface BookingDetail {
  checkin: Timestamp;
  checkout: Timestamp;
  price: number;
  quantity: number;
  idRoom: string;
  roomName?: string;
  roomTypeName?: string;
}

@Component({
  selector: 'app-invoice',
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.css']
})
export class InvoiceComponent implements OnInit, AfterViewInit {
  bookings: any[] = [];
  filteredBookings: any[] = [];
  totalRevenue = 0;
  totalServiceRevenue = 0;
  totalExpenses = 0;
  totalProfit = 0;
  serviceRequests: { [key: string]: ServiceRequest[] } = {};
  startDate: string;
  endDate: string;
  selectedRoom = '';
  availableRooms: string[] = [];
  roomRevenue: { [key: string]: number } = {};
  roomTypeRevenue: { [key: string]: number } = {};
  serviceRevenue: { [key: string]: number } = {};
  monthlyRevenue: { [key: string]: number } = {};
  dailyRoomUsage: { [key: string]: number } = {};
  
  revenueChart: Chart | undefined;
  monthlyRevenueChart: Chart | undefined;
  roomTypeRevenueChart: Chart | undefined;
  roomUsageChart: Chart | undefined;

  constructor(
    private bookingService: BookingService,
    private roomService: RoomService,
    private customerService: CustomerService,
    private serviceRequestService: DichVuService,
    private loaiPhongService: LoaiPhongService,
    private expenseService: ExpenseService,
    private cdr: ChangeDetectorRef
  ) {
    const today = new Date();
    this.startDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-01`;
    this.endDate = today.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.resetFilters();
    this.loadBookings();
    this.loadExpenses();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.createCharts();
    }, 100);
  }

  private loadBookings(): void {
    this.bookingService.getUserBookings().subscribe({
      next: (bookings) => {
        this.bookings = bookings.filter((b) => b.status === 'Đã thanh toán');
        this.filteredBookings = [...this.bookings];
        this.fetchAdditionalData();
        this.filterBookings();
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        alert('Có lỗi xảy ra khi tải danh sách đặt chỗ');
      }
    });
  }

  private loadExpenses(): void {
    this.expenseService.getExpenses().subscribe({
      next: (expenses: Expense[]) => {
        this.calculateFilteredExpenses(expenses);
        this.calculateProfit();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading expenses:', error);
        alert('Có lỗi xảy ra khi tải danh sách chi tiêu');
      }
    });
  }

  private fetchAdditionalData(): void {
    this.bookings.forEach((booking) => {
      this.serviceRequestService.getServiceRequestsByBooking(booking.id).subscribe({
        next: (requests) => {
          this.serviceRequests[booking.id] = requests;
          this.calculateFilteredRevenue();
          this.calculateProfit();
          this.updateCharts();
        },
        error: (error) => {
          console.error(`Error loading service requests for booking ${booking.id}:`, error);
        }
      });

      booking.details.forEach((detail: BookingDetail) => {
        this.roomService.getRoomName(detail.idRoom).subscribe({
          next: (roomName) => {
            detail.roomName = roomName;
            if (roomName && !this.availableRooms.includes(roomName)) {
              this.availableRooms.push(roomName);
            }
            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error(`Error loading room name for room ${detail.idRoom}:`, error);
          }
        });

        this.roomService.getRoom(detail.idRoom).subscribe({
          next: (room) => {
            if (room && room.roomTypeId) {
              this.loaiPhongService.getNameTypeRoom(room.roomTypeId).subscribe({
                next: (roomTypeName) => {
                  detail.roomTypeName = roomTypeName;
                  this.calculateFilteredRevenue();
                  this.calculateProfit();
                  this.updateCharts();
                },
                error: (error) => {
                  console.error(`Error loading room type name for room ${detail.idRoom}:`, error);
                }
              });
            }
          },
          error: (error) => {
            console.error(`Error loading room ${detail.idRoom}:`, error);
          }
        });
      });

      this.customerService.getCustomerNameByBookingId(booking.id).subscribe({
        next: (customerName) => {
          booking.customerName = customerName;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error(`Error loading customer name for booking ${booking.id}:`, error);
        }
      });
    });
  }

  deleteBooking(bookingId: string): void {
    if (confirm('Bạn có chắc chắn muốn xóa hóa đơn này?')) {
      this.bookingService.deleteBooking(bookingId).subscribe({
        next: (response) => {
          console.log(response.message);
          this.bookings = this.bookings.filter(b => b.id !== bookingId);
          this.filteredBookings = this.filteredBookings.filter(b => b.id !== bookingId);
          delete this.serviceRequests[bookingId];
          this.calculateFilteredRevenue();
          this.calculateProfit();
          this.updateCharts();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error deleting booking:', error);
          alert('Có lỗi xảy ra khi xóa hóa đơn');
        }
      });
    }
  }

  getTotalAmount(booking: any): number {
    const roomPrice = this.getTotalPrice(booking, this.selectedRoom);
    const servicePrice = (this.serviceRequests[booking.id] || []).reduce(
      (sum, service) => sum + service.price * service.quantity,
      0
    );
    return roomPrice + servicePrice;
  }

  getTotalPrice(booking: any, roomName?: string): number {
    if (!booking.details) return 0;
    const details = roomName
      ? booking.details.filter((d: BookingDetail) => d.roomName === roomName)
      : booking.details;
    return details.reduce(
      (sum: number, detail: BookingDetail) =>
        sum + this.getTotalNights(detail.checkin, detail.checkout) * detail.price,
      0
    );
  }

  getDateFromTimestamp(timestamp: any): Date | string {
    return timestamp?.seconds ? new Date(timestamp.seconds * 1000) : 'Không xác định';
  }

  getTotalNights(checkin: any, checkout: any): number {
    const checkinDate = new Date(checkin.seconds * 1000);
    const checkoutDate = new Date(checkout.seconds * 1000);
    return (checkoutDate.getTime() - checkinDate.getTime()) / (1000 * 3600 * 24);
  }

  filterBookings(): void {
    this.filteredBookings = this.bookings.filter((booking) =>
      this.isBookingInRange(booking) && this.isBookingInRoom(booking)
    );
    this.calculateFilteredRevenue();
    this.loadExpenses();
    this.updateCharts();
  }

  private isBookingInRange(booking: any): boolean {
    if (!this.startDate && !this.endDate) return true;
    return booking.details.some((detail: BookingDetail) => {
      const checkinDate = this.getDateFromTimestamp(detail.checkin);
      if (!(checkinDate instanceof Date)) return false;
      const start = this.startDate ? new Date(this.startDate) : null;
      const end = this.endDate ? new Date(this.endDate) : null;
      return (!start || checkinDate >= start) && (!end || checkinDate <= end);
    });
  }

  private isBookingInRoom(booking: any): boolean {
    return !this.selectedRoom || booking.details.some((d: BookingDetail) => d.roomName === this.selectedRoom);
  }

  private calculateFilteredRevenue(): void {
    this.totalRevenue = this.filteredBookings.reduce((sum, booking) => sum + this.getTotalPrice(booking), 0);
    this.totalServiceRevenue = this.filteredBookings.reduce(
      (sum, booking) =>
        sum +
        (this.serviceRequests[booking.id] || []).reduce(
          (serviceSum, service) => serviceSum + service.price * service.quantity,
          0
        ),
      0
    );
    this.calculateRoomRevenue();
    this.calculateMonthlyRevenue();
    this.calculateRoomTypeRevenue();
    this.calculateDailyRoomUsage();
    this.calculateProfit();
  }

  private calculateRoomRevenue(): void {
    this.roomRevenue = this.filteredBookings.reduce((acc, booking) => {
      booking.details.forEach((detail: BookingDetail) => {
        if (detail.roomName) {
          acc[detail.roomName] = (acc[detail.roomName] || 0) + this.getTotalNights(detail.checkin, detail.checkout) * detail.price;
        }
      });
      return acc;
    }, {} as { [key: string]: number });
  }

  private calculateRoomTypeRevenue(): void {
    this.roomTypeRevenue = this.filteredBookings.reduce((acc, booking) => {
      booking.details.forEach((detail: BookingDetail) => {
        if (detail.roomTypeName) {
          acc[detail.roomTypeName] = (acc[detail.roomTypeName] || 0) + this.getTotalNights(detail.checkin, detail.checkout) * detail.price;
        }
      });
      return acc;
    }, {} as { [key: string]: number });
  }

  private calculateDailyRoomUsage(): void {
    this.dailyRoomUsage = {};
    const startDate = this.startDate ? new Date(this.startDate) : this.getEarliestCheckinDate();
    const endDate = this.endDate ? new Date(this.endDate) : this.getLatestCheckoutDate();
    
    if (!startDate || !endDate) return;

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      this.dailyRoomUsage[dateKey] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    this.filteredBookings.forEach(booking => {
      booking.details.forEach((detail: BookingDetail) => {
        const checkin = this.getDateFromTimestamp(detail.checkin);
        const checkout = this.getDateFromTimestamp(detail.checkout);
        
        if (checkin instanceof Date && checkout instanceof Date) {
          const currentDay = new Date(checkin);
          while (currentDay < checkout) {
            const dateKey = currentDay.toISOString().split('T')[0];
            this.dailyRoomUsage[dateKey] = (this.dailyRoomUsage[dateKey] || 0) + 1;
            currentDay.setDate(currentDay.getDate() + 1);
          }
        }
      });
    });
  }

  private getEarliestCheckinDate(): Date | null {
    if (this.filteredBookings.length === 0) return null;
    let earliestDate = new Date(9999, 11, 31);
    this.filteredBookings.forEach(booking => {
      booking.details.forEach((detail: BookingDetail) => {
        const checkin = this.getDateFromTimestamp(detail.checkin);
        if (checkin instanceof Date && checkin < earliestDate) {
          earliestDate = checkin;
        }
      });
    });
    return earliestDate;
  }

  private getLatestCheckoutDate(): Date | null {
    if (this.filteredBookings.length === 0) return null;
    let latestDate = new Date(1970, 0, 1);
    this.filteredBookings.forEach(booking => {
      booking.details.forEach((detail: BookingDetail) => {
        const checkout = this.getDateFromTimestamp(detail.checkout);
        if (checkout instanceof Date && checkout > latestDate) {
          latestDate = checkout;
        }
      });
    });
    return latestDate;
  }

  private calculateMonthlyRevenue(): void {
    const currentYear = new Date().getFullYear();
    this.monthlyRevenue = {};
    for (let month = 1; month <= 12; month++) {
      const monthKey = `${currentYear}-${month.toString().padStart(2, '0')}`;
      this.monthlyRevenue[monthKey] = 0;
    }

    this.filteredBookings.forEach((booking) => {
      booking.details.forEach((detail: BookingDetail) => {
        const checkinDate = this.getDateFromTimestamp(detail.checkin);
        if (checkinDate instanceof Date) {
          const monthKey = `${checkinDate.getFullYear()}-${(checkinDate.getMonth() + 1).toString().padStart(2, '0')}`;
          this.monthlyRevenue[monthKey] = (this.monthlyRevenue[monthKey] || 0) + this.getTotalNights(detail.checkin, detail.checkout) * detail.price;
        }
      });
      const serviceRevenue = (this.serviceRequests[booking.id] || []).reduce(
        (sum, service) => sum + service.price * service.quantity,
        0
      );
      const checkinDate = this.getDateFromTimestamp(booking.details[0]?.checkin);
      if (checkinDate instanceof Date) {
        const monthKey = `${checkinDate.getFullYear()}-${(checkinDate.getMonth() + 1).toString().padStart(2, '0')}`;
        this.monthlyRevenue[monthKey] = (this.monthlyRevenue[monthKey] || 0) + serviceRevenue;
      }
    });
  }

  private calculateFilteredExpenses(expenses: Expense[]): void {
    this.totalExpenses = expenses
      .filter((expense) => this.isExpenseInRange(expense))
      .reduce((sum, expense) => sum + expense.amount, 0);
  }

  private isExpenseInRange(expense: Expense): boolean {
    if (!this.startDate && !this.endDate) return true;
    const expenseDate = new Date(expense.date);
    const start = this.startDate ? new Date(this.startDate) : null;
    const end = this.endDate ? new Date(this.endDate) : null;
    return (!start || expenseDate >= start) && (!end || expenseDate <= end);
  }

  private calculateProfit(): void {
    this.totalProfit = (this.totalRevenue + this.totalServiceRevenue) - this.totalExpenses;
  }

  private updateCharts(): void {
    setTimeout(() => {
      this.destroyCharts();
      this.createCharts();
    }, 0);
  }

  private createCharts(): void {
  this.destroyCharts();

  // Detect dark mode
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

  // Define theme-based colors
  const chartColors = {
    textColor: isDarkMode ? '#e2e8f0' : '#1E40AF',
    gridColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    tooltipBg: isDarkMode ? '#333' : '#fff',
    tooltipText: isDarkMode ? '#e2e8f0' : '#333',
  };

  // Revenue Chart (Pie)
  const pieCtx = document.getElementById('revenueChart') as HTMLCanvasElement;
  if (pieCtx && !Chart.getChart('revenueChart')) {
    try {
      const pieConfig: ChartConfiguration<'pie'> = {
        type: 'pie',
        data: {
          labels: Object.keys(this.roomRevenue),
          datasets: [{
            data: Object.values(this.roomRevenue),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#9966FF', 
                             '#FF9F40', '#E74C3C', '#8E44AD', '#3498DB', '#2ECC71', 
                             '#F1C40F', '#D35400'],
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: chartColors.textColor,
                font: { size: 14 }
              }
            },
            tooltip: {
              backgroundColor: chartColors.tooltipBg,
              titleColor: chartColors.tooltipText,
              bodyColor: chartColors.tooltipText,
              callbacks: {
                label: (context: TooltipItem<'pie'>) => `${context.label}: ${context.raw} VND`
              }
            },
            title: {
              display: true,
              text: 'Doanh thu theo phòng',
              color: chartColors.textColor,
              font: { size: 16, weight: 600 } // Changed '600' to 600
            }
          }
        }
      };
      this.revenueChart = new Chart(pieCtx, pieConfig);
    } catch (error) {
      console.error('Lỗi khi tạo biểu đồ tròn:', error);
    }
  }

  // Monthly Revenue Chart (Bar)
  const barCtx = document.getElementById('monthlyRevenueChart') as HTMLCanvasElement;
  if (barCtx && !Chart.getChart('monthlyRevenueChart')) {
    try {
      const currentYear = new Date().getFullYear();
      const labels = Array.from({ length: 12 }, (_, i) => 
        `${currentYear}-${(i + 1).toString().padStart(2, '0')}`);
      const data = labels.map(label => this.monthlyRevenue[label] || 0);

      const barConfig: ChartConfiguration<'bar'> = {
        type: 'bar',
        data: {
          labels: labels.map(label => `Tháng ${parseInt(label.split('-')[1], 10)}`),
          datasets: [{
            label: 'Doanh thu',
            data: data,
            backgroundColor: '#36A2EB',
            borderColor: '#2980B9',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            x: {
              title: {
                display: true,
                text: `Tháng (${currentYear})`,
                color: chartColors.textColor,
                font: { size: 14 }
              },
              ticks: { color: chartColors.textColor }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Doanh thu (VND)',
                color: chartColors.textColor,
                font: { size: 14 }
              },
              ticks: { color: chartColors.textColor },
              grid: { color: chartColors.gridColor }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: chartColors.tooltipBg,
              titleColor: chartColors.tooltipText,
              bodyColor: chartColors.tooltipText,
              callbacks: {
                label: (context: TooltipItem<'bar'>) => `${context.raw} VND`
              }
            },
            title: {
              display: true,
              text: 'Doanh thu theo tháng',
              color: chartColors.textColor,
              font: { size: 16, weight: 600 } // Changed '600' to 600
            }
          }
        }
      };
      this.monthlyRevenueChart = new Chart(barCtx, barConfig);
    } catch (error) {
      console.error('Lỗi khi tạo biểu đồ cột:', error);
    }
  }

  // Room Type Revenue Chart (Scatter)
  const roomTypeScatterCtx = document.getElementById('roomTypeRevenueChart') as HTMLCanvasElement;
  if (roomTypeScatterCtx && !Chart.getChart('roomTypeRevenueChart')) {
    try {
      const roomTypeScatterConfig: ChartConfiguration<'scatter'> = {
        type: 'scatter',
        data: {
          datasets: [{
            label: 'Doanh thu theo loại phòng',
            data: Object.keys(this.roomTypeRevenue).map((key, index) => ({
              x: index + 1,
              y: this.roomTypeRevenue[key],
              label: key
            })),
            backgroundColor: '#FF6384',
            pointRadius: 8,
            pointHoverRadius: 12
          }]
        },
        options: {
          responsive: true,
          scales: {
            x: {
              title: {
                display: true,
                text: 'Loại phòng',
                color: chartColors.textColor,
                font: { size: 14 }
              },
              ticks: {
                color: chartColors.textColor,
                stepSize: 1,
                callback: (value, index) => {
                  const label = Object.keys(this.roomTypeRevenue)[index];
                  return label || '';
                }
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Doanh thu (VND)',
                color: chartColors.textColor,
                font: { size: 14 }
              },
              ticks: { color: chartColors.textColor },
              grid: { color: chartColors.gridColor }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: chartColors.tooltipBg,
              titleColor: chartColors.textColor,
              bodyColor: chartColors.textColor,
              callbacks: {
                label: (context: TooltipItem<'scatter'>) => {
                  const dataPoint = context.raw as { x: number; y: number; label: string };
                  return `${dataPoint.label}: ${dataPoint.y} VND`;
                }
              }
            },
            title: {
              display: true,
              text: 'Doanh thu theo loại phòng',
              color: chartColors.textColor,
              font: { size: 16, weight: 600 } // Changed '600' to 600
            }
          }
        }
      };
      this.roomTypeRevenueChart = new Chart(roomTypeScatterCtx, roomTypeScatterConfig);
    } catch (error) {
      console.error('Lỗi khi tạo biểu đồ phân tán loại phòng:', error);
    }
  }

  // Room Usage Chart (Line)
  const roomUsageLineCtx = document.getElementById('roomUsageChart') as HTMLCanvasElement;
  if (roomUsageLineCtx && !Chart.getChart('roomUsageChart')) {
    try {
      const sortedDates = Object.keys(this.dailyRoomUsage).sort();
      const data = sortedDates.map(date => this.dailyRoomUsage[date]);

      const lineConfig: ChartConfiguration<'line'> = {
        type: 'line',
        data: {
          labels: sortedDates.map(date => {
            const d = new Date(date);
            return `${d.getDate()}/${d.getMonth() + 1}`;
          }),
          datasets: [{
            label: 'Số phòng sử dụng',
            data: data,
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          scales: {
            x: {
              title: {
                display: true,
                text: 'Ngày',
                color: chartColors.textColor,
                font: { size: 14 }
              },
              ticks: { color: chartColors.textColor },
              grid: { color: chartColors.gridColor }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Số phòng',
                color: chartColors.textColor,
                font: { size: 14 }
              },
              ticks: {
                color: chartColors.textColor,
                stepSize: 1,
                precision: 0
              },
              grid: { color: chartColors.gridColor }
            }
          },
          plugins: {
            tooltip: {
              backgroundColor: chartColors.tooltipBg,
              titleColor: chartColors.textColor,
              bodyColor: chartColors.textColor,
              callbacks: {
                label: (context: TooltipItem<'line'>) => {
                  return `${context.dataset.label}: ${context.raw}`;
                },
                title: (context) => {
                  return `Ngày ${context[0].label}`;
                }
              }
            },
            title: {
              display: true,
              text: 'Phòng sử dụng',
              color: chartColors.textColor,
              font: { size: 16, weight: 600 } // Changed '600' to 600
            }
          }
        }
      };
      this.roomUsageChart = new Chart(roomUsageLineCtx, lineConfig);
    } catch (error) {
      console.error('Lỗi khi tạo biểu đồ đường số phòng sử dụng:', error);
    }
  }
}

  private destroyCharts(): void {
    if (this.revenueChart) {
      this.revenueChart.destroy();
      this.revenueChart = undefined;
    }
    if (this.monthlyRevenueChart) {
      this.monthlyRevenueChart.destroy();
      this.monthlyRevenueChart = undefined;
    }
    if (this.roomTypeRevenueChart) {
      this.roomTypeRevenueChart.destroy();
      this.roomTypeRevenueChart = undefined;
    }
    if (this.roomUsageChart) {
      this.roomUsageChart.destroy();
      this.roomUsageChart = undefined;
    }
  }

  resetFilters(): void {
    this.startDate = '';
    this.endDate = '';
    this.selectedRoom = '';
    this.filteredBookings = [...this.bookings];
    this.calculateFilteredRevenue();
    this.loadExpenses();
    this.updateCharts();
  }
}
