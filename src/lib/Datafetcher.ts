'use client';

import { convertSecondsToTime } from './Time';

const getProjects = async () => {
  const projects = await window.electron.getProjects();
  return projects;
}

const loadTasks = async (projectName: string) => {
  const tasks = await electron.getTasks(projectName);
  return tasks;
}

export const Datafetcher = {
  getProjects,
};
