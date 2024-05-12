import React from 'react'
import { createRoot } from 'react-dom/client';

import '@fortawesome/fontawesome-free/css/all.min.css';
import 'bulma/css/bulma.min.css';
import './index.css';
import './modal.ts';
import { Container } from './renderer/Container';
import { Form, FormInput } from './renderer/Form';

const rootNode = document.getElementById('root') as HTMLElement;

createRoot(rootNode).render(
  <React.StrictMode>
    <Container>
      <Form>
        <FormInput label="Username" type="text" placeholder="Enter your username" />
        <FormInput label="Password" type="password" placeholder="Enter your password" />
        <FormInput label="Email" type="email" placeholder="Enter your email" />
        <FormInput label="Phone" type="tel" placeholder="Enter your phone number" />
        <FormInput label="Date of Birth" type="date" placeholder="Enter your date of birth" />
      </Form>
    </Container>
  </React.StrictMode>,
)
