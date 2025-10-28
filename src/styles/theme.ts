import { type DefaultTheme } from 'styled-components';

const lightTheme: DefaultTheme = {
  primary: '#0052cc',
  primaryHover: '#0065ff',
  surface: '#ffffff',
  background: '#F9FAFB', // Lighter, off-white
  textPrimary: '#172b4d',
  textSecondary: '#6B7280', // Tailwind Gray 500
  border: '#E5E7EB', // Tailwind Gray 200
  danger: '#de350b',
  success: '#00875a',
  surfaceVariant: '#F3F4F6', // Tailwind Gray 100
};

const darkTheme: DefaultTheme = {
  primary: '#4c9aff',
  primaryHover: '#62a9ff',
  surface: '#1F2937', // Tailwind Gray 800
  background: '#111827', // Tailwind Gray 900
  textPrimary: '#F9FAFB', // Tailwind Gray 50
  textSecondary: '#9CA3AF', // Tailwind Gray 400
  border: '#374151', // Tailwind Gray 700
  danger: '#ff5630',
  success: '#36b37e',
  surfaceVariant: '#374151', // Tailwind Gray 700
};

export { lightTheme, darkTheme };
