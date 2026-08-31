import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '../setupTest';
import { render, screen } from './test-utils';
import AnnotationFormBody from '../src/annotationForm/AnnotationFormBody';
import { TEMPLATE } from '../src/annotationForm/AnnotationFormUtils';
import {
  getTemplateType, TEMPLATE_REGISTRY, TEMPLATE_TYPES,
} from '../src/annotationForm/templateRegistry';

// Dispatch tests for issue #12 (https://github.com/Tetras-dfb/root_repo/issues/12): AnnotationFormBody
// renders whichever template component the registry (templateRegistry.jsx, Phase 1) maps a given
// templateType.id to. These tests pin down that dispatch behavior.

vi.mock('../src/annotationForm/TextCommentTemplate', () => ({
  convertTextCommentAnnotationToBeSaved: vi.fn(),
  default: () => <div data-testid="TextCommentTemplate" />,
}));
vi.mock('../src/annotationForm/TaggingTemplate', () => ({
  convertTaggingAnnotationToBeSaved: vi.fn(),
  default: () => <div data-testid="TaggingTemplate" />,
}));
vi.mock('../src/annotationForm/IIIFTemplate', () => ({
  convertIIIFAnnotationToBeSaved: vi.fn(),
  default: () => <div data-testid="IIIFTemplate" />,
}));
vi.mock('../src/annotationForm/MultipleBodyTemplate', () => ({
  convertMultipleBodyAnnotationToBeSaved: vi.fn(),
  default: () => <div data-testid="MultipleBodyTemplate" />,
}));

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

  it('dispatches to an externally-registered template (Phase 5, issue #12) when configured', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AnnotationFormBody
          annotation={{}}
          canvases={[{ id: 'canvas1', index: 0 }]}
          closeFormCompanionWindow={vi.fn()}
          playerReferences={{}}
          saveAnnotation={vi.fn()}
          templateType={{ id: 'my-plugin/custom-template', label: 'Custom' }}
          windowId="window1"
        />
      </I18nextProvider>,
      {
        preloadedState: {
          config: {
            annotation: {
              adapter: vi.fn(),
              templates: [{
                Component: () => <div data-testid="ExternalTemplate" />,
                convertToAnnotation: vi.fn(),
                description: '',
                icon: null,
                id: 'my-plugin/custom-template',
                isCompatibleWithMediaType: () => true,
                label: 'Custom',
                selectable: true,
              }],
            },
          },
        },
      },
    );

    expect(screen.getByTestId('ExternalTemplate')).toBeInTheDocument();
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

describe('TEMPLATE_REGISTRY external registration (Phase 5, issue #12)', () => {
  /** Identity translation stub */
  const mockT = (key) => key;
  /** A minimal, valid external template descriptor */
  const externalTemplate = () => ({
    Component: () => <div data-testid="ExternalTemplate" />,
    convertToAnnotation: vi.fn(),
    description: 'An externally-registered template',
    icon: null,
    id: 'my-plugin/custom-template',
    isCompatibleWithMediaType: () => true,
    label: 'Custom',
    selectable: true,
  });

  it('appends a valid external template to the registry', () => {
    const entries = TEMPLATE_REGISTRY(mockT, [externalTemplate()]);

    expect(entries.map((entry) => entry.id)).toContain('my-plugin/custom-template');
  });

  it('is picked up by getTemplateType/TEMPLATE_TYPES when passed through', () => {
    const external = [externalTemplate()];

    expect(getTemplateType(mockT, 'my-plugin/custom-template', external)?.label).toBe('Custom');
    expect(TEMPLATE_TYPES(mockT, external).map((entry) => entry.id))
      .toContain('my-plugin/custom-template');
  });

  it('drops (and warns about) an external template whose id collides with a built-in one', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const colliding = { ...externalTemplate(), id: TEMPLATE.TAGGING_TYPE };

    const entries = TEMPLATE_REGISTRY(mockT, [colliding]);

    expect(entries.filter((entry) => entry.id === TEMPLATE.TAGGING_TYPE)).toHaveLength(1);
    expect(entries.find((entry) => entry.id === TEMPLATE.TAGGING_TYPE).Component)
      .not.toBe(colliding.Component);
    expect(consoleWarnSpy).toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('defaults to no external templates when none are passed', () => {
    expect(TEMPLATE_REGISTRY(mockT)).toHaveLength(4);
  });
});
