import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { getConfig } from 'mirador';
import TextCommentTemplate from './TextCommentTemplate';
import './debug.css';
import TaggingTemplate from './TaggingTemplate';
import IIIFTemplate from './IIIFTemplate';
import MultipleBodyTemplate from './MultipleBodyTemplate';
import { DebugInformation } from './DebugInformation';
import { TEMPLATE } from './AnnotationFormUtils';

/**
 * This function contain the logic for loading annotation and render proper template type
 * * */
export default function AnnotationFormBody(
  {
    annotation,
    canvases,
    closeFormCompanionWindow,
    playerReferences,
    saveAnnotation,
    templateType,
    windowId,
  },
) {
  const { t } = useTranslation();
  const debugMode = useSelector((state) => getConfig(state)).annotation.debug ?? false;
  return (
    <Grid container direction="column">

      <TemplateContainer>
        {
          templateType.id === TEMPLATE.TEXT_TYPE && (
            <TextCommentTemplate
              annotation={annotation}
              closeFormCompanionWindow={closeFormCompanionWindow}
              playerReferences={playerReferences}
              saveAnnotation={saveAnnotation}
              t={t}
              windowId={windowId}
            />
          )
        }
        {
          templateType.id === TEMPLATE.MULTIPLE_BODY_TYPE && (
            <MultipleBodyTemplate
              annotation={annotation}
              closeFormCompanionWindow={closeFormCompanionWindow}
              playerReferences={playerReferences}
              saveAnnotation={saveAnnotation}
              t={t}
              windowId={windowId}
            />
          )
        }
        {
          templateType.id === TEMPLATE.TAGGING_TYPE && (
            <TaggingTemplate
              annotation={annotation}
              closeFormCompanionWindow={closeFormCompanionWindow}
              playerReferences={playerReferences}
              saveAnnotation={saveAnnotation}
              t={t}
              windowId={windowId}
            />
          )
        }
        {
          templateType.id === TEMPLATE.IIIF_TYPE && (
            <IIIFTemplate
              annotation={annotation}
              canvases={canvases}
              closeFormCompanionWindow={closeFormCompanionWindow}
              playerReferences={playerReferences}
              saveAnnotation={saveAnnotation}
              t={t}
            />
          )
        }
      </TemplateContainer>
      {debugMode && (
        <DebugInformation
          playerReferences={playerReferences}
          t={t}
        />
      )}
    </Grid>
  );
}

const TemplateContainer = styled(Grid)({
  margin: '0 10px',
});

AnnotationFormBody.propTypes = {
  annotation: PropTypes.shape({
    adapter: PropTypes.func,
    body: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string,
      }),
    ),
    defaults: PropTypes.objectOf(
      PropTypes.oneOfType(
        [PropTypes.bool, PropTypes.func, PropTypes.number, PropTypes.string],
      ),
    ),
    drawingState: PropTypes.string,
    manifestNetwork: PropTypes.string,
    target: PropTypes.string,
  }).isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  canvases: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      index: PropTypes.number,
    }),
  ).isRequired,
  closeFormCompanionWindow: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  playerReferences: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  saveAnnotation: PropTypes.func.isRequired,
  templateType: PropTypes.shape(
    {
      description: PropTypes.string,
      icon: PropTypes.element,
      id: PropTypes.string,
      label: PropTypes.string,
    },
  ).isRequired,
  windowId: PropTypes.string.isRequired,
};
