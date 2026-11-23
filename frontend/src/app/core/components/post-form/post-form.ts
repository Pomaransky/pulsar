import {
  Component,
  inject,
  Input,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import {
  FileSelectEvent,
  FileUpload,
  FileUploadModule,
} from 'primeng/fileupload';
import { FileValidationService } from '../../services/file-validation.service';
import { Tooltip } from 'primeng/tooltip';
import { form, maxLength, FormField, required, submit } from '@angular/forms/signals';
import { InputFieldSignalForms } from '../input-field-signal-forms/input-field-signal-forms';

export interface PostFormSubmit {
  content: string;
  parentDocumentId?: string;
  media?: File;
}

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ACCEPT_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
@Component({
  selector: 'app-post-form',
  imports: [
    InputFieldSignalForms,
    ButtonModule,
    FileUploadModule,
    TranslateModule,
    Tooltip,
    FormField
  ],
  templateUrl: './post-form.html',
  styleUrl: './post-form.scss',
})
export class PostForm {
  private fileValidation = inject(FileValidationService);

  @Input() label = 'post.whatsOnYourMind';
  @Input() submitLabel = 'post.postLabel';
  @Input() rows = 5;
  @Input() parentDocumentId: string | undefined = undefined;

  @ViewChild('mediaUpload') mediaUpload!: FileUpload;
  selectedMedia = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  acceptFileTypes = ACCEPT_FILE_TYPES;

  submitForm = output<PostFormSubmit>();
  postFormModel = signal<PostFormSubmit>({
    content: '',
  })
  postForm = form(this.postFormModel, (schemaPath) => {
    required(schemaPath.content);
    maxLength(schemaPath.content, 255, { message: 'postValidations.maxLength' });
  });
  get inputId(): string {
    return this.parentDocumentId ? 'comment-content' : 'post-content';
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    submit(this.postForm, async () => {
      const trimmed = this.postFormModel().content.trim();

      this.submitForm.emit({
        content: trimmed,
        parentDocumentId: this.parentDocumentId ?? undefined,
        media: this.selectedMedia() ?? undefined,
      });
    });
  }

  onMediaSelect(event: Pick<FileSelectEvent, 'files'>): void {
    const file = event.files?.[0];
    if (!file) return;
    if (
      !this.fileValidation.validateFile(file, {
        maxFileSize: MAX_FILE_SIZE,
        acceptFileTypes: ACCEPT_FILE_TYPES,
      })
    ) {
      this.mediaUpload?.clear();
      return;
    }
    this.previewUrl.update((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    this.selectedMedia.set(file);
  }

  clearMedia(): void {
    this.previewUrl.update((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    this.selectedMedia.set(null);
    this.mediaUpload?.clear();
  }

  reset(): void {
    this.postForm().reset({ content: '' });
    this.clearMedia();
  }
}
