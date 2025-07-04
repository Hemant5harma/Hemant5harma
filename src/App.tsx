import React from 'react';
import AppRouter from './AppRouter';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { NotificationProvider } from './context/NotificationContext';
import '@mantine/notifications/styles.css';

function App() {
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
