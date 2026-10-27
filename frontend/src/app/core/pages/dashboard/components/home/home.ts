import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserStore } from '../../../../store/user.store';
import { PostsStore } from '../../../../store/posts.store';
import { PostApi } from '../../../../services/post-api';
import { ButtonModule } from 'primeng/button';
import { PostForm, PostsList } from '../../../../components';
import { Title } from '@angular/platform-browser';
import { PageTitle } from '../../../../constants';

@Component({
  selector: 'app-home',
  imports: [ButtonModule, PostForm, PostsList],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  private postService = inject(PostApi);
  private userStore = inject(UserStore);
  private postsStore = inject(PostsStore);
  private destroyRef = inject(DestroyRef);
  private titleService = inject(Title);

  postFormRef = viewChild.required(PostForm);

  ngOnInit(): void {
    this.titleService.setTitle(PageTitle.PULSAR);
  }

  onPostSubmit(payload: {
    content: string;
    parentDocumentId?: string;
    media?: File;
  }): void {
    const user = this.userStore.me.data();
    if (!user) return;
    this.postService
      .addPost(payload.content, payload.parentDocumentId, payload.media)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (post) => {
          this.postsStore.prependPost(post, payload.parentDocumentId);
          this.postFormRef().reset();
        },
      });
  }
}
