import React from 'react';
import { AttendanceProvider } from './src/context/AttendanceContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppContainer from './src/AppContainer';
import ErrorBoundary from './src/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AttendanceProvider>
          <AppContainer />
        </AttendanceProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
