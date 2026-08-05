import { useState, useCallback, useRef, useEffect } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

/** Represents a single managed file with a stable key. */
export interface ManagedFile<TData = File> {
  /** Stable unique key for React keys and lookups. */
  key: string;
  /** Original File object. */
  file: File;
  /** Resolved data — raw File, base64 string, or Blob depending on `output`. */
  data: TData;
  /** File name. */
  name: string;
  /** File size in bytes. */
  size: number;
  /** MIME type. */
  type: string;
  /** Object URL preview (only generated when `preview: true`). Revoked on remove/clear. */
  preview: string | null;
}

/** Output format for file data. */
type OutputFormat = 'file' | 'base64' | 'blob';

/** Maps output format to the data type stored in ManagedFile. */
type OutputData<T extends OutputFormat> = T extends 'base64'
  ? string
  : T extends 'blob'
    ? Blob
    : File;

// ── Options ──────────────────────────────────────────────────────────────────

interface BaseOptions {
  /** Maximum number of files. Defaults to `1` for single, `10` for multiple. */
  maxFiles?: number;
  /** Maximum file size in bytes. Defaults to 100 MB. */
  maxSizeBytes?: number;
  /** Accepted MIME types or extensions (e.g. `[".pdf", "image/*"]`). */
  accept?: string[];
  /** Generate object URL previews for image files. Defaults to `false`. */
  preview?: boolean;
}

interface SingleOptions<
  TOutput extends OutputFormat = 'file',
> extends BaseOptions {
  multiple?: false;
  /** Output format. Defaults to `'file'`. */
  output?: TOutput;
  /** Called whenever the file list changes (add, remove, clear). */
  onFileChange?: (files: ManagedFile<OutputData<TOutput>>[]) => void;
}

interface MultipleOptions<
  TOutput extends OutputFormat = 'file',
> extends BaseOptions {
  multiple: true;
  /** Output format. Defaults to `'file'`. */
  output?: TOutput;
  /** Called whenever the file list changes (add, remove, clear). */
  onFileChange?: (files: ManagedFile<OutputData<TOutput>>[]) => void;
}

// ── Return types ─────────────────────────────────────────────────────────────

type FileInputType = FileList | File[] | File;

interface BaseReturn {
  /** Validation or limit error message, or null. */
  error: string | null;
  /** Whether files are currently being processed (base64 reads). */
  isProcessing: boolean;
  /** Clear the error. */
  clearError: () => void;
}

interface SingleReturn<TData> extends BaseReturn {
  /** The current file, or null. */
  file: ManagedFile<TData> | null;
  /** All files as an array (length 0 or 1). */
  files: ManagedFile<TData>[];
  /** Add a file (replaces current). Accepts FileList, File[], or single File. */
  addFiles: (input: FileInputType) => void;
  /** Remove the current file. */
  remove: () => void;
  /** Clear all files. */
  clear: () => void;
  /** Get the current file's data, or null. */
  getData: () => TData | null;
}

