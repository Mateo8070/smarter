import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Stock from './pages/Stock';
import Notes from './pages/Notes';
import Categories from './pages/Categories';
import AuditLog from './pages/AuditLog';
import Settings from './pages/Settings';
import Chatbot from './pages/Chatbot';
import Modal from './components/Modal';
import { syncWithBackend } from './utils/sync';
import { ThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from './styles/theme';
import GlobalStyles from './styles/GlobalStyles';
import { ToastProvider } from './components/Toast';
import styled, { keyframes } from 'styled-components';
import { BoxIcon } from './components/Icons';
import { useDb } from './hooks/useDb';
import { useMediaQuery } from './hooks/useMediaQuery';

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
`;

const SplashScreen = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: var(--background);
  z-index: 9999;
  opacity: 1;
  transition: opacity 0.5s ease-out;
  gap: 16px;

  svg {
    width: 64px;
    height: 64px;
    color: var(--primary);
    animation: ${pulse} 1.5s ease-in-out infinite;
  }
  
  h1 {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
  }
`;

function App() {
  const { hardware } = useDb();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [page, setPage] = useState('dashboard');
  const [pageHistory, setPageHistory] = useState<string[]>(['dashboard']);
  const [auditFilterItemId, setAuditFilterItemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  
  // State lifted from Stock page
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setSearchActive] = useState(false);
  const [sortOrder, setSortOrder] = useState('description_asc');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [isSortModalOpen, setSortModalOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAiModalOpen, setAiModalOpen] = useState(false);
  const mainContentRef = useRef<HTMLElement>(null);

  const setPageWithHistory = (newPage: string, payload?: { auditItemId?: string }) => {
    setPage(newPage);
    if (payload?.auditItemId) setAuditFilterItemId(payload.auditItemId);
    else setAuditFilterItemId(null);

    setPageHistory(prevHistory => {
      const newHistory = [...prevHistory, newPage];
      return newHistory.slice(-10);
    });

    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleAiClick = () => {
    if (isDesktop) {
      setAiModalOpen(true);
    } else {
      setPageWithHistory('chatbot');
    }
  };

  const goBack = () => {
    setPageHistory(prevHistory => {
      if (prevHistory.length > 1) {
        const newHistory = prevHistory.slice(0, -1);
        const previousPage = newHistory[newHistory.length - 1];
        setPage(previousPage);
        return newHistory;
      }
      return prevHistory;
    });
  };

  useEffect(() => {
    const initialSync = async () => {
      try {
        await syncWithBackend();
      } catch (error) {
        console.error('Initial sync failed:', error);
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };
    initialSync();
  }, []);

  useEffect(() => {
    const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(preferredTheme);

    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const pageTitles: { [key: string]: string } = {
    dashboard: 'Dashboard',
    stock: 'Stock',
    notes: 'Notes',
    categories: 'Categories',
    'audit-log': 'Audit Log',
    settings: 'Settings',
    chatbot: 'AI Assistant',
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard setPage={setPageWithHistory} handleAiClick={handleAiClick} />;
      case 'stock': return <Stock 
        setPage={setPageWithHistory} 
        searchQuery={searchQuery} 
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        isDesktop={isDesktop}
        isSortModalOpen={isSortModalOpen}
        setSortModalOpen={setSortModalOpen}
        isHeaderVisible={isHeaderVisible}
        viewMode={viewMode}
        mainContentRef={mainContentRef}
      />;
      case 'notes': return <Notes />;
      case 'categories': return <Categories />;
      case 'audit-log': return <AuditLog itemId={auditFilterItemId} />;
      case 'settings': return <Settings />;
      case 'chatbot': return <Chatbot />;
      default: return <Dashboard setPage={setPageWithHistory} handleAiClick={handleAiClick} />;
    }
  };

  const currentPageTitle = pageTitles[page] || 'Dashboard';

  return (
    <ToastProvider>
      <ThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
        <GlobalStyles />
        {loading ? (
          <SplashScreen>
            <BoxIcon />
            <h1>Smart Stock</h1>
          </SplashScreen>
        ) : (
          <>
            <Layout
              pageTitle={currentPageTitle}
              setPage={setPageWithHistory}
              toggleTheme={toggleTheme}
              theme={theme}
              isSidebarOpen={isSidebarOpen}
              toggleSidebar={toggleSidebar}
              goBack={goBack}
              canGoBack={pageHistory.length > 1 && page !== 'dashboard'}
              page={page}
              isSearchActive={isSearchActive}
              setSearchActive={setSearchActive}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              hardware={hardware || []}
              openSortModal={() => setSortModalOpen(true)}
              isHeaderVisible={isHeaderVisible}
              setIsHeaderVisible={setIsHeaderVisible}
              viewMode={viewMode}
              setViewMode={setViewMode}
              showSuggestions={showSuggestions}
              setShowSuggestions={setShowSuggestions}
              handleAiClick={handleAiClick}
              mainContentRef={mainContentRef}
            >
              {renderPage()}
            </Layout>
            <Modal isOpen={isAiModalOpen} onClose={() => setAiModalOpen(false)}>
              <Chatbot isModal />
            </Modal>
          </>
        )}
      </ThemeProvider>
    </ToastProvider>
  );
}

export default App;
