import React, { useState } from 'react'
import { createRoot } from 'react-dom/client';

import '@fortawesome/fontawesome-free/css/all.min.css';
import 'bulma/css/bulma.min.css';
import './index.css';
import './modal.ts';
import { GUI } from './components/GUI';

const rootNode = document.getElementById('root') as HTMLElement;

createRoot(rootNode).render(
  <React.StrictMode>
    <GUI />
  </React.StrictMode>,
)
