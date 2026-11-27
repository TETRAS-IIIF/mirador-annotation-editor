import React from 'react';
import { DraftItemActions, DraftsFooter } from '../src/DraftActions';
import AnnotationFormFooter from '../src/annotationForm/templates/templateComponents/AnnotationFormFooter';
import AnnotationFormHeader from '../src/annotationForm/AnnotationFormHeader';
import AnnotationFormOverlay from '../src/annotationForm/AnnotationFormOverlay/AnnotationFormOverlay';
import { render } from './test-utils';

/**
 * MUI 9 removed system props (alignItems, justifyContent, padding...) from
 * Box, Stack, Typography and Grid: passed as props, they end up on the DOM
 * and React warns. They belong in `sx`.
 */
describe('layout props go through sx (MUI 9)', () => {
  // Lower-cased by the DOM when React passes them through.
  const LEAKED = ['alignitems', 'justifycontent', 'padding', 'item', 'xs', 'flexdirection'];
  /** Layout props React passed through to DOM elements. */
  const leakedAttributes = (container) => [...container.querySelectorAll('*')]
    .flatMap((el) => LEAKED.filter((name) => el.hasAttribute(name)));

  it.each([
    ['DraftItemActions', () => (
      <DraftItemActions
        annotation={{ id: 'a1', status: 'draft' }}
        canvasId="c1"
        marker={{ property: 'status', value: 'draft' }}
        receiveAnnotation={vi.fn()}
        storageAdapter={vi.fn()}
      />
    )],
    ['DraftsFooter', () => <DraftsFooter count={2} onAcceptAll={vi.fn()} onRejectAll={vi.fn()} />],
    ['AnnotationFormFooter', () => (
      <AnnotationFormFooter
        annotationState={{}}
        closeFormCompanionWindow={vi.fn()}
        saveAnnotation={vi.fn()}
        t={(key) => key}
      />
    )],
    ['AnnotationFormHeader', () => (
      <AnnotationFormHeader annotation={{}} setCommentingType={vi.fn()} templateType={{ label: 'Note' }} t={(key) => key} />
    )],
    ['AnnotationFormOverlay', () => (
      <AnnotationFormOverlay
        currentShape={{}}
        deleteShape={vi.fn()}
        displayMode=""
        setToolState={vi.fn()}
        setViewTool={vi.fn()}
        shapes={[]}
        t={(key) => key}
        toolState={{
          activeTool: 'shapes',
          closedMode: 'closed',
          fillColor: 'black',
          image: {},
          strokeColor: 'black',
          strokeWidth: 1,
          updateColor: vi.fn(),
        }}
        updateCurrentShapeInShapes={vi.fn()}
      />
    )],
  ])('%s passes no layout prop to the DOM', (_name, element) => {
    const { container } = render(element());
    expect(leakedAttributes(container)).toEqual([]);
  });
});
