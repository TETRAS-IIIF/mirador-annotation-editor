import { convertIIIFAnnoToMaeData } from '../IIIFUtils';

/** */
export default class LocalStorageAdapter {
  /** */
  constructor(annotationPageId, user) {
    this.annotationPageId = annotationPageId;
    if (user) {
      this.user = user;
    } else {
      this.user = ANONYMOUS_USER;
    }
  }

  /**
   * Get the storage adapter user
   * @returns {*}
   */
  getStorageAdapterUser() {
    return this.user;
  }

  /** */
  async create(annotation) {
    const emptyAnnoPage = {
      id: this.annotationPageId,
      items: [],
      type: 'AnnotationPage',
    };
    const annotationPage = await this.all() || emptyAnnoPage;

    annotationPage.items.push(annotation);
    localStorage.setItem(this.annotationPageId, JSON.stringify(annotationPage));
    console.log('CREATE ANNOTATION', annotationPage);
    return annotationPage;
  }

  /** */
  async update(annotation) {
    const annotationPage = await this.all();
    if (annotationPage) {
      const currentIndex = annotationPage.items.findIndex((item) => item.id === annotation.id);
      annotationPage.items.splice(currentIndex, 1, annotation);
      localStorage.setItem(this.annotationPageId, JSON.stringify(annotationPage));
      console.log('UPDATE ANNOTATION', annotationPage);
      return annotationPage;
    }
    return null;
  }

  /** */
  async delete(annoId) {
    const annotationPage = await this.all();
    if (annotationPage) {
      annotationPage.items = annotationPage.items.filter((item) => item.id !== annoId);
    }
    localStorage.setItem(this.annotationPageId, JSON.stringify(annotationPage));
    return annotationPage;
  }

  /** */
  async get(annoId) {
    const annotationPage = await this.all();
    if (annotationPage) {
      return annotationPage.items.find((item) => item.id === annoId);
    }
    return null;
  }

  /** */
  async all() {
    const annotationPage = JSON.parse(localStorage.getItem(this.annotationPageId));
    // Mirrors AiiinotateAdapter: backfills maeData on annotations that weren't created through
    // MAE's own form (e.g. seeded directly into a manifest's AnnotationPage), so the annotation
    // list's hover action toolbar (gated on item.maeData - see CanvasListItem's editable())
    // shows for them too, not just MAE-created ones.
    if (annotationPage) {
      annotationPage.items = annotationPage.items.map(convertIIIFAnnoToMaeData);
    }
    return annotationPage;
  }
}

export const ANONYMOUS_USER = 'Anonymous';
