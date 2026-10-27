import 'zone.js/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { getTestBed, TestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { SupportedLanguages, Theme } from './app/core/constants';
import { AppStore } from './app/core/store/app.store';
import { emptyPaginated } from './app/core/utils/empty-paginated';
import { PostsStore } from './app/core/store/posts.store';
import { UserStore } from './app/core/store/user.store';
import { PostApi } from './app/core/services/post-api';
import { UserApiService } from './app/core/services/user-api-service';

getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting());

const registerGlobalBeforeEach = (fn: () => void): void => {
  const globalObj = globalThis as {
    beforeEach?: (hook: () => void) => void;
    jasmine?: { getEnv?: () => { beforeEach?: (hook: () => void) => void } };
  };

  if (typeof globalObj.beforeEach === 'function') {
    globalObj.beforeEach(fn);
    return;
  }

  const jasmineBeforeEach = globalObj.jasmine?.getEnv?.()?.beforeEach;
  if (typeof jasmineBeforeEach === 'function') {
    jasmineBeforeEach(fn);
  }
};

registerGlobalBeforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withXhr()),
      provideHttpClientTesting(),
      ConfirmationService,
      MessageService,
      {
        provide: AppStore,
        useValue: {
          theme: () => Theme.LIGHT,
          language: signal(SupportedLanguages.EN),
          setTheme: () => undefined,
          setLanguage: () => of({}),
        },
      },
      {
        provide: UserStore,
        useValue: {
          me: {
            data: signal(null),
            isLoading: signal(false),
          },
          users: {
            data: {
              data: signal([]),
              meta: {
                pagination: {
                  total: signal(0),
                },
              },
            },
            isLoading: signal(false),
            lastLoadParams: signal(null),
          },
        },
      },
      {
        provide: PostsStore,
        useValue: {
          posts: Object.assign(
            () => ({
              data: emptyPaginated(),
              isLoading: false,
              lastLoadParams: { page: 1, pageSize: 10 },
            }),
            {
              data: {
                data: signal([]),
                meta: {
                  pagination: signal({
                    page: 1,
                    pageCount: 1,
                    pageSize: 10,
                    total: 0,
                  }),
                },
              },
              isLoading: signal(false),
              lastLoadParams: signal({ page: 1, pageSize: 10 }),
            }
          ),
          currentPost: signal(null),
          setCurrentPost: () => undefined,
          resetPostsLoadParams: () => undefined,
          resetPosts: () => undefined,
          setPosts: () => undefined,
        },
      },
      providePrimeNG({ ripple: false }),
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: { paramMap: { get: () => '1' } },
          paramMap: of({ get: () => '1' }),
          params: of({ id: '1' }),
        },
      },
      {
        provide: TranslateService,
        useValue: {
          onTranslationChange: new Subject(),
          onLangChange: new Subject(),
          onFallbackLangChange: new Subject(),
          onDefaultLangChange: new Subject(),
          use: () => of({}),
          get: (key: string | string[]) => of(key),
          stream: (key: string | string[]) => of(key),
          getStreamOnTranslationChange: (key: string | string[]) => of(key),
          setFallbackLang: () => of({}),
          getFallbackLang: () => 'en',
          instant: (key: string | string[]) => key,
          setDefaultLang: () => of({}),
          getDefaultLang: () => 'en',
        } as Partial<TranslateService>,
      },
      {
        provide: PostApi,
        useValue: {
          getPost: () => of(null),
          getPosts: () => of({ data: [], meta: { pagination: {} } }),
          addPost: () => of(null),
        },
      },
      {
        provide: UserApiService,
        useValue: {
          getMe: () => of(null),
          getUsers: () => of({ data: [], meta: { pagination: {} } }),
          editMe: () => of(null),
          uploadAvatar: () => of(null),
        },
      },
    ],
  });
});
