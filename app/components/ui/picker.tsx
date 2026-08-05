/**
 * Picker — single + multi-select control with optional remote search.
 *
 * The one select control in this template. Deliberately NOT named `Combobox`:
 * shadcn/ui publishes its own "Combobox" recipe, and this component is ours,
 * not vendored — a distinct name keeps it from being mistaken for (or clobbered
 * by) generated shadcn output. `~/components/ui/select.tsx` remains the genuine
 * vendored shadcn primitive and is unrelated.
 *
 * Three usage shapes, all driven by the same component:
 *
 *   1. **Static single-select** — pass `items` and `value: string | null`.
 *      Filters client-side as the user types.
 *   2. **Static multi-select** — same `items`, plus `multi`, plus
 *      `value: string[]`. Selected items render as removable chips.
 *   3. **Remote search** — instead of `items`, pass `onSearch(query, signal)`.
 *      The component debounces the query and calls the loader; the parent owns
 *      the fetch (reuse its API client, abort signals, caching).
 *
 * Built on Radix Popover + cmdk, so keyboard nav, focus management and
 * accessibility come for free.
 */
import * as React from 'react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from 'cmdk';
import {
  Check as IconCheck,
  ChevronDown as IconChevronDown,
  X as IconX,
} from 'lucide-react';

import { cn } from '~/lib/utils';
import { Checkbox } from './checkbox';

export interface PickerItem {
  readonly value: string;
  readonly label: string;
  /** Optional secondary line shown smaller below `label`. */
  readonly description?: string;
  /** Marks the item unselectable but still rendered. */
  readonly disabled?: boolean;
}

interface BaseProps {
  readonly placeholder?: string;
  readonly searchPlaceholder?: string;
  readonly emptyMessage?: string;
  /** Rendered inside the empty state — a quick action (e.g. "+ Add category"). */
  readonly emptyAction?: React.ReactNode;
  readonly disabled?: boolean;
  /**
   * Shows the selection but blocks every interaction. Unlike `disabled` the
   * label keeps full contrast — for "look, don't touch" views.
   */
  readonly readOnly?: boolean;
  /**
   * Parent-owned loading flag, OR-ed with the internal remote-search state. Use
   * it when the items come from a query the Picker doesn't drive itself.
   */
  readonly loading?: boolean;
  /** Text shown while loading. Default "Searching…". */
  readonly loadingText?: string;
  readonly className?: string;
  readonly triggerClassName?: string;
  readonly contentClassName?: string;
  /** Aria label for assistive tech when there's no visible label. */
  readonly 'aria-label'?: string;
  /**
   * If supplied, renders hidden `<input>`(s) so the Picker works inside a
   * native `<form method="get|post">` without `preventDefault()`.
   */
  readonly name?: string;
  /** id forwarded to the trigger for label `htmlFor`. */
  readonly id?: string;
}

interface StaticItemsProps extends BaseProps {
  readonly items: ReadonlyArray<PickerItem>;
  readonly onSearch?: never;
}

interface RemoteSearchProps extends BaseProps {
  readonly items?: never;
  /**
   * Called on each (debounced) search change. Return the matching items and use
   * `signal` to abort stale fetches when a newer query arrives.
   */
  readonly onSearch: (
    query: string,
    signal: AbortSignal
  ) => Promise<ReadonlyArray<PickerItem>>;
  /** Debounce window for the search input. Default 250ms. */
  readonly debounceMs?: number;
  /** Items shown before the user types. */
  readonly initialItems?: ReadonlyArray<PickerItem>;
  /**
   * Don't call `onSearch` until the query is at least this long — the list shows
   * a "type at least N characters" hint instead. Default 0 (search at once).
   */
  readonly minSearchLength?: number;
}

interface SingleSelectProps {
  readonly value: string | null;
  readonly onChange: (value: string | null) => void;
  readonly multi?: false;
}

