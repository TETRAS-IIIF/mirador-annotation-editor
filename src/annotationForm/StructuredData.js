/* eslint-disable react/forbid-prop-types */
import React from 'react';
import { useSelector } from 'react-redux';
import { getConfig } from 'mirador/dist/es/src/state/selectors';
import { useTranslation } from 'react-i18next';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import PropTypes from 'prop-types';

/**
 * Component which uses structured data from the config
*/
export default function StructuredData(
  {
    descriptionList,
    updateDescriptionList,
  },
) {
  const { t } = useTranslation();
  const annotationConfig = useSelector((state) => getConfig(state)).annotation;
  const { structuredData } = annotationConfig;

  if (!structuredData) {
    return null;
  }

  /** */
  const renderField = (elem, values) => {
    const {
      placeholder, selectLabel, entries, inputProps,
    } = elem.options;

    const listEntry = descriptionList.find((entry) => entry.dt === elem.title) ?? {};
    const value = listEntry.dd ?? '';

    const fieldProps = {
      fullWidth: true,
      inputProps: inputProps ?? {},
      placeholder: placeholder ? t(`structuredData.${placeholder}`) : '',
      size: 'small',
      value,
      variant: 'outlined',
    };

    switch (elem.type) {
      case 'TEXT':
        return (
          <TextField
            onChange={(e) => updateDescriptionList(e, elem.title)}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...fieldProps}
          />
        );
      case 'NUMBER':
        return (
          <TextField
            onChange={(e) => updateDescriptionList(e, elem.title)}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...fieldProps}
            type="number"
          />
        );
      case 'SELECT':
        return (
          <Select
            onChange={(e) => updateDescriptionList(e, elem.title)}
            label={t(`${selectLabel}`)}
            fullWidth
            value={value}
            size="small"
          >
            {entries.map((entry) => (
              <MenuItem key={entry} value={entry}>
                {t(`structuredData.${entry}`)}
              </MenuItem>
            ))}
          </Select>
        );
      default:
        return null;
    }
  };
  return (
    <Grid container direction="column" spacing={1}>
      <Grid item>
        <Typography variant="formSectionTitle">
          {t('structuredData.structuredData')}
        </Typography>
      </Grid>
      {structuredData.map((elem) => (
        <Grid item key={elem.title}>
          <Typography>{t(`structuredData.${elem.title}`)}</Typography>
          {renderField(elem, descriptionList)}
        </Grid>
      ))}
    </Grid>
  );
}

StructuredData.propTypes = {
  descriptionList: PropTypes.any.isRequired,
  updateDescriptionList: PropTypes.any.isRequired,
};
