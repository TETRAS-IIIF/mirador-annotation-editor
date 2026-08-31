import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '../setupTest';
import { render, screen } from './test-utils';
import AnnotationFormTemplateSelector from '../src/annotationForm/AnnotationFormTemplateSelector';
import { MEDIA_TYPES } from '../src/annotationForm/AnnotationFormUtils';

// Selector tests for issue #12 (https://github.com/Tetras-dfb/root_repo/issues/12): pins down
// which template cards AnnotationFormTemplateSelector offers per mediaType, ahead of a
// registry-based refactor.

/**
 * Renders AnnotationFormTemplateSelector wired up to i18n
 * @param {string} mediaType
 * @param {Function} setCommentingType
 */
function renderSelector(mediaType, setCommentingType = vi.fn()) {
  return render(
    <I18nextProvider i18n={i18n}>
      <AnnotationFormTemplateSelector mediaType={mediaType} setCommentingType={setCommentingType} />
    </I18nextProvider>,
  );
}

describe('AnnotationFormTemplateSelector', () => {
  it('offers note, tag and expert_mode cards for IMAGE media', () => {
    renderSelector(MEDIA_TYPES.IMAGE);

    expect(screen.getByText('note')).toBeInTheDocument();
    expect(screen.getByText('tag')).toBeInTheDocument();
    expect(screen.getByText('expert_mode')).toBeInTheDocument();
  });

  it('shows an "audio not supported" message instead of any card for AUDIO media', () => {
    renderSelector(MEDIA_TYPES.AUDIO);

    expect(screen.getByText('audio_not_supported')).toBeInTheDocument();
    expect(screen.queryByText('note')).not.toBeInTheDocument();
    expect(screen.queryByText('tag')).not.toBeInTheDocument();
    expect(screen.queryByText('expert_mode')).not.toBeInTheDocument();
  });

  it('offers no card at all for VIDEO media (none of today\'s templates declare themselves compatible)', () => {
    renderSelector(MEDIA_TYPES.VIDEO);

    expect(screen.queryByText('note')).not.toBeInTheDocument();
    expect(screen.queryByText('tag')).not.toBeInTheDocument();
    expect(screen.queryByText('expert_mode')).not.toBeInTheDocument();
  });

  it('calls setCommentingType with the matching template descriptor when a card is clicked', () => {
    const setCommentingType = vi.fn();
    renderSelector(MEDIA_TYPES.IMAGE, setCommentingType);

    screen.getByRole('button', { name: /note/i }).click();

    expect(setCommentingType).toHaveBeenCalledWith(expect.objectContaining({ id: 'multiple_body', label: 'note' }));
  });
});
