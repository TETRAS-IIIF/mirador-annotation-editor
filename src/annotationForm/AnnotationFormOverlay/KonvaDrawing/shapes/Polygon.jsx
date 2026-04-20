import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Line, Transformer } from 'react-konva';

/** FreeHand shape displaying */
function Polygon({
  activeTool,
  handleDragEnd,
  handleDragStart,
  isSelected,
  onShapeClick,
  onTransform,
  shape,
}) {
  // TODO check if selectedShapeId is needed
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (trRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()
        .batchDraw();
    }
  }, [isSelected, shape]);

  /**
   * Handles the click event on the shape by invoking the provided callback function.
   * @function handleClick
   *- The shape object representing the properties of the clicked shape.
   * @returns {void}
   */
  const handleClick = () => {
    onShapeClick(shape);
  };

  return (
    <>
      <Line
        closed={shape.closed || false}
        draggable={activeTool === 'cursor' || activeTool === 'edit'}
        fill={shape.fill}
        globalCompositeOperation="source-over"
        id={shape.id}
        lineCap="round"
        lineJoin="round"
        onClick={handleClick}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        onMousedown={handleClick}
        onTransform={onTransform}
        points={shape.points}
        ref={shapeRef}
        rotation={shape.rotation}
        scaleX={shape.scaleX}
        scaleY={shape.scaleY}
        stroke={shape.stroke}
        // This line cause SVG export error
        strokeScaleEnabled={false}
        strokeWidth={shape.strokeWidth}
        x={shape.x}
        y={shape.y}
      />
      <Transformer
        ref={trRef}
        visible={activeTool === 'edit' && isSelected}
      />
    </>
  );
}

Polygon.propTypes = {
  activeTool: PropTypes.string.isRequired,
  baseStrokeWidth: PropTypes.number.isRequired,
  displayMode: PropTypes.string.isRequired,
  handleDragEnd: PropTypes.func.isRequired,
  handleDragStart: PropTypes.func.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onShapeClick: PropTypes.func.isRequired,
  onTransform: PropTypes.func.isRequired,
  shape: PropTypes.shape({
    fill: PropTypes.string,
    id: PropTypes.string,
    points: PropTypes.arrayOf(PropTypes.number),
    rotation: PropTypes.number,
    scaleX: PropTypes.number,
    scaleY: PropTypes.number,
    stroke: PropTypes.string,
    strokeWidth: PropTypes.number,
    type: PropTypes.string,
    url: PropTypes.string,
    x: PropTypes.number,
    y: PropTypes.number,
  }).isRequired,
};

export default Polygon;
