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
import { useDb } from './hooks/useDb';
import { useMediaQuery } from './hooks/useMediaQuery';

const hammerAnimation = keyframes`
  0% { transform: rotate(0deg) translateY(0px); }
  25% { transform: rotate(-30deg) translateY(-10px); }
  50% { transform: rotate(0deg) translateY(0px); }
  75% { transform: rotate(-30deg) translateY(-10px); }
  100% { transform: rotate(0deg) translateY(0px); }
`;

const nailAnimation = keyframes`
  0% { transform: translateY(0px); opacity: 1; }
  50% { transform: translateY(10px); opacity: 0.5; }
  100% { transform: translateY(0px); opacity: 1; }
`;

const AnimationContainer = styled.div`
  position: relative;
  width: 150px; /* Adjusted for new SVG size */
  height: 150px; /* Adjusted for new SVG size */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const AnimatedHammer = styled.svg`
  width: 150px;
  height: 150px;
  animation: ${hammerAnimation} 1.5s ease-in-out infinite;
  transform-origin: 75% 75%; /* Adjust origin for rotation around the handle */
  position: absolute;
  top: 0;
  left: 0;
`;

const AnimatedNail = styled.svg`
  width: 30px;
  height: 60px;
  margin-top: 20px;
  animation: ${nailAnimation} 1.5s ease-in-out infinite;
  position: absolute;
  bottom: -20px; /* Adjust position relative to hammer */
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
  const [showStockForm, setShowStockForm] = useState(false); // New state to control StockForm visibility
  const [aiSuggestedItem, setAiSuggestedItem] = useState<Hardware | null>(null); // New state for AI suggested item
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false); // New state for exit confirmation modal

  // State lifted from Stock page
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setSearchActive] = useState(false);
  const [sortOrder, setSortOrder] = useState('description_asc');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [isSortModalOpen, setSortModalOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
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
    setPageWithHistory('chatbot');
  };

  const openStockFormWithAIItem = (item: Hardware) => {
    setAiSuggestedItem(item);
    setShowStockForm(true);
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
        setTimeout(() => setLoading(false), 1500); // Increased timeout for animation
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

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If we are on the dashboard and trying to go back further
      if (page === 'dashboard' && pageHistory.length === 1) {
        // Prevent the default back action
        window.history.pushState(null, '', window.location.pathname);
        setShowExitConfirmModal(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [page, pageHistory]);

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
      case 'chatbot': return <Chatbot setPage={setPageWithHistory} openStockFormWithAIItem={openStockFormWithAIItem} />;
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
            <AnimationContainer>
              <AnimatedHammer viewBox="0 0 200 200">
                {/* Handle */}
                <rect x="90" y="100" width="20" height="80" fill="#8B4513" rx="5"/>
                {/* Head */}
                <rect x="50" y="60" width="100" height="50" fill="#696969" rx="8"/>
                {/* Claw (left side) */}
                <path d="M50 85 Q30 85 30 70 Q30 55 50 55 L50 85 Z" fill="#696969"/>
                {/* Striking face (right side) */}
                <rect x="140" y="70" width="20" height="30" fill="#A9A9A9" rx="2"/>
              </AnimatedHammer>
              <AnimatedNail viewBox="0 0 100 100">
                {/* Simple Nail SVG */}
                <rect x="45" y="10" width="10" height="60" fill="#A9A9A9" rx="2"/>
                <circle cx="50" cy="10" r="8" fill="#A9A9A9"/>
              </AnimatedNail>
            </AnimationContainer>
            <h1>Smart Stock</h1>
          </SplashScreen>
        ) : (
          <>
            <Layout
              pageTitle={currentPageTitle}
              setPage={setPageWithHistory}
              toggleTheme={toggleTheme}
              theme={theme}
              $isSidebarOpen={isSidebarOpen}
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

            <Modal isOpen={showStockForm} onClose={() => setShowStockForm(false)} title="Add New Item">
              <StockForm
                onSubmit={async (item) => {
                  // This onSubmit is for the AI-suggested item
                  if (!hardware || !categories || !addHardware || !addAuditLog) return;
                  try {
                    const newItem: Hardware = {
                      ...item,
                      id: crypto.randomUUID(),
                      updated_at: new Date().toISOString(),
                      is_deleted: false,
                    } as Hardware;
                    await addHardware(newItem);
                    await addAuditLog({
                      id: crypto.randomUUID(),
                      item_id: newItem.id,
                      change_description: `Created item: ${newItem.description} via AI suggestion`,
                      created_at: new Date().toISOString(),
                      username: 'Giya Hardware',
                      is_synced: 0
                    });
                    setShowStockForm(false);
                    setAiSuggestedItem(null);
                    // Optionally navigate to stock page or show toast
                  } catch (error) {
                    console.error('Failed to add AI suggested item:', error);
                  }
                }}
                initialItem={aiSuggestedItem || undefined}
                categories={categories || []}
              />
            </Modal>

            <ConfirmationModal
              isOpen={showExitConfirmModal}
              onConfirm={() => {
                setShowExitConfirmModal(false);
                window.history.back(); // Allow the back action to proceed
              }}
              onCancel={() => {
                setShowExitConfirmModal(false);
                // Keep the user on the current page (dashboard)
                // The pushState in useEffect already prevented the actual navigation
              }}
              title="Exit Smart Stock?"
              message="Are you sure you want to exit Smart Stock?"
            />
          </>
        )}
      </ThemeProvider>
    </ToastProvider>
  );
}

export default App;

