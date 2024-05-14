import { FC } from 'react';
import { Provider } from 'react-redux'
import { Container } from './Container';
import { Navigation } from './Navigation';
import { store } from './Store'

export const GUI: FC = () => {
  return <>
    <Provider store={store}>
      <Container>
        <Navigation />
      </Container>
    </Provider>
  </>;
};

