import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { UserStore } from '../../store/user.store';
import { Spinner, DataRow, Avatar } from '../../components';
import { ButtonModule } from 'primeng/button';
import { EditProfileDialog } from './components/edit-profile-dialog/edit-profile-dialog';
import { DeepSignal } from '@ngrx/signals';
import { User } from '../../models/auth/user.model';
import { DatePipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { Title } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { PageTitle } from '../../constants';
import {
  FileSelectEvent,
  FileUpload,
  FileUploadModule,
} from 'primeng/fileupload';
import { FileValidationService } from '../../services/file-validation.service';
import { UserApiService } from '../../services/user-api-service';
import { switchMap } from 'rxjs';
import { TooltipModule } from 'primeng/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangePasswordDialog } from './components/change-password-dialog/change-password-dialog';
import { ProfileTabs } from './components/profile-tabs/profile-tabs';

@Component({
  selector: 'app-profile',
  imports: [
    Spinner,
    ButtonModule,
    DataRow,
    EditProfileDialog,
    DatePipe,
    CardModule,
    Avatar,
    TranslateModule,
    FileUploadModule,
    TooltipModule,
    ChangePasswordDialog,
    ProfileTabs,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private userStore = inject(UserStore);
  private titleService = inject(Title);
  private userApiService = inject(UserApiService);
  private fileValidation = inject(FileValidationService);
  private destroyRef = inject(DestroyRef);

  avatarMaxFileSize = 3 * 1024 * 1024; // 3 MB
  avatarAcceptTypes = ['image/jpeg', 'image/png'];

  user: DeepSignal<User | null> = this.userStore.me.data;
  isUserLoading: DeepSignal<boolean> = this.userStore.me.isLoading;

  @ViewChild(EditProfileDialog) editProfileDialog!: EditProfileDialog;
  @ViewChild(ChangePasswordDialog) changePasswordDialog!: ChangePasswordDialog;
  @ViewChild('avatarUpload') avatarUpload!: FileUpload;

  onEdit(): void {
    this.editProfileDialog.showDialog();
  }

  onChangePassword(): void {
    this.changePasswordDialog.showDialog();
  }

  onChangeAvatar(event: FileSelectEvent): void {
    const file = event.files?.[0];
    const currentUser = this.user();
    if (!currentUser || !file || currentUser.id === null) return;

    if (
      !this.fileValidation.validateFile(file, {
        maxFileSize: this.avatarMaxFileSize,
        acceptFileTypes: this.avatarAcceptTypes,
      })
    ) {
      this.avatarUpload?.clear();
      return;
    }

    const currentAvatarId = currentUser.avatar?.id?.toString() ?? null;
    this.userApiService
      .uploadAvatar(file, currentUser.id, currentAvatarId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.userApiService.getMe()),
      )
      .subscribe();
  }

  ngOnInit(): void {
    this.titleService.setTitle(PageTitle.PULSAR_PROFILE);
  }
}
