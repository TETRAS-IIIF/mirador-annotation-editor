import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { styled } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { getConfig } from 'mirador';
import {DEFAULT_QUILL_CONFIG} from "./utils";

const StyledReactQuill = styled(ReactQuill)(({ theme }) => ({
    '.ql-editor': {
        minHeight: '150px',
    },
}));

/** Rich text editor for annotation body */
function TextEditor({ text, setText }) {
    const quillConfigFromState = useSelector((state) => getConfig(state)?.annotation?.quillConfig);

    const { formats, modules } = useMemo(() => {
        return quillConfigFromState?.modules && quillConfigFromState?.formats
            ? quillConfigFromState
            : DEFAULT_QUILL_CONFIG;
    }, [quillConfigFromState]);

    const handleChange = (html) => {
        setText(html);
    };

    return (
        <div data-text-editor="name" data-testid="textEditor">
            <StyledReactQuill
                value={text}
                onChange={handleChange}
                placeholder="Your text here"
                bounds='[data-text-editor="name"]'
                modules={modules}
                formats={formats}
            />
        </div>
    );
}

TextEditor.propTypes = {
    setText: PropTypes.func.isRequired,
    text: PropTypes.string.isRequired,
};

export default TextEditor;
