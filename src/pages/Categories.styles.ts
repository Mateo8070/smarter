import styled from 'styled-components';

export const CategoriesPageContainer = styled.div`
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
  gap: 16px;
  
  .search-container {
    position: relative;
    display: flex;
    align-items: center;
    flex-grow: 1;
    max-width: 400px;
    
    svg {
      position: absolute;
      left: 14px;
      width: 20px;
      height: 20px;
      color: var(--text-secondary);
    }
  }
`;

export const SearchInput = styled.input`
  width: 100%;
  height: 44px;
  padding: 0 16px 0 44px;
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
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  align-content: start;
`;

export const Card = styled.div`
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    border-color: var(--primary);
  }

  .category-info {
    display: flex;
    align-items: center;
    gap: 12px;
    overflow: hidden;
  }

  .color-swatch {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    transition: transform 0.2s;
    &:hover {
        transform: scale(1.1);
    }
  }

  .category-name {
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 4px;
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

export const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 60px 24px;
  text-align: center;
  grid-column: 1 / -1;
`;

export const EmptyStateMessage = styled.p`
  color: var(--text-secondary);
  font-size: 16px;
  max-width: 400px;
  margin-top: 16px;
`;
