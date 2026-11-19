import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  Input,
  OnInit,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { InputIcon } from 'primeng/inputicon';
import { IconField } from 'primeng/iconfield';
import { TranslateModule } from '@ngx-translate/core';
import { ValidationMessage, SelectOption } from '../../models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-input-field',
  imports: [
    ReactiveFormsModule,
    FloatLabelModule,
    InputTextModule,
    PasswordModule,
    TextareaModule,
    DatePickerModule,
    SelectModule,
    IconField,
    InputIcon,
    TranslateModule,
  ],
  templateUrl: './input-field.html',
  styleUrl: './input-field.scss',
})
export class InputField implements ControlValueAccessor, OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  ngControl = inject(NgControl, { optional: true, self: true });

  @Input({ required: true }) inputId!: string;
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type:
    | 'text'
    | 'email'
    | 'password'
    | 'textarea'
    | 'datepicker'
    | 'select' = 'text';
  @Input() options: SelectOption[] = [];
  @Input() dateFormat = 'dd/mm/yy';
  @Input() showDateIcon = true;
  @Input() validationMessages: ValidationMessage[] = [];
  @Input() toggleMask = true;
  @Input() feedback = false;
  @Input() rows = 3;
  @Input() labelWidth = '';
  @Input() icon = '';
  @Input() containerClass = 'w-full';

  // Internal FormControl for p-password
  internalControl = new FormControl('');

  value = '';
  disabled = false;

  private onChange: (value: string) => void = () => {
    /* set by registerOnChange */
  };
  private onTouched: () => void = () => {
    /* set by registerOnTouched */
  };

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    this.internalControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.value = value || '';
        this.onChange(this.value);
      });
  }

  get control(): FormControl | null {
    return this.ngControl?.control as FormControl;
  }

  get isInvalid(): boolean {
    if (!this.control?.touched) {
      return false;
    }
    // Check both control-level and form-level errors
    const hasControlErrors = this.control.invalid;
    const hasFormErrors = this.control.parent?.errors != null;

    // For form-level errors, check if any validationMessages match
    const hasRelevantFormErrors =
      hasFormErrors &&
      this.validationMessages.some(
        (msg) => this.control?.parent?.errors?.[msg.key],
      );

    return hasControlErrors || hasRelevantFormErrors;
  }

  get currentErrors(): string[] {
    if (!this.control?.touched) {
      return [];
    }

    const errors: string[] = [];
    const controlErrors = this.control.errors;
    // Check form-level errors (like passwordMismatch)
    const formErrors = this.control.parent?.errors;

    if (!controlErrors && !formErrors) {
      return [];
    }

    for (const msg of this.validationMessages) {
      if (controlErrors?.[msg.key] || formErrors?.[msg.key]) {
        errors.push(msg.message);
      }
    }

    return errors;
  }

  writeValue(value: string | Date | null): void {
    if (this.type === 'datepicker') {
      this.cdr.markForCheck();
      return;
    }
    this.value = value != null ? String(value) : '';
    this.internalControl.setValue(this.value, { emitEvent: false });
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.internalControl.disable({ emitEvent: false });
    } else {
      this.internalControl.enable({ emitEvent: false });
    }
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.onTouched();
  }
}
