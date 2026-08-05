import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import { Picker, type PickerItem } from '~/components/ui/picker';

/** Type the stored form value is coerced to. The Picker always speaks strings. */
type ValueAs = 'string' | 'number' | 'boolean';

interface CommonProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  /** Text shown while loading. Default "Searching…". */
  loadingText?: string;
  /** Parent-owned loading flag (e.g. the query feeding `options` is pending). */
  loading?: boolean;
  required?: boolean;
  disabled?: boolean;
  /** Shows the selection but blocks interaction, without dimming the label. */
  readOnly?: boolean;
  /** Coerce each selected string value before setting it on the form field. */
  valueAs?: ValueAs;
  /** Side-channel notification with the raw (uncoerced) string value(s). */
  onValueChange?: (value: string | string[]) => void;
}

/** Options are provided up-front and filtered client-side. */
interface StaticSource {
  options: PickerItem[];
  onSearch?: never;
}

/** Options are fetched per keystroke (debounced) — the parent owns the request. */
interface RemoteSource {
  options?: never;
  onSearch: (
    query: string,
    signal: AbortSignal
  ) => Promise<ReadonlyArray<PickerItem>>;
  debounceMs?: number;
  initialItems?: PickerItem[];
  /** Wait for this many characters before calling `onSearch`. Default 0. */
  minSearchLength?: number;
}

interface SingleProps {
  multi?: false;
}

interface MultiProps {
  multi: true;
  /** Max number of selections. */
  max?: number;
  /** List indicator style for multi-select. */
  optionStyle?: 'check' | 'checkbox';
  /** Cap the chips shown; the rest collapse into a "+N more" badge. */
  maxVisibleChips?: number;
}

type FormPickerFieldProps<TFieldValues extends FieldValues> =
  CommonProps<TFieldValues> &
    (StaticSource | RemoteSource) &
    (SingleProps | MultiProps);

/**
 * Coerce one selected value on its way into the form state.
 *
 * An absent selection is ALWAYS `null` — never `0`/`false`. Those look like real
 * values: `0` is a plausible id and passes a `z.number()` required check, so an
 * empty field would sail past validation. Returning `null` lets the schema
 * reject it.
 */
function coerceOne(val: string | null, as: ValueAs): unknown {
  if (val == null) return null;
  if (as === 'number') return Number(val);
  if (as === 'boolean') return val === 'true';
  return val;
}

/**
 * `Picker` wired into React Hook Form — the single select field component. Two
 * axes, independent:
 *
 * - **static** (`options`) vs **remote** (`onSearch`, debounced async search)
 * - **single** (stores one value) vs **multi** (`multi`, stores an array)
 *
 * Values are stored as strings unless `valueAs` asks for `number`/`boolean`.
 * Clearing a single-select writes `null`, whatever `valueAs` says.
 */
export function FormPickerField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  loadingText,
  loading,
  required = false,
  disabled = false,
  readOnly = false,
  valueAs = 'string',
  onValueChange,
  ...rest
}: Readonly<FormPickerFieldProps<TFieldValues>>) {
  const isMulti = 'multi' in rest && rest.multi === true;
  const isRemote = 'onSearch' in rest && typeof rest.onSearch === 'function';

  const common = {
    placeholder,
    searchPlaceholder,
    emptyMessage,
    loadingText,
    loading,
    disabled,
    readOnly,
    'aria-label': label,
  } as const;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const source = isRemote
          ? {
              onSearch: (rest as RemoteSource).onSearch,
              debounceMs: (rest as RemoteSource).debounceMs,
              initialItems: (rest as RemoteSource).initialItems,
              minSearchLength: (rest as RemoteSource).minSearchLength,
            }
          : { items: (rest as StaticSource).options };

        // Back to string(s) for display. Checked against null/'' rather than
        // truthiness so a legitimate `0` or `false` still renders.
        const singleValue =
          field.value == null || field.value === ''
            ? null
            : String(field.value);

        return (
          <FormItem className="self-start">
            <FormLabel>
              {label} {required && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormControl>
              {isMulti ? (
                <Picker
                  {...common}
                  {...(source as { items: PickerItem[] })}
                  multi
                  max={(rest as MultiProps).max}
                  optionStyle={(rest as MultiProps).optionStyle}
                  maxVisibleChips={(rest as MultiProps).maxVisibleChips}
                  value={
                    Array.isArray(field.value) ? field.value.map(String) : []
                  }
                  onChange={(values) => {
                    field.onChange(values.map((v) => coerceOne(v, valueAs)));
                    onValueChange?.([...values]);
                  }}
                />
              ) : (
                <Picker
                  {...common}
                  {...(source as { items: PickerItem[] })}
                  value={singleValue}
                  onChange={(value) => {
                    field.onChange(coerceOne(value, valueAs));
                    onValueChange?.(value ?? '');
                  }}
                />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
