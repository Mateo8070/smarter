
import React from 'react';
import styled from 'styled-components';
import Modal from './Modal';

const ColorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 10px;
  padding: 10px;
`;

const ColorSwatch = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme.border};
  cursor: pointer;
  background-color: ${props => props.color};
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.1);
  }
`;

const colors = [
  '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3',
  '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
  '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#795548', '#9E9E9E',
  '#607D8B', '#000000',
];

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onColorSelect: (color: string) => void;
}

const ColorPickerModal: React.FC<ColorPickerModalProps> = ({ isOpen, onClose, onColorSelect }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select a Color">
      <ColorGrid>
        {colors.map(color => (
          <ColorSwatch
            key={color}
            color={color}
            onClick={() => onColorSelect(color)}
            aria-label={`Select color ${color}`}
          />
        ))}
      </ColorGrid>
    </Modal>
  );
};

export default ColorPickerModal;