import {
  patchState,
  signalStore,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { toObservable } from '@angular/core/rxjs-interop';
import { User } from '../models';

interface UserState {
  me: {
    data: User | null;
    isLoading: boolean;
  };
}

const initialState: UserState = {
  me: {
    data: null,
    isLoading: false,
  },
};

export const UserStore = signalStore(
  withState<UserState>(initialState),
  withProps(({ me }) => ({
    me$: toObservable(me),
  })),
  withMethods((store) => ({
    setMe(user: User | null) {
      patchState(store, { me: { ...store.me(), data: user } });
    },
    setMeLoading(isLoading: boolean) {
      patchState(store, { me: { ...store.me(), isLoading } });
    },
  })),
);
