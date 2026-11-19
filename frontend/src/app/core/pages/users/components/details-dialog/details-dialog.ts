import { DatePipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { User } from '../../../../models/auth/user.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserApiService } from '../../../../services/user-api-service';
import { finalize, tap } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { Spinner, DataRow, Avatar, Dialog } from '../../../../components';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-details-dialog',
  imports: [
    Dialog,
    Spinner,
    ButtonModule,
    DataRow,
    Avatar,
    TranslateModule,
    DatePipe,
  ],
  templateUrl: './details-dialog.html',
  styleUrl: './details-dialog.scss',
})
export class DetailsDialog {
  private userApiService = inject(UserApiService);
  private destroyRef = inject(DestroyRef);
  visible = signal<boolean>(false);
  user = signal<User | null>(null);
  isLoading = signal<boolean>(false);

  showDialog(id: number): void {
    this.isLoading.set(true);
    this.userApiService
      .getUser(id.toString())
      .pipe(
        tap((user) => {
          this.user.set(user);
        }),
        finalize(() => {
          this.isLoading.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
    this.visible.set(true);
  }
}
