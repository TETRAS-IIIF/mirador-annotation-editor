  export const ANONYMOUS_USER = 'Anonymous';
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
    return JSON.parse(localStorage.getItem(this.annotationPageId));
  }
}

