import React from 'react';
import { StoreProvider } from './state';
import { Shell } from './Shell';
import './theme.css';

export function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
