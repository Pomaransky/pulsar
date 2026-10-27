import { computed, inject, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { patchState, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals';
import { Paginated, TableLoadParams, User } from '../models';
import { UserApiService } from '../services/user-api-service';
import { emptyPaginated } from '../utils/empty-paginated';

interface UsersState {
  loadParams: TableLoadParams | undefined;
}

const initialState: UsersState = {
  loadParams: undefined,
};

export const UsersStore = signalStore(
  withState<UsersState>(initialState),

  withProps(({ loadParams }) => {
    const userApiService = inject(UserApiService);
    return {
      _usersResource: rxResource({
        params: () => loadParams(),
        stream: ({ params }) => userApiService.getUsers(params),
      }),
    };
  }),

  withComputed(({ _usersResource }) => {
    const lastUsers = linkedSignal<Paginated<User> | undefined, Paginated<User>>({
      source: () => (_usersResource.hasValue() ? _usersResource.value() : undefined),
      computation: (users, previous) => users ?? previous?.value ?? emptyPaginated<User>(),
    });

    return {
      users: computed(() => lastUsers().data),
      totalRecords: computed(() => lastUsers().meta.pagination.total),
      isLoading: _usersResource.isLoading,
    };
  }),

  withMethods(store => ({
    load(params: TableLoadParams) {
      patchState(store, { loadParams: params });
    },
    reload() {
      store._usersResource.reload();
    },
  }))
);
