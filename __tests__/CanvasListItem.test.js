import React from 'react';
import userEvent from '@testing-library/user-event';

import CanvasListItem from '../src/CanvasListItem';
import AnnotationActionsContext from '../src/AnnotationActionsContext';
import {
  fireEvent, render, screen, waitFor, within,
} from './test-utils';

const receiveAnnotation = vi.fn();
const storageAdapter = vi.fn(() => ({
  all: vi.fn()
    .mockResolvedValue({
      items: [{ id: 'anno/2' }]
    }),
  annotationPageId: 'pageId/3',
  delete: vi.fn(async () => 'annoPageResultFromDelete')
}));

function createWrapper(props, context = {}) {
  return render(
    <AnnotationActionsContext.Provider
      value={{
        canvases: [],
        receiveAnnotation,
        storageAdapter,
        switchToSingleCanvasView: () => undefined,
        ...context
      }}
    >
      <CanvasListItem annotationid="anno/1" {...props}>
        <div>HelloWorld</div>
      </CanvasListItem>
    </AnnotationActionsContext.Provider>,
    { context }
  );
}

describe('CanvasListItem', () => {
  it('wraps its children', () => {
    createWrapper();
    expect(screen.getByText('HelloWorld'))
      .toBeInTheDocument();
  });

  it('doesn\'t show edit/delete when annotation not editable on hover', async () => {
    createWrapper({}, {
      annotationsOnCanvases: {
        'canv/1': {
          'annoPage/1': {
            json: { items: [{ id: 'anno/1' }] } // no maeData => not editable
          }
        }
      },
      canvases: [{ id: 'canv/1' }]
    });

    const li = screen.getByText('HelloWorld')
      .closest('li');
    expect(li)
      .not
      .toBeNull();

    // you can use either userEvent.hover or fireEvent.mouseEnter
    await userEvent.hover(li);
    // fireEvent.mouseEnter(li!);

    expect(screen.queryByRole('button', { name: /metadata/i }))
      .toBeNull();
    expect(screen.queryByRole('button', { name: /edit/i }))
      .toBeNull();
    expect(screen.queryByRole('button', { name: /delete/i }))
      .toBeNull();
  });

  it('shows edit/delete when editable and hovering', async () => {
    createWrapper({}, {
      annotationsOnCanvases: {
        'canv/1': {
          'annoPage/1': {
            json: {
              items: [
                {
                  id: 'anno/1',
                  maeData: { cre: 'someValue' },
                  creator: 'someCreator'
                } // editable
              ]
            }
          }
        }
      },
      canvases: [{ id: 'canv/1' }]
    });

    const li = screen.getByText('HelloWorld')
      .closest('li');
    expect(li)
      .not
      .toBeNull();

    await userEvent.hover(li);
    // fireEvent.mouseEnter(li!);

    const buttons = screen.getAllByRole('button');
    expect(buttons.length)
      .toBe(3);
    expect(screen.getByRole('button', { name: /metadata/i }))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit/i }))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i }))
      .toBeInTheDocument();
  });

  it('deletes via storageAdapter on delete click, once confirmed', async () => {
    createWrapper({}, {
      annotationEditCompanionWindowIsOpened: true,
      annotationsOnCanvases: {
        'canv/1': {
          'annoPage/1': {
            json: {
              items: [
                {
                  id: 'anno/1',
                  maeData: { someData: 'someValue' }
                }
              ]
            }
          }
        }
      },
      canvases: [{ id: 'canv/1' }]
    });

    const li = screen.getByText('HelloWorld')
      .closest('li');
    expect(li)
      .not
      .toBeNull();

    await userEvent.hover(li);
    // fireEvent.mouseEnter(li!);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);
    // fireEvent.click(deleteButton);
    expect(storageAdapter).not.toHaveBeenCalled();

    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /delete/i }));

    expect(storageAdapter)
      .toHaveBeenCalledTimes(1);
    expect(storageAdapter)
      .toHaveBeenCalledWith('canv/1');
  });

  it('keeps the annotation when its deletion is cancelled', async () => {
    storageAdapter.mockClear();
    createWrapper({}, {
      annotationEditCompanionWindowIsOpened: true,
      annotationsOnCanvases: {
        'canv/1': {
          'annoPage/1': {
            json: {
              items: [{
                body: [{
                  language: 'en', purpose: 'identifying', type: 'TextualBody', value: 'Cairo',
                }],
                id: 'anno/1',
                maeData: { someData: 'someValue' },
              }],
            },
          },
        },
      },
      canvases: [{ id: 'canv/1' }],
    });

    await userEvent.hover(screen.getByText('HelloWorld').closest('li'));
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('delete_annotation_confirm_title')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: /cancel/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(storageAdapter).not.toHaveBeenCalled();
  });
});
