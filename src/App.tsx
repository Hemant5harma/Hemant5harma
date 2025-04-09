import React from 'react';
import Markup from "./router";
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { NotificationProvider } from './context/NotificationContext';
import '@mantine/notifications/styles.css';

function App() {
  return (
    <MantineProvider>
      <Notifications position="top-right" />
      <NotificationProvider>
        <Markup />
      </NotificationProvider>
    </MantineProvider>
  );
}

export default App;
