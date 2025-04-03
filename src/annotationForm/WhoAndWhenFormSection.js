import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ANONYMOUS_USER } from '../annotationAdapter/LocalStorageAdapter';

export const TOOLTIP_MODE = 'tooltip';
export const SECTION_MODE = 'section';

/**
 *
 * @param creator
 * @param creationDate
 * @param displayMode
 * @param lastEditor
 * @param lastSavedDate
 * @param t
 * @returns {React.JSX.Element|null}
 * @constructor
 */
function WhoAndWhenFormSection({
  creator,
  creationDate,
  lastEditor,
  lastSavedDate,
  displayMode,
}) {
  const { t } = useTranslation();

  if (!creator || !creationDate) {
    return null;
  }

  const creatorToDisplay = creator !== ANONYMOUS_USER ? creator : t('anonymous');
  const lastEditorToDisplay = lastEditor !== ANONYMOUS_USER ? lastEditor : t('anonymous');

  return (
    <>
      {
        displayMode === SECTION_MODE && (
          <Typography variant="formSectionTitle">
            {t('metadata')}
          </Typography>
        )
      }
      {
        displayMode === TOOLTIP_MODE && (
          <h1>
            {t('metadata')}
          </h1>
        )
      }
      <Typography>
        {t('createdByOn', {
          creationDate,
          creator: creatorToDisplay,
        })}
      </Typography>
      {
        (lastSavedDate && lastEditor) && (
          <Typography>
            {t('lastEditedByOn', {
              lastEditor: lastEditorToDisplay,
              lastSavedDate,
            })}
          </Typography>
        )
      }
    </>
  );
}

WhoAndWhenFormSection.propTypes = {
  creationDate: PropTypes.string.isRequired,
  creator: PropTypes.string.isRequired,
  displayMode: PropTypes.string.isRequired,
  lastEditor: PropTypes.string.isRequired,
  lastSavedDate: PropTypes.string.isRequired,
};

export default WhoAndWhenFormSection;
