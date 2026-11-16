import { AuthService } from './../../services/auth-service';
import { AnalyticsService } from '../../services/analytics-service';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';

import { LoginCredentials } from '../../models/auth';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { PageTitle, AnalyticsEventType, AppRoutePath, ModalType } from '../../constants';
import { Settings } from '../../components/settings/settings';
import { InputField } from '../../components';
import { TranslateModule } from '@ngx-translate/core';
import { LOGIN_FORM_VALIDATIONS } from './constants/login-form-validations.const';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, ButtonModule, InputField, MessageModule, CardModule, DividerModule, Settings, TranslateModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private authService = inject(AuthService);
  private analyticsService = inject(AnalyticsService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private titleService = inject(Title);
  private destroyRef = inject(DestroyRef);
  private modalService = inject(ModalService);

  loginForm!: FormGroup;
  validations = LOGIN_FORM_VALIDATIONS;
  isLoading = false;
  errorMessage = '';

  constructor() {
    this.initLoginForm();
  }

  ngOnInit(): void {
    this.titleService.setTitle(PageTitle.PULSAR_LOGIN);
    this.trackPageView();
  }

  trackPageView(): void {
    this.analyticsService.track(AnalyticsEventType.PAGE_VIEW_LOGIN).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  private initLoginForm(): void {
    this.loginForm = new FormGroup({
      identifier: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    });
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      this.errorMessage = '';
      this.isLoading = true;
      const credentials: LoginCredentials = this.loginForm.value;

      this.authService
        .login(credentials)
        .pipe(
          catchError(error => {
            this.errorMessage = error.message;
            return of(null);
          }),
          finalize(() => {
            this.isLoading = false;
            this.cdr.detectChanges();
          })
        )
        .subscribe();
    }
  }

  onRegister(): void {
    this.router.navigate([`/${AppRoutePath.REGISTER}`]);
  }

  openPrivacyPolicy(): void {
    this.modalService.open(ModalType.PRIVACY);
  }
}
