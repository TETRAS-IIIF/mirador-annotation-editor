import { stripSpuriousWhiteBackgroundRect } from '../src/annotationForm/AnnotationFormOverlay/KonvaDrawing/KonvaUtils';

describe('stripSpuriousWhiteBackgroundRect', () => {
  it('removes a strokeless opaque-white rect (the svgcanvas clearRect artifact)', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">'
      + '<rect x="0" y="0" width="100" height="100" fill="#FFFFFF"/>'
      + '<rect x="10" y="10" width="20" height="20" fill="rgba(100,100,100,0)" stroke="rgb(255,0,0)"/>'
      + '</svg>';

    const cleaned = stripSpuriousWhiteBackgroundRect(svg);

    expect(cleaned).not.toContain('#FFFFFF');
    expect(cleaned).toContain('stroke="rgb(255,0,0)"');
  });

  it('leaves shapes alone when none match the artifact signature', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50">'
      + '<rect x="1" y="1" width="10" height="10" fill="rgba(100,100,100,0)" stroke="rgb(255,0,0)"/>'
      + '</svg>';

    const cleaned = stripSpuriousWhiteBackgroundRect(svg);

    expect(cleaned).toContain('stroke="rgb(255,0,0)"');
    expect((cleaned.match(/<rect/g) || []).length).toBe(1);
  });

  it('is case-insensitive and tolerant of the "white" and "#fff" spellings', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30">'
      + '<rect x="0" y="0" width="30" height="30" fill="white"/>'
      + '<rect x="0" y="0" width="30" height="30" fill="#fff"/>'
      + '</svg>';

    const cleaned = stripSpuriousWhiteBackgroundRect(svg);

    expect((cleaned.match(/<rect/g) || []).length).toBe(0);
  });

  it('removes the artifact rect when svgcanvas writes it with an explicit stroke="none" (issue #267)', () => {
    const svg = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="4089" height="5000"><defs/><g>'
      + '<rect fill="#FFFFFF" stroke="none" x="0" y="0" width="4089.0000000000005" height="5000" transform="matrix(1 0 0 1 0 0)"/>'
      + '<g><path fill="rgb(100,100,100)" stroke="rgb(255,0,0" paint-order="fill stroke markers" d=" M 1978 2164 L 2304 2164 L 2304 2351 L 1978 2351 L 1978 2164 Z Z" fill-opacity="0" stroke-miterlimit="10" stroke-width="3" stroke-dasharray=""/></g>'
      + '</g></svg>';

    const cleaned = stripSpuriousWhiteBackgroundRect(svg);

    expect(cleaned).not.toContain('#FFFFFF');
    expect(cleaned).toContain('stroke="rgb(255,0,0"');
  });
});
