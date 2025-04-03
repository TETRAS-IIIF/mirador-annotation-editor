import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { Grid } from '@mui/material';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { TEMPLATE } from './AnnotationFormUtils';
import TextCommentTemplate from './TextCommentTemplate';
import IIIFTemplate from './IIIFTemplate';
import TaggingTemplate from './TaggingTemplate';

import './debug.css';
import { AdvancedAnnotationEditor } from './AdvancedAnnotationEditor';

/**
 * This function contain the logic for loading annotation and render proper template type
 * * */
export default function AnnotationFormBody(
  {
    annotation,
    canvases,
    closeFormCompanionWindow,
    debugMode,
    playerReferences,
    saveAnnotation,
    templateType,
    windowId,
  },
) {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Grid container direction="column">
      {!showAdvanced && (
        <TemplateContainer item>
          {
            templateType.id === TEMPLATE.TEXT_TYPE && (
              <TextCommentTemplate
                annotation={annotation}
                closeFormCompanionWindow={closeFormCompanionWindow}
                playerReferences={playerReferences}
                saveAnnotation={saveAnnotation}
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
              />
            )
          }
          {templateType.id === TEMPLATE.TAGGING_TYPE && (
            <TaggingTemplate
              annotation={annotation}
              closeFormCompanionWindow={closeFormCompanionWindow}
              playerReferences={playerReferences}
              saveAnnotation={saveAnnotation}
              windowId={windowId}
            />
          )}
        </TemplateContainer>
      )}
      <Grid item>
        {showAdvanced && (
          <AdvancedAnnotationEditor
            value={annotation}
            onChange={(updatedAnnotation) => {
              // eslint-disable-next-line no-param-reassign
              annotation = updatedAnnotation;
            }}
            closeFormCompanionWindow={closeFormCompanionWindow}
            saveAnnotation={saveAnnotation}
          />
        )}
      </Grid>
      {debugMode && (
        <>
          <Typography>
            {playerReferences.getMediaType()}
          </Typography>
          <Typography>
            {t('scale')}
            :
            {playerReferences.getScale()}
          </Typography>
          <Typography>
            {t('zoom')}
            :
            {playerReferences.getZoom()}
          </Typography>
          <Typography>
            {t('image_true_size')}
            :
            {playerReferences.getMediaTrueWidth()}
            {' '}
            x
            {playerReferences.getMediaTrueHeight()}
          </Typography>
          <Typography>
            {t('container_size')}
            :
            {playerReferences.getContainerWidth()}
            {' '}
            x
            {playerReferences.getContainerHeight()}
          </Typography>
          <Typography>
            {t('image_displayed')}
            :
            {playerReferences.getDisplayedMediaWidth()}
            {' '}
            x
            {playerReferences.getDisplayedMediaHeight()}
          </Typography>
        </>
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
    PropTypes.shape({ id: PropTypes.string, index: PropTypes.number }),
  ).isRequired,
  closeFormCompanionWindow: PropTypes.func.isRequired,
  debugMode: PropTypes.bool.isRequired,
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
