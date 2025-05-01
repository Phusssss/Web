import { TestBed } from '@angular/core/testing';

import { VietQRService } from './viet-qr.service';

describe('VietQRService', () => {
  let service: VietQRService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VietQRService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
