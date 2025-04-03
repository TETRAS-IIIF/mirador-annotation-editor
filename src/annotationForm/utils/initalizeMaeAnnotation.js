import { getDefaultMaeAnnotation } from './getDefaultMaeAnnotation';

/** initalize a maeAnnotation */
export const initalizeMaeAnnotation = (annotation, type, motivation, templateType) => {
  let maeAnnotation = annotation;

  if (!maeAnnotation.id) {
    // If the annotation does not have maeData, the annotation was not created with mae
    maeAnnotation = getDefaultMaeAnnotation(type, motivation, templateType);
  } else if (maeAnnotation.maeData.target.drawingState && typeof maeAnnotation.maeData.target.drawingState === 'string') {
    // eslint-disable-next-line max-len
    maeAnnotation.maeData.target.drawingState = JSON.parse(maeAnnotation.maeData.target.drawingState);
  }
  return maeAnnotation;
};
