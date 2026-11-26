import React from 'react';
import userEvent from '@testing-library/user-event';
import CanvasListItem from '../src/CanvasListItem';
import AnnotationActionsContext from '../src/AnnotationActionsContext';
import { DraftsFooter } from '../src/DraftActions';
import {
  acceptAllDrafts,
  acceptDraft,
  draftProvenance,
  draftsOnCanvases,
  getDraftMarker,
  isDraft,
  prepareDraftForEditing,
  rejectAllDrafts,
  withoutDraftMarker,
} from '../src/draftUtils';
import { render, screen, waitFor } from './test-utils';

const marker = {
  batchProperty: 'x:batch',
  modelProperty: 'x:model',
  property: 'x:status',
  value: 'draft',
};

const draft = {
  body: [
    { purpose: 'describing', type: 'TextualBody', value: '<p>anno domini</p>' },
    { purpose: 'tagging', type: 'TextualBody', value: 'date' },
  ],
  id: 'anno/1',
  motivation: 'commenting',
  target: {
    selector: { type: 'FragmentSelector', value: 'xywh=10,20,30,40' },
    source: 'canv/1',
  },
  type: 'Annotation',
  'x:batch': 7,
  'x:model': 'claude-opus-5-5',
  'x:status': 'draft',
};

describe('draft utilities', () => {
  it('reads the marker from annotations or annotation config', () => {
    expect(getDraftMarker({ annotations: { draftMarker: marker } })).toBe(marker);
    expect(getDraftMarker({ annotation: { draftMarker: marker } })).toBe(marker);
    expect(getDraftMarker({})).toBeNull();
  });

  it('recognizes drafts only when a marker is configured', () => {
    expect(isDraft(draft, marker)).toBe(true);
    expect(isDraft({ ...draft, 'x:status': 'published' }, marker)).toBe(false);
    expect(isDraft(draft, null)).toBe(false);
    expect(isDraft({ isDraft: true }, { property: 'isDraft' })).toBe(true);
  });

  it('removes the marker to publish', () => {
    const published = withoutDraftMarker(draft, marker);
    expect(published['x:status']).toBeUndefined();
    expect(draft['x:status']).toBe('draft');
  });

  it('gives model and batch for the banner, falling back to the W3C generator', () => {
    expect(draftProvenance(draft, marker)).toEqual({ batch: 7, model: 'claude-opus-5-5' });
    expect(draftProvenance({ generator: { name: 'tool' } }, { property: 'p' }))
      .toEqual({ batch: null, model: 'tool' });
  });

  it('builds maeData so a draft opens in the regular editor', () => {
    const prepared = prepareDraftForEditing(draft, marker);
    expect(prepared).not.toBe(draft);
    expect(prepared.maeData.templateType).toBe('multiple_body');
    expect(JSON.parse(prepared.maeData.target.drawingState).shapes[0])
      .toMatchObject({ height: 40, width: 30, x: 10, y: 20 });
    expect(draft.maeData).toBeUndefined();
    const notDraft = { id: 'x' };
    expect(prepareDraftForEditing(notDraft, marker)).toBe(notDraft);
  });

  it('lists the drafts of visible canvases', () => {
    const annotationsOnCanvases = {
      'canv/1': { p1: { json: { items: [draft, { id: 'pub' }] } } },
      'canv/2': { p2: { json: { items: [{ ...draft, id: 'anno/2' }] } } },
    };
    expect(draftsOnCanvases([{ id: 'canv/1' }, { id: 'canv/2' }], annotationsOnCanvases, marker)
      .map((d) => [d.canvasId, d.annotation.id]))
      .toEqual([['canv/1', 'anno/1'], ['canv/2', 'anno/2']]);
  });

  it('accepts through adapter.accept, or saves without the marker', async () => {
    const withAccept = { accept: vi.fn(async () => 'page'), update: vi.fn() };
    await expect(acceptDraft(withAccept, draft, marker)).resolves.toBe('page');
    expect(withAccept.accept).toHaveBeenCalledWith('anno/1');
    expect(withAccept.update).not.toHaveBeenCalled();

    const plain = { update: vi.fn(async () => 'page2') };
    await acceptDraft(plain, draft, marker);
    expect(plain.update.mock.calls[0][0]['x:status']).toBeUndefined();
  });

  it('bulk actions use acceptAll/rejectAll when the adapter has them', async () => {
    const bulk = { acceptAll: vi.fn(async () => 'a'), rejectAll: vi.fn(async () => 'r') };
    await expect(acceptAllDrafts(bulk, [draft], marker)).resolves.toBe('a');
    await expect(rejectAllDrafts(bulk, [draft])).resolves.toBe('r');

    const plain = { delete: vi.fn(async () => 'd'), update: vi.fn(async () => 'u') };
    await acceptAllDrafts(plain, [draft, { ...draft, id: 'anno/2' }], marker);
    expect(plain.update).toHaveBeenCalledTimes(2);
    await rejectAllDrafts(plain, [draft]);
    expect(plain.delete).toHaveBeenCalledWith('anno/1');
  });
});

