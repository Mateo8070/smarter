import React from 'react';
import styled from 'styled-components';
import Modal from './Modal';

const ModalBody = styled.div`
  p {
    color: var(--text-secondary);
    margin: 0 0 24px 0;
    font-size: 15px;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const Button = styled.button`
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
`;

const ConfirmButton = styled(Button)`
  background-color: var(--danger);
  color: white;
`;

const CancelButton = styled(Button)`
  background-color: var(--surface);
  color: var(--text-primary);
  border: 1px solid var(--border);
  
  &:hover {
    background-color: var(--background);
  }
`;

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <ModalBody>
        <p>{message}</p>
        <ButtonContainer>
          <CancelButton onClick={onCancel}>Cancel</CancelButton>
          <ConfirmButton onClick={onConfirm}>Confirm</ConfirmButton>
        </ButtonContainer>
      </ModalBody>
    </Modal>
  );
};

export default ConfirmationModal;
