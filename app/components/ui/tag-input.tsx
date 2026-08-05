import { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '~/components/ui/input';
import { Badge } from '~/components/ui/badge';
import { cn } from '~/lib/utils';

export interface TagInputProps {
  /** Current tags */
  value?: string[];
  /** Called when tags change */
  onChange?: (tags: string[]) => void;
  /** Input placeholder */
  placeholder?: string;
  /** Maximum number of tags allowed */
  maxTags?: number;
  /** Maximum length per tag */
  maxTagLength?: number;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Custom class for the root container */
  className?: string;
  /** Badge variant for tags */
  variant?: 'default' | 'secondary' | 'outline';
}

export function TagInput({
  value = [],
  onChange,
  placeholder = 'Type and press Enter',
  maxTags,
  maxTagLength = 100,
  disabled = false,
  className,
  variant = 'secondary',
}: Readonly<TagInputProps>) {
  const [input, setInput] = useState('');

  const addTags = (raw: string) => {
    const candidates = raw
      .split(',')
      .map((s) => s.trim().slice(0, maxTagLength))
      .filter(Boolean);
    if (candidates.length === 0) return;

    const unique = candidates.filter((t) => !value.includes(t));
    if (unique.length === 0) {
      setInput('');
      return;
    }

    const allowed = maxTags ? unique.slice(0, maxTags - value.length) : unique;
    if (allowed.length === 0) return;

    onChange?.([...value, ...allowed]);
    setInput('');
  };

  const removeTag = (tag: string) => {
    onChange?.(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTags(input);
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted.includes(',')) {
      e.preventDefault();
      addTags(pasted);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={placeholder}
        disabled={disabled || (maxTags != null && value.length >= maxTags)}
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <Badge key={tag} variant={variant} className="gap-1">
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-0.5 rounded-full hover:bg-muted-foreground/20"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {tag}</span>
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
