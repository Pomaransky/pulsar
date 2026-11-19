import {
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TranslateModule } from '@ngx-translate/core';
import { Theme, SupportedLanguages } from '../../constants';
import { AppStore } from '../../store/app.store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface LanguageOption {
  value: SupportedLanguages;
  label: string;
}

@Component({
  selector: 'app-settings',
  imports: [
    ButtonModule,
    DrawerModule,
    SelectModule,
    ToggleSwitchModule,
    FormsModule,
    TranslateModule,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  private appStore = inject(AppStore);
  private destroyRef = inject(DestroyRef);

  drawerVisible = signal(false);
  isDark = this.appStore.theme() === Theme.DARK;
  currentLanguage = this.appStore.language;

  languageOptions: LanguageOption[] = [
    { value: SupportedLanguages.EN, label: 'English' },
    { value: SupportedLanguages.PL, label: 'Polski' },
  ];

  onDarkModeChange(checked: boolean): void {
    this.appStore.setTheme(checked ? Theme.DARK : Theme.LIGHT);
  }

  onLanguageChange(lang: SupportedLanguages): void {
    this.appStore
      .setLanguage(lang)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
