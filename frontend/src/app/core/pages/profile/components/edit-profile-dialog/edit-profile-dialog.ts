import {
  Component,
  inject,
  signal,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { UserApiService } from '../../../../services/user-api-service';
import { UserStore } from '../../../../store/user.store';
import {
  ReactiveFormsModule,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { DeepSignal } from '@ngrx/signals';
import { User } from '../../../../models/auth/user.model';
import { TranslateModule } from '@ngx-translate/core';
import { Dialog } from '../../../../components';
import { InputFieldSignalForms } from '../../../../components/input-field-signal-forms/input-field-signal-forms';
import { form, FormField, maxLength, submit } from '@angular/forms/signals';
import { DatePicker } from 'primeng/datepicker';
import { EditForm } from '../../../../models/auth';

const initialFormModel: EditForm = {
  firstName: '',
  lastName: '',
  birthDate: null,
  aboutMe: '',
};

@Component({
  selector: 'app-edit-profile-dialog',
  imports: [
    Dialog,
    ButtonModule,
    ReactiveFormsModule,
    TranslateModule,
    InputFieldSignalForms,
    FormField,
    DatePicker
  ],
  templateUrl: './edit-profile-dialog.html',
  styleUrl: './edit-profile-dialog.scss',
})
export class EditProfileDialog {
  private userApiService = inject(UserApiService);
  private userStore = inject(UserStore);

  visible = signal<boolean>(false);
  user: DeepSignal<User | null> = this.userStore.me.data;

  editFormModel = signal<EditForm>(initialFormModel)
  editForm = form(this.editFormModel, (schemaPath) => {
    maxLength(schemaPath.aboutMe, 255, { message: 'editProfileValidations.aboutMeMaxLength' });
  });

  showDialog(): void {
    const currentUser = this.user();
    if (currentUser) {
      this.editFormModel.update(_ => ({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        birthDate: currentUser.birthDate ? new Date(currentUser.birthDate) : null,
        aboutMe: currentUser.aboutMe || '',
      }));
    }
    this.visible.set(true);
  }

  async onEdit(event: Event): Promise<void> {
    event.preventDefault();
    const user = this.user();
    if (!user) {
      return;
    }

    await submit(this.editForm, async (f) => {
      try {
        const formValue = f().value();
        await firstValueFrom(this.userApiService.editMe({ id: user.id, ...formValue }));
        this.changeVisibility(false);
        return undefined;
      } catch (err) {
        return [
          {
            field: f,
            kind: 'auth',
            message: err instanceof Error && err.message || 'editProfile.editProfileError',
          },
        ];
      }
    });
  }

  changeVisibility(isVisible: boolean): void {
    this.visible.set(isVisible);

    if (!isVisible) {
      this.editForm().reset(initialFormModel);
    }
  }
}
