import React from 'react';
import { AutenticacaoProvider } from './src/contextos/AutenticacaoContexto';
import AppNavegacao from './src/navegacao';

export default function App() {
  return (
    <AutenticacaoProvider>
      <AppNavegacao />
    </AutenticacaoProvider>
  );
}