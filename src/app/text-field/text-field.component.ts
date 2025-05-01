// text-field.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-text-field',
  template: `
    <input
      [type]="type"
      [placeholder]="placeholder"
      [value]="value"
      (input)="onInput($event)"
      [disabled]="disabled"
      [ngClass]="customClass"
    />
  `,
  styles: [`
    input {
      width: 100%;
      padding: 8px;
      margin-bottom: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }
    input:disabled {
      background: #f0f0f0;
      cursor: not-allowed;
    }
  `]
})
export class TextFieldComponent {
  @Input() type: string = 'text';
  @Input() placeholder: string = '';
  @Input() value: string | number = '';
  @Input() disabled: boolean = false;
  @Input() customClass: string = '';
  
  @Output() valueChange = new EventEmitter<string | number>();

  onInput(event: Event) {
    const inputValue = (event.target as HTMLInputElement).value;
    this.valueChange.emit(inputValue);
  }
}