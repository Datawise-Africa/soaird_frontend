import { useRef, useState, type ReactNode } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '~/lib/utils';

interface DropZoneProps {
  /**
   * Called with the selected/dropped files.
   * Accepts `FileList`, `File[]`, or a single `File` — compatible with
   * `useFileUpload`'s `addFiles` so you can pass it directly:
   *
   * ```tsx
   * const { addFiles } = useFileUpload({ multiple: true });
   * <DropZone onFiles={addFiles} />
   * ```
   */
  onFiles: (files: FileList | File[] | File) => void;
  /** Comma-separated accept string, e.g. ".pdf,.csv,.json" */
  accept?: string;
  /** Allow multiple files. Defaults to true. */
  multiple?: boolean;
  /** Whether the drop zone is disabled. */
  disabled?: boolean;
  /** Custom content inside the drop zone. Falls back to default layout. */
  children?: ReactNode;
  /** Additional class names for the drop surface. */
  className?: string;
  /** Hint text below the main label. */
  hint?: string;
}

/**
 * Reusable accessible drag-and-drop file picker.
 *
 * Works standalone or with `useFileUpload` — pass `addFiles` directly:
 *
 * @example
 * ```tsx
 * const { addFiles, files } = useFileUpload({ multiple: true, output: 'base64' });
 *
 * <DropZone
 *   onFiles={addFiles}
 *   accept=".pdf,.csv,.xlsx"
 *   hint="PDF, CSV, Excel — max 20 MB per file"
 * />
 * ```
 */
export function DropZone({
  onFiles,
  accept,
  multiple = true,
  disabled = false,
  children,
  className,
  hint,
}: Readonly<DropZoneProps>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  // dragenter/dragleave also fire as the pointer crosses onto a CHILD element, so a
  // plain boolean flickers off mid-drag. Count depth and only clear on the outermost
  // leave.
  const dragDepth = useRef(0);

  const open = () => {
    if (!disabled) inputRef.current?.click();
  };

  const endDrag = () => {
    dragDepth.current = 0;
    setIsDragging(false);
  };

  return (
    // The <input> is a SIBLING of the button, never a child. Nested, the
    // `inputRef.current.click()` in `open()` dispatches a real bubbling click that
    // re-enters the button's own onClick and re-opens the file chooser — unbounded
    // re-entry. A <button> may not contain interactive content either.
    <div>
      <button
        type="button"
        disabled={disabled}
        className={cn(
          'flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card p-6 text-center text-foreground transition-[border-color,background-color,box-shadow]',
          'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30',
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-input hover:border-primary/70 hover:bg-accent/30',
          disabled && 'pointer-events-none opacity-50',
          className
        )}
        onClick={open}
        onDragEnter={(e) => {
          e.preventDefault();
          dragDepth.current += 1;
          if (!disabled) setIsDragging(true);
        }}
        onDragOver={(e) => {
          // Required: without it the browser rejects the drop.
          e.preventDefault();
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          dragDepth.current -= 1;
          if (dragDepth.current <= 0) endDrag();
        }}
        onDrop={(e) => {
          e.preventDefault();
          endDrag();
          if (!disabled && e.dataTransfer.files.length > 0) {
            onFiles(e.dataTransfer.files);
          }
        }}
      >
        {children ?? (
          <>
            <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag & drop files or{' '}
              <span className="font-medium text-primary">browse</span>
            </p>
            {hint && (
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            )}
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFiles(e.target.files);
          }
          e.target.value = '';
        }}
      />
    </div>
  );
}