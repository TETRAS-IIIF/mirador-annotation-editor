import Mirador from 'mirador';
import annotationPlugins from '../../src';
import LocalStorageAdapter from '../../src/annotationAdapter/LocalStorageAdapter';
import { manifestsCatalog } from './manifestsCatalog';

const config = {
  annotation: {
    adapter: (canvasId) => new LocalStorageAdapter(`localStorage://?canvasId=${canvasId}`, 'Anonymous User'),
    allowTargetShapesStyling: true,
    commentTemplates: [{
      content: '<h4>Comment</h4><p>Comment content</p>',
      title: 'Template',
    },
    {
      content: '<h4>Comment2</h4><p>Comment content</p>',
      title: 'Template 2',
    }],
    debug: true,
    exportLocalStorageAnnotations: true,
    readonly: false,
    tagsSuggestions: ['Mirador', 'Awesome', 'Viewer', 'IIIF', 'Template'],
  },
  annotations: {
    htmlSanitizationRuleSet: 'liberal',
  },
  catalog: manifestsCatalog,
  id: 'demo',
  language: 'en',
  themes: {
    dark: {
      typography: {
        formSectionTitle: {
          color: '#5A8264',
          fontSize: '1rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        },
        subFormSectionTitle: {
          fontSize: '1.383rem',
          fontWeight: 300,
          letterSpacing: '0em',
          lineHeight: '1.33em',
          textTransform: 'uppercase',
        },
      },
    },
    light: {
      palette: {
        primary: {
          main: '#5A8264',
        },
      },
      typography: {
        formSectionTitle: {
          color: '#5A8264',
          fontSize: '1.215rem',
        },
        subFormSectionTitle: {
          fontSize: '0.937rem',
          fontWeight: 300,

        },
      },
    },
  },
  window: {
    defaultSideBarPanel: 'annotations',
    sideBarOpenByDefault: true,
  },
  windows: [
    { manifestId: ' https://iiif.harvardartmuseums.org/manifests/object/299843' },
  ],
};

Mirador.viewer(config, [...annotationPlugins]);
