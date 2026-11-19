import { AuthService } from './../../services/auth-service';
import { AnalyticsService } from '../../services/analytics-service';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';

import { LoginCredentials } from '../../models/auth';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { PageTitle, AnalyticsEventType, AppRoutePath, ModalType } from '../../constants';
import { Settings } from '../../components/settings/settings';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ModalService } from '../../services/modal.service';
import { form, required, FormField, minLength, submit } from '@angular/forms/signals'
import { InputFieldSignalForms } from '../../components/input-field-signal-forms/input-field-signal-forms';

@Component({
  selector: 'app-login',
  imports: [ButtonModule, FormField, MessageModule, CardModule, Settings, TranslateModule, InputFieldSignalForms],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private authService = inject(AuthService);
  private analyticsService = inject(AnalyticsService);
  private router = inject(Router);
  private titleService = inject(Title);
  private destroyRef = inject(DestroyRef);
  private modalService = inject(ModalService);

  loginFormModel = signal<LoginCredentials>({
    identifier: '',
    password: ''
  })
  loginForm = form(this.loginFormModel, (fieldPath) => {
    required(fieldPath.identifier, { message: 'login.emailOrUsernameRequired' });
    required(fieldPath.password, { message: 'login.passwordRequired' });
    minLength(fieldPath.password, 8, { message: 'login.passwordMinLength' });
  });

  ngOnInit(): void {
    this.titleService.setTitle(PageTitle.PULSAR_LOGIN);
    this.trackPageView();
  }

  trackPageView(): void {
    this.analyticsService.track(AnalyticsEventType.PAGE_VIEW_LOGIN).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  async onLogin(event: Event): Promise<void> {
    event.preventDefault();

    await submit(this.loginForm, async (f) => {
      try {
        await firstValueFrom(this.authService.login(f().value()));
        return undefined; // Succsess
      } catch (err) {
        // throwError from AuthService
        return [
          {
            field: f, // Form-wide error
            kind: 'auth',
            message: err instanceof Error && err?.message || 'login.loginError',
          },
        ];
      }
    });
  }

  onRegister(): void {
    this.router.navigate([`/${AppRoutePath.REGISTER}`]);
  }

  openPrivacyPolicy(): void {
    this.modalService.open(ModalType.PRIVACY);
  }
}
