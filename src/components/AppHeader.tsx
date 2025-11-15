import React, { useMemo, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { HamburgerIcon, ArrowLeftIcon, SearchIcon, SortBarsIcon, MoonIcon, SunIcon, LayoutGridIcon, ListIcon, Volume2Icon, VolumeXIcon, CloseIcon, HomeIcon, ArrowRightIcon, TrashIcon } from './Icons';
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
  padding: 0;
  width: 40px;
  height: 40px;
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
  padding: 0 44px 0 44px; /* Adjusted padding-right */
  border-radius: 99px;

  &:focus, &:focus-visible {
    border-radius: 99px; /* Maintain pill shape on focus */
  }
`;

const ClearSearchButton = styled(HeaderButton)<{ theme: 'light' | 'dark' }>`
  position: absolute;
  right: 8px;
  background-color: ${({ theme }) => (theme === 'light' ? 'white' : 'var(--surface)')};
  color: ${({ theme }) => (theme === 'light' ? 'var(--text-primary)' : 'var(--text-primary)')};
  border-radius: 50%;
  width: 24px;
  height: 24px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    opacity: 0.8;
  }

  svg {
    width: 16px;
    height: 16px;
    transform: translateX(-9px);
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

const ViewModeButton = styled(HeaderButton)<{ $active?: boolean }>`
  background-color: ${({ $active }) => $active ? 'var(--surface)' : 'transparent'};
  color: ${({ $active }) => $active ? 'var(--primary)' : 'var(--text-secondary)'};
  box-shadow: ${({ $active }) => $active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'};
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

// New Mobile Header Styles
const MobileHeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const MobileHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MobileHeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MobilePageTitle = styled.h1`
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
`;

const SortButtonContainer = styled.button`
  position: relative; // Added for dropdown positioning
  display: flex;
  flex-direction: column;
  align-items: flex-start; // Changed from flex-end to flex-start
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: var(--text-secondary);
  transition: color 0.2s;

  &:hover {
    color: var(--text-primary);
  }
`;

const SortByText = styled.span`
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const SortCriteriaText = styled.span`
  font-size: 12px;
  color: var(--text-tertiary); // A lighter color for secondary info
`;

const SortDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0; // Align left with the button
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-top: 8px;
  padding: 8px;
  list-style: none;
  box-shadow: 0 44px 12px rgba(0,0,0,0.1);
  z-index: 10;
  min-width: 220px;
  display: flex;
  flex-direction: column;
`;

const SortDropdownItem = styled.div`
  width: 100%;
  background: none;
  border: none;
  color: var(--text-secondary);
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: space-between; // To push the checkmark to the right
  gap: 8px;
  padding: 10px 12px;
  font-size: 14px;
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
`;

interface AppHeaderProps {
  pageTitle: string;
  toggleSidebar: () => void;
  goBack: () => void;
  canGoBack: boolean;
  $isSidebarOpen: boolean;
  page: string;
  setPage: (page: string) => void;
  isSearchActive: boolean;
  setSearchActive: (active: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  hardware: Hardware[];
  setSortOrder: (order: string) => void;
  viewMode: 'card' | 'table';
  setViewMode: (mode: 'card' | 'table') => void;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  handleAiClick?: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  sortOrder: string; // Added sortOrder to props
  onClearChatbot?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = (props) => {
  const {
    pageTitle, toggleSidebar, goBack, canGoBack, $isSidebarOpen, page, setPage,
    isSearchActive, setSearchActive, searchQuery, setSearchQuery,
    hardware, setSortOrder,
    viewMode, setViewMode, showSuggestions, setShowSuggestions
    , handleAiClick, theme, toggleTheme, sortOrder, onClearChatbot
  } = props;

  const isMobile = useMediaQuery('(max-width: 768px)');
  const isStockPage = page === 'stock';
  const searchRef = useRef<HTMLDivElement>(null);
  const sortButtonRef = useRef<HTMLButtonElement>(null); // Added
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false); // Added

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
      // Close sort dropdown if click is outside
      if (sortButtonRef.current && !sortButtonRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, setSearchActive, setShowSuggestions, sortButtonRef, setIsSortDropdownOpen]); // Dependencies updated

  const handleSuggestionClick = (description: string) => {
    setSearchQuery(description);
    setShowSuggestions(false);
    if (isMobile) {
      setSearchActive(false);
    }
  };

  const getSortDisplayText = useMemo(() => {
    switch (sortOrder) {
      case 'description_asc': return 'Description (A-Z)';
      case 'description_desc': return 'Description (Z-A)';
      case 'quantity_asc': return 'Quantity (Low to High)';
      case 'quantity_desc': return 'Quantity (High to Low)';
      case 'retail_price_asc': return 'Retail Price (Low to High)';
      case 'retail_price_desc': return 'Retail Price (High to Low)';
      default: return 'Description (A-Z)';
    }
  }, [sortOrder]);

  const sortOptions = [ // Added
    { value: 'description_asc', label: 'Description (A-Z)' },
    { value: 'description_desc', label: 'Description (Z-A)' },
    { value: 'quantity_asc', label: 'Quantity (Low to High)' },
    { value: 'quantity_desc', label: 'Quantity (High to Low)' },
    { value: 'retail_price_asc', label: 'Retail Price (Low to High)' },
    { value: 'retail_price_desc', label: 'Retail Price (High to Low)' },
  ];

  // Mobile Header Implementation
  if (isMobile) {
    if (isSearchActive && isStockPage) {
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
                {searchQuery && (
                  <ClearSearchButton onClick={() => setSearchQuery('')} aria-label="Clear search" theme={theme}>
                    <CloseIcon />
                  </ClearSearchButton>
                )}
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
          </HeaderContent>
        </HeaderContainer>
      );
    }

    return (
      <HeaderContainer>
        <MobileHeaderWrapper>
          <MobileHeaderLeft>
            {page !== 'dashboard' && (
              <HeaderButton onClick={() => setPage('dashboard')} aria-label="Go home">
                <HomeIcon />
              </HeaderButton>
            )}
            {isStockPage ? (
              <SortButtonContainer ref={sortButtonRef} onClick={() => setIsSortDropdownOpen(prev => !prev)} aria-label="Sort by criteria">
                <SortByText>
                  Sort By <span style={{ fontSize: '0.8em', lineHeight: '1', marginLeft: '4px' }}>▼</span>
                </SortByText>
                <SortCriteriaText>{getSortDisplayText}</SortCriteriaText>
                {isSortDropdownOpen && (
                  <SortDropdown>
                    {sortOptions.map(option => (
                      <SortDropdownItem
                        key={option.value}
                        className={sortOrder === option.value ? 'active' : ''}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent SortButtonContainer's onClick from firing again
                          setSortOrder(option.value);
                          setIsSortDropdownOpen(false);
                        }}
                      >
                        {option.label}
                      </SortDropdownItem>
                    ))}
                  </SortDropdown>
                )}
              </SortButtonContainer>
            ) : (
              <MobilePageTitle>{page === 'dashboard' ? 'Home' : pageTitle}</MobilePageTitle>
            )}
          </MobileHeaderLeft>
          <MobileHeaderRight>
            {isStockPage && (
              <HeaderButton onClick={() => setSearchActive(true)} aria-label="Search">
                <SearchIcon />
              </HeaderButton>
            )}
            {page === 'chatbot' && onClearChatbot && (
              <HeaderButton onClick={onClearChatbot} aria-label="Clear conversation">
                <TrashIcon />
              </HeaderButton>
            )}
            {page === 'dashboard' && (
              <HeaderButton onClick={toggleTheme} aria-label="Toggle theme">
                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
              </HeaderButton>
            )}
            <HeaderButton onClick={toggleSidebar} aria-label="Toggle sidebar">
              <HamburgerIcon />
            </HeaderButton>
          </MobileHeaderRight>
        </MobileHeaderWrapper>
      </HeaderContainer>
    );
  }

  // Desktop Header Implementation
  const showDesktopSearch = isStockPage && !isMobile;
  const showTitle = !isSearchActive && (!isStockPage || (isStockPage && isMobile));

  return (
    <HeaderContainer>
      <HeaderContent>
        <ActionsContainer className="left">
          {!$isSidebarOpen && !isMobile && (
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
              {searchQuery && (
                <ClearSearchButton onClick={() => setSearchQuery('')} aria-label="Clear search" theme={theme}>
                  <CloseIcon />
                </ClearSearchButton>
              )}
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
        ) : isStockPage && !isMobile && !isSearchActive ? (
          <SortButtonContainer ref={sortButtonRef} onClick={() => setIsSortDropdownOpen(prev => !prev)} aria-label="Sort by criteria">
            <SortByText>
              Sort By <ArrowRightIcon style={{ transform: 'rotate(90deg)' }} />
            </SortByText>
            <SortCriteriaText>{getSortDisplayText}</SortCriteriaText>
          </SortButtonContainer>
        ) : showTitle ? (
          <PageTitle>{pageTitle}</PageTitle>
        ) : <div /> /* Empty div to balance the grid */}

        <ActionsContainer className="right">
          {page === 'chatbot' && onClearChatbot && (
            <HeaderButton onClick={onClearChatbot} aria-label="Clear conversation">
              <TrashIcon />
            </HeaderButton>
          )}
          {isStockPage && (!isMobile || !isSearchActive) && (
            <StockActionsContainer>
               {!isMobile && (
                <ViewModeContainer>
                  <ViewModeButton $active={viewMode === 'card'} onClick={() => setViewMode('card')} aria-label="Card view">
                    <LayoutGridIcon />
                  </ViewModeButton>
                  <ViewModeButton $active={viewMode === 'table'} onClick={() => setViewMode('table')} aria-label="Table view">
                    <ListIcon />
                  </ViewModeButton>
                </ViewModeContainer>
              )}
              {isMobile && (
                 <HeaderButton onClick={() => setSearchActive(true)} aria-label="Search">
                    <SearchIcon />
                </HeaderButton>
              )}
            </StockActionsContainer>
          )}
          {page === 'dashboard' && (
            <HeaderButton onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </HeaderButton>
          )}
          {!$isSidebarOpen && isMobile && (
            <HeaderButton onClick={toggleSidebar} aria-label="Toggle sidebar"><HamburgerIcon /></HeaderButton>
          )}
        </ActionsContainer>
      </HeaderContent>
    </HeaderContainer>
  );
};

export default AppHeader;
