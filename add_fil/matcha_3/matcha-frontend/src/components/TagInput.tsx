// import React, { useState } from 'react';
import {WithContext as ReactTags, Tag} from 'react-tag-input';
import '../styles/TagInput.css';

interface TagInputProps {
    selectedTags: Tag[],
    setSelectedTags: (tags: Tag[]) => void,
    placeholder?: string,
    id?: string
}

const KeyCodes = {
    comma: 188,
    enter: 13,
};

const delimiters = [KeyCodes.comma, KeyCodes.enter];

const TagInput: React.FC<TagInputProps> = ({selectedTags, setSelectedTags, placeholder = 'Add a tag'}) => {
    const handleDelete = (i: number) => {
        setSelectedTags(selectedTags.filter((_tag, index) => index !== i));
    };

    const handleAddition = (tag: Tag) => {
        setSelectedTags([...selectedTags, tag]);
    };

    return (
        <div className="tag-input">
            <ReactTags
                tags={selectedTags}
                handleDelete={handleDelete}
                handleAddition={handleAddition}
                delimiters={delimiters}
                placeholder={placeholder}
                inputFieldPosition="inline"
                autocomplete
            />
        </div>
    );
};

export default TagInput;
