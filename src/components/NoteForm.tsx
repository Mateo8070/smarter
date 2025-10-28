import React, { useState, useEffect, useRef } from 'react';
import type { Note } from '../types/database';
import styled from 'styled-components';

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
    font-weight: 500;
    font-size: 14px;
    color: var(--text-primary);
`;

const ButtonContainer = styled.div`
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
`;

const SubmitButton = styled.button`
    background-color: var(--primary);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s ease;

    &:hover {
        background-color: var(--primary-hover);
    }
`;


interface NoteFormProps {
  onSubmit: (item: Partial<Note>) => void;
  initialItem?: Note;
}

const NoteForm: React.FC<NoteFormProps> = ({ onSubmit, initialItem }) => {
  const [item, setItem] = useState<Partial<Note>>(
    initialItem || {
      title: '',
      body: '',
    }
  );
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (initialItem) {
        setItem(initialItem);
    }
  }, [initialItem]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(item);
    if (!initialItem) {
        setItem({ title: '', body: '' });
    }
  };

  return (
    <FormContainer onSubmit={handleSubmit}>
      <InputGroup>
        <Label htmlFor="note-title">Title</Label>
        <input
            id="note-title"
            name="title"
            ref={inputRef}
            value={item.title || ''}
            onChange={handleChange}
            placeholder="Note title"
            required
        />
      </InputGroup>
      <InputGroup>
        <Label htmlFor="note-body">Body</Label>
        <textarea
            id="note-body"
            name="body"
            value={item.body || ''}
            onChange={handleChange}
            placeholder="Write your note..."
            rows={5}
        />
      </InputGroup>
      <ButtonContainer>
        <SubmitButton type="submit">{initialItem ? 'Update' : 'Add'} Note</SubmitButton>
      </ButtonContainer>
    </FormContainer>
  );
};

export default NoteForm;
