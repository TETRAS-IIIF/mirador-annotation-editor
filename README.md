# Mirador Annotation Editor - Apache edition

- [Online demos](https://tetras-iiif.github.io/mirador-annotation-editor/), 
- [Roadmap](https://github.com/TETRAS-IIIF/.github/blob/main/profile/ROADMAP.md)

## Presentation

### Generalities

`mirador-annotation-editor`(also known as "MAE") is a [Mirador 4](https://github.com/projectmirador/mirador) plugin that 
adds annotation creation tools to the user interface. 

It is based on the original [mirador-annotations](https://github.com/ProjectMirador/mirador-annotations/) plugin with a
lot of technical and functional modifications (including migration from PaperJS to Konvas for the drawing part).

### General functionalities

- Activate a panel with tools to create annotations on IIIF documents (manifests) containing images **[and videos with
  MAEV](https://github.com/TETRAS-IIIF/mirador-annotation-editor-video)**
- Spatial and temporal targets for annotations
- Overlay annotations (geometric forms, free hand drawing, text and images)
- Textual/semantic annotations and tags
- Annotation metadata (based on Dublin Core)
- Annotation with another manifest --> network of IIIF documents

<!-- TOC -->
* [Mirador Annotation Editor - Apache edition](#mirador-annotation-editor---apache-edition)
  * [Presentation](#presentation)
    * [Generalities](#generalities)
    * [General functionalities](#general-functionalities)
  * [Install / integrate](#install--integrate-)
    * [NPM package](#npm-package)
    * [Use in existing npm project with previous plugins](#use-in-existing-npm-project-with-previous-plugins)
    * [Install (local)](#install-local)
  * [Usage](#usage)
    * [Use MAE with video annotation support](#use-mae-with-video-annotation-support)
    * [Persisting Annotations](#persisting-annotations)
    * [Configuration](#configuration-)
    * [External templates](#external-templates)
  * [Technical aspects from the original plugin](#technical-aspects-from-the-original-plugin)
  * [Contribute](#contribute)
    * [Contributor](#contributor)
    * [License](#license)
    * [Property](#property)
<!-- TOC -->


## Install / integrate 

### NPM package

```bash
npm install mirador-annotation-editor
```

### Use in existing npm project with previous plugins

You can override existing annotation plugin with your own versions by using npm. We support React 18 and MUI 5.

Update your `package.json` file to include the following dependencies and devDependencies:
```json
"mirador-annotations": "npm:mirador-annotation-editor@^1.1.6",
```

You need also to use the latest version of Mirador 4.

```json
"mirador": "4.0.0"
```

[Mirador 4 integration example](https://github.com/ProjectMirador/mirador-integration)


### Install (local)

This method requires `nvm`, `npm`.

```
git clone git@github.com:TETRAS-IIIF/mirador-annotation-editor.git
cd mirador-annotation-editor
nvm use
npm install
```

Run a demo with Mirador and the MAE plugin :

```
npm start
```

## Usage

### Use MAE with video annotation support
- If you need video annotation, you can use 
[our fork of Mirador: mirador-video](https://github.com/Tetras-IIIF/mirador-video)
- In addition, we have developed an extended version to support video annotation. This plugin is called **MAEV** and is
available in the [mirador-annotation-editor-video](https://github.com/Tetras-IIIF/mirador-annotation-editor-video)
repository.


### Persisting Annotations
Persisting annotations requires implementing a IIIF annotation server. Several 
[examples of annotation servers](https://github.com/IIIF/awesome-iiif#annotation-servers) are available on iiif-awesome.

We provide a full Mirador workspace with persistance at https://app.mirador-multi-user.com.

### Configuration 

See `demo/src/index.js` for a full configuration sample.

```js
 let annotationConfig = { // Annotation plugin related
    adapter: (canvasId) => new LocalStorageAdapter(`localStorage://?canvasId=${canvasId}`, 'Anonymous User'), // Adapter to persist annotations
    allowTargetShapesStyling: true, // Allow user to change color, line ... Color rendering is not fully supported by Mirador viewer in some case
    commentTemplates: [{ // Templates for comment creation
      content: '<h4>Comment</h4><p>Comment content</p>',
      title: 'Template',
    },
    {
      content: '<h4>Comment2</h4><p>Comment content</p>',
      title: 'Template 2',
    }],
    exportLocalStorageAnnotations: false, 
    quillConfig, // Configuration for the quill editor
    readonly: false, // If true, no annotation creation, edit, deleting is allowed
    tagsSuggestions: ['Mirador', 'Awesome', 'Viewer', 'IIIF', 'Template'], // Tags suggestions for autocompletion
    templates: [], // Externally-registered annotation templates - see "External templates" below
};
```

### External templates

MAE's built-in annotation templates (Note, Tag, expert JSON mode) are entries in an internal
template registry. As of the template-registry migration
([tetras-dfb/root_repo#12](https://github.com/Tetras-dfb/root_repo/issues/12)), you can register
your own template alongside them via `config.annotation.templates`: an array of entries following
the same contract as a built-in one.

```js
import { templateKit } from 'mirador-annotation-editor';

const { AnnotationFormFooter } = templateKit; // reuse MAE's own building blocks in your template

const myTemplate = {
  // A unique id. Never reuse a built-in TEMPLATE.* value ('multiple_body', 'tagging', 'iiif',
  // 'text') - a colliding id is dropped (with a console warning) rather than overriding the
  // built-in entry.
  id: 'my-plugin/my-template',
  label: 'My Template', // shown on the picker card
  description: 'What this template is for', // shown on the picker card
  icon: null, // a React element, or null
  isCompatibleWithMediaType: (mediaType) => mediaType === 'Image', // MEDIA_TYPES.IMAGE/AUDIO/VIDEO/UNKNOWN
  selectable: true, // false hides it from the picker (reachable only by loading existing data with this id)
  Component: MyTemplateComponent, // receives the same props every built-in template does:
                                   // annotation, canvases, closeFormCompanionWindow,
                                   // playerReferences, saveAnnotation, t, windowId
  convertToAnnotation: async (state, { canvas, windowId, playerReferences }) => {
    // Turn your component's annotationState into a savable IIIF annotation (set `.target`,
    // shape `.body`, etc.) and return it.
    return { ...state, target: canvas.id };
  },
};

let annotationConfig = {
  // ... your other options ...
  templates: [myTemplate],
};
```

See `src/examples/exampleExternalTemplate.jsx` for a complete, tested example (a minimal
whole-canvas star-rating template) and `src/annotationForm/templateRegistry.jsx`'s
`TEMPLATE_REGISTRY` JSDoc for the full contract reference.

## Technical aspects from the original plugin

- Mirador 4 support
- Update to Material UI 7 and React 19 to follow latest Mirador upgrades
- The [paperjs](http://paperjs.org/ ) library has been replaced with [Konvas](https://konvajs.org)
- Use `template` to facilitate the creation of annotations with pre-filled content and tags
- Use of `quill` as rich text editor for annotation content
- Mirador Multi User (MMU) support for real time annotation sharing and collaboration (see https://mirador-multi-user.com/)
- New adapter system to facilitate the implementation of annotation persistence and sharing ([Aiiinotation server](https://github.com/Aikon-platform/aiiinotate) )

## Contribute

Our plugin follow the Mirador guidelines. Development, design, and maintenance is driven by community needs and ongoing
feedback and discussion.
To suggest features, report bugs, and clarify usage, please submit a GitHub issue.

### Contributor

The contributors of this software are :

- [Tétras Libre SARL](https://tetras-libre.fr)
  - David Rouquet
  - Anthony Geourjon
  - Antoine Roy
- Leipzig University
  - Gerd Muller
  - fstoe
- École nationale des ponts et chaussées (enpc.fr)
   - paulhectork
   - 

### License

Like the original [mirador-annotations](https://github.com/ProjectMirador/mirador-annotations/) plugin, this
`mirador-annotation-editor` is distributed under the **Apache License Version 2.0**.

Beware that the extension plugin [mirador-annotation-editor-video](https://github.com/Tetras-IIIF/mirador-annotation-editor-video)
that supports video annotation is released under the **GPL v3** license.

Please acknowledge that any modification you make must be distributed under a compatible license and cannot be closed
source.

If you need to integrate this code base in closed source pieces of software, please contact us, so we can discuss dual
licencing.

### Property

The base of this software (up to V1) is the property of [SATT Ouest Valorisation](https://www.ouest-valorisation.fr/)
that funded its development under the French public contract AO-MA2023-0004-DV5189.
After that, development has been almost fully supported by Tétras Libre with external contributions.
