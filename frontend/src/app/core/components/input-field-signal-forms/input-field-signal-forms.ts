import { Component, computed, effect, input, model } from '@angular/core';
import { FormValueControl, ValidationError } from '@angular/forms/signals';
import { TranslateModule } from '@ngx-translate/core';
import { FloatLabelModule } from 'primeng/floatlabel';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputPasswordModule } from 'primeng/inputpassword';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';

@Component({
  imports: [InputTextModule, IconFieldModule, InputIconModule, TranslateModule, FloatLabelModule, InputPasswordModule, Textarea],
  selector: 'app-input-field-signal-forms',
  styleUrl: './input-field-signal-forms.scss',
  templateUrl: './input-field-signal-forms.html'
})
export class InputFieldSignalForms implements FormValueControl<string> {
  // FormValueControl
  readonly value = model<string>('');
  readonly touched = model<boolean>(false);
  readonly dirty = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly invalid = input<boolean>(false);
  readonly errors = input<readonly ValidationError[]>([]);
  readonly rows = input<number>(3);

  private static nextId = 0;
  passwordMask = true;

  // UI
  readonly id = input(`app-input-${++InputFieldSignalForms.nextId}`);
  readonly label = input<string>('');
  readonly icon = input<string>('');
  readonly floatLabelVariant = input<'in' | 'on'>('in');
  readonly placeholder = input<string | null>(null);
  readonly type = input<'text' | 'password' | 'email' | 'textarea'>('text');
  readonly showError = computed(() => (this.touched() || this.dirty()) && this.invalid());
  readonly firstError = computed(() => this.errors()[0]);

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
  }

  togglePasswordMask(): void {
    this.passwordMask = !this.passwordMask;
  }
}
