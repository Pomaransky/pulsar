import {
  Component,
  inject,
  OnInit,
  computed,
} from '@angular/core';
import { MenuModule } from 'primeng/menu';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService } from 'primeng/api';
import {
  menuItems,
  MenuItemWithPermissions,
} from '../../../../constants/menu-items.const';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../../services/auth-service';
import { ModalService } from '../../../../services/modal.service';
import { ModalType } from '../../../../constants';
import { UserStore } from '../../../../store/user.store';
import { AppStore } from '../../../../store/app.store';
import { Settings } from '../../../../components/settings/settings';
import { Spinner } from '../../../../components';

@Component({
  selector: 'app-sidebar',
  imports: [
    MenuModule,
    DividerModule,
    ButtonModule,
    Settings,
    TranslateModule,
    Spinner,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  host: {
    '(window:resize)': 'checkWindowDimensions()',
  },
})
export class Sidebar implements OnInit {
  private authService = inject(AuthService);
  private confirmationService = inject(ConfirmationService);
  private userStore = inject(UserStore);
  private translate = inject(TranslateService);
  private appStore = inject(AppStore);
  private modalService = inject(ModalService);

  isUserLoading = this.userStore.me.isLoading;
  items = computed(() => {
    this.appStore.language();
    return this.getFilteredMenuItems();
  });

  isMenuPopup = false;

  ngOnInit(): void {
    this.checkWindowDimensions();
  }

  private getFilteredMenuItems(): MenuItemWithPermissions[] {
    const userRole = this.userStore.me.data()?.role?.type;

    return menuItems.map((item: MenuItemWithPermissions) => {
      const base = {
        ...item,
        label: this.translate.instant(item.label ?? ''),
      };
      if (item.label === 'menu.privacyPolicy') {
        return {
          ...base,
          command: () => this.modalService.open(ModalType.PRIVACY),
        };
      }
      if (item.permissions && item.permissions.length > 0) {
        return {
          ...base,
          visible: userRole ? item.permissions.includes(userRole) : false,
        };
      }
      return base;
    });
  }

  checkWindowDimensions(): void {
    if (window.innerWidth < 768) {
      this.isMenuPopup = true;
    } else {
      this.isMenuPopup = false;
    }
  }

  logout(event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: this.translate.instant('confirmDialog.confirmLogoutMessage'),
      header: this.translate.instant('confirmDialog.confirmLogout'),
      acceptLabel: this.translate.instant('confirmDialog.logout'),
      rejectLabel: this.translate.instant('common.cancel'),
      icon: 'pi pi-sign-out',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-info',
      accept: () => this.authService.logout(),
      reject: () => {
        /* do nothing */
      },
    });
  }
}
