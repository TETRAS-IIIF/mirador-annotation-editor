import TextFieldsIcon from '@mui/icons-material/TextFields';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import DataObjectIcon from '@mui/icons-material/DataObject';
import React from 'react';
import { convertAnnotationStateToBeSaved } from '../IIIFUtils';
import IIIFTemplate from './IIIFTemplate';
import MultipleBodyTemplate from './MultipleBodyTemplate';
import TaggingTemplate from './TaggingTemplate';
import TextCommentTemplate from './TextCommentTemplate';
import { MEDIA_TYPES, TEMPLATE } from './AnnotationFormUtils';

/**
 * Thin adapter delegating to the still-centralized conversion logic in IIIFUtils.js.
 * A later phase of the annotation-template migration (tetras-dfb/root_repo#12) will move
 * each template's own conversion logic here instead of delegating to the shared function.
 * @param {object} state - the annotationState to convert
 * @param {{ canvas: object, windowId: string, playerReferences: object }} ctx
 * @returns {Promise<object>}
 */
const delegateToSharedConverter = (state, { canvas, windowId, playerReferences }) => (
  convertAnnotationStateToBeSaved(state, canvas, windowId, playerReferences)
);

/** Only IMAGE canvases support any of today's templates */
const imageOnly = (mediaType) => mediaType === MEDIA_TYPES.IMAGE;

/**
 * The annotation template registry (tetras-dfb/root_repo#12, Phase 1): a single source of
 * truth for which template components exist, which are user-selectable from the template
 * picker, and how each converts its own state into a savable IIIF annotation. Replaces the
 * previous hardcoded TEMPLATE_TYPES array and the AnnotationFormBody if-chain.
 *
 * Contract per entry:
 * - id: one of the TEMPLATE.* constants
 * - label / description / icon: shown in the template picker card
 * - isCompatibleWithMediaType(mediaType): whether the template picker offers this entry
 * - selectable: whether this template can be picked for a NEW annotation (false for legacy
 *   templates only reachable by loading data previously saved with this templateType)
 * - Component: the React component AnnotationFormBody renders for this templateType
 * - convertToAnnotation(state, ctx): converts annotationState to a savable IIIF annotation
 * @param {Function} t - i18next translation function
 * @returns {object[]}
 */
export const TEMPLATE_REGISTRY = (t) => [
  {
    Component: MultipleBodyTemplate,
    convertToAnnotation: delegateToSharedConverter,
    description: t('textual_note_with_target'),
    icon: <TextFieldsIcon />,
    id: TEMPLATE.MULTIPLE_BODY_TYPE,
    isCompatibleWithMediaType: imageOnly,
    label: t('note'),
    selectable: true,
  },
  {
    Component: TaggingTemplate,
    convertToAnnotation: delegateToSharedConverter,
    description: t('tag_with_target'),
    icon: <LocalOfferIcon fontSize="small" />,
    id: TEMPLATE.TAGGING_TYPE,
    isCompatibleWithMediaType: imageOnly,
    label: t('tag'),
    selectable: true,
  },
  {
    Component: IIIFTemplate,
    convertToAnnotation: delegateToSharedConverter,
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
    convertToAnnotation: delegateToSharedConverter,
    description: '',
    icon: null,
    id: TEMPLATE.TEXT_TYPE,
    isCompatibleWithMediaType: imageOnly,
    label: '',
    selectable: false,
  },
];

/** List of the templates offered by the template picker */
export const TEMPLATE_TYPES = (t) => TEMPLATE_REGISTRY(t)
  .filter((entry) => entry.selectable);

/** Return the registry entry for a given templateType id, selectable or not */
export const getTemplateType = (t, templateType) => TEMPLATE_REGISTRY(t)
  .find((entry) => entry.id === templateType);
