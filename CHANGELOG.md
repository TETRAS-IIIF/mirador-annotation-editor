# Changelog

Entries types:

- `ADDED` for new features.
- `CHANGED` for changes in existing functionality.
- `DEPRECATED` for soon-to-be removed features.
- `REMOVED` for now removed features.
- `FIXED` for any bug fixes.
- `SECURITY` to invite users to upgrade in case of vulnerabilities.

## [Unreleased]

- FIXED : Compatibility with Mirador 4.3 / MUI 9 (#273). Drop the `@mui/system` peer dependency so the MUI version follows Mirador's (MUI 7 for Mirador 4.2.x, MUI 9 for Mirador 4.3+)
- SECURITY : Sanitize comment-template HTML before rendering it in the merge-confirmation dialog (stored XSS) (#196)
- ADDED : Ask for confirmation before deleting an annotation, from the Delete/Backspace hotkey and the annotation list (#196)
- ADDED : Export `convertIIIFAnnoToMaeData` from the package entry point (#196)
- ADDED : `build:watch` npm script (#196)
- CHANGED : `react-redux` is now a peer dependency (`^8 || ^9`, same as Mirador) instead of being bundled (#196)
- CHANGED : Annotation template files grouped under `src/annotationForm/templates/` (`builtin/`, `examples/`, `templateComponents/`, `kit.js`, `registry.jsx`) (#196)
- CHANGED : `LocalStorageAdapter.all()` adds `maeData` to annotations not created through MAE so they are editable (#196)
- FIXED : Backspace/Delete typed in a text field no longer deletes the selected shape (#196)
- FIXED : Saga-only plugin no longer enters Mirador's Window render chain (#196)
- FIXED : `CanvasListItem` forwarded ref lost by `withTranslation()` (MUI focus warning, `t` prop leaked onto `<li>`) (#196)
- FIXED : `types` condition added to the package `exports` map (#196)
- FIXED : Wrong `toolState` / `selectedShapeId` prop types (#196)
- REMOVED : Unused `AdvancedAnnotationEditor` component (#196)

## [1.3.3 ]

- SECURITY : Update dependencies to fix vulnerabilities
- FIXED : Fix white background on generated annotation
- FIXED : Polygon tools

## [1.3.2 ]

- SECURITY : Update dependencies to fix vulnerabilities

## [ 1.3.1 ]

- SECURITY : Update dependencies to fix vulnerabilities
- REMOVED : Draftsj deps removed from package.json

## [ 1.2.3 ]

- CHANGED : UX improvement when drawing shape
- FIXED : default body annotation value when value left empty

## [ 1.2.2]

- CHANGED : UX improvement when drawing shape
- ADDED : maeData generation when annotation come form external source (ex : aiiinotate server)

## [ 1.2.1 ]

- FIX Correct the way to export module **Breaking change**. 

## [ 1.1.5 ]

- FIXED : Peer version of Mirador 

## [ 1.1.4 ]

- ADDED : Aiiinotate adapter
- FIXED : Npm package publish issues since moving to vite
- FIXED : Translation issue 
- FIXED : Error when no Quill config is provided

## [ 1.1.3 ]

- ADDED : Auto deploy 'stable' and 'latest' demo on github pages

## [ 1.1.2 ]

- FIXED : Fix regression from M4 update

## [ 1.1.1 ]

- FIXED : Fix regression from M4 update

## [ 1.1.0 ]

- ADDED : Mirador 4 support, some minor regression can be feared
- ADDED : React 19 and MUI 7 support
- FIXED : Minor regression about shape edition
- ADDED : Read only mode for annotation viewer
- CHANGED : Remove Webpack and use Vite for build
- CHANGED : Move to react-quill-new for rich text editor

## New changes not yet released

- ADD : readonly mode for annotation viewer

## [ 1.0.88]

- ADDED : Implement Multibody template
- ADDED : Tags suggestion in annotation edition
- FIXED : Use selector to get config data
- FIXED : Clean translation function call
- FIXED : Simplify IIIF annotation generation
- REMOVED : Remove unused code

## 1.0.80 (2025-02-05)

- FIXED : Wrong size of target after scaling shape
- FIXED : Window crash when opening new manifest if mae is already open

## 1.0.78 (2025-02-05)

- CHANGED : Display edit annotation button only if annotation is editable with MAE
- FIXED : Github CI/CD
- FIXED : Linting error issues





