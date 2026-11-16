import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterOutlet,
} from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { TranslateModule } from '@ngx-translate/core';
import { Dialog, PrivacyPolicyContent } from './core/components';
import { ModalService } from './core/services/modal.service';
import { ModalType } from './core/constants';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    ToastModule,
    TranslateModule,
    Dialog,
    PrivacyPolicyContent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: {
    '(window:resize)': 'onResize()',
  },
})
export class App implements OnInit {
  private readonly mobileBreakpoint = 768;
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  readonly modalType = ModalType;
  modalService = inject(ModalService);
  showPrivacyHeaderClose = this.checkIsMobileViewport();

  ngOnInit(): void {
    this.syncModalFromRoute();

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.syncModalFromRoute());
  }

  onResize(): void {
    this.showPrivacyHeaderClose = this.checkIsMobileViewport();
  }

  private syncModalFromRoute(): void {
    const modalParam = this.activatedRoute.snapshot.queryParamMap.get(
      this.modalService.queryParam,
    );
    this.modalService.syncFromRoute(modalParam);
  }

  private checkIsMobileViewport(): boolean {
    return typeof window !== 'undefined'
      ? window.innerWidth < this.mobileBreakpoint
      : false;
  }
}
