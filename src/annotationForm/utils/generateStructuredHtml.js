/** */
export const generateStructuredHtml = (descriptionList, structuredDataKey) => `${structuredDataKey}  <dl> ${descriptionList.map(({ dt, dd }) => `<dt>${dt}</dt><dd>${dd}</dd>`).join('')} </dl>`;
