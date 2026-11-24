import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';

type DialogPosition = 'center' | 'top' | 'bottom' | 'left' | 'right';

@Component({
  selector: 'app-dialog',
  imports: [DialogModule, ButtonModule, TranslateModule],
  templateUrl: './dialog.html',
  styleUrl: './dialog.scss',
})
export class Dialog {
  @Input() visible = false;
  @Input() title = '';
  @Input() icon = 'pi pi-info-circle';
  @Input() styleClass = 'w-full sm:w-[500px]';
  @Input() position: DialogPosition = 'center';
  @Input() showCloseInHeader = false;
  @Input() closeOnEscape = true;

  @Output() visibilityChange = new EventEmitter<boolean>();

  onVisibilityChange(value: boolean): void {
    this.visibilityChange.emit(value);
  }

  close(): void {
    this.visibilityChange.emit(false);
  }
}
