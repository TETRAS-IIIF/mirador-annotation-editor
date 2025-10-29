export const DEFAULT_QUILL_CONFIG = {
    // https://quilljs.com/docs/formats
    formats: [
        'header',
        'bold',
        'italic',
        'underline',
        'strike',
        'blockquote',
        'list',
        'indent',
        'link',
        'image',
        'color',
        'background',
    ],
    // https://quilljs.com/docs/modules/toolbar/
    modules: {
        toolbar: [
            [{ header: [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [
                { list: 'ordered' },
                { list: 'bullet' },
                { indent: '-1' },
                { indent: '+1' },
            ],
            [{ color: [] }, { background: [] }],
            ['link', 'image'],
            ['clean'],
        ],
    },
};