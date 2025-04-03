import uuid from 'draft-js/lib/uuid';

/** Returns a default Mae Text type annotation */
export const getDefaultMaeAnnotation = (type, motivation, templateType) => ({
  body: {
    id: uuid(),
    type,
    value: '',
  },
  maeData: {
    target: null,
    templateType,
  },
  motivation,
  target: null,
});
