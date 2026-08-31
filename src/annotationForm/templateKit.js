import AnnotationFormFooter from './AnnotationFormFooter';
import TargetFormSection from './TargetFormSection';
import TextFormSection from './TextFormSection';
import { TextCommentInput } from './TextCommentInput';
import { MultiTagsInput } from './MultiTagsInput';

/**
 * The shared "template kit" (tetras-dfb/root_repo#12, Phase 3): the low-level building blocks
 * every annotation template composes - a target picker/editor, a save/cancel footer, and
 * tag/text input widgets. Bundled as a single object (mirroring `annotationAdapters` in
 * src/index.js) and re-exported from this package's public entry point, so both the 4
 * in-repo templates and future externally-registered templates (see templateRegistry.jsx and
 * its Phase 5 extension point) compose the same primitives instead of reaching into this
 * package's internal file structure directly.
 */
export const templateKit = {
  AnnotationFormFooter,
  MultiTagsInput,
  TargetFormSection,
  TextCommentInput,
  TextFormSection,
};
