import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    primary: string;
    primaryHover: string;
    surface: string;
    background: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
    danger: string;
    success: string;
    surfaceVariant: string;
  }
}