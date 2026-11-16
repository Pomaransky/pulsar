import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { TableColumnType, UserBanType } from '../../../../models';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-table-cell',
  imports: [TagModule, DatePipe, TranslateModule],
  templateUrl: './table-cell.html',
  styleUrl: './table-cell.scss',
})
export class TableCell {
  @Input({ required: true }) value!: string | Date | undefined | null;
  @Input({ required: true }) columnType!: TableColumnType;
  @Input({ required: true }) columnKey!: string;

  readonly TableColumnType = TableColumnType;

  get tagValue(): string {
    if (this.columnKey === 'confirmed') {
      return this.value ? 'profile.confirmed' : 'profile.notConfirmed';
    }
    if (this.columnKey === 'banType') {
      return this.getBanTypeLabel(this.value as string);
    }
    return '';
  }

  get tagSeverity(): 'success' | 'danger' | 'warn' | 'info' {
    if (this.columnKey === 'confirmed') {
      return this.value ? 'success' : 'danger';
    }
    if (this.columnKey === 'banType') {
      return this.getBanTypeSeverity(this.value as string);
    }
    return 'success';
  }

  private getBanTypeLabel(banType: string | null | undefined): string {
    switch (banType) {
      case UserBanType.SHADOW:
        return 'users.ban.type.shadow';
      case UserBanType.TIME:
        return 'users.ban.type.time';
      case UserBanType.PERM:
        return 'users.ban.type.perm';
      default:
        return 'users.ban.type.active';
    }
  }

  private getBanTypeSeverity(
    banType: string | null | undefined,
  ): 'success' | 'danger' | 'warn' | 'info' {
    switch (banType) {
      case UserBanType.SHADOW:
        return 'warn';
      case UserBanType.TIME:
      case UserBanType.PERM:
        return 'danger';
      default:
        return 'success';
    }
  }
}
