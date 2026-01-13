import React from 'react';
import AppRouter from './AppRouter';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { NotificationProvider } from './context/NotificationContext';
import useColorMode from './hooks/useColorMode';
import '@mantine/notifications/styles.css';

function App() {
  // Initialize dark mode on app start
  useColorMode();

  return (
    <MantineProvider>
      <Notifications position="top-right" />
      <NotificationProvider>
        <AppRouter />
      </NotificationProvider>
    </MantineProvider>
  );
}

export default App;
