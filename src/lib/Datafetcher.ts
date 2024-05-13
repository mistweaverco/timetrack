'use client';

import { convertSecondsToTime } from './Time';

const getProjects = async () => {
  const projects = await window.electron.getProjects();
  return projects;
}

const getTasks = async (projectName: string) => {
  const tasks = await electron.getTasks(projectName);
  return tasks;
}

const getTaskDefinitions = async (projectName: string) => {
  const td = await electron.getTaskDefinitions(projectName);
  return td;
}

export const Datafetcher = {
  getProjects,
  getTaskDefinitions,
  getTasks,
};
