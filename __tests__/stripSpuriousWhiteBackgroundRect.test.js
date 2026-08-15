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
});
