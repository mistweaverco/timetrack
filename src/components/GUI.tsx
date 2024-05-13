import React, { FC, useState, useEffect } from 'react';
import { Container } from './Container';
import { ActiveTasks } from './ActiveTasks';
import { Projects } from './Projects';
import { Tasks } from './Tasks';
import { TaskDefinitions } from './TaskDefinitions';
import { Datafetcher } from './../lib/Datafetcher';

export const GUI: FC = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(()=> {
    Datafetcher.getProjects().then((projects) => {
      setProjects(projects);
    });
  },[])

  return <>
    <Container>
      <ActiveTasks />
      <Projects projects={projects} />
      <Tasks />
      <TaskDefinitions />
    </Container>
  </>;
};

