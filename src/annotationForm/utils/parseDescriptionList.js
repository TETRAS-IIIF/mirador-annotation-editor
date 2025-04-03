/** */
export const parseDescriptionList = (bodyValue, structuredDataKey) => {
  try {
    const parser = new DOMParser();
    const splitData = bodyValue.split(structuredDataKey);

    if (splitData.length < 2) return [];

    const doc = parser.parseFromString(splitData[1], 'text/html');
    const dlElement = doc.querySelector('dl');

    if (!dlElement) return [];

    return Array.from(dlElement.querySelectorAll('dt')).map((dt, index) => ({
      dd: dlElement.querySelectorAll('dd')[index]?.textContent.trim() || '',
      dt: dt.textContent.trim(),
    }));
  } catch (error) {
    return [];
  }
};
 