interface MultiSelectProps {
  readonly value: ReadonlyArray<string>;
  readonly onChange: (value: ReadonlyArray<string>) => void;
  readonly multi: true;
  /** Max selections; further picks are ignored. */
  readonly max?: number;
  /** Multi list indicator: a check icon (default) or a checkbox square. */
  readonly optionStyle?: 'check' | 'checkbox';
  /** 'inline' renders an always-open checkbox list (static items only). */
  readonly displayMode?: 'popover' | 'inline';
  /** How selected items render in popover mode: chips (default) or inline. */
  readonly selectedDisplay?: 'chips' | 'inline';
  /**
   * Cap how many chips render above the trigger; the remainder collapse into a
   * "+N more" badge. Unset renders every chip.
   */
  readonly maxVisibleChips?: number;
}

export type PickerProps = (StaticItemsProps | RemoteSearchProps) &
  (SingleSelectProps | MultiSelectProps);

export function Picker(props: Readonly<PickerProps>) {
  const {
    placeholder = 'Select…',
    searchPlaceholder = 'Search…',
    emptyMessage = 'No results.',
    emptyAction,
    disabled,
    readOnly = false,
    loading: externalLoading = false,
    loadingText = 'Searching…',
    className,
    triggerClassName,
    contentClassName,
    'aria-label': ariaLabel,
    name,
    id,
  } = props;

  // Narrow the union via a runtime check — TS can't peer through
  // `'onSearch' in props` when both variants descend from `BaseProps`.
  const remoteProps =
    typeof (props as RemoteSearchProps).onSearch === 'function'
      ? (props as RemoteSearchProps)
      : null;
  const staticItems: ReadonlyArray<PickerItem> = remoteProps
    ? []
    : ((props as StaticItemsProps).items ?? []);

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [remoteItems, setRemoteItems] = React.useState<
    ReadonlyArray<PickerItem>
  >(remoteProps?.initialItems ?? []);
  const [searching, setSearching] = React.useState(false);

  const abortRef = React.useRef<AbortController | null>(null);

  // Keep the callback in a ref so the effect deps stay primitive: it fires when
  // the SEARCH changes, never merely because an unmemoised parent re-rendered.
  const onSearchRef = React.useRef(remoteProps?.onSearch);
  onSearchRef.current = remoteProps?.onSearch;
  const isRemote = remoteProps !== null;
  const debounceMs = remoteProps?.debounceMs ?? 250;
  const minSearchLength = remoteProps?.minSearchLength ?? 0;
  const belowMinSearch = isRemote && query.length < minSearchLength;

  React.useEffect(() => {
    if (!isRemote) return;
    // Too short to be worth a round trip — drop stale results and wait.
    if (query.length < minSearchLength) {
      abortRef.current?.abort();
      setSearching(false);
      setRemoteItems([]);
      return;
    }
    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setSearching(true);
      onSearchRef
        .current?.(query, controller.signal)
        .then((items) => {
          if (!controller.signal.aborted) setRemoteItems(items);
        })
        .catch(() => {
          /* swallow aborts + transient errors; parent owns retry */
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [query, isRemote, debounceMs, minSearchLength]);

  // Abort any in-flight search on unmount.
  React.useEffect(() => () => abortRef.current?.abort(), []);

  const loading = externalLoading || searching;

  const items: ReadonlyArray<PickerItem> = remoteProps
    ? remoteItems
    : staticItems;

  const selectedValues: ReadonlyArray<string> = props.multi
    ? props.value
    : props.value
      ? [props.value]
      : [];
  const selectedItems = items.filter((it) => selectedValues.includes(it.value));
  // Selected values not in the current list (e.g. from a previous remote page)
  // — surface them so labels stay accurate when filtered out of view.
  const selectedFallback: ReadonlyArray<PickerItem> = selectedValues
    .filter((v) => !items.some((it) => it.value === v))
    .map((v) => ({ value: v, label: v }));

  function commitSingle(next: string | null) {
    if (readOnly) return;
    if (!props.multi) {
      props.onChange(next);
      setOpen(false);
    }
  }

  function commitMulti(value: string) {
    if (readOnly) return;
    if (!props.multi) return;
    const current = props.value;
    if (current.includes(value)) {
      props.onChange(current.filter((v) => v !== value));
      return;
    }
    if (props.max !== undefined && current.length >= props.max) return;
    props.onChange([...current, value]);
  }

  function clearAll(e: React.MouseEvent) {
    e.stopPropagation();
    if (readOnly) return;
    if (props.multi) props.onChange([]);
    else props.onChange(null);
  }

  const buttonLabel: React.ReactNode = (() => {
    if (props.multi) {
      if (selectedValues.length === 0) return placeholder;
      return <span className="truncate">{selectedValues.length} selected</span>;
    }
    if (selectedItems[0]) {
      return <span className="truncate">{selectedItems[0].label}</span>;
    }
    if (selectedFallback[0]) {
      return (
        <span className="truncate text-muted-foreground">
          {selectedFallback[0].label}
        </span>
      );
    }
    return (
      <span className="truncate text-muted-foreground">{placeholder}</span>
    );
  })();

  const hasSelection = selectedValues.length > 0;

  const optionStyle = props.multi ? (props.optionStyle ?? 'check') : 'check';
  const selectedDisplay = props.multi
    ? (props.selectedDisplay ?? 'chips')
    : 'chips';
  const inlineMode =
    props.multi && props.displayMode === 'inline' && !('onSearch' in props);

  const allSelected = [...selectedItems, ...selectedFallback];
  const maxVisibleChips = props.multi ? props.maxVisibleChips : undefined;
  const visibleChips =
    maxVisibleChips === undefined
      ? allSelected
      : allSelected.slice(0, maxVisibleChips);
  const hiddenChipCount = allSelected.length - visibleChips.length;

  const emptyState = belowMinSearch
    ? `Type at least ${minSearchLength} characters to search…`
    : emptyMessage;

  const renderRow = (
    it: PickerItem,
    isSelected: boolean,
    onPick: () => void
  ) => (
    <div
      key={it.value}
      role="option"
      tabIndex={it.disabled ? -1 : 0}
      aria-selected={isSelected}
      aria-disabled={it.disabled}
      onClick={() => {
        if (!it.disabled) onPick();
      }}
      onKeyDown={(e) => {
        if (it.disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPick();
        }
      }}
      className={cn(
        'flex cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground',
        it.disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      {optionStyle === 'checkbox' ? (
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => {}}
          tabIndex={-1}
          className="mt-0.5 shrink-0"
        />
      ) : (
        <IconCheck
          className={cn(
            'mt-0.5 size-3.5 shrink-0',
            isSelected ? 'text-foreground' : 'text-transparent'
          )}
        />
      )}
      <div className="min-w-0">
        <div className="truncate">{it.label}</div>
        {it.description ? (
          <div className="truncate text-xs text-muted-foreground">
            {it.description}
          </div>
        ) : null}
      </div>
    </div>
  );

  if (inlineMode) {
    return (
      <div
        className={cn('w-full', className)}
        role="listbox"
        aria-multiselectable
        aria-readonly={readOnly || undefined}
      >
        {name
          ? selectedValues.map((v, i) => (
              <input key={`${name}-${i}`} type="hidden" name={name} value={v} />
            ))
          : null}
        <div
          className={cn(
            'space-y-0.5 rounded-md border p-1',
            readOnly && 'pointer-events-none bg-muted/50'
          )}
        >
          {items.length === 0 ? (
            <div className="py-3 text-center text-xs text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            items.map((it) =>
              renderRow(it, selectedValues.includes(it.value), () =>
                commitMulti(it.value)
              )
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {props.multi && allSelected.length > 0 ? (
        selectedDisplay === 'inline' ? (
          <div className="mb-1.5 text-xs text-muted-foreground">
            {allSelected.map((it) => it.label).join(', ')}
          </div>
        ) : (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {visibleChips.map((it) => (
              <span
                key={it.value}
                className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground"
              >
                {it.label}
                {readOnly ? null : (
                  <button
                    type="button"
                    aria-label={`Remove ${it.label}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      commitMulti(it.value);
                    }}
                    className="hover:text-foreground"
                  >
                    <IconX className="size-3" />
                  </button>
                )}
              </span>
            ))}
            {hiddenChipCount > 0 ? (
              <span className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs text-muted-foreground">
                +{hiddenChipCount} more
              </span>
            ) : null}
          </div>
        )
      ) : null}

      {name && !props.multi ? (
        <input type="hidden" name={name} value={selectedValues[0] ?? ''} />
      ) : null}
      {name && props.multi
        ? selectedValues.map((v, i) => (
            <input key={`${name}-${i}`} type="hidden" name={name} value={v} />
          ))
        : null}

      <PopoverPrimitive.Root
        open={readOnly ? false : open}
        onOpenChange={readOnly ? undefined : setOpen}
      >
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            id={id}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-readonly={readOnly || undefined}
            className={cn(
              'flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-xs outline-none transition-[border-color,box-shadow,background-color] hover:border-ring/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-70',
              readOnly && 'pointer-events-none bg-muted/50',
              triggerClassName
            )}
          >
            {buttonLabel}
            {readOnly ? null : (
              <div className="flex items-center gap-1">
                {hasSelection && !disabled ? (
                  // A span, not a button — the Radix Trigger renders this whole
                  // control AS a button via asChild, and a nested button is
                  // invalid HTML. tabIndex=-1 keeps it out of the tab order.
                  <span
                    role="button"
                    aria-label="Clear selection"
                    onClick={clearAll}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        clearAll(e as unknown as React.MouseEvent);
                      }
                    }}
                    className="inline-flex cursor-pointer text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    <IconX className="size-3.5" />
                  </span>
                ) : null}
                <IconChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
              </div>
            )}
          </button>
        </PopoverPrimitive.Trigger>

        {/*
         * No Portal on purpose. When the picker opens inside a modal overlay
         * (our Sheet/Dialog use react-remove-scroll), a body-portaled popover
         * sits OUTSIDE the overlay's allowed-scroll subtree, so the mouse wheel
         * is blocked (drag still works). Rendering inline keeps it inside that
         * subtree; Radix's fixed positioning still prevents overflow clipping.
         */}
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className={cn(
            'z-50 w-[var(--radix-popover-trigger-width)] min-w-56 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-xl',
            contentClassName
          )}
        >
          <Command shouldFilter={!('onSearch' in props)}>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder={searchPlaceholder}
              className="min-h-10 w-full border-b border-border bg-popover px-3 py-2 text-sm text-popover-foreground caret-primary outline-none placeholder:text-muted-foreground"
            />
            <CommandList className="max-h-64 overflow-y-auto p-1">
              {loading ? (
                <div className="py-3 text-center text-xs text-muted-foreground">
                  {loadingText}
                </div>
              ) : null}
              <CommandEmpty className="py-3 text-center text-xs text-muted-foreground">
                <span>{emptyState}</span>
                {emptyAction ? <div className="mt-2">{emptyAction}</div> : null}
              </CommandEmpty>
              <CommandGroup>
                {items.map((it) => {
                  const isSelected = selectedValues.includes(it.value);
                  return (
                    <CommandItem
                      key={it.value}
                      value={it.value}
                      keywords={[it.label, it.description ?? ''].filter(
                        Boolean
                      )}
                      disabled={it.disabled}
                      onSelect={() => {
                        if (it.disabled) return;
                        if (props.multi) commitMulti(it.value);
                        else commitSingle(isSelected ? null : it.value);
                      }}
                      className="flex min-h-9 cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50"
                    >
                      {optionStyle === 'checkbox' ? (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => {}}
                          tabIndex={-1}
                          className="mt-0.5 shrink-0"
                        />
                      ) : (
                        <IconCheck
                          className={cn(
                            'mt-0.5 size-3.5 shrink-0',
                            isSelected ? 'text-foreground' : 'text-transparent'
                          )}
                        />
                      )}
                      <div className="min-w-0">
                        <div className="truncate">{it.label}</div>
                        {it.description ? (
                          <div className="truncate text-xs text-muted-foreground">
                            {it.description}
                          </div>
                        ) : null}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Root>
    </div>
  );
}