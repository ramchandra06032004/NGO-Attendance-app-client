import React from 'react';
import { AttendanceProvider } from './src/context/AttendanceContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppContainer from './src/AppContainer';
import ErrorBoundary from './src/ErrorBoundary';
import { AuthProvider } from "./src/context/AuthContext";

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AttendanceProvider>
          <AuthProvider>
            <AppContainer />
          </AuthProvider>
        </AttendanceProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
