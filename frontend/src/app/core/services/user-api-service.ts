import { inject, Injectable } from '@angular/core';
import { StrapiRefUid } from '../models';
import { ApiService } from './api-service';
import {
  catchError,
  finalize,
  Observable,
  of,
  tap,
  throwError,
  switchMap,
} from 'rxjs';
import { UserStore } from '../store/user.store';
import { Paginated, TableLoadParams, User, UserBanUpdate } from '../models';
import { ToastService } from './toast-service';
import { tableLoadParamsToStrapiQuery } from '../utils/table-load-params-to-query';
import { TranslateService } from '@ngx-translate/core';
import { FileApiService } from './file-api-service';

@Injectable({
  providedIn: 'root',
})
export class UserApiService extends ApiService {
  private userStore = inject(UserStore);
  private toastService = inject(ToastService);
  private translate = inject(TranslateService);
  private fileApiService = inject(FileApiService);

  constructor() {
    super();
  }

  uploadAvatar(
    file: File,
    userId: number,
    currentAvatarId: string | null,
  ): Observable<unknown> {
    return this.fileApiService
      .uploadFile(file, StrapiRefUid.USER, userId, 'avatar')
      .pipe(
        switchMap(() =>
          currentAvatarId
            ? this.fileApiService.deleteFile(currentAvatarId)
            : of(null),
        ),
        tap((res) => {
          console.log(res);
          this.toastService.successToast(
            this.translate.instant('upload.success'),
          );
        }),
        catchError((err) => {
          this.toastService.errorToast(this.translate.instant('upload.error'));
          return throwError(() => err);
        }),
      );
  }

  getMe(): Observable<User | null> {
    this.userStore.setMeLoading(true);
    return this.get<User>('users/me?populate=role&populate=avatar').pipe(
      tap((user) => {
        this.userStore.setMe(user);
      }),
      catchError(() => {
        return of(null);
      }),
      finalize(() => {
        this.userStore.setMeLoading(false);
      }),
    );
  }

  editMe(
    user: Pick<User, 'id' | 'firstName' | 'lastName' | 'birthDate' | 'aboutMe'>,
  ): Observable<User | null> {
    return this.put<User>(`user/me`, user).pipe(
      tap(() => {
        this.toastService.successToast(
          this.translate.instant('user.userDataUpdated'),
        );
      }),
      switchMap(() => this.getMe()),
      catchError((error) => {
        const msg =
          error.error?.error?.message ??
          this.translate.instant('user.userDataUpdateError');
        this.toastService.errorToast(msg);
        return throwError(() => new Error(msg));
      }),
    );
  }

  getUsers(params: TableLoadParams): Observable<Paginated<User>> {
    const { page, pageSize } = params;
    const { sort, filter } = tableLoadParamsToStrapiQuery(params);
    const base = `users?populate=role&pagination[page]=${page}&pagination[pageSize]=${pageSize}&filters[role][type][$eq]=authenticated`;
    const url = `${base}${sort}${filter}`;
    return this.get<Paginated<User>>(url).pipe(
      catchError(() => {
        const msg = this.translate.instant('user.usersFetchError');
        this.toastService.errorToast(msg);
        return throwError(() => new Error(msg));
      }),
    );
  }

  getUser(id: string): Observable<User> {
    return this.get<User>(`users/${id}?populate=role&populate=avatar`);
  }

  updateUserBan(userId: string, ban: UserBanUpdate): Observable<User> {
    return this.put<User>(`users/${userId}`, ban).pipe(
      tap(() => {
        const messageKey =
          ban.banType == null ? 'user.userBanRemoved' : 'user.userBanApplied';
        this.toastService.successToast(this.translate.instant(messageKey));
      }),
      catchError((error) => {
        const msg =
          error.error?.error?.message ||
          this.translate.instant('user.updateBanError');
        this.toastService.errorToast(msg);
        return throwError(() => new Error(msg));
      }),
    );
  }
}
