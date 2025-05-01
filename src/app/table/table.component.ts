// table.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-table',
  template: `
    <table class="table" [ngClass]="customClass">
      <thead>
        <tr>
          <th *ngFor="let header of headers">{{ header }}</th>
        </tr>
      </thead>
      <tbody>
        <ng-content></ng-content>
      </tbody>
    </table>
  `,
  styles: [`
    .table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 10px;
      border: 1px solid #ddd;
      text-align: left;
    }
    th {
      background: #f0f0f0;
    }
  `]
})
export class TableComponent {
  @Input() headers: string[] = []; // Đảm bảo @Input() được khai báo
  @Input() customClass: string = '';
}