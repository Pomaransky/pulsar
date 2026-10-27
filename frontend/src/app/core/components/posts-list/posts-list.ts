import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  OnInit,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { PostsQuery, PostsStore } from '../../store/posts.store';
import { TranslateModule } from '@ngx-translate/core';
import { PostCard } from '../post-card/post-card';
import { InfiniteScrollDirective } from '../../directives/infinite-scroll.directive';
import { Spinner } from '../spinner/spinner';

@Component({
  selector: 'app-posts-list',
  imports: [PostCard, Spinner, InfiniteScrollDirective, TranslateModule],
  templateUrl: './posts-list.html',
  styleUrl: './posts-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostsList implements OnInit, OnChanges {
  @Input() parentDocumentId: string | undefined = undefined;
  @Input() authorDocumentId: string | undefined = undefined;
  private postStore = inject(PostsStore);

  postsData = this.postStore.posts.data.data;
  isPostsLoading = this.postStore.posts.isLoading;
  hasMorePosts = this.postStore.hasMorePosts;

  ngOnInit(): void {
    if (!this.parentDocumentId && !this.authorDocumentId) {
      this.postStore.loadPosts(this.query());
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['parentDocumentId'] || changes['authorDocumentId']) {
      this.postStore.loadPosts(this.query());
    }
  }

  onInfiniteScroll(): void {
    this.postStore.loadMorePosts(this.query());
  }

  private query(): PostsQuery {
    return {
      parentDocumentId: this.parentDocumentId,
      authorDocumentId: this.authorDocumentId,
    };
  }
}
