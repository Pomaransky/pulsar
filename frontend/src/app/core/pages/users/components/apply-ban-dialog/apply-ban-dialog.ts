import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Dialog, InputField } from '../../../../components';
import { User, UserBanType, SelectOption } from '../../../../models';
import { UserApiService } from '../../../../services/user-api-service';
import { UsersStore } from '../../../../store/users.store';
import {
  BAN_DURATION_PRESETS,
  BAN_TYPE_OPTIONS,
} from '../../constants/ban-options.const';

@Component({
  selector: 'app-apply-ban-dialog',
  imports: [
    Dialog,
    ButtonModule,
    ReactiveFormsModule,
    InputField,
    TranslateModule,
  ],
  templateUrl: './apply-ban-dialog.html',
  styleUrl: './apply-ban-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplyBanDialog implements OnInit {
  private userApiService = inject(UserApiService);
  private usersStore = inject(UsersStore);
  private destroyRef = inject(DestroyRef);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);

  visible = signal(false);
  selectedUser = signal<User | null>(null);
  banTypeOptions: SelectOption<UserBanType>[] = [];
  durationOptions: SelectOption<number>[] = [];

  banForm!: FormGroup<{
    banType: FormControl<UserBanType>;
    durationMinutes: FormControl<number>;
  }>;

  readonly UserBanType = UserBanType;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.banForm = new FormGroup({
      banType: new FormControl<UserBanType>(UserBanType.PERM, {
        nonNullable: true,
        validators: Validators.required,
      }),
      durationMinutes: new FormControl(5, {
        nonNullable: true,
        validators: Validators.required,
      }),
    });

    this.banForm.controls.banType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());
  }

  showDialog(user: User): void {
    this.selectedUser.set(user);
    this.banTypeOptions = BAN_TYPE_OPTIONS.map((option) => ({
      value: option.value,
      label: this.translate.instant(option.label),
    }));
    this.durationOptions = BAN_DURATION_PRESETS.map((option) => ({
      value: option.minutes,
      label: this.translate.instant(option.label),
    }));
    this.banForm.reset({
      banType: UserBanType.PERM,
      durationMinutes: 5,
    });
    this.visible.set(true);
  }

  onApply(): void {
    if (this.banForm.invalid) {
      return;
    }

    const user = this.selectedUser();
    if (!user) {
      return;
    }

    const { banType, durationMinutes } = this.banForm.getRawValue();
    const payload = {
      banType,
      ...(banType === UserBanType.TIME
        ? {
            banExpiresAt: new Date(
              Date.now() + durationMinutes * 60 * 1000,
            ).toISOString(),
          }
        : { banExpiresAt: null }),
    };

    this.userApiService
      .updateUserBan(user.id.toString(), payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.visible.set(false)),
      )
      .subscribe(() => this.usersStore.reload());
  }
}
