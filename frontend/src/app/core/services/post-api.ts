import { inject, Injectable } from '@angular/core';
import { Paginated, Post, StrapiRefUid, TableLoadParams } from '../models';
import {
  catchError,
  map,
  Observable,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { tableLoadParamsToStrapiQuery } from '../utils/table-load-params-to-query';
import { ApiService } from './api-service';
import { FileApiService } from './file-api-service';
import { ToastService } from './toast-service';
import { UserStore } from '../store/user.store';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class PostApi extends ApiService {
  private userStore = inject(UserStore);
  private toastService = inject(ToastService);
  private translate = inject(TranslateService);
  private fileApiService = inject(FileApiService);

  constructor() {
    super();
  }

  getPost(documentId: string): Observable<Post> {
    return this.get<{ data: Post }>(
      `posts/${documentId}?populate=author.avatar&populate=media`,
    ).pipe(
      map((res) => res.data),
      catchError(() =>
        throwError(
          () => new Error(this.translate.instant('posts.postFetchError')),
        ),
      ),
    );
  }

  getPosts(
    params: TableLoadParams,
    parentId?: string,
    authorDocumentId?: string,
  ): Observable<Paginated<Post>> {
    const { page, pageSize } = params;
    const { sort, filter } = tableLoadParamsToStrapiQuery(params);
    const parent = parentId
      ? `&filters[parent][documentId][$eq]=${parentId}`
      : '&filters[parent][$null]=true';
    const author = authorDocumentId
      ? `&filters[author][documentId][$eq]=${encodeURIComponent(authorDocumentId)}`
      : '';
    const base = `posts?populate=author.avatar&populate=media&pagination[page]=${page}&pagination[pageSize]=${pageSize}`;
    const url = `${base}${sort}${filter}${parent}${author}`;
    return this.get<Paginated<Post>>(url).pipe(
      catchError(() => {
        const msg = this.translate.instant('posts.postsFetchError');
        this.toastService.errorToast(msg);
        return throwError(() => new Error(msg));
      }),
    );
  }

  addPost(
    postContent: string,
    parentDocumentId?: string,
    media?: File,
  ): Observable<Post> {
    const user = this.userStore.me.data();
    if (!user) {
      return throwError(
        () => new Error(this.translate.instant('user.userNotFound')),
      );
    }

    const data: Record<string, unknown> = {
      content: [
        {
          type: 'paragraph',
          children: [{ type: 'text', text: postContent }],
        },
      ],
      author: { set: [user.documentId] },
    };
    if (parentDocumentId) {
      data['parent'] = { set: [parentDocumentId] };
    }

    const isComment = !!parentDocumentId;

    const createPost$ = this.post<{ data: Post }>(
      'posts?populate=author.avatar&populate=media',
      { data },
    ).pipe(map((res) => res.data));

    const post$ = media
      ? createPost$.pipe(
          switchMap((post) => {
            return this.fileApiService
              .uploadFile(media, StrapiRefUid.POST, post.id, 'media')
              .pipe(
                map((uploaded) => ({
                  ...post,
                  media: uploaded[0],
                })),
              );
          }),
        )
      : createPost$;

    return post$.pipe(
      tap(() => {
        if (isComment) {
          this.toastService.successToast(
            this.translate.instant('posts.commentAdded'),
          );
        } else {
          this.toastService.successToast(
            this.translate.instant('posts.postAdded'),
          );
        }
      }),
      catchError((error) => {
        const msg =
          error.error?.error?.message ||
          this.translate.instant(
            isComment ? 'posts.addCommentError' : 'posts.addPostError',
          );
        this.toastService.errorToast(msg);
        return throwError(() => new Error(msg));
      }),
    );
  }
}
