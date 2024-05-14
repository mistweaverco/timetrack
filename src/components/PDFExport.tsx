import React, { FC, useEffect, useRef, useState, ReactNode } from 'react';
import moment from 'moment';
import { getHMSStringFromSeconds } from './../lib/Utils';
import { Datafetcher } from './../lib/Datafetcher';
import { useAppDispatch, useAppSelector } from './Store/hooks'
import { setPDFDocument, removePDFDocument } from './Store/slices/pdfDocument'
import { setSelectedPanel } from './Store/slices/selectedPanel'

type ProjectTaskDefintion = {
  project_name: string,
  name: string,
}

const TasksComponent: FC<{ tasks: ProjectTaskDefintion[] }> = ({ tasks }) => {
  if (!tasks.length) {
    return null;
  }
  return tasks.map((task, idx: number) => {
    return (
      <div key={idx}>
        <label className="checkbox">
          <input type="checkbox" name="task" data-project-name={task.project_name} value={task.name} /> {task.name}
        </label>
      </div>
    )
  })
}

const ProjectsComponent: FC<{ projects: DBProject[], taskdefs: ProjectTaskDefintion[] }> = ({ projects, taskdefs }) => {
  if (!projects.length) {
    return null;
  }
  if (!taskdefs.length) {
    return null;
  }
  return projects.map((project, idx: number) => {
    const tasks = taskdefs.filter((td) => td.project_name === project.name);
    return (
      <div key={idx} className="card">
        <header className="card-header">
          <p className="card-header-title">{project.name}</p>
        </header>
        <div className="card-content">
          <div className="content">
            <TasksComponent tasks={tasks} />
          </div>
        </div>
      </div>
    )
  })
}

const Component: FC = () => {
  const [projects, setProjects] = useState([]);
  const [tasksDefinitions, setTaskDefinitions] = useState([]);
  const fromRef = useRef<HTMLInputElement>(null)
  const toRef = useRef<HTMLInputElement>(null)
  const genRef = useRef<HTMLButtonElement>(null)
  const dispatch = useAppDispatch();

  const onFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const rawfrom = formData.get('from') as string;
    const rawto = formData.get('to') as string;
    const from = moment(rawfrom).format('YYYY-MM-DD');
    const to = moment(rawto).format('YYYY-MM-DD');
    const tasks = form.querySelectorAll('input[name="task"]:checked');
    const query: PDFQuery = { from, to, tasks: [] };
    tasks.forEach((task: HTMLInputElement) => {
      const project_name = task.dataset.projectName as string;
      const name = task.value;
      query.tasks.push({ project_name, name });
    });
    const rpcResult = await window.electron.getDataForPDFExport(query);
    window.electron.showFileSaveDialog();
    dispatch(setSelectedPanel({ name: 'PDFDocument' }));
    dispatch(setPDFDocument({ name: rpcResult }));
  }

  window.electron.on('on-pdf-export-file-selected', ({ filePath, canceled }) => {
    if (canceled) {
      dispatch(removePDFDocument());
      dispatch(setSelectedPanel({ name: 'PDFExport' }));
    }
  })

  window.electron.on('on-pdf-export-file-saved', () => {
    dispatch(removePDFDocument());
    dispatch(setSelectedPanel({ name: 'PDFExport' }));
  })

  const onTimeChange = async () => {
    if (fromRef.current && toRef.current) {
      const from = fromRef.current.value;
      const to = toRef.current.value;
      if (from && to) {
        genRef.current.disabled = false;
      } else {
        genRef.current.disabled = true;
      }
    } else {
      genRef.current.disabled = true;
    }
  }


  const fetchAllProjects = async () => {
    const p = await Datafetcher.getProjects();
    setProjects(p);
  }

  const fetchAllTaskDefinitions = async () => {
    const td = await Datafetcher.getAllTaskDefinitions();
    setTaskDefinitions(td);
  }

  useEffect(() => {
    fetchAllProjects();
    fetchAllTaskDefinitions();
  }, [])

  if (tasksDefinitions.length) {
    return <>
      <section className="section">
        <h1 className="title">PDF Export</h1>
        <h2 className="subtitle">You can export your saved projects and tasks as PDF.</h2>
        <form onSubmit={onFormSubmit}>
          <div className="fixed-grid has-3-cols">
            <div className="grid">
              <div className="cell">
                <nav className="panel">
                  <p className="panel-heading">Date-Range</p>
                  <div className="field">
                    <label className="label">From</label>
                    <div className="control">
                      <input name="from" ref={fromRef} onChange={onTimeChange} className="input" type="date" />
                    </div>
                  </div>
                  <div className="field">
                    <label className="label">To</label>
                    <div className="control">
                      <input name="to" ref={toRef} onChange={onTimeChange} className="input" type="date" />
                    </div>
                  </div>
                  <div className="field">
                    <div className="control">
                      <button ref={genRef} disabled className="button is-primary" type="submit">Generate</button>
                    </div>
                  </div>
                </nav>
              </div>

              <div className="cell">
                <nav className="panel">
                  <p className="panel-heading">Topics</p>
                  <div className="field">
                    <ProjectsComponent projects={projects} taskdefs={tasksDefinitions} />
                  </div>
                </nav>
              </div>
            </div>
          </div>
        </form>
      </section>
    </>;
  } else {
    return null;
  }
};

export const PDFExport = Component;