interface MultipleReturn<TData> extends BaseReturn {
  /** The current file list. */
  files: ManagedFile<TData>[];
  /** Add files. Accepts FileList, File[], or single File. */
  addFiles: (input: FileInputType) => void;
  /** Remove a file by its key. */
  remove: (key: string) => void;
  /** Remove a file by index. */
  removeAt: (index: number) => void;
  /** Clear all files. */
  clear: () => void;
  /** Get all file data as an array. */
  getData: () => TData[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

let keyCounter = 0;
function nextKey(): string {
  return `file_${Date.now()}_${++keyCounter}`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function matchesAccept(file: File, accept: string[]): boolean {
  return accept.some((pattern) => {
    if (pattern.startsWith('.')) {
      return file.name.toLowerCase().endsWith(pattern.toLowerCase());
    }
    if (pattern.endsWith('/*')) {
      return file.type.startsWith(pattern.slice(0, -1));
    }
    return file.type === pattern;
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Overloads ────────────────────────────────────────────────────────────────

export function useFileUpload<TOutput extends OutputFormat = 'file'>(
  options?: SingleOptions<TOutput>
): SingleReturn<OutputData<TOutput>>;

export function useFileUpload<TOutput extends OutputFormat = 'file'>(
  options: MultipleOptions<TOutput>
): MultipleReturn<OutputData<TOutput>>;

// ── Implementation ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useFileUpload(options: any = {}): any {
  const {
    multiple = false,
    maxFiles = multiple ? 10 : 1,
    maxSizeBytes = 100 * 1024 * 1024,
    accept,
    preview = false,
    output = 'file',
    onFileChange,
  } = options;

  type Entry = ManagedFile<unknown>;

  const [files, setFiles] = useState<Entry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const previewUrls = useRef<Map<string, string>>(new Map());
  const onFileChangeRef = useRef(onFileChange);
  onFileChangeRef.current = onFileChange;

  // Fire onFileChange whenever files change.
  useEffect(() => {
    onFileChangeRef.current?.(files);
  }, [files]);

  // Revoke all preview URLs on unmount.
  useEffect(() => {
    const urls = previewUrls.current;
    return () => {
      for (const url of urls.values()) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  const revokePreview = useCallback((key: string) => {
    const url = previewUrls.current.get(key);
    if (url) {
      URL.revokeObjectURL(url);
      previewUrls.current.delete(key);
    }
  }, []);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSizeBytes) {
        return `"${file.name}" exceeds ${formatBytes(maxSizeBytes)}`;
      }
      if (accept && !matchesAccept(file, accept)) {
        return `"${file.name}" has an unsupported file type`;
      }
      return null;
    },
    [maxSizeBytes, accept]
  );

  const buildEntry = useCallback(
    async (file: File): Promise<Entry> => {
      let data: unknown = file;
      if (output === 'base64') {
        data = await fileToBase64(file);
      } else if (output === 'blob') {
        data = new Blob([file], { type: file.type });
      }

      let previewUrl: string | null = null;
      if (preview && file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }

      const key = nextKey();
      if (previewUrl) previewUrls.current.set(key, previewUrl);

      return {
        key,
        file,
        data,
        name: file.name,
        size: file.size,
        type: file.type,
        preview: previewUrl,
      };
    },
    [output, preview]
  );

  const addFiles = useCallback(
    (input: FileList | File[] | File) => {
      const fileArray = input instanceof File ? [input] : Array.from(input);
      if (fileArray.length === 0) return;

      // Validate all files first.
      for (const file of fileArray) {
        const err = validateFile(file);
        if (err) {
          setError(err);
          return;
        }
      }

      setError(null);
      setIsProcessing(true);

      const process = async () => {
        const entries = await Promise.all(fileArray.map(buildEntry));

        setFiles((prev) => {
          if (!multiple) {
            // Single mode: replace. Revoke old previews.
            for (const old of prev) revokePreview(old.key);
            return [entries[0]];
          }
          const combined = [...prev, ...entries];
          if (combined.length > maxFiles) {
            // Revoke previews for entries that won't be added.
            for (const e of entries) revokePreview(e.key);
            setError(`Maximum ${maxFiles} files allowed`);
            return prev;
          }
          return combined;
        });
        setIsProcessing(false);
      };

      process();
    },
    [multiple, maxFiles, validateFile, buildEntry, revokePreview]
  );

  const removeByKey = useCallback(
    (key: string) => {
      revokePreview(key);
      setFiles((prev) => prev.filter((f) => f.key !== key));
      setError(null);
    },
    [revokePreview]
  );

  const removeAt = useCallback(
    (index: number) => {
      setFiles((prev) => {
        const entry = prev[index];
        if (entry) revokePreview(entry.key);
        return prev.filter((_, i) => i !== index);
      });
      setError(null);
    },
    [revokePreview]
  );

  const clear = useCallback(() => {
    setFiles((prev) => {
      for (const f of prev) revokePreview(f.key);
      return [];
    });
    setError(null);
  }, [revokePreview]);

  const clearError = useCallback(() => setError(null), []);

  if (multiple) {
    return {
      files,
      error,
      isProcessing,
      clearError,
      addFiles,
      remove: removeByKey,
      removeAt,
      clear,
      getData: () => files.map((f) => f.data),
    } satisfies MultipleReturn<unknown>;
  }

  return {
    file: files[0] ?? null,
    files,
    error,
    isProcessing,
    clearError,
    addFiles,
    remove: clear,
    clear,
    getData: () => files[0]?.data ?? null,
  } satisfies SingleReturn<unknown>;
}
