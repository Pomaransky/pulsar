import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Menu } from 'primeng/menu';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TableColumn, RowActionItem, TableLoadParams } from '../../models';
import { TableCell } from './components/table-cell/table-cell';
import { InputField } from '../input-field/input-field';
import { CardModule } from 'primeng/card';
import { TranslateService } from '@ngx-translate/core';

const SEARCH_DEBOUNCE_MS = 500;

@Component({
  selector: 'app-table',
  imports: [
    TableModule,
    ButtonModule,
    Menu,
    TableCell,
    FormsModule,
    InputField,
    CardModule,
    TranslateModule,
  ],
  templateUrl: './table.html',
  styleUrl: './table.scss',
})
export class Table<T = unknown> implements OnChanges, OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private translate = inject(TranslateService);

  @Input({ required: true }) data!: T[];
  @Input({ required: true }) columns!: TableColumn[];
  @Input({ required: true }) pageSize!: number;
  @Input({ required: true }) totalRecords!: number;
  @Input({ required: true }) isLoading!: boolean;

  @Input() rowActions?: (row: T) => RowActionItem[];
  @Input() onRowAction?: (row: T, actionId: string) => void;

  @Input() showSearch = true;
  @Input() searchPlaceholder = 'table.search';

  @Output() loadParams = new EventEmitter<TableLoadParams>();

  private rowActionsMenuItemsCache = new Map<
    unknown,
    { rowRef: T; items: MenuItem[] }
  >();

  private filterSubject = new Subject<string>();

  sortField: string | undefined = undefined;
  sortOrderNg: number | undefined = undefined;
  filterValue = '';
  private lastEmittedParams: TableLoadParams | null = null;

  ngOnInit(): void {
    this.filterSubject
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value: string) => {
        this.filterValue = value.trim();
        this.cdr.markForCheck();
        this.emitLoad(1);
      });
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.rowActionsMenuItemsCache.clear();
        this.cdr.markForCheck();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) this.rowActionsMenuItemsCache.clear();
  }

  onLazyLoadInternal(event: TableLazyLoadEvent): void {
    const page = event.rows
      ? Math.floor((event.first ?? 0) / event.rows) + 1
      : 1;
    if (typeof event.sortField === 'string')
      this.sortField = event.sortField || undefined;
    if (typeof event.sortOrder === 'number') this.sortOrderNg = event.sortOrder;
    this.emitLoad(page);
  }

  onSearchInput(value: string): void {
    this.filterValue = value;
    this.filterSubject.next(value);
  }

  private emitLoad(page: number): void {
    const order: 'asc' | 'desc' | undefined =
      this.sortOrderNg === 1
        ? 'asc'
        : this.sortOrderNg === -1
          ? 'desc'
          : undefined;
    const sort =
      this.sortField != null && order != null
        ? { field: this.sortField, order }
        : undefined;
    const filterKeys = this.columns
      .filter((c) => c.filterable)
      .map((c) => c.key);
    const filter =
      this.filterValue || filterKeys.length
        ? {
            filter: this.filterValue || undefined,
            filterKeys: filterKeys.length ? filterKeys : undefined,
          }
        : undefined;
    const params: TableLoadParams = {
      page,
      pageSize: this.pageSize,
      sort,
      filter,
    };
    if (this.paramsEqual(this.lastEmittedParams, params)) return;
    this.lastEmittedParams = params;
    this.loadParams.emit(params);
  }

  private paramsEqual(a: TableLoadParams | null, b: TableLoadParams): boolean {
    if (!a) return false;
    return (
      a.page === b.page &&
      JSON.stringify(a.sort) === JSON.stringify(b.sort) &&
      JSON.stringify(a.filter) === JSON.stringify(b.filter)
    );
  }

  getRowActions(row: T): MenuItem[] {
    if (!this.rowActions || !this.onRowAction) return [];

    const r = row as Record<string, unknown> | null | undefined;
    const key = r?.['id'] ?? r?.['documentId'] ?? row;
    const cached = this.rowActionsMenuItemsCache.get(key);
    if (cached && cached.rowRef === row) return cached.items;

    const actions = this.rowActions(row);
    const items = actions.map((item) => ({
      label: item.label,
      icon: item.icon,
      disabled: item.disabled,
      command: () => this.onRowAction!(row, item.actionId),
    }));
    this.rowActionsMenuItemsCache.set(key, { rowRef: row, items });
    return items;
  }
}
