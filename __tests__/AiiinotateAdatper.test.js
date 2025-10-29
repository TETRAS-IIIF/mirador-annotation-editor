import AiiinotateAdapter from '../src/annotationAdapter/AiiinotateAdapter';
import fixture from '../__fixtures__/web_annotation.json';

const
  endpointUrl = 'http://127.0.0.1:4000',
  iiifPresentationVersion = 2,
  annotation = fixture.items.at(0),
  canvasId = annotation.target.id;

describe('AiiinotateAdapter', () => {
  let subject = new AiiinotateAdapter(endpointUrl, iiifPresentationVersion, canvasId, "Test User");;
  beforeEach(async () => {
    // delete all annotations on canvas `canvasId`
    await fetch(`${endpointUrl}/annotations/2/delete?canvasUri=${canvasId}`, { method: "DELETE" });
  });
  describe('create', () => {
    it.skip('adds an item to the AnnotationPage items', async () => {
      let annoPage = await subject.all();
      const preLength = annoPage.items.length;
      annoPage = await subject.create(annotation);
      expect(annoPage.items.length - preLength).toBe(1);  // asserts that 1 item has been inserted
    });
    // NOTE: this test doesn't make sense for Aiiinotate, since we don't store annotationPages, but annotations.
    // it('if there is no AnnotationPage, create one', async () => {
    //   subject = new LocalStorageAdapter('//bar');
    //   let annoPage = await subject.all();
    //   expect(annoPage).toBe(null);
    //   await subject.create({});
    //   annoPage = await subject.all();
    //   expect(annoPage.type).toBe('AnnotationPage');
    //   expect(annoPage.items.length).toBe(1);
    // });
  });
  describe('delete', () => {
    it.skip('removes an item from an AnnotationPage', async () => {
      // insert an element, delete it, assert annoPage has 1 less element than before deletion
      let annoPage = await subject.create(annotation);
      const preLength = annoPage.items.length;
      const annotationId = annoPage.items.at(-1).id;
      annoPage = await subject.delete(annotationId);
      expect(annoPage.items.length - preLength).toBe(-1);
    });
  });
  describe('update', () => {
    it.skip('replaces the annotation', async () => {
      const updateValue = "face";
      let annoPage = await subject.create(annotation);
      const preLength = annoPage.items.length;
      const annotationUpdate = annoPage.items.at(-1);
      const annotationUpdateId = annotationUpdate.id;

      annotationUpdate.body.value = updateValue;
      annoPage = await subject.update(annotationUpdate);

      expect(annoPage.items.length === preLength);
      expect(
        annoPage.items.find( (anno) => anno.id === annotationUpdateId )?.body.value
      ).toBe(updateValue);
    });
  });
  describe('all', () => {
    it.skip('parses and returns an item based on its annotationPageId', async () => {
      let annoPage = await subject.create(annotation);
      expect( typeof annoPage.id === "string" && annoPage.id.length > 0 ).toBe(true);
      expect( annoPage.items.length > 0 ).toBe(true);
    });
  });
});
