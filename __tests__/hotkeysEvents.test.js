import { isEditableTarget } from '../src/hotkeys/hotkeysEvents';

// Shared by HotkeysListener and AnnotationDrawing's window-level keydown handler: a
// Delete/Backspace typed in one of the form's own fields must not delete the selected shape.
describe('isEditableTarget', () => {
  it.each(['input', 'textarea', 'select'])('treats <%s> as editable', (tag) => {
    expect(isEditableTarget(document.createElement(tag))).toBe(true);
  });

  it('treats a contenteditable element (e.g. the Quill editor) as editable', () => {
    const el = document.createElement('div');
    el.contentEditable = 'true';
    document.body.appendChild(el);

    expect(isEditableTarget(el)).toBe(true);

    el.remove();
  });

  it('does not treat other elements as editable', () => {
    expect(isEditableTarget(document.body)).toBe(false);
    expect(isEditableTarget(document.createElement('div'))).toBe(false);
  });

  it('handles a missing target', () => {
    expect(isEditableTarget(null)).toBe(false);
    expect(isEditableTarget(undefined)).toBe(false);
  });
});
