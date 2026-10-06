import React from 'react';
import userEvent from '@testing-library/user-event';
import DeleteAnnotationDialog, { annotationTitle } from '../src/DeleteAnnotationDialog';
import { render, screen } from './test-utils';

const title = (language, value) => ({
  language, purpose: 'identifying', type: 'TextualBody', value,
});

describe('annotationTitle', () => {
  it('prefers the title in the UI language', () => {
    const annotation = { body: [title('en', 'Cairo'), title('ar', 'القاهرة')] };

    expect(annotationTitle(annotation, 'ar')).toBe('القاهرة');
    expect(annotationTitle(annotation, 'en-GB')).toBe('Cairo');
  });

  it('falls back to any non-empty title, or null', () => {
    expect(annotationTitle({ body: [title('en', ''), title('ar', 'القاهرة')] }, 'en')).toBe('القاهرة');
    expect(annotationTitle({ body: [{ purpose: 'describing', type: 'TextualBody', value: 'x' }] }, 'en')).toBeNull();
    expect(annotationTitle(null, 'en')).toBeNull();
  });
});

describe('DeleteAnnotationDialog', () => {
  it('confirms or cancels', async () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<DeleteAnnotationDialog onCancel={onCancel} onConfirm={onConfirm} open title="Cairo" />);

    // Cancel is focused first, so a stray Enter keeps the annotation.
    expect(screen.getByRole('button', { name: 'cancel' })).toHaveFocus();

    await userEvent.click(screen.getByRole('button', { name: 'delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
