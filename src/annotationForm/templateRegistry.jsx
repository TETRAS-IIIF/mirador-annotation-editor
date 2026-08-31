import TextFieldsIcon from '@mui/icons-material/TextFields';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import DataObjectIcon from '@mui/icons-material/DataObject';
import React from 'react';
import IIIFTemplate, { convertIIIFAnnotationToBeSaved } from './IIIFTemplate';
import MultipleBodyTemplate, { convertMultipleBodyAnnotationToBeSaved } from './MultipleBodyTemplate';
import TaggingTemplate, { convertTaggingAnnotationToBeSaved } from './TaggingTemplate';
import TextCommentTemplate, { convertTextCommentAnnotationToBeSaved } from './TextCommentTemplate';
import { MEDIA_TYPES, TEMPLATE } from './AnnotationFormUtils';

/** Only IMAGE canvases support any of today's templates */
const imageOnly = (mediaType) => mediaType === MEDIA_TYPES.IMAGE;

/**
 * The annotation template registry (tetras-dfb/root_repo#12, Phase 1): a single source of
 * truth for which template components exist, which are user-selectable from the template
 * picker, and how each converts its own state into a savable IIIF annotation. Replaces the
 * previous hardcoded TEMPLATE_TYPES array and the AnnotationFormBody if-chain.
 *
 * As of Phase 2d, every entry's convertToAnnotation is owned by its own template module -
 * there is no more central "convert annotationState" function branching on templateType.
 * convertAnnotationStateToBeSaved still exists in IIIFUtils.js, but only as
 * AnnotationForm.jsx's fallback for a templateType this registry doesn't recognize.
 *
 * Contract per entry:
 * - id: a unique string. Use one of the TEMPLATE.* constants for a built-in entry; an
 *   externally-registered template must use its own id, never one of TEMPLATE.*'s values
 *   (see externalTemplates below)
 * - label / description / icon: shown in the template picker card
 * - isCompatibleWithMediaType(mediaType): whether the template picker offers this entry
 * - selectable: whether this template can be picked for a NEW annotation (false for legacy
 *   templates only reachable by loading data previously saved with this templateType)
 * - Component: the React component AnnotationFormBody renders for this templateType. Receives
 *   the same props as every built-in template: annotation, canvases, closeFormCompanionWindow,
 *   playerReferences, saveAnnotation, t, windowId (see AnnotationFormBody.jsx)
 * - convertToAnnotation(state, ctx): converts annotationState to a savable IIIF annotation.
 *   ctx is `{ canvas, windowId, playerReferences }`
 *
 * Phase 5 (tetras-dfb/root_repo#12): open for external registration via
 * `config.annotation.templates`, an array of entries following this same contract - see the
 * README's "External templates" section and src/examples/exampleExternalTemplate.jsx for a
 * complete, tested example. An external entry whose id collides with a built-in TEMPLATE.*
 * constant is dropped (with a console.warn) rather than silently overriding it.
 * @param {Function} t - i18next translation function
 * @param {object[]} externalTemplates - entries from config.annotation.templates, if any
 * @returns {object[]}
 */
export const TEMPLATE_REGISTRY = (t, externalTemplates = []) => {
  const builtInTemplates = [
    {
      Component: MultipleBodyTemplate,
      convertToAnnotation: convertMultipleBodyAnnotationToBeSaved,
      description: t('textual_note_with_target'),
      icon: <TextFieldsIcon />,
      id: TEMPLATE.MULTIPLE_BODY_TYPE,
      isCompatibleWithMediaType: imageOnly,
      label: t('note'),
      selectable: true,
    },
    {
      Component: TaggingTemplate,
      convertToAnnotation: convertTaggingAnnotationToBeSaved,
      description: t('tag_with_target'),
      icon: <LocalOfferIcon fontSize="small" />,
      id: TEMPLATE.TAGGING_TYPE,
      isCompatibleWithMediaType: imageOnly,
      label: t('tag'),
      selectable: true,
    },
    {
      Component: IIIFTemplate,
      convertToAnnotation: convertIIIFAnnotationToBeSaved,
      description: t('edit_iiif_json_code'),
      icon: <DataObjectIcon fontSize="small" />,
      id: TEMPLATE.IIIF_TYPE,
      isCompatibleWithMediaType: imageOnly,
      label: t('expert_mode'),
      selectable: true,
    },
    {
      // Kept only for backward compatibility: annotations previously saved with
      // templateType: TEMPLATE.TEXT_TYPE must still open and re-save correctly.
      // Never offered in the template picker - use MultipleBodyTemplate instead.
      Component: TextCommentTemplate,
      convertToAnnotation: convertTextCommentAnnotationToBeSaved,
      description: '',
      icon: null,
      id: TEMPLATE.TEXT_TYPE,
      isCompatibleWithMediaType: imageOnly,
      label: '',
      selectable: false,
    },
  ];

  const builtInIds = new Set(builtInTemplates.map((entry) => entry.id));
  const validExternalTemplates = externalTemplates.filter((entry) => {
    if (builtInIds.has(entry.id)) {
      console.warn(
        `Ignoring external annotation template with id "${entry.id}": it collides with a built-in template id.`,
      );
      return false;
    }
    // A malformed entry (e.g. isCompatibleWithMediaType missing) would otherwise throw inside
    // AnnotationFormTemplateSelector's render, breaking the picker for every template - not
    // just this one. Drop it instead, with enough detail to fix the registration.
    if (
      typeof entry.id !== 'string'
        || typeof entry.Component !== 'function'
        || typeof entry.convertToAnnotation !== 'function'
        || typeof entry.isCompatibleWithMediaType !== 'function'
    ) {
      console.warn(
        `Ignoring external annotation template with id "${entry.id}": it does not follow the `
          + 'TEMPLATE_REGISTRY contract (id: string, Component/convertToAnnotation/'
          + 'isCompatibleWithMediaType: function are all required).',
      );
      return false;
    }
    return true;
  });

  return [...builtInTemplates, ...validExternalTemplates];
};

/** List of the templates offered by the template picker */
export const TEMPLATE_TYPES = (t, externalTemplates = []) => TEMPLATE_REGISTRY(t, externalTemplates)
  .filter((entry) => entry.selectable);

/** Return the registry entry for a given templateType id, selectable or not */
export const getTemplateType = (t, templateType, externalTemplates = []) => TEMPLATE_REGISTRY(
  t,
  externalTemplates,
).find((entry) => entry.id === templateType);
