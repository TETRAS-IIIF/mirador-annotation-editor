import { templateKit } from '../src/annotationForm/templateKit';
import AnnotationFormFooter from '../src/annotationForm/AnnotationFormFooter';
import TargetFormSection from '../src/annotationForm/TargetFormSection';
import TextFormSection from '../src/annotationForm/TextFormSection';
import { TextCommentInput } from '../src/annotationForm/TextCommentInput';
import { MultiTagsInput } from '../src/annotationForm/MultiTagsInput';

// Smoke test for issue #12 Phase 3 (tetras-dfb/root_repo#12): templateKit is the public,
// documented building-block bundle both in-repo and future externally-registered templates
// are meant to compose instead of reaching into this package's file structure directly. Pins
// down that it actually re-exports the real components (not stale/renamed copies).

describe('templateKit', () => {
  it('re-exports the same 5 building-block components the in-repo templates use', () => {
    expect(templateKit.AnnotationFormFooter).toBe(AnnotationFormFooter);
    expect(templateKit.TargetFormSection).toBe(TargetFormSection);
    expect(templateKit.TextFormSection).toBe(TextFormSection);
    expect(templateKit.TextCommentInput).toBe(TextCommentInput);
    expect(templateKit.MultiTagsInput).toBe(MultiTagsInput);
  });
});
