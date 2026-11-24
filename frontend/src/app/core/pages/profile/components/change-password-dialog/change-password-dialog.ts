import {
  Component,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Dialog } from '../../../../components';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../../services/auth-service';
import { InputFieldSignalForms } from '../../../../components/input-field-signal-forms/input-field-signal-forms';
import { form, FormField, minLength, pattern, required, submit } from '@angular/forms/signals';
import { fieldsMatchValidator } from '../../../../validators/fields-match.validator';
import { firstValueFrom } from 'rxjs';
import { ChangePassword } from '../../../../models/auth';
import { MessageModule } from 'primeng/message';

const initialFormModel = { currentPassword: '', password: "", passwordConfirmation: '' };

@Component({
  selector: 'app-change-password-dialog',
  imports: [
    Dialog,
    ButtonModule,
    TranslateModule,
    InputFieldSignalForms,
    FormField,
    MessageModule
  ],
  templateUrl: './change-password-dialog.html',
  styleUrl: './change-password-dialog.scss',
})
export class ChangePasswordDialog {
  private authService = inject(AuthService);

  visible = signal<boolean>(false);

  changePasswordFormModel = signal<ChangePassword>(initialFormModel)
  changePasswordForm = form(this.changePasswordFormModel, (schemaPath) => {
    required(schemaPath.currentPassword, { message: 'changePasswordValidations.currentPasswordRequired' });
    required(schemaPath.password, { message: 'changePasswordValidations.passwordRequired' });
    required(schemaPath.passwordConfirmation, { message: 'changePasswordValidations.confirmPasswordRequired' });
    minLength(schemaPath.password, 8, { message: 'changePasswordValidations.passwordMinLength' });
    pattern(schemaPath.password, /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/, { message: 'changePasswordValidations.passwordPattern' });
    required(schemaPath.passwordConfirmation, { message: 'changePasswordValidations.confirmPasswordRequired' });
    fieldsMatchValidator(schemaPath.passwordConfirmation, schemaPath.password, {
      kind: 'passwordMismatch',
      message: 'changePasswordValidations.passwordsMismatch'
    })
  });

  showDialog(): void {
    this.visible.set(true);
  }

  async onChangePassword(event: Event): Promise<void> {
    event.preventDefault();

    await submit(this.changePasswordForm, async (f) => {
      try {
        const formValue = f().value();
        await firstValueFrom(this.authService.changePassword(formValue));
        this.changeVisibility(false);
        return undefined;
      } catch (err) {
        return [
          {
            field: f,
            kind: 'auth',
            message: err instanceof Error && err.message || 'changePassword.changePasswordError',
          },
        ];
      }
    });
  }

  changeVisibility(isVisible: boolean): void {
    this.visible.set(isVisible);

    if (!isVisible) {
      this.changePasswordForm().reset(initialFormModel);
    }
  }
}
