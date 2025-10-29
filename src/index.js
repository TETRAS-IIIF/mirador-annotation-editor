import miradorAnnotationPlugin from './plugins/miradorAnnotationPlugin';
import externalStorageAnnotationPlugin from './plugins/externalStorageAnnotationPlugin';
import canvasAnnotationsPlugin from './plugins/canvasAnnotationsPlugin';
import annotationCreationCompanionWindowPlugin from './plugins/annotationCreationCompanionWindow';
import windowSideBarButtonsPlugin from './plugins/windowSideBarButtonsPlugin';
import annotationSagaPlugin from './plugins/annotationSaga';

export {
  miradorAnnotationPlugin, externalStorageAnnotationPlugin,
  canvasAnnotationsPlugin, annotationCreationCompanionWindowPlugin,
  windowSideBarButtonsPlugin,
};

// TODO atttention M4 merge

const annotationPlugins = [
  miradorAnnotationPlugin,
  externalStorageAnnotationPlugin,
  canvasAnnotationsPlugin,
  annotationCreationCompanionWindowPlugin,
  windowSideBarButtonsPlugin,
  annotationSagaPlugin,
];

export default annotationPlugins;
