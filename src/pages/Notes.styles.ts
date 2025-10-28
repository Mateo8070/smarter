import styled from 'styled-components';

export const NotesPageContainer = styled.div`
  padding: 24px;
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

export const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

export const PrimaryButton = styled.button`
  background-color: var(--primary);
  color: white;
  border: none;
  padding: 0 16px;
  height: 44px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--primary-hover);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

export const CardView = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  align-items: start;
`;

export const Card = styled.div`
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  break-inside: avoid; /* For masonry effect */
  
  .card-content {
    flex-grow: 1;
    h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 8px;
    }
    p {
      font-size: 14px;
      color: var(--text-secondary);
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.6;
      margin: 0;
    }
  }

  .card-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
  }
`;

export const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background-color: var(--background);
    color: var(--text-primary);
  }
  svg {
    width: 18px;
    height: 18px;
  }
`;

export const DeleteButton = styled(ActionButton)`
  &:hover {
    color: var(--danger);
    background-color: ${({ theme }) => theme.danger}1a;
  }
`;

export const FloatingActionButton = styled.button`
  position: fixed !important;
  bottom: 30px !important;
  right: 30px !important;
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: 50%;
  width: 56px;
  height: 56px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
  
  svg {
    width: 28px;
    height: 28px;
  }
`;
