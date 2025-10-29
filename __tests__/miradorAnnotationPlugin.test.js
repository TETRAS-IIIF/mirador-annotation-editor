// tests/MiradorAnnotation.test.jsx
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '../setupTest';
import { useDispatch } from 'react-redux';

import * as miradorPkg from 'mirador';
import LocalStorageAdapter from '../src/annotationAdapter/LocalStorageAdapter';
import miradorAnnotationPlugin from '../src/plugins/miradorAnnotationPlugin';
import { render, screen, fireEvent } from './test-utils';

// ---- Mocks ----
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useDispatch: vi.fn()
  };
});

vi.mock('mirador', async () => {
  const actual = await vi.importActual('mirador');
  return {
    ...actual,
    getWindowViewType: vi.fn(),
    // MiradorMenuButton can be heavy; render a simple button
    MiradorMenuButton: ({
      children,
      ...rest
    }) => <button type="button" {...rest}>{children}</button>
  };
});

// ---- Default state ----
const defaultInitialState = {
  config: {
    annotation: {
      adapter: vi.fn(),
      exportLocalStorageAnnotations: true,
      readonly: false
    }
  }
};

// ---- Helper ----
function createWrapper(props = {}, initialState = defaultInitialState) {
  const Component = miradorAnnotationPlugin.component;
  return render(
    <I18nextProvider i18n={i18n}>
      <Component
        TargetComponent={() => <div>hello</div>}
        targetProps={{ windowId: 'windowId' }}
        annotationEditCompanionWindowIsOpened
        {...props}
      />
    </I18nextProvider>,
    { preloadedState: initialState }
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---- Tests ----
describe('MiradorAnnotation', () => {
  it('renders a create new button', () => {
    createWrapper();
    expect(screen.getByRole('button', { name: /create_annotation/i }))
      .toBeInTheDocument();
  });

  it('opens a new companionWindow when clicked', () => {
    const mockDispatch = vi.fn();
    useDispatch.mockImplementation(() => mockDispatch);

    miradorPkg.getWindowViewType.mockReturnValue('single');
    createWrapper();

    fireEvent.click(screen.getByRole('button', { name: /create_annotation/i }));

    expect(mockDispatch)
      .toHaveBeenCalledTimes(1);
    const dispatchedAction = mockDispatch.mock.calls[0][0];
    expect(dispatchedAction)
      .toEqual(
        expect.objectContaining({
          payload: expect.objectContaining({
            content: 'annotationCreation',
            position: 'right'
          }),
          type: 'mirador/ADD_COMPANION_WINDOW',
          windowId: 'windowId'
        })
      );
  });

  it('opens single canvas view dialog if not in single view', () => {
    miradorPkg.getWindowViewType.mockReturnValue('book');
    createWrapper();

    expect(screen.queryByText('switch_view'))
      .toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /create_annotation/i }));

    expect(screen.queryByText('switch_view'))
      .toBeInTheDocument();
  });

  it('renders no export button if export or LocalStorageAdapter are not configured', () => {
    const stateWithoutLocalAdapter = {
      config: {
        annotation: {
          adapter: () => () => {
          },
          exportLocalStorageAnnotations: true,
          readonly: false
        }
      }
    };
    createWrapper({}, stateWithoutLocalAdapter);
    expect(screen.queryByText(/Export local annotations for visible items/i))
      .toBeNull();

    const annotation = {
      adapter: () => () => {
      },
      exportLocalStorageAnnotations: false,
      readonly: false
    };
    const stateWithFalsyExport = { config: annotation };
    createWrapper({}, stateWithFalsyExport);
    expect(screen.queryByText(/Export local annotations for visible items/i))
      .toBeNull();
  });

  it('renders export button if export and LocalStorageAdapter are configured', () => {
    const annotation = {
      adapter: () => new LocalStorageAdapter(),
      exportLocalStorageAnnotations: true,
      readonly: false
    };

    const initialState = { config: { annotation } };
    createWrapper({}, initialState);

    expect(
      screen.getByRole('button', { name: /Export local annotations for visible items/i })
    )
      .toBeInTheDocument();
  });
});
