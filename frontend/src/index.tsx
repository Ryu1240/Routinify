import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import './index.css';
import App from './App';
import { BRAND_COLORS } from '@/shared/constants/colors';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <MantineProvider
      theme={{
        colors: {
          brand: BRAND_COLORS,
        },
        primaryColor: 'brand',
      }}
    >
      <App />
    </MantineProvider>
  </React.StrictMode>
);
