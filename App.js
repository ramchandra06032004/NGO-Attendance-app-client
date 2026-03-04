import "./global.css";
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AttendanceProvider } from './src/context/AttendanceContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppContainer from './src/AppContainer';
import ErrorBoundary from './src/ErrorBoundary';
import { AuthProvider } from "./src/context/AuthContext";

// Suppress deprecation warnings from third-party packages
LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <AttendanceProvider>
            <AuthProvider>
              <AppContainer />
            </AuthProvider>
          </AttendanceProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
