import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { InputField, Dialog } from '../../../../components';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../../services/auth-service';
import { tap } from 'rxjs/operators';
import { CHANGE_PASSWORD_FORM_VALIDATIONS } from '../../constants/change-password-form-validations';
import { passwordMatchValidator } from '../../../../directives/password-match-directive';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-change-password-dialog',
  imports: [
    Dialog,
    ButtonModule,
    ReactiveFormsModule,
    InputField,
    TranslateModule,
  ],
  templateUrl: './change-password-dialog.html',
  styleUrl: './change-password-dialog.scss',
})
export class ChangePasswordDialog implements OnInit {
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  visible = signal<boolean>(false);

  changePasswordForm!: FormGroup;
  validations = CHANGE_PASSWORD_FORM_VALIDATIONS;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.changePasswordForm = new FormGroup(
      {
        currentPassword: new FormControl('', [Validators.required]),
        password: new FormControl('', [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/,
          ),
        ]),
        confirmPassword: new FormControl('', [Validators.required]),
      },
      { validators: passwordMatchValidator },
    );
  }

  showDialog(): void {
    this.visible.set(true);
  }

  onChangePassword(): void {
    if (this.changePasswordForm.valid) {
      this.authService
        .changePassword(
          this.changePasswordForm.value.currentPassword,
          this.changePasswordForm.value.password,
          this.changePasswordForm.value.confirmPassword,
        )
        // Take until destroy is theoretically not needed, but it's a good practice to use it
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          tap(() => this.visible.set(false)),
        )
        .subscribe();
    }
  }
}
