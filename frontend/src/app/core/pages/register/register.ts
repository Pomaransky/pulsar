import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import {
  Validators,
  FormGroup,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { passwordMatchValidator } from '../../directives/password-match-directive';
import { RegisterCredentials } from '../../models';
import { catchError, finalize, of } from 'rxjs';
import { AuthService } from '../../services/auth-service';
import { AnalyticsService } from '../../services/analytics-service';
import { Router } from '@angular/router';
import { REGISTER_VALIDATIONS } from './constants/register-form-validations.const';
import { InputField } from '../../components';
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

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    MessageModule,
    InputField,
    TranslateModule,
    Settings,
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnInit {
  private authService = inject(AuthService);
  private analyticsService = inject(AnalyticsService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private titleService = inject(Title);
  private modalService = inject(ModalService);

  registerForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  validations = REGISTER_VALIDATIONS;

  constructor() {
    this.initRegisterForm();
  }

  ngOnInit(): void {
    this.titleService.setTitle(PageTitle.PULSAR_REGISTER);
    this.analyticsService
      .track(AnalyticsEventType.PAGE_VIEW_REGISTER)
      .subscribe();
  }

  private initRegisterForm(): void {
    this.registerForm = new FormGroup(
      {
        username: new FormControl('', [Validators.required]),
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/,
          ),
        ]),
        confirmPassword: new FormControl('', [Validators.required]),
      },
      {
        validators: passwordMatchValidator,
      },
    );
  }

  onRegister(): void {
    if (this.registerForm.valid) {
      this.errorMessage = '';
      this.isLoading = true;
      const credentials: RegisterCredentials = {
        username: this.registerForm.value.username,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
      };

      this.authService
        .register(credentials)
        .pipe(
          catchError((error) => {
            this.errorMessage = error.message;
            return of(null);
          }),
          finalize(() => {
            this.isLoading = false;
            this.cdr.detectChanges();
          }),
        )
        .subscribe();
    }
  }

  onLogin(): void {
    this.router.navigate([`/${AppRoutePath.LOGIN}`]);
  }

  openPrivacyPolicy(): void {
    this.modalService.open(ModalType.PRIVACY);
  }
}
