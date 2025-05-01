import { Component, OnInit } from '@angular/core';
import { DichVuService } from '../services/dichvu.service';

@Component({
  selector: 'app-service-request',
  templateUrl: './service-request.component.html',
  styleUrls: ['./service-request.component.css']
})
export class ServiceRequestComponent implements OnInit {

  qrCodeUrl: string = '';

  constructor(private dichVuService: DichVuService) {}

  ngOnInit() {
    this.createQRCode('https://bluehotel-c6700.web.app/servicerequest');
  }

  createQRCode(data: string) {
    this.dichVuService.generateQRCode(data).subscribe(
      (url) => {
        this.qrCodeUrl = url;  // Set the QR code URL
      },
      (error) => {
        console.error('Error generating QR code:', error);
      }
    );
  }
}
