import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { getConfig } from 'mirador';
import './debug.css';
import { DebugInformation } from './DebugInformation';
import { TEMPLATE_REGISTRY } from './templateRegistry';

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

  const annotationConfig = useSelector((state) => getConfig(state)).annotation;
  const debugMode = annotationConfig.debug ?? false;
  // Not defaulted to [] here: TEMPLATE_REGISTRY already defaults externalTemplates to [] on its
  // own, and passing `undefined` through (rather than a fresh [] on every render) keeps this
  // dependency stable when no custom templates are configured, so useMemo below actually memoizes.
  const { externalTemplates } = annotationConfig;
  // Avoid rebuilding the registry (and its JSX icon elements) on every render just to look up
  // one entry by id.
  const TemplateComponent = useMemo(
    () => TEMPLATE_REGISTRY(t, externalTemplates).find(
      (entry) => entry.id === templateType.id,
    )?.Component,
    [t, templateType.id, externalTemplates],
  );

  return (
    <Grid container direction="column">

      <TemplateContainer>
        {
          // Every template receives the same full prop set regardless of which ones it
          // actually declares/uses (e.g. only IIIFTemplate uses `canvases`) - simpler than
          // special-casing props per registry entry, and unused props are harmless.
          TemplateComponent && (
            <TemplateComponent
              annotation={annotation}
              canvases={canvases}
              closeFormCompanionWindow={closeFormCompanionWindow}
              playerReferences={playerReferences}
              saveAnnotation={saveAnnotation}
              t={t}
              windowId={windowId}
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
