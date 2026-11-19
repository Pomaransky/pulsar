import {
  Component,
  inject,
  Input,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import {
  FileSelectEvent,
  FileUpload,
  FileUploadModule,
} from 'primeng/fileupload';
import { InputField } from '../input-field/input-field';
import { ValidationMessage } from '../../models';
import { FileValidationService } from '../../services/file-validation.service';
import { POST_VALIDATION_MESSAGES } from '../../pages/dashboard/constants/post-validation-messages.const';
import { Tooltip } from 'primeng/tooltip';

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
    ReactiveFormsModule,
    InputField,
    ButtonModule,
    FileUploadModule,
    TranslateModule,
    Tooltip,
  ],
  templateUrl: './post-form.html',
  styleUrl: './post-form.scss',
})
export class PostForm {
  private fb = inject(FormBuilder);
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
  form: FormGroup = this.fb.group({
    content: ['', [Validators.required, Validators.maxLength(255)]],
  });
  validationMessages: ValidationMessage[] = POST_VALIDATION_MESSAGES;
  get inputId(): string {
    return this.parentDocumentId ? 'comment-content' : 'post-content';
  }

  onSubmit(): void {
    const trimmed = this.form.get('content')?.value?.trim();
    if (!trimmed) return;
    this.submitForm.emit({
      content: trimmed,
      parentDocumentId: this.parentDocumentId ?? undefined,
      media: this.selectedMedia() ?? undefined,
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
    this.form.reset();
    this.clearMedia();
  }
}
