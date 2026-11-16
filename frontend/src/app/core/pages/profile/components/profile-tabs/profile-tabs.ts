import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TabsModule } from 'primeng/tabs';
import { PostsList } from '../../../../components';
import { UserStore } from '../../../../store/user.store';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-profile-tabs',
  imports: [TabsModule, TranslateModule, PostsList, TooltipModule],
  templateUrl: './profile-tabs.html',
  styleUrl: './profile-tabs.scss',
})
export class ProfileTabs {
  private userStore = inject(UserStore);

  user = this.userStore.me.data;
}
