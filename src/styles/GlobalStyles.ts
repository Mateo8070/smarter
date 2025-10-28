import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  :root {
    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    
    --primary: ${({ theme }) => theme.primary};
    --primary-hover: ${({ theme }) => theme.primaryHover};
    --surface: ${({ theme }) => theme.surface};
    --background: ${({ theme }) => theme.background};
    --text-primary: ${({ theme }) => theme.textPrimary};
    --text-secondary: ${({ theme }) => theme.textSecondary};
    --border: ${({ theme }) => theme.border};
    --danger: ${({ theme }) => theme.danger};
    --success: ${({ theme }) => theme.success};
    --surface-variant: ${({ theme }) => theme.surfaceVariant};
  }

  *, *::before, *::after {
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  html {
    font-size: 16px;
  }
  
  html, body, #root {
    height: 100%;
  }

  body {
    font-family: var(--font-sans);
    margin: 0;
    background-color: var(--background);
    color: var(--text-primary);
    line-height: 1.6;
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  h1, h2, h3, h4, h5, h6 {
    color: var(--text-primary);
    margin: 0 0 0.5em 0;
    font-weight: 600;
  }

  p {
    margin: 0 0 1em 0;
  }

  a {
    color: var(--primary);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  a:hover {
    text-decoration: underline;
    color: var(--primary-hover);
  }

  button, input, textarea, select {
    font-family: inherit;
    font-size: 1rem;
    border-radius: 8px;
  }
  
  input, textarea, select {
    background-color: var(--surface-variant);
    border: 1px solid var(--border);
    color: var(--text-primary);
    padding: 10px 14px;
    width: 100%;
    transition: border-color 0.2s, box-shadow 0.2s;
    
    &:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px ${({ theme }) => theme.primary}33;
    }

    &::placeholder {
      color: var(--text-secondary);
    }
  }

  button {
    cursor: pointer;
  }

  *:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
    border-radius: 6px;
  }
  
  body.modal-open {
    overflow: hidden;
  }
`;

export default GlobalStyles;