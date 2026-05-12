import miradorAnnotationPlugin from './plugins/miradorAnnotationPlugin';
import externalStorageAnnotationPlugin from './plugins/externalStorageAnnotationPlugin';
import canvasAnnotationsPlugin from './plugins/canvasAnnotationsPlugin';
import annotationCreationCompanionWindowPlugin from './plugins/annotationCreationCompanionWindow';
import windowSideBarButtonsPlugin from './plugins/windowSideBarButtonsPlugin';
import annotationSagaPlugin from './plugins/annotationSaga';
import AiiinotateAdapter from './annotationAdapter/AiiinotateAdapter';
import LocalStorageAdapter from './annotationAdapter/LocalStorageAdapter';
import 'react-quill/dist/quill.snow.css';

export { WindowPlayer } from './playerReferences';

export {
  miradorAnnotationPlugin, externalStorageAnnotationPlugin,
  canvasAnnotationsPlugin, annotationCreationCompanionWindowPlugin,
  windowSideBarButtonsPlugin,
};

export const annotationAdapters = {
  AiiinotateAdapter,
  LocalStorageAdapter,
};

const annotationPlugins = [
  miradorAnnotationPlugin,
  externalStorageAnnotationPlugin,
  canvasAnnotationsPlugin,
  annotationCreationCompanionWindowPlugin,
  windowSideBarButtonsPlugin,
  annotationSagaPlugin,
];

export default annotationPlugins;
