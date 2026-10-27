import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, ViewChild } from '@angular/core';
import { UsersStore } from '../../store/users.store';
import { UserApiService } from '../../services/user-api-service';
import { TableModule } from 'primeng/table';
import { User, RowActionItem, TableLoadParams } from '../../models';
import { TagModule } from 'primeng/tag';
import { ApplyBanDialog, DetailsDialog } from './components';
import { Table } from '../../components';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { USERS_TABLE_CONFIG } from './constants/users-table-config.const';
import { Title } from '@angular/platform-browser';
import { PageTitle } from '../../constants';

@Component({
  selector: 'app-users',
  imports: [TableModule, TagModule, Table, DetailsDialog, ApplyBanDialog],
  templateUrl: './users.html',
  styleUrl: './users.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [UsersStore],
})
export class Users implements OnInit {
  @ViewChild(DetailsDialog) detailsDialog!: DetailsDialog;
  @ViewChild(ApplyBanDialog) applyBanDialog!: ApplyBanDialog;

  private userService = inject(UserApiService);
  private usersStore = inject(UsersStore);
  private destroyRef = inject(DestroyRef);
  private titleService = inject(Title);
  private translate = inject(TranslateService);

  usersTableConfig = USERS_TABLE_CONFIG;

  usersData = this.usersStore.users;
  totalRecords = this.usersStore.totalRecords;
  isUsersLoading = this.usersStore.isLoading;

  ngOnInit(): void {
    this.titleService.setTitle(PageTitle.PULSAR_USERS);
  }

  onTableLoad(params: TableLoadParams): void {
    this.usersStore.load(params);
  }

  rowActions(user: User): RowActionItem[] {
    const hasBan = !!user.banType;

    return [
      {
        label: this.translate.instant('users.ban.applyAction'),
        icon: 'pi pi-ban',
        actionId: 'applyBan',
      },
      {
        label: this.translate.instant('users.ban.removeAction'),
        icon: 'pi pi-unlock',
        disabled: !hasBan,
        actionId: 'removeBan',
      },
      {
        label: this.translate.instant('users.details'),
        icon: 'pi pi-info-circle',
        actionId: 'details',
      },
    ];
  }

  onRowAction(user: User, actionId: string): void {
    switch (actionId) {
      case 'applyBan':
        this.applyBanDialog.showDialog(user);
        break;
      case 'removeBan':
        this.removeUserBan(user);
        break;
      case 'details':
        this.detailsDialog.showDialog(user.id);
        break;
    }
  }

  private removeUserBan(user: User): void {
    this.userService
      .updateUserBan(user.id.toString(), {
        banType: null,
        banExpiresAt: null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.usersStore.reload());
  }
}
