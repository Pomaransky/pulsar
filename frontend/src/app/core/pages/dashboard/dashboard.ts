import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar, Header } from './components';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from '../../components/confirm-dialog/confirm-dialog';
import { UserStore } from '../../store/user.store';
import { DeepSignal } from '@ngrx/signals';
import { UserApiService } from '../../services/user-api-service';
import { User } from '../../models/auth/user.model';

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, Sidebar, Header, ConfirmDialog],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  providers: [ConfirmationService],
})
export class Dashboard implements OnInit {
  private userService = inject(UserApiService);
  private userStore = inject(UserStore);
  user: DeepSignal<User | null> = this.userStore.me.data;

  ngOnInit(): void {
    if (!this.user()) {
      this.getMe();
    }
  }

  getMe(): void {
    this.userService.getMe().subscribe();
  }
}
