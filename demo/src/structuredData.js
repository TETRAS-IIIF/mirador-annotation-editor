/* eslint-disable max-len */

/**
 * @typedef {Object} StructuredDataField
 * @property {string} title - subtitle, used as key for translation.
 * @property {'TEXT' | 'NUMBER' | 'RANGE' | 'SELECT'} type - specifies type of input field
 * @property {Object} options - specify options
 * @property {string} [options.placeholder] - placeholder for input fields
 * @property {Object} [options.inputProps] - inputProps for MuiTextField
 * @property {Array<string>} [options.entries] - Menu items. value is used as key for menuItem text and as a value.

 * @property {string} [options.fromText] - text before range from field.
 * @property {string} [options.toText] - text before range to field.
 * @property {string} [options.text] - text before input field.

 * @type {StructuredDataField[]}
 */
const structuredData = [
  {
    options: {
      inputProps: {},
      placeholder: 'origPlacePlaceholder',
    },
    title: 'origPlace',
    type: 'TEXT',
  },
  {
    options: {
      inputProps: { pattern: '[0-9]*', step: 1 },
      placeholder: 'publishYearPlaceholder',
    },
    title: 'publishYear',
    type: 'NUMBER',
  },
  {
    options: {
      entries: ['de', 'en'],
      selectLabel: 'langPlaceholder',
    },
    title: 'language',
    type: 'SELECT',
  },
];

export default structuredData;
