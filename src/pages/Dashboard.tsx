import React from 'react';
import styled from 'styled-components';
import {
  BoxIcon,
  HistoryIcon,
  TagIcon,
  BotIcon,
  FileTextIcon,
  SettingsIcon,
} from '../components/Icons';

const DashboardContainer = styled.div`
  padding: 48px;
  
  @media (max-width: 768px) {
    padding: 24px;
  }

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const WelcomeHeader = styled.div`
  margin-bottom: 32px;
  text-align: center;

  @media (max-width: 480px) {
    margin-bottom: 24px;
  }
`;

const WelcomeTitle = styled.h2`
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);

  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
  align-content: start;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
`;

const IconContainer = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--surface-variant);
  margin-bottom: 12px;
  transition: all 0.25s ease;

  svg {
    width: 24px;
    height: 24px;
    color: var(--text-secondary);
    transition: all 0.25s ease;
  }

  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
    margin-bottom: 8px;
    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

const CardLabel = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  transition: color 0.25s ease;

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const DashboardCard = styled.button`
  background-color: var(--surface);
  border: 1px solid var(--border);
  padding: 16px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: all 0.25s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    border-color: var(--primary);
  
    ${IconContainer} {
      background-color: var(--primary);
      svg {
        color: white;
      }
    }
  
    ${CardLabel} {
      color: var(--primary);
    }
  }
  
  @media (max-width: 480px) {
    padding: 12px;
  }
`;

interface DashboardItem {
  label: string;
  page: string;
  icon: React.ReactNode;
}

const dashboardItems: DashboardItem[] = [
  { label: 'Stock', page: 'stock', icon: <BoxIcon /> },
  { label: 'Categories', page: 'categories', icon: <TagIcon /> },
  { label: 'Notes', page: 'notes', icon: <FileTextIcon /> },
  { label: 'AI Assistant', page: 'chatbot', icon: <BotIcon /> },
  { label: 'Audit Log', page: 'audit-log', icon: <HistoryIcon /> },
  { label: 'Settings', page: 'settings', icon: <SettingsIcon /> },
];

interface DashboardProps {
  setPage: (page: string) => void;
  handleAiClick: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setPage, handleAiClick }) => {
  const handleClick = (page: string) => {
    if (page === 'chatbot') {
      handleAiClick();
    } else {
      setPage(page);
    }
  }
  
  return (
    <DashboardContainer>
      <WelcomeHeader>
        <WelcomeTitle>Smart Stock</WelcomeTitle>
      </WelcomeHeader>

      <CardGrid>
        {dashboardItems.map(item => (
          <DashboardCard key={item.page} aria-label={item.label} onClick={() => handleClick(item.page)}>
            <IconContainer>{item.icon}</IconContainer>
            <CardLabel>{item.label}</CardLabel>
          </DashboardCard>
        ))}
      </CardGrid>
    </DashboardContainer>
  );
};

export default Dashboard;