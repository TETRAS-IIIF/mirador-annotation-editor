import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '../setupTest';
import { render, screen } from './test-utils';
import AnnotationFormBody from '../src/annotationForm/AnnotationFormBody';
import { TEMPLATE } from '../src/annotationForm/AnnotationFormUtils';
import { getTemplateType, TEMPLATE_TYPES } from '../src/annotationForm/templateRegistry';

// Dispatch tests for issue #12 (https://github.com/Tetras-dfb/root_repo/issues/12): AnnotationFormBody
// renders whichever template component the registry (templateRegistry.jsx, Phase 1) maps a given
// templateType.id to. These tests pin down that dispatch behavior.

vi.mock('../src/annotationForm/TextCommentTemplate', () => ({ default: () => <div data-testid="TextCommentTemplate" /> }));
vi.mock('../src/annotationForm/TaggingTemplate', () => ({
  convertTaggingAnnotationToBeSaved: vi.fn(),
  default: () => <div data-testid="TaggingTemplate" />,
}));
vi.mock('../src/annotationForm/IIIFTemplate', () => ({ default: () => <div data-testid="IIIFTemplate" /> }));
vi.mock('../src/annotationForm/MultipleBodyTemplate', () => ({ default: () => <div data-testid="MultipleBodyTemplate" /> }));

const ALL_TEMPLATE_TESTIDS = ['TextCommentTemplate', 'TaggingTemplate', 'IIIFTemplate', 'MultipleBodyTemplate'];

const defaultInitialState = {
  config: {
    annotation: {
      adapter: vi.fn(),
    },
  },
};

/**
 * Renders AnnotationFormBody wired up to i18n + redux, like the real plugin does
 * @param {string} templateType
 */
function renderBody(templateType) {
  return render(
    <I18nextProvider i18n={i18n}>
      <AnnotationFormBody
        annotation={{}}
        canvases={[{ id: 'canvas1', index: 0 }]}
        closeFormCompanionWindow={vi.fn()}
        playerReferences={{}}
        saveAnnotation={vi.fn()}
        templateType={{ id: templateType, label: 'label' }}
        windowId="window1"
      />
    </I18nextProvider>,
    { preloadedState: defaultInitialState },
  );
}

describe('AnnotationFormBody dispatch', () => {
  it.each([
    [TEMPLATE.TEXT_TYPE, 'TextCommentTemplate'],
    [TEMPLATE.MULTIPLE_BODY_TYPE, 'MultipleBodyTemplate'],
    [TEMPLATE.TAGGING_TYPE, 'TaggingTemplate'],
    [TEMPLATE.IIIF_TYPE, 'IIIFTemplate'],
  ])('renders only %s -> %s', (templateType, expectedTestId) => {
    renderBody(templateType);

    expect(screen.getByTestId(expectedTestId)).toBeInTheDocument();
    ALL_TEMPLATE_TESTIDS.filter((id) => id !== expectedTestId).forEach((id) => {
      expect(screen.queryByTestId(id)).not.toBeInTheDocument();
    });
  });

  it('renders no template at all for an unknown templateType.id', () => {
    renderBody('some-unknown-type');

    ALL_TEMPLATE_TESTIDS.forEach((id) => {
      expect(screen.queryByTestId(id)).not.toBeInTheDocument();
    });
  });
});

describe('getTemplateType', () => {
  /** Identity translation stub */
  const mockT = (key) => key;

  it.each([
    TEMPLATE.MULTIPLE_BODY_TYPE, TEMPLATE.TAGGING_TYPE, TEMPLATE.IIIF_TYPE, TEMPLATE.TEXT_TYPE,
  ])(
    'resolves the %s entry from the registry by id, for dispatch purposes',
    (templateType) => {
      expect(getTemplateType(mockT, templateType)?.id).toBe(templateType);
    },
  );

  it('returns undefined for an unknown templateType id', () => {
    expect(getTemplateType(mockT, 'some-unknown-type')).toBeUndefined();
  });
});

describe('TEMPLATE_TYPES (the template picker list)', () => {
  /** Identity translation stub */
  const mockT = (key) => key;

  it('does not offer TEXT_TYPE: the legacy template is only reachable by loading existing data, never selectable', () => {
    expect(TEMPLATE_TYPES(mockT).map((entry) => entry.id)).not.toContain(TEMPLATE.TEXT_TYPE);
  });

  it('offers the 3 user-selectable templates', () => {
    expect(TEMPLATE_TYPES(mockT).map((entry) => entry.id).sort()).toEqual(
      [TEMPLATE.MULTIPLE_BODY_TYPE, TEMPLATE.TAGGING_TYPE, TEMPLATE.IIIF_TYPE].sort(),
    );
  });
});
