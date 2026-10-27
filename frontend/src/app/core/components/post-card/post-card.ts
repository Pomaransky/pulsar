import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  Input,
  signal,
} from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { CardModule } from 'primeng/card';
import { Avatar } from '../avatar/avatar';
import { RichTextToPlainPipe } from '../../pipes/rich-text-to-plain.pipe';
import { DateFromNowPipe } from '../../pipes/from-now.pipe';
import { TooltipModule } from 'primeng/tooltip';
import { Post } from '../../models';
import { PostsStore } from '../../store/posts.store';
import { UserStore } from '../../store/user.store';
import { LikeApi } from '../../services/like-api';
import { ToastService } from '../../services/toast-service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-post-card',
  imports: [
    DatePipe,
    DateFromNowPipe,
    NgTemplateOutlet,
    CardModule,
    Avatar,
    RichTextToPlainPipe,
    TooltipModule,
    TranslateModule,
  ],
  templateUrl: './post-card.html',
  styleUrl: './post-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostCard {
  private router = inject(Router);
  private postsStore = inject(PostsStore);
  private userStore = inject(UserStore);
  private likeApi = inject(LikeApi);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  @Input({ required: true }) post!: Post;
  @Input() link = false;
  @Input() isMainPost = false;

  isTogglingLike = signal(false);
  me = this.userStore.me.data;

  navigateToPost(post: Post): void {
    this.router.navigate(['/post', post.documentId]);
  }

  toggleLike(event: Event): void {
    event.stopPropagation();

    if (!this.me() || this.isTogglingLike()) {
      return;
    }

    this.isTogglingLike.set(true);
    this.likeApi
      .toggleLike(this.post.documentId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(({ liked, likesTotal }) =>
          this.postsStore.patchPostLike(
            this.post.documentId,
            liked,
            likesTotal,
          ),
        ),
        catchError((error: Error) => {
          this.toastService.errorToast(error.message);
          return EMPTY;
        }),
        finalize(() => this.isTogglingLike.set(false)),
      )
      .subscribe();
  }
}
