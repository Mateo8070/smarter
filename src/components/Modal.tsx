import React from 'react';
import styled, { keyframes } from 'styled-components';
import { CloseIcon } from './Icons';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const scaleIn = keyframes`
  from { transform: translateY(20px) scale(0.98); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 16px;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContent = styled.div`
  background-color: var(--surface);
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  position: relative;
  width: 100%;
  max-width: 500px;
  max-height: 95vh;
  overflow-y: auto;
  animation: ${scaleIn} 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;

  h2 {
    margin-top: 0;
    margin-bottom: 24px;
    font-size: 20px;
    font-weight: 600;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: ;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  text-color: pink;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  color: lightblue;
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background-color: var(--surface-variant);
    color: var(--primary);
  }

  svg {
    width: 20px;
    height: 20px;
    stroke: black; /* Explicitly set stroke to black */
  }
`;

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose} aria-label="Close modal">X</CloseButton>
        {title && <h2>{title}</h2>}
        {children}
      </ModalContent>
    </ModalOverlay>
  );
};

export default Modal;
