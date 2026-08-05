import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import { TagInput, type TagInputProps } from '~/components/ui/tag-input';

interface FormTagInputFieldProps<TFieldValues extends FieldValues> extends Omit<
  TagInputProps,
  'value' | 'onChange'
> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  required?: boolean;
}

export function FormTagInputField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  required = false,
  ...tagInputProps
}: Readonly<FormTagInputFieldProps<TFieldValues>>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {required && <span className="text-destructive">*</span>}
          </FormLabel>
          <FormControl>
            <TagInput
              value={(field.value as string[]) ?? []}
              onChange={field.onChange}
              {...tagInputProps}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
