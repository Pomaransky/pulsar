import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import {
  PostForm,
  PostCard,
  type PostFormSubmit,
  PostsList,
  Spinner,
} from '../../components';
import { TranslateModule } from '@ngx-translate/core';
import { PostsStore } from '../../store/posts.store';
import { PostApi } from '../../services/post-api';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-post',
  imports: [
    PostForm,
    PostCard,
    PostsList,
    TranslateModule,
    ButtonModule,
    Spinner,
  ],
  templateUrl: './post.html',
  styleUrl: './post.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Post implements OnInit, OnDestroy {
  private postsStore = inject(PostsStore);
  private postApi = inject(PostApi);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  post = this.postsStore.currentPost;
  isPostLoading = this.postsStore.isCurrentPostLoading;

  constructor() {
    effect(() => {
      if (this.postsStore.currentPostError()) {
        this.router.navigate(['/']);
      }
    });
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((params) => params.get('id')!),
      )
      .subscribe((documentId) => this.postsStore.loadCurrentPost(documentId));
  }

  ngOnDestroy(): void {
    this.postsStore.clearCurrentPost();
  }

  showCommentForm = signal(false);
  commentFormRef = viewChild<PostForm>('commentFormRef');

  toggleCommentForm(): void {
    this.showCommentForm.update((v) => !v);
  }

  onCommentSubmit(payload: PostFormSubmit): void {
    if (!payload.parentDocumentId) return;
    this.postApi
      .addPost(payload.content, payload.parentDocumentId, payload.media)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (post) => {
          this.postsStore.prependPost(post, payload.parentDocumentId);
          this.commentFormRef()?.reset();
          this.showCommentForm.set(false);
        },
      });
  }
}
