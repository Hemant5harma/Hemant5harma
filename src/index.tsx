import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import '@mantine/core/styles.css';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store/store';
import reportWebVitals from './reportWebVitals';
import { MantineProvider } from '@mantine/core';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <MantineProvider>
      <Provider store={store}>
        <BrowserRouter basename="/">
          <App />
        </BrowserRouter>
      </Provider>
    </MantineProvider>
  </React.StrictMode>,
);

reportWebVitals();
