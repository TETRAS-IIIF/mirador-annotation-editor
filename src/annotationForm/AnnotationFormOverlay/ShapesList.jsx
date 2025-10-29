import {
  Divider, IconButton, ListItem, Tooltip,
} from '@mui/material';
import React from 'react';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import DeleteIcon from '@mui/icons-material/DeleteForever';
import { styled } from '@mui/material/styles';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';

/**
 * Accordion presentation of shapes
 * @param shapes
 * @param deleteShape
 * @param currentShapeId
 * @returns {Element}
 * @constructor
 */
const Row = styled(ListItem)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
}));

/**
 *
 * @param shapes
 * @param deleteShape
 * @param currentShapeId
 * @param updateCurrentShapeInShapes
 * @returns {JSX.Element}
 * @constructor
 */
function ShapesList({
  currentShapeId,
  deleteShape,
  shapes,
  t,
  updateCurrentShapeInShapes,
}) {
  return (
    <MenuList>
      {shapes.map((shape) => (
        <React.Fragment key={shape.id}>
          <MenuItem disableGutters>
            <Row>
              <Typography
                component="span"
                sx={{
                  color: 'black',
                  cursor: 'pointer',
                  fontWeight: shape.id === currentShapeId ? 'bold' : undefined,
                }}
                onClick={() => updateCurrentShapeInShapes(shape)}
              >
                {t(shape.type)}
              </Typography>
              <Tooltip title={t('delete')}>
                <IconButton onClick={() => deleteShape(shape.id)} edge="end" aria-label="delete">
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Row>
          </MenuItem>
          <Divider component="li" />
        </React.Fragment>
      ))}
    </MenuList>
  );
}

ShapesList.propTypes = {
  currentShapeId: PropTypes.string.isRequired,
  deleteShape: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  shapes: PropTypes.array.isRequired,
  t: PropTypes.func.isRequired,
  updateCurrentShapeInShapes: PropTypes.func.isRequired,
};

export default ShapesList;
