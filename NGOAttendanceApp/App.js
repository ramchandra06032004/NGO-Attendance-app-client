import React from 'react';
import { AttendanceProvider } from './src/context/AttendanceContext';
import AppContainer from './src/AppContainer';

export default function App() {
  return (
    <AttendanceProvider>
      <AppContainer />
    </AttendanceProvider>
  );
}
