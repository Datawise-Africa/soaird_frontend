import * as React from 'react';

import { cn } from '~/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input flex field-sizing-content min-h-24 w-full rounded-md border bg-card px-3 py-2 text-base text-foreground caret-primary shadow-xs outline-none transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground placeholder:opacity-100 hover:border-ring/70 focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-[3px] aria-invalid:border-destructive aria-invalid:ring-destructive/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-70 md:text-sm',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };