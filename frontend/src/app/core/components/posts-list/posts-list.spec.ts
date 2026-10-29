import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, SimpleChange } from '@angular/core';
import { PostsStore } from '../../store/posts.store';
import { PostsList } from './posts-list';

describe('PostsList', () => {
  let component: PostsList;
  let fixture: ComponentFixture<PostsList>;
  let postsStore: jasmine.SpyObj<
    Pick<InstanceType<typeof PostsStore>, 'loadPosts' | 'loadMorePosts'>
  >;

  beforeEach(async () => {
    postsStore = Object.assign(
      jasmine.createSpyObj('PostsStore', ['loadPosts', 'loadMorePosts']),
      {
        posts: { data: { data: signal([]) }, isLoading: signal(false) },
        hasMorePosts: signal(false),
      },
    );

    TestBed.overrideComponent(PostsList, {
      set: {
        template: '',
      },
    });

    await TestBed.configureTestingModule({
      imports: [PostsList],
      providers: [{ provide: PostsStore, useValue: postsStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(PostsList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load posts when no parent or author is set', () => {
      expect(postsStore.loadPosts).toHaveBeenCalledWith({
        parentDocumentId: undefined,
        authorDocumentId: undefined,
      });
    });
  });

  describe('ngOnChanges', () => {
    it('should load posts when parentDocumentId changes', () => {
      component.parentDocumentId = 'parent-1';

      component.ngOnChanges({
        parentDocumentId: new SimpleChange(undefined, 'parent-1', true),
      });

      expect(postsStore.loadPosts).toHaveBeenCalledWith({
        parentDocumentId: 'parent-1',
        authorDocumentId: undefined,
      });
    });

    it('should load posts when authorDocumentId changes', () => {
      component.authorDocumentId = 'user-1';

      component.ngOnChanges({
        authorDocumentId: new SimpleChange(undefined, 'user-1', true),
      });

      expect(postsStore.loadPosts).toHaveBeenCalledWith({
        parentDocumentId: undefined,
        authorDocumentId: 'user-1',
      });
    });
  });

  describe('onInfiniteScroll', () => {
    it('should load more posts for the current query', () => {
      component.parentDocumentId = 'parent-1';

      component.onInfiniteScroll();

      expect(postsStore.loadMorePosts).toHaveBeenCalledWith({
        parentDocumentId: 'parent-1',
        authorDocumentId: undefined,
      });
    });
  });
});
