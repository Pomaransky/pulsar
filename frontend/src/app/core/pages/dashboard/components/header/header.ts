import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { menuItems } from '../../../../constants/menu-items.const';
import { MenuItem } from 'primeng/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { Settings } from '../../../../components/settings/settings';

@Component({
  selector: 'app-header',
  imports: [Settings, TranslateModule, ButtonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
  private router = inject(Router);
  private location = inject(Location);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  currentRouteLabel = '';
  showBackButton = false;

  ngOnInit(): void {
    this.updateCurrentRouteLabel();
    this.router.events
      .pipe(
        tap(() => {
          this.updateCurrentRouteLabel();
          this.cdr.detectChanges();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private updateCurrentRouteLabel(): void {
    const currentUrl = this.router.url.split('?')[0];
    const currentMenuItem = menuItems.find((item: MenuItem) => {
      const link = item.routerLink;
      if (typeof link !== 'string') return link === currentUrl;
      const path = link.startsWith('/') ? link : `/${link}`;
      if (path === currentUrl) return true;
      if (path.includes(':')) {
        const pattern = path.replace(/:[^/]+/g, '[^/]+');
        return new RegExp(`^${pattern}$`).test(currentUrl);
      }
      return false;
    });
    this.currentRouteLabel = currentMenuItem?.label ?? '';
    this.showBackButton = currentMenuItem?.visible === false;
  }

  goBack(): void {
    this.location.back();
  }
}
