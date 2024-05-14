'use client';

const getProjects = async () => {
  const projects = await window.electron.getProjects();
  return projects;
}

const getTasks = async (project_name: string) => {
  const tasks = await electron.getTasks(project_name);
  return tasks;
}

const getTasksToday = async (project_name: string) => {
  const tasks = await electron.getTasksToday(project_name);
  return tasks;
}

const getTaskDefinitions = async (project_name: string) => {
  const td = await electron.getTaskDefinitions(project_name);
  return td;
}

const getAllTaskDefinitions = async () => {
  const td = await electron.getAllTaskDefinitions();
  return td;
}

const getDataForPDFExport = async (q: PDFQuery) => {
  const r = await electron.getDataForPDFExport(q);
  return r;
}

const getPDFExport = async () => {
  return await electron.getPDFExport();
}

const showFileSaveDialogue = async () => {
  await electron.showFileSaveDialogue();
}

export const Datafetcher = {
  getProjects,
  getTaskDefinitions,
  getTasks,
  getTasksToday,
  getAllTaskDefinitions,
  getDataForPDFExport,
  getPDFExport,
  showFileSaveDialogue,
};
