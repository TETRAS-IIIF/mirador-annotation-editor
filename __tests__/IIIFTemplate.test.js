import { convertIIIFAnnotationToBeSaved } from '../src/annotationForm/IIIFTemplate';

// Regression test for issue #12 Phase 2c (tetras-dfb/root_repo#12): IIIF_TYPE ("expert mode")
// annotations are already a raw, hand-edited IIIF annotation - convertAnnotationStateToBeSaved
// used to early-return them unchanged, and this dedicated function preserves that exactly.

describe('convertIIIFAnnotationToBeSaved', () => {
  it('returns the annotationState unchanged, whatever shape it is', async () => {
    const state = { anything: 'goes', here: { nested: true } };

    await expect(convertIIIFAnnotationToBeSaved(state)).resolves.toBe(state);
  });
});
