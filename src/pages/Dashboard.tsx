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
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'; // Added recharts imports
import type { Hardware, Category, AuditLog } from '../types/database'; // Added type imports
import { useMediaQuery } from '../hooks/useMediaQuery'; // Import useMediaQuery
import { isOutOfStock } from '../utils/stockUtils'; // Import isOutOfStock

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

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 48px; // Increased margin-bottom

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    margin-bottom: 32px; // Increased margin-bottom
  }

  @media (max-width: 480px) {
    margin-bottom: 24px; // Increased margin-bottom
  }
`;

const InfoCard = styled.button`
  background-color: var(--surface);
  border: 1px solid var(--border);
  padding: 16px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    border-color: var(--primary);
  }
`;

const InfoLabel = styled.span`
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 4px;
`;

const InfoValue = styled.span`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
`;

const SubInfoLabel = styled.span`
  font-size: 0.75rem;
  color: var(--text-secondary);
  align-self: flex-end; // Position to bottom right
  margin-top: auto; // Push to bottom
`;

// Added ChartContainer and ChartTitle styled components
const ChartContainer = styled.div`
  background-color: var(--surface);
  border: 1px solid var(--border);
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  margin-top: 48px; // Increased margin-top
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px; // Increased min-height

  // Fix for square outline on pie chart segments
  .recharts-pie-sector,
  .recharts-pie-sector path {
    outline: none !important;
    stroke: none !important; /* Ensure no stroke is causing it */
    stroke-width: 0 !important; /* Ensure no stroke is causing it */
  }
  .recharts-pie-sector:focus,
  .recharts-pie-sector path:focus {
    outline: none !important;
    stroke: none !important;
    stroke-width: 0 !important;
  }

  @media (max-width: 768px) {
    min-height: 350px; // Increased min-height
    margin-top: 32px; // Increased margin-top
  }

  @media (max-width: 480px) {
    min-height: 300px; // Increased min-height for mobile
    margin-top: 24px; // Increased margin-top
  }
`;

const ChartTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
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
  hardware: Hardware[];
  categories: Category[];
  auditLog: AuditLog[];
}

const Dashboard: React.FC<DashboardProps> = ({ setPage, handleAiClick, hardware, categories, auditLog }) => {
  const handleClick = (page: string) => {
    if (page === 'chatbot') {
      handleAiClick();
    }
    else {
      setPage(page);
    }
  }

    // Calculate summary statistics
    const newStockCategory = categories.find(
      cat => cat.name.toLowerCase() === 'new stock'
    );
    const newStockCategoryId = newStockCategory ? newStockCategory.id : null;

    const totalHardwareItemsIncludingNewStock = hardware.filter(item => !item.is_deleted).length;

    const totalHardwareItems = hardware.filter(
      item => !item.is_deleted && item.category_id !== newStockCategoryId
    ).length;
    const totalCategories = categories.filter(cat => !cat.is_deleted).length; // Modified
    const outOfStockItems = hardware.filter(item => !item.is_deleted && isOutOfStock(item.quantity)).length;
  
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentAuditLogs = auditLog.filter(log => new Date(log.created_at) > sevenDaysAgo).length;
    const totalAuditLogs = auditLog.length; // New calculation
  
    // Calculate category breakdown for pie chart
    const categoryData = categories
      .filter(cat => !cat.is_deleted)
      .map(cat => {
        const itemCount = hardware.filter(item => item.category_id === cat.id && !item.is_deleted).length;
        return { name: cat.name, value: itemCount, color: cat.color };
      })
      .filter(data => data.value > 0); // Only show categories with items

    const isMobile = useMediaQuery('(max-width: 480px)'); // Define mobile breakpoint
    
    return (
      <DashboardContainer>
        <WelcomeHeader>
          <WelcomeTitle>Smart Stock</WelcomeTitle>
        </WelcomeHeader>
  
        <InfoGrid>
          <InfoCard onClick={() => handleClick('stock')}>
            <InfoLabel>Total Items</InfoLabel>
            <InfoValue>{totalHardwareItems}</InfoValue>
            <SubInfoLabel>Total: {totalHardwareItemsIncludingNewStock}</SubInfoLabel>
          </InfoCard>
          <InfoCard onClick={() => handleClick('categories')}>
            <InfoLabel>Total Categories</InfoLabel>
            <InfoValue>{totalCategories}</InfoValue>
          </InfoCard>
          <InfoCard onClick={() => handleClick('out-of-stock')}>
            <InfoLabel>Out of Stock Items</InfoLabel>
            <InfoValue>{outOfStockItems}</InfoValue>
          </InfoCard>
          <InfoCard onClick={() => handleClick('audit-log')}>
            <InfoLabel>Total Audit Logs</InfoLabel>
            <InfoValue>{totalAuditLogs}</InfoValue>
          </InfoCard>
        </InfoGrid>
  
        <ChartContainer>
          <ChartTitle>Items by Category</ChartTitle>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={isMobile ? false : ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#CCCCCC'} /> // Use category color
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p>No items in categories to display.</p>
          )}
        </ChartContainer>
      </DashboardContainer>
    );
  };
export default Dashboard;
