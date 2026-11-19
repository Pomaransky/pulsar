import {
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { UserApiService } from '../../../../services/user-api-service';
import { UserStore } from '../../../../store/user.store';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { DeepSignal } from '@ngrx/signals';
import { User } from '../../../../models/auth/user.model';
import { TranslateModule } from '@ngx-translate/core';
import { InputField, Dialog } from '../../../../components';
import { EDIT_PROFILE_FORM_VALIDATIONS } from '../../constants/edit-profile-form-validations.const';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-edit-profile-dialog',
  imports: [
    Dialog,
    ButtonModule,
    ReactiveFormsModule,
    InputField,
    TranslateModule,
  ],
  templateUrl: './edit-profile-dialog.html',
  styleUrl: './edit-profile-dialog.scss',
})
export class EditProfileDialog {
  private userApiService = inject(UserApiService);
  private userStore = inject(UserStore);
  private destroyRef = inject(DestroyRef);

  visible = signal<boolean>(false);
  user: DeepSignal<User | null> = this.userStore.me.data;
  editForm!: FormGroup;

  validations = EDIT_PROFILE_FORM_VALIDATIONS;

  constructor() {
    effect(() => {
      if (this.user()) {
        this.initForm();
      }
    });
  }

  private initForm(): void {
    this.editForm = new FormGroup({
      firstName: new FormControl(''),
      lastName: new FormControl(''),
      birthDate: new FormControl<Date | null>(null),
      aboutMe: new FormControl('', [Validators.maxLength(255)]),
    });
  }

  showDialog(): void {
    const currentUser = this.user();
    if (currentUser) {
      this.editForm.patchValue({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        birthDate: currentUser.birthDate
          ? new Date(currentUser.birthDate)
          : null,
        aboutMe: currentUser.aboutMe || '',
      });
    }
    this.visible.set(true);
  }

  onEdit(): void {
    const user = this.user();
    if (!user) {
      return;
    }

    this.userApiService
      .editMe({
        id: user.id,
        firstName: this.editForm.value.firstName,
        lastName: this.editForm.value.lastName,
        birthDate: this.editForm.value.birthDate,
        aboutMe: this.editForm.value.aboutMe,
      })
      // Take until destroy is theoretically not needed, but it's a good practice to use it
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.visible.set(false)),
      )
      .subscribe();
  }
}
