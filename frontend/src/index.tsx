// frontend/src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
// No need for index.css if using MUI's CssBaseline and emotion for styling
// However, if you add global CSS or custom fonts, you'd link it here.
// For now, removing the default index.css import as MUI handles base styling.
// import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
