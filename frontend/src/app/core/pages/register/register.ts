import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { RegisterCredentials } from '../../models';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth-service';
import { AnalyticsService } from '../../services/analytics-service';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import {
  PageTitle,
  AnalyticsEventType,
  AppRoutePath,
  ModalType,
} from '../../constants';
import { Settings } from '../../components/settings/settings';
import { ModalService } from '../../services/modal.service';
import { email, form, FormField, minLength, pattern, required, submit } from '@angular/forms/signals';
import { fieldsMatchValidator } from '../../validators/fields-match.validator';
import { InputFieldSignalForms } from '../../components/input-field-signal-forms/input-field-signal-forms';

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-register',
  imports: [
    CardModule,
    ButtonModule,
    MessageModule,
    TranslateModule,
    Settings,
    InputFieldSignalForms,
    FormField
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnInit {
  private authService = inject(AuthService);
  private analyticsService = inject(AnalyticsService);
  private router = inject(Router);
  private titleService = inject(Title);
  private modalService = inject(ModalService);

  registerFormModel = signal<RegisterForm>({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  registerForm = form(this.registerFormModel, (schemaPath) => {
    required(schemaPath.username, { message: 'registerValidations.usernameRequired' });
    required(schemaPath.email, { message: 'registerValidations.emailRequired' });
    email(schemaPath.email, { message: 'registerValidations.invalidEmail' });
    required(schemaPath.password, { message: 'registerValidations.passwordRequired' });
    minLength(schemaPath.password, 8, { message: 'registerValidations.passwordMinLength' });
    pattern(schemaPath.password, /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/, { message: 'registerValidations.passwordPattern' });
    required(schemaPath.confirmPassword, { message: 'registerValidations.confirmPasswordRequired' });
    fieldsMatchValidator(schemaPath.confirmPassword, schemaPath.password, {
      kind: 'passwordMismatch',
      message: 'registerValidations.passwordsMismatch'
    })
  });

  ngOnInit(): void {
    this.titleService.setTitle(PageTitle.PULSAR_REGISTER);
    this.analyticsService
      .track(AnalyticsEventType.PAGE_VIEW_REGISTER)
      .subscribe();
  }

  async onRegister(event: Event): Promise<void> {
    event.preventDefault();

    await submit(this.registerForm, async (f) => {
      try {
        const formValue = f().value();
        const credentials: RegisterCredentials = {
          username: formValue.username,
          email: formValue.email,
          password: formValue.password,
        };

        await firstValueFrom(this.authService.register(credentials));
        return undefined;
      } catch (err) {
        return [
          {
            field: f,
            kind: 'auth',
            message: err instanceof Error && err.message || 'register.registerError',
          },
        ];
      }
    });
  }

  onLogin(): void {
    this.router.navigate([`/${AppRoutePath.LOGIN}`]);
  }

  openPrivacyPolicy(): void {
    this.modalService.open(ModalType.PRIVACY);
  }
}
