import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '../setupTest';
import { fireEvent, render, screen } from './test-utils';
import {
  ExampleRatingTemplate,
  convertExampleRatingAnnotationToBeSaved,
  exampleExternalTemplate,
} from '../src/examples/exampleExternalTemplate';
import { TEMPLATE_REGISTRY } from '../src/annotationForm/templateRegistry';

// Living documentation for issue #12 Phase 5 (tetras-dfb/root_repo#12): proves the example
// third-party template actually works end-to-end through the real extension point, not just
// that it type-checks against the contract.

describe('exampleExternalTemplate', () => {
  it('follows the registry entry contract and registers cleanly alongside the built-ins', () => {
    const entries = TEMPLATE_REGISTRY(() => '', [exampleExternalTemplate]);

    expect(entries).toHaveLength(5);
    expect(entries.find((entry) => entry.id === 'example-org/rating-template')).toBe(
      exampleExternalTemplate,
    );
  });

  it('renders, lets the user pick a rating, and saves a whole-canvas tagging annotation', () => {
    const saveAnnotation = vi.fn();
    /** Identity translation stub */
    const mockT = (key) => key;

    render(
      <I18nextProvider i18n={i18n}>
        <ExampleRatingTemplate
          annotation={{}}
          closeFormCompanionWindow={vi.fn()}
          saveAnnotation={saveAnnotation}
          t={mockT}
        />
      </I18nextProvider>,
    );

    const stars = screen.getAllByRole('radio');
    fireEvent.click(stars[2]); // 3rd star = a rating of 3
    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    expect(saveAnnotation).toHaveBeenCalledWith(expect.objectContaining({
      body: { purpose: 'tagging', type: 'TextualBody', value: '3' },
      maeData: { templateType: 'example-org/rating-template' },
    }));
  });

  it('converts to a whole-canvas target (no spatial selector) when saved', async () => {
    const state = {
      body: { purpose: 'tagging', type: 'TextualBody', value: '4' },
      maeData: { templateType: 'example-org/rating-template' },
    };

    const result = await convertExampleRatingAnnotationToBeSaved(state, { canvas: { id: 'canvas1' } });

    expect(result.target).toBe('canvas1');
    expect(result.body).toEqual(state.body);
  });
});
