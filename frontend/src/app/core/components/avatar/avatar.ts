import { Component, Input } from '@angular/core';
import { User } from '../../models';

@Component({
  selector: 'app-avatar',
  imports: [],
  templateUrl: './avatar.html',
  styleUrl: './avatar.scss',
})
export class Avatar {
  @Input() userData: User | null = null;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  get defaultData(): string {
    if (!this.userData) return '';
    const firstNameLetter = this.userData.firstName?.charAt(0) ?? '';
    const lastNameLetter = this.userData.lastName?.charAt(0) ?? '';

    return firstNameLetter && lastNameLetter
      ? firstNameLetter + lastNameLetter
      : this.userData.username.charAt(0);
  }

  get url(): string | null {
    const avatarUrl = this.userData?.avatar?.formats.thumbnail.url;
    return avatarUrl ? avatarUrl : null;
  }

  get boxSize(): string {
    switch (this.size) {
      case 'sm':
        return '2rem';
      case 'md':
        return '3rem';
      case 'lg':
        return '4rem';
    }
  }

  get fontSize(): string {
    switch (this.size) {
      case 'sm':
        return '0.75rem';
      case 'md':
        return '1.25rem';
      case 'lg':
        return '1.5rem';
    }
  }
}
