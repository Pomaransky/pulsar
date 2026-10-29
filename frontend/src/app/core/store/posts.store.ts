import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { Paginated, Post, TableLoadParams } from '../models';
import { emptyPaginated } from '../utils/empty-paginated';
import { rxResource, toObservable } from '@angular/core/rxjs-interop';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, pipe, switchMap, tap } from 'rxjs';
import { PostApi } from '../services/post-api';

export const DEFAULT_POSTS_LOAD_PARAMS: TableLoadParams = {
  page: 1,
  pageSize: 10,
  sort: { field: 'createdAt', order: 'desc' },
};

export interface PostsQuery {
  parentDocumentId?: string;
  authorDocumentId?: string;
}

interface PostsState {
  posts: {
    data: Paginated<Post>;
    isLoading: boolean;
    lastLoadParams: TableLoadParams;
  };
  currentPostId: string | undefined;
}

const initialState: PostsState = {
  posts: {
    data: emptyPaginated<Post>(),
    isLoading: false,
    lastLoadParams: DEFAULT_POSTS_LOAD_PARAMS,
  },
  currentPostId: undefined,
};

function patchPostInList(
  posts: Paginated<Post>,
  postDocumentId: string,
  patch: Partial<Post>,
): Paginated<Post> {
  return {
    ...posts,
    data: posts.data.map((post) =>
      post.documentId === postDocumentId ? { ...post, ...patch } : post,
    ),
  };
}

export const PostsStore = signalStore(
  withState<PostsState>(initialState),
  withProps(({ posts, currentPostId }) => {
    const postApi = inject(PostApi);
    return {
      posts$: toObservable(posts),
      _currentPostResource: rxResource({
        params: () => currentPostId(),
        stream: ({ params }) => postApi.getPost(params),
      }),
    };
  }),
  withComputed(({ posts, _currentPostResource }) => ({
    hasMorePosts: computed(() => {
      const { page, pageCount, total } = posts().data.meta.pagination;
      return page < pageCount && total > 0;
    }),
    currentPost: computed(() =>
      _currentPostResource.hasValue() ? _currentPostResource.value() : null,
    ),
    isCurrentPostLoading: _currentPostResource.isLoading,
    currentPostError: _currentPostResource.error,
  })),
  withMethods((store) => ({
    resetPostsLoadParams() {
      patchState(store, {
        posts: { ...store.posts(), lastLoadParams: DEFAULT_POSTS_LOAD_PARAMS },
      });
    },
    addPosts(posts: Paginated<Post>) {
      const current = store.posts().data;
      const params = store.posts().lastLoadParams;
      const existingIds = new Set(current.data.map((p) => p.documentId));
      const newPosts = posts.data.filter((p) => !existingIds.has(p.documentId));
      const merged: Paginated<Post> = {
        ...current,
        data: [...current.data, ...newPosts],
        meta: posts.meta,
      };
      patchState(store, {
        posts: {
          ...store.posts(),
          data: merged,
          lastLoadParams: {
            ...params,
            page: posts.meta.pagination.page,
            pageSize: posts.meta.pagination.pageSize,
          },
        },
      });
    },
    resetPosts() {
      patchState(store, {
        posts: { ...store.posts(), data: emptyPaginated<Post>() },
      });
    },
    setPostsLoading(isLoading: boolean) {
      patchState(store, { posts: { ...store.posts(), isLoading } });
    },
    loadCurrentPost(documentId: string) {
      patchState(store, { currentPostId: documentId });
    },
    clearCurrentPost() {
      patchState(store, { currentPostId: undefined });
    },
    patchPostLike(postDocumentId: string, liked: boolean, likesTotal: number) {
      const postsData = store.posts().data;
      patchState(store, {
        posts: {
          ...store.posts(),
          data: patchPostInList(postsData, postDocumentId, {
            likedByMe: liked,
            likesTotal,
          }),
        },
      });

      const currentPost = store.currentPost();
      if (currentPost?.documentId === postDocumentId) {
        store._currentPostResource.set({
          ...currentPost,
          likedByMe: liked,
          likesTotal,
        });
      }
    },
    prependPost(post: Post, parentDocumentId?: string) {
      const current = store.posts().data;
      const merged: Paginated<Post> = {
        ...current,
        data: [post, ...current.data],
        meta: {
          ...current.meta,
          pagination: {
            ...current.meta.pagination,
            total: current.meta.pagination.total + 1,
          },
        },
      };
      patchState(store, { posts: { ...store.posts(), data: merged } });

      const currPost = store.currentPost();
      if (parentDocumentId && currPost?.documentId === parentDocumentId) {
        store._currentPostResource.set({
          ...currPost,
          commentsTotal: (currPost.commentsTotal ?? 0) + 1,
        });
      }
    },
  })),
  withMethods((store) => {
    const postApi = inject(PostApi);

    const fetchPosts = rxMethod<{ query: PostsQuery; params: TableLoadParams }>(
      pipe(
        tap(() => store.setPostsLoading(true)),
        switchMap(({ query, params }) =>
          postApi
            .getPosts(params, query.parentDocumentId, query.authorDocumentId)
            .pipe(
              tap((posts) => {
                store.addPosts(posts);
                store.setPostsLoading(false);
              }),
              catchError(() => {
                store.setPostsLoading(false);
                return EMPTY;
              }),
            ),
        ),
      ),
    );

    return {
      loadPosts(query: PostsQuery) {
        store.resetPostsLoadParams();
        store.resetPosts();
        fetchPosts({ query, params: store.posts().lastLoadParams });
      },
      loadMorePosts(query: PostsQuery) {
        if (!store.hasMorePosts() || store.posts.isLoading()) return;
        const params = store.posts().lastLoadParams;
        fetchPosts({ query, params: { ...params, page: params.page + 1 } });
      },
    };
  }),
);
