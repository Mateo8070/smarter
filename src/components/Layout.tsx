// Force TypeScript re-evaluation
import React, { useRef, useEffect } from 'react';
import Sidebar from './Sidebar';
import styled from 'styled-components';
import AppHeader from './AppHeader';
import type { Hardware } from '../types/database';

const LayoutContainer = styled.div`
  display: flex;
  height: 100%;
  position: relative;
`;

const ContentWrapper = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$isSidebarOpen'].includes(prop),
})<{ $isSidebarOpen: boolean }>`
  display: flex;
  flex-direction: column;
  flex: 1;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow-x: hidden; /* Prevents horizontal scroll from wide children */
  min-height: 0; /* allow children with overflow to shrink inside this flex parent */

  @media (min-width: 769px) {
    margin-left: ${({ $isSidebarOpen }) => ($isSidebarOpen ? '260px' : '0')};
  }
`;

const MainContent = styled.main`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* smooth/native scrolling on iOS */
  overscroll-behavior: contain;
  min-height: 0; /* allow this flex child to shrink and enable scrolling */
  position: relative;
`;

interface LayoutProps {
  children: React.ReactNode;
  pageTitle: string;
  setPage: (page: string) => void;
  toggleTheme: () => void;
  theme: 'light' | 'dark';
  $isSidebarOpen: boolean;
  toggleSidebar: () => void;
  goBack: () => void;
  canGoBack: boolean;
  page: string;
  isSearchActive: boolean;
  setSearchActive: (active: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  hardware: Hardware[];
  sortOrder: string;
  setSortOrder: (order: string) => void;
  isHeaderVisible: boolean;
  setIsHeaderVisible: (visible: boolean) => void;
  viewMode: 'card' | 'table';
  setViewMode: (mode: 'card' | 'table') => void;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  handleAiClick: () => void;
  mainContentRef: React.RefObject<HTMLElement>;
  onClearChatbot: (() => void) | undefined;
}

const Layout: React.FC<LayoutProps> = (props) => {
  const {
    children, pageTitle, setPage, toggleTheme, theme, $isSidebarOpen, toggleSidebar, goBack, canGoBack, page,
    isSearchActive, setSearchActive, searchQuery, setSearchQuery, hardware,
    sortOrder, setSortOrder, isHeaderVisible, setIsHeaderVisible, viewMode, setViewMode,
    showSuggestions, setShowSuggestions, handleAiClick, mainContentRef, onClearChatbot
  } = props;

  const lastScrollY = useRef(0);

  useEffect(() => {
    const mainEl = mainContentRef.current;
    if (!mainEl) return;

    const handleScroll = () => {
        const currentScrollY = mainEl.scrollTop;
        if (showSuggestions) {
          setShowSuggestions(false);
        }

        if (page === 'stock') { // Only apply this behavior on the stock page
          if (currentScrollY > lastScrollY.current && currentScrollY > 50 && isHeaderVisible) {
              setIsHeaderVisible(false);
          } else if ((currentScrollY < lastScrollY.current || currentScrollY <= 50) && !isHeaderVisible) {
              setIsHeaderVisible(true);
          }
        } else {
            if (!isHeaderVisible) setIsHeaderVisible(true);
        }
        lastScrollY.current = currentScrollY;
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
        mainEl.removeEventListener('scroll', handleScroll);
    };
  }, [page, isHeaderVisible, setIsHeaderVisible, showSuggestions, setShowSuggestions, mainContentRef]);


  return (
    <LayoutContainer>
      <Sidebar
        setPage={setPage}
        toggleTheme={toggleTheme}
        $isSidebarOpen={$isSidebarOpen}
        toggleSidebar={toggleSidebar}
        handleAiClick={handleAiClick}
      />
      <ContentWrapper $isSidebarOpen={$isSidebarOpen}>
        <AppHeader
          pageTitle={pageTitle}
          toggleSidebar={toggleSidebar}
          goBack={goBack}
          canGoBack={canGoBack}
          $isSidebarOpen={$isSidebarOpen}
          page={page}
          setPage={setPage}
          isSearchActive={isSearchActive}
          setSearchActive={setSearchActive}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          hardware={hardware}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          viewMode={viewMode}
          setViewMode={setViewMode}
          showSuggestions={showSuggestions}
          setShowSuggestions={setShowSuggestions}
          handleAiClick={handleAiClick}
          theme={theme}
          toggleTheme={toggleTheme}
          onClearChatbot={onClearChatbot}
        />
        <MainContent ref={mainContentRef}>{children}</MainContent>
      </ContentWrapper>
    </LayoutContainer>
  );
};

export default Layout;
