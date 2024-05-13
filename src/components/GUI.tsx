import React, { FC, useState, useEffect, useContext } from 'react';
import { Provider } from 'react-redux'
import { Container } from './Container';
import { ActiveTasks } from './ActiveTasks';
import { Projects } from './Projects';
import { Tasks } from './Tasks';
import { TaskDefinitions } from './TaskDefinitions';
import { store } from './Store'

export const GUI: FC = () => {
  return <>
    <Provider store={store}>
      <Container>
        <ActiveTasks />
        <Projects />
        <Tasks />
        <TaskDefinitions />
      </Container>
    </Provider>
  </>;
};

