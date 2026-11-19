import { PathKind, SchemaPath, SchemaPathRules, validate } from '@angular/forms/signals';

export function fieldsMatchValidator<
  TValue,
  TTargetKind extends PathKind = PathKind.Root,
  TSourceKind extends PathKind = PathKind.Root,
>(
  targetPath: SchemaPath<TValue, SchemaPathRules.Supported, TTargetKind>,
  sourcePath: SchemaPath<TValue, SchemaPathRules.Supported, TSourceKind>,
  error = {
    kind: 'fieldsMismatch',
    message: 'Values do not match',
  },
) {
  return validate(targetPath, ({ value, valueOf }) => {
    const targetValue = value();
    const sourceValue = valueOf(sourcePath);

    return targetValue !== sourceValue ? error : null;
  });
}