import { sanitizeTemplateHtml } from '../src/annotationForm/templates/templateComponents/TextCommentInput';

// Regression test: the merge-confirmation dialog in TextCommentInput previews a comment
// template's `content` via dangerouslySetInnerHTML. Templates can come from admin config or
// external annotation adapters (AiiinotateAdapter, AnnototAdapter), so that content is untrusted
// third-party HTML and must be sanitized before rendering (stored-XSS otherwise).

describe('sanitizeTemplateHtml', () => {
  it('strips <script> tags (the inert JS text may remain, but it can no longer execute)', () => {
    const result = sanitizeTemplateHtml('<script>window.__xss = true;</script><p>hi</p>');

    expect(result).not.toContain('<script');
    expect(result).toContain('hi');
  });

  it('strips inline event handler attributes like onerror', () => {
    const result = sanitizeTemplateHtml('<img src="x" onerror="window.__xss = true">');

    expect(result).not.toContain('onerror');
    expect(result).not.toContain('__xss');
  });

  it('strips javascript: URLs', () => {
    const result = sanitizeTemplateHtml('<a href="javascript:window.__xss = true">click</a>');

    expect(result).not.toContain('javascript:');
  });

  it('keeps safe formatting tags and text content intact', () => {
    const result = sanitizeTemplateHtml('<p><strong>hello</strong> world</p>');

    expect(result).toContain('<strong>hello</strong>');
    expect(result).toContain('world');
  });

  it('returns an empty string for empty input', () => {
    expect(sanitizeTemplateHtml('')).toBe('');
  });
});
