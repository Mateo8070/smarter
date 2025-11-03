import React from 'react';
import styled, { useTheme } from 'styled-components';
import { syncWithBackend } from '../utils/sync';
import { useToast } from './Toast';
import {
  HomeIcon,
  BoxIcon,
  FileTextIcon,
  TagIcon,
  HistoryIcon,
  SettingsIcon,
  SyncIcon,
  MoonIcon,
  SunIcon,
  BotIcon,
  CloseIcon,
  Volume2Icon,
  VolumeXIcon,
} from './Icons';

const SidebarContainer = styled.aside<{ isSidebarOpen: boolean }>`
  width: 260px;
  border-right: 1px solid var(--border);
  background-color: var(--surface);
  color: var(--text-primary);
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  z-index: 1100;
  transform: translateX(${({ isSidebarOpen }) => (isSidebarOpen ? '0' : '-100%')});
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    box-shadow: ${({ isSidebarOpen }) => (isSidebarOpen ? '0 10px 30px rgba(0,0,0,0.1)' : 'none')};
  }
`;

const SidebarHeader = styled.div`
  padding: 0 20px;
  height: 64px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
`;

const Logo = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    color: var(--primary);
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  transition: background-color 0.2s, color 0.2s;
  
  &:hover {
    background-color: var(--background);
    color: var(--text-primary);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const SidebarBody = styled.nav`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  overscroll-behavior: contain;
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const NavItem = styled.li`
  margin: 0;
`;

const NavLink = styled.button`
  width: 100%;
  background: none;
  border: none;
  color: var(--text-secondary);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;

  &:hover {
    background-color: var(--background);
    color: var(--text-primary);
  }

  &.active {
    background-color: var(--primary);
    color: white;
    font-weight: 600;
  }

  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
`;

const SidebarFooter = styled.div`
  padding: 16px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SidebarButton = styled(NavLink)`
  background-color: var(--surface-variant);
  color: var(--text-primary);
  border: 1px solid transparent;

  &:hover {
    border-color: var(--border);
  }
`;

const Sidebar: React.FC<{

  setPage: (page: string) => void;

  toggleTheme: () => void;

  isSidebarOpen: boolean;

  toggleSidebar: () => void;

  handleAiClick: () => void;

}> = ({ setPage, toggleTheme, isSidebarOpen, toggleSidebar, handleAiClick }) => {

  const theme = useTheme();

  const { addToast } = useToast();



  const handleSync = async () => {

    addToast('Syncing data...', 'info');

    try {

      await syncWithBackend();

      addToast('Sync complete!', 'success');

    } catch (error) {

      console.error('Sync failed:', error);

      addToast('Sync failed. Check console for details.', 'error');

    }

  };



  const isDark = (theme as any).background === '#111827';



  return (

    <SidebarContainer isSidebarOpen={isSidebarOpen}>

      <SidebarHeader>

        <Logo><BoxIcon /> Smart Stock</Logo>

        <CloseButton onClick={toggleSidebar} aria-label="Close sidebar"><CloseIcon /></CloseButton>

      </SidebarHeader>

      <SidebarBody>

        <NavList>

          <NavItem><NavLink onClick={() => setPage('dashboard')}><HomeIcon /> Dashboard</NavLink></NavItem>

          <NavItem><NavLink onClick={() => setPage('stock')}><BoxIcon /> Stock</NavLink></NavItem>

          <NavItem><NavLink onClick={() => setPage('notes')}><FileTextIcon /> Notes</NavLink></NavItem>

          <NavItem><NavLink onClick={() => setPage('categories')}><TagIcon /> Categories</NavLink></NavItem>

          <NavItem><NavLink onClick={() => setPage('audit-log')}><HistoryIcon /> Audit Log</NavLink></NavItem>

          <NavItem><NavLink onClick={handleAiClick}><BotIcon /> AI Assistant</NavLink></NavItem>

          <NavItem><NavLink onClick={() => setPage('settings')}><SettingsIcon /> Settings</NavLink></NavItem>

        </NavList>

      </SidebarBody>

      <SidebarFooter>

        <SidebarButton onClick={handleSync}><SyncIcon /> Sync Now</SidebarButton>

        <SidebarButton onClick={toggleTheme}>

          {isDark ? <SunIcon /> : <MoonIcon />}

          {isDark ? 'Light Mode' : 'Dark Mode'}

        </SidebarButton>

      </SidebarFooter>

    </SidebarContainer>

  );

};

export default Sidebar;