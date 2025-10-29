import React, { useMemo, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { HamburgerIcon, ArrowLeftIcon, SearchIcon, SortBarsIcon, MoonIcon, SunIcon, LayoutGridIcon, ListIcon, Volume2Icon, VolumeXIcon } from './Icons';
import { useMediaQuery } from '../hooks/useMediaQuery';
import type { Hardware } from '../types/database';

const HeaderContainer = styled.header`
  height: 64px;
  background-color: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 24px;
  z-index: 1000;
  flex-shrink: 0;

  @media (max-width: 768px) {
    padding: 0 16px;
  }
`;

const HeaderContent = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  width: 100%;
`;

const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  &.left {
    justify-content: flex-start;
  }
  &.right {
    justify-content: flex-end;
  }
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
  grid-column: 2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const HeaderButton = styled.button`
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
  flex-shrink: 0;

  &:hover {
    background-color: var(--background);
    color: var(--text-primary);
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;


const SearchContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  grid-column: 2;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
`;

const SearchWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  
  svg {
    position: absolute;
    left: 14px;
    width: 20px;
    height: 20px;
    color: var(--text-secondary);
    pointer-events: none;
  }
`;

const SearchBar = styled.input`
  width: 100%;
  height: 40px;
  padding: 0 16px 0 44px;
  border-radius: 99px;

  &:focus, &:focus-visible {
    border-radius: 99px; /* Maintain pill shape on focus */
  }
`;

const SuggestionsList = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-top: 8px;
  padding: 8px 0;
  list-style: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  z-index: 10;
`;

const SuggestionItem = styled.li`
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  &:hover {
    background-color: var(--background);
  }
`;

const StockActionsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ViewModeContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: var(--background);
  border-radius: 8px;
  padding: 4px;
`;

const ViewModeButton = styled(HeaderButton)<{ active?: boolean }>`
  background-color: ${({ active }) => active ? 'var(--surface)' : 'transparent'};
  color: ${({ active }) => active ? 'var(--primary)' : 'var(--text-secondary)'};
  box-shadow: ${({ active }) => active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'};
  border-radius: 6px;
  padding: 6px;
  
  &:hover {
    background-color: var(--surface);
    color: var(--primary);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

interface AppHeaderProps {
  pageTitle: string;
  toggleSidebar: () => void;
  goBack: () => void;
  canGoBack: boolean;
  isSidebarOpen: boolean;
  page: string;
  isSearchActive: boolean;
  setSearchActive: (active: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  hardware: Hardware[];
  openSortModal: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  viewMode: 'card' | 'table';
  setViewMode: (mode: 'card' | 'table') => void;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  isTtsEnabled: boolean;
  toggleTts: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = (props) => {
  const { 
    pageTitle, toggleSidebar, goBack, canGoBack, isSidebarOpen, page, 
    isSearchActive, setSearchActive, searchQuery, setSearchQuery,
    hardware, openSortModal, theme, toggleTheme,
    viewMode, setViewMode, showSuggestions, setShowSuggestions,
    isTtsEnabled, toggleTts
  } = props;
  
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isStockPage = page === 'stock';
  const searchRef = useRef<HTMLDivElement>(null);

  const searchSuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    return hardware
      .filter(item => item.description?.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 5);
  }, [searchQuery, hardware]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        if (isMobile) {
          setSearchActive(false);
        }
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, setSearchActive, setShowSuggestions]);

  const handleSuggestionClick = (description: string) => {
    setSearchQuery(description);
    setShowSuggestions(false);
    if (isMobile) {
      setSearchActive(false);
    }
  };

  const showDesktopSearch = isStockPage && !isMobile;
  const showTitle = !isSearchActive && (!isStockPage || (isStockPage && isMobile));

  if (isMobile && isSearchActive && isStockPage) {
    return (
      <HeaderContainer>
        <HeaderContent style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <HeaderButton onClick={() => { setSearchActive(false); setSearchQuery(''); }}>
            <ArrowLeftIcon />
          </HeaderButton>
          <SearchContainer ref={searchRef} style={{flex: 1, margin: 0, gridColumn: 'unset'}}>
            <SearchWrapper>
              <SearchIcon />
              <SearchBar 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search inventory..." 
                autoFocus 
              />
            </SearchWrapper>
            {showSuggestions && searchSuggestions.length > 0 && (
              <SuggestionsList>
                {searchSuggestions.map(item => (
                  <SuggestionItem key={item.id} onClick={() => handleSuggestionClick(item.description || '')}>
                    {item.description}
                  </SuggestionItem>
                ))}
              </SuggestionsList>
            )}
          </SearchContainer>
          <div style={{ width: '40px', flexShrink: 0 }} />
        </HeaderContent>
      </HeaderContainer>
    );
  }

  return (
    <HeaderContainer>
      <HeaderContent>
        <ActionsContainer className="left">
          {!isSidebarOpen && (
            canGoBack ? (
              <HeaderButton onClick={goBack} aria-label="Go back"><ArrowLeftIcon /></HeaderButton>
            ) : (
              <HeaderButton onClick={toggleSidebar} aria-label="Toggle sidebar"><HamburgerIcon /></HeaderButton>
            )
          )}
        </ActionsContainer>
        
        {showDesktopSearch ? (
          <SearchContainer ref={searchRef}>
            <SearchWrapper>
              <SearchIcon />
              <SearchBar 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search inventory..." 
              />
            </SearchWrapper>
            {showSuggestions && searchSuggestions.length > 0 && (
              <SuggestionsList>
                {searchSuggestions.map(item => (
                  <SuggestionItem key={item.id} onClick={() => handleSuggestionClick(item.description || '')}>
                    {item.description}
                  </SuggestionItem>
                ))}
              </SuggestionsList>
            )}
          </SearchContainer>
        ) : showTitle ? (
          <PageTitle>{pageTitle}</PageTitle>
        ) : <div /> /* Empty div to balance the grid */}

        <ActionsContainer className="right">
          {isStockPage && (!isMobile || !isSearchActive) && (
            <StockActionsContainer>
               {!isMobile && (
                <ViewModeContainer>
                  <ViewModeButton active={viewMode === 'card'} onClick={() => setViewMode('card')} aria-label="Card view">
                    <LayoutGridIcon />
                  </ViewModeButton>
                  <ViewModeButton active={viewMode === 'table'} onClick={() => setViewMode('table')} aria-label="Table view">
                    <ListIcon />
                  </ViewModeButton>
                </ViewModeContainer>
              )}
              <HeaderButton onClick={openSortModal} aria-label="Sort">
                <SortBarsIcon />
              </HeaderButton>
              {isMobile && (
                 <HeaderButton onClick={() => setSearchActive(true)} aria-label="Search">
                    <SearchIcon />
                </HeaderButton>
              )}
            </StockActionsContainer>
          )}
           {page === 'chatbot' && (
            <HeaderButton onClick={toggleTts} aria-label="Toggle text to speech">
              {isTtsEnabled ? <Volume2Icon /> : <VolumeXIcon />}
            </HeaderButton>
           )}
           <HeaderButton onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </HeaderButton>
        </ActionsContainer>
      </HeaderContent>
    </HeaderContainer>
  );
};

export default AppHeader;
