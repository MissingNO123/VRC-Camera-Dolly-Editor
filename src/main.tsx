import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './plugins/i18n';
import App from './App'; 

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/*
React 18 introduced a new root API. The old ReactDOM.render method is now deprecated.
I'm leaving the old React 17 code here just in case

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import './plugins/i18n';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

*/