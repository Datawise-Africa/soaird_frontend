import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';

describe('Dialog viewport behavior', () => {
  it('bounds long dialogs and keeps their header and footer sticky', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader data-testid="header">
            <DialogTitle>Long modal</DialogTitle>
            <DialogDescription>Scrollable modal content.</DialogDescription>
          </DialogHeader>
          <div>Scrollable content</div>
          <DialogFooter data-testid="footer">Actions</DialogFooter>
        </DialogContent>
      </Dialog>
    );

    const content = screen.getByRole('dialog');
    expect(content.className).toContain('100dvh');
    expect(content.className).toContain('overscroll-contain');
    expect(screen.getByTestId('header').className).toContain('sticky');
    expect(screen.getByTestId('footer').className).toContain('sticky');
  });

  it('allows a fixed-layout modal to opt out of a sticky header', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader data-testid="header" sticky={false}>
            <DialogTitle>Fixed layout</DialogTitle>
            <DialogDescription>Fixed modal content.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByTestId('header').className).not.toContain('sticky');
  });
});