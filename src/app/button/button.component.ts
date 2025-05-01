// button.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-button',
  template: `
    <button
      [type]="type"
      [disabled]="disabled"
      (click)="onClick()"
      [ngClass]="[color, customClass]"
    >
      {{ label }}
    </button>
  `,
  styles: [`
    button {
      padding: 8px 15px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 5px;
      color: white;
    }
    button:hover:not(:disabled) {
      opacity: 0.9;
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .primary { background: #4CAF50; }
    .warning { background: #FFA500; }
    .danger { background: #FF4500; }
    .default { background: #666; }
  `]
})
export class ButtonComponent {
  @Input() label: string = 'Button';
  @Input() type: string = 'button';
  @Input() color: 'primary' | 'warning' | 'danger' | 'default' = 'primary';
  @Input() disabled: boolean = false;
  @Input() customClass: string = '';
  
  @Output() buttonClick = new EventEmitter<void>();

  onClick() {
    this.buttonClick.emit();
  }
}