describe('draft actions in the annotation list', () => {
  const receiveAnnotation = vi.fn();
  let adapter;

  /** Renders a list item for anno/1 on canv/1. */
  const renderItem = (item = draft, config = { annotation: {}, annotations: { draftMarker: marker } }) => {
    adapter = {
      accept: vi.fn(async () => 'pageAfterAccept'),
      annotationPageId: 'canv/1/annotationPage',
      delete: vi.fn(async () => 'pageAfterDelete'),
    };
    return render(
      <AnnotationActionsContext.Provider
        value={{
          annotationsOnCanvases: { 'canv/1': { p: { json: { items: [item] } } } },
          canvases: [{ id: 'canv/1' }],
          config,
          receiveAnnotation,
          storageAdapter: () => adapter,
        }}
      >
        <CanvasListItem annotationid="anno/1">
          <div>HelloWorld</div>
        </CanvasListItem>
      </AnnotationActionsContext.Provider>,
    );
  };

  beforeEach(() => receiveAnnotation.mockClear());

  it('shows a badge and Accept / Reject on drafts, without hovering', () => {
    renderItem();
    expect(screen.getByTestId('draft-actions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^accept$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^reject$/i })).toBeInTheDocument();
  });

  it('shows nothing for published annotations or without a marker', () => {
    renderItem({ ...draft, 'x:status': 'published' });
    expect(screen.queryByTestId('draft-actions')).toBeNull();
  });

  it('shows nothing when no marker is configured', () => {
    renderItem(draft, { annotation: {} });
    expect(screen.queryByTestId('draft-actions')).toBeNull();
  });

  it('accepts through the adapter and refreshes the canvas page', async () => {
    renderItem();
    await userEvent.click(screen.getByRole('button', { name: /^accept$/i }));
    await waitFor(() => expect(receiveAnnotation)
      .toHaveBeenCalledWith('canv/1', 'canv/1/annotationPage', 'pageAfterAccept'));
    expect(adapter.accept).toHaveBeenCalledWith('anno/1');
  });

  it('rejects by deleting the draft', async () => {
    renderItem();
    await userEvent.click(screen.getByRole('button', { name: /^reject$/i }));
    await waitFor(() => expect(receiveAnnotation)
      .toHaveBeenCalledWith('canv/1', 'canv/1/annotationPage', 'pageAfterDelete'));
    expect(adapter.delete).toHaveBeenCalledWith('anno/1');
  });

  it('lets drafts be edited from the hover toolbar', async () => {
    renderItem();
    await userEvent.hover(screen.getByText('HelloWorld').closest('li')); // eslint-disable-line testing-library/no-node-access
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });
});

describe('DraftsFooter', () => {
  it('is hidden without drafts', () => {
    render(<DraftsFooter count={0} onAcceptAll={vi.fn()} onRejectAll={vi.fn()} />);
    expect(screen.queryByTestId('drafts-footer')).toBeNull();
  });

  it('shows the count and runs bulk actions', async () => {
    const onAcceptAll = vi.fn(async () => undefined);
    const onRejectAll = vi.fn(async () => undefined);
    render(<DraftsFooter count={2} onAcceptAll={onAcceptAll} onRejectAll={onRejectAll} />);
    // Tests render i18n keys as-is: the count goes through t('drafts_count', { count }).
    expect(screen.getByTestId('drafts-footer')).toHaveTextContent('drafts_count');
    await userEvent.click(screen.getByRole('button', { name: /accept.all/i }));
    await userEvent.click(screen.getByRole('button', { name: /reject.all/i }));
    expect(onAcceptAll).toHaveBeenCalledTimes(1);
    expect(onRejectAll).toHaveBeenCalledTimes(1);
  });
});
