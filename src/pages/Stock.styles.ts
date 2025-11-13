import styled from 'styled-components';

export const StockPageContainer = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
`;

export const PageHeader = styled.div<{ $isVisible: boolean }>`
  padding: 12px 24px 8px;
  background-color: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 10;
  transition: transform 0.3s ease-in-out;
  transform: ${({ $isVisible }) => ($isVisible ? 'translateY(0)' : 'translateY(-100%)')};
  
  @media (max-width: 768px) {
    padding: 12px 16px 8px;
  }
`;

export const FilterContainer = styled.div`
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

export const FilterButton = styled.button<{ $active?: boolean }>`
  padding: 6px 16px;
  border: 1px solid var(--border);
  border-radius: 20px;
  cursor: pointer;
  background-color: ${({ $active }) => ($active ? 'var(--primary)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'white' : 'var(--text-primary)')};
  font-weight: 500;
  font-size: 14px;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary);
  }
`;

const ContentArea = styled.div`
  flex: 1;
  position: relative;
`;

export const CardView = styled(ContentArea)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  padding: 24px;
  align-content: start;
  overflow-y: auto;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px;
  }
`;

export const Card = styled.div<{ $isSelectMode?: boolean; $isSelected?: boolean }>`
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative; /* Needed for overlay */
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    border-color: var(--primary);
  }

  ${({ $isSelectMode }) => $isSelectMode && `
    border-color: var(--primary);
    box-shadow: 0 0 0 2px var(--primary)33; /* Subtle glow */
  `}

  ${({ $isSelected }) => $isSelected && `
    background-color: var(--primary-light); /* Lighter primary color for selected */
    border-color: var(--primary);
    box-shadow: 0 0 0 2px var(--primary); /* Stronger glow for selected */
  `}

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 16px;
  }
  
  .description {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.4;
    word-break: break-word;
    margin-right: 8px;
  }

  .category-tag {
    display: inline-block;
    padding: 3px 10px;
    background-color: var(--category-color, var(--surface-variant));
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    color: white;
    text-transform: uppercase;
    flex-shrink: 0;
  }
  
  .card-body {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    border-top: 1px solid var(--border);
    padding-top: 16px;
    margin-top: auto;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .detail-label {
    font-size: 12px;
    color: var(--text-secondary);
    text-transform: uppercase;
  }
  .detail-value {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);

    .price-unit {
        font-size: 12px;
        color: var(--text-secondary);
        font-weight: 400;
    }
  }
`;

export const TableViewContainer = styled(ContentArea)`
  padding: 0 24px 24px;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: 0 16px 16px;
  }
`;

export const TableWrapper = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

export const StockTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 14px 16px;
    text-align: left;
    color: var(--text-primary);
    border-bottom: 1px solid var(--border);
  }
  
  td {
    white-space: normal;
    word-break: break-word;
  }

  th {
    background-color: var(--surface);
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    color: var(--text-secondary);
    position: sticky;
    top: 0;
    z-index: 1;
    white-space: nowrap;
  }
  
  tbody tr {
    transition: background-color 0.2s;
  }
  
  tbody tr:nth-of-type(even) {
    background-color: var(--background);
  }

  tbody tr:hover {
    background-color: var(--surface-variant);
  }
  
  tbody td:first-child {
    cursor: pointer;
  }
`;

export const ActionCell = styled.td`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const BaseActionButton = styled.button`
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background-color: var(--surface);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background-color: var(--background);
    color: var(--text-primary);
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

export const TableEditButton = styled(BaseActionButton)``;

export const TableDeleteButton = styled(BaseActionButton)`
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
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(0,0,0,0.2);
  }

  svg {
    width: 28px;
    height: 28px;
  }
`;

export const SortModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const SortOption = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  cursor: pointer;
  padding: 12px;
  border-radius: 6px;

  &:hover {
    background-color: var(--background);
  }

  input[type="radio"] {
    accent-color: var(--primary);
    width: 18px;
    height: 18px;
  }
  
  label {
    cursor: pointer;
    flex: 1;
  }
`;

export const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 60px 24px;
  text-align: center;
`;

export const EmptyStateMessage = styled.p`
  color: var(--text-secondary);
  font-size: 16px;
  max-width: 400px;
  margin-top: 16px;
`;

export const SelectionActionBar = styled.div<{ $isVisible: boolean }>`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--surface);
  border-top: 1px solid var(--border);
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transform: translateY(${({ $isVisible }) => ($isVisible ? '0' : '100%')});
  transition: transform 0.3s ease-in-out;
  z-index: 1000;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);

  @media (max-width: 768px) {
    padding: 12px 16px;
  }
`;

export const SelectionCount = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
`;

export const SelectionActions = styled.div`
  display: flex;
  gap: 12px;
`;

export const SelectionButton = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.reassign {
    background-color: var(--primary);
    color: white;
    border: none;
    &:hover {
      background-color: var(--primary-dark);
    }
  }

  &.delete {
    background-color: var(--danger);
    color: white;
    border: none;
    &:hover {
      background-color: var(--danger-dark);
    }
  }

  &.cancel {
    background-color: var(--surface-variant);
    color: var(--text-primary);
    border: 1px solid var(--border);
    &:hover {
      background-color: var(--background);
    }
  }
`;

export const CheckboxContainer = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1;
  display: inline-block;
  vertical-align: middle;
  cursor: pointer;
`;

export const HiddenCheckbox = styled.input.attrs({ type: 'checkbox' })`
  // Hide checkbox visually but keep it accessible to screen readers
  border: 0;
  clip: rect(0 0 0 0);
  clippath: inset(50%);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  white-space: nowrap;
  width: 1px;
`;

export const CustomCheckbox = styled.div<{ checked: boolean }>`
  display: inline-block;
  width: 20px;
  height: 20px;
  background: ${({ checked }) => (checked ? 'var(--primary)' : 'var(--surface)')};
  border-radius: 4px;
  transition: all 150ms;
  border: 1px solid ${({ checked }) => (checked ? 'var(--primary)' : 'var(--text-secondary)')};
  display: flex;
  align-items: center;
  justify-content: center;

  ${HiddenCheckbox}:focus + & {
    box-shadow: 0 0 0 3px var(--primary)33;
  }

  &::after {
    content: '';
    display: ${({ checked }) => (checked ? 'block' : 'none')};
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 3px 3px 0;
    transform: rotate(45deg);
  }
`;
