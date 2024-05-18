import React, { FC, useEffect, useRef, useState, ReactNode } from 'react';
import moment from 'moment';
import { getHMSStringFromSeconds } from './../lib/Utils';
import { Datafetcher } from './../lib/Datafetcher';
import { useAppDispatch, useAppSelector } from './Store/hooks'
import { setPDFDocument, removePDFDocument } from './Store/slices/pdfDocument'
import { setSelectedPanel } from './Store/slices/selectedPanel'
import { RootState } from './Store';
import { connect } from 'react-redux';
import { setPDFEventlisteners } from './Store/slices/pdfEventListeners';

type ProjectTaskDefintion = {
  project_name: string,
  name: string,
}

const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const target = e.currentTarget;
  const form = target.closest('form') as HTMLFormElement;
  const submitButton = form.querySelector('button[name="generate"]');
  const countChecked = form.querySelector('input[type="checkbox"]:checked');
  if (form.checkValidity() && countChecked) {
    submitButton.removeAttribute('disabled');
    submitButton.classList.remove('is-danger');
    submitButton.classList.add('is-primary');
  } else {
    submitButton.setAttribute('disabled', 'disabled');
    submitButton.classList.add('is-danger');
    submitButton.classList.remove('is-primary');
  }
}

const TasksComponent: FC<{ tasks: ProjectTaskDefintion[] }> = ({ tasks }) => {
  if (!tasks.length) {
    return null;
  }
  return tasks.map((task, idx: number) => {
    return (
      <div key={idx}>
        <label className="checkbox">
          <input onChange={onInputChange} type="checkbox" name="task" data-project-name={task.project_name} value={task.name} /> {task.name}
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

type Props = {
  pdfEventlistenersAdded: boolean
}

const Component: FC<Props> = ({ pdfEventlistenersAdded }) => {
  const [projects, setProjects] = useState([]);
  const [tasksDefinitions, setTaskDefinitions] = useState([]);
  const dispatch = useAppDispatch();

  const onFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    if (!form.checkValidity()) {
      return;
    }
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

  const fetchAllProjects = async () => {
    const p = await Datafetcher.getProjects();
    setProjects(p);
  }

  const fetchAllTaskDefinitions = async () => {
    const td = await Datafetcher.getAllTaskDefinitions();
    setTaskDefinitions(td);
  }

  const onPDFExportFileSelected = ({ canceled }) => {
    if (canceled) {
      dispatch(removePDFDocument());
      dispatch(setSelectedPanel({ name: 'PDFExport' }));
    }
  }

  const onPDFExportFileSaved = () => {
    dispatch(removePDFDocument());
    dispatch(setSelectedPanel({ name: 'PDFExport' }));
  }

  useEffect(() => {
    fetchAllProjects();
    fetchAllTaskDefinitions();
    // this leaks, we need to make sure to not add the same listener multiple times
    // we could remove the listener in the cleanup function, that
    // that would mess up the pdf export functionality
    // so we keep track of added listeners in a redux state
    if (pdfEventlistenersAdded) {
      return;
    }
    window.electron.on('on-pdf-export-file-selected', onPDFExportFileSelected);
    window.electron.on('on-pdf-export-file-saved', onPDFExportFileSaved);
    dispatch(setPDFEventlisteners());
  }, [])

  if (tasksDefinitions.length) {
    return <>
      <section className="section">
        <h1 className="title">PDF Export</h1>
        <h2 className="subtitle">You can export your saved projects and tasks as PDF.</h2>
        <form onSubmit={onFormSubmit} className="pdf-export-form">
          <div className="fixed-grid has-3-cols">
            <div className="grid">
              <div className="cell">
                <nav className="panel">
                  <p className="panel-heading">Date-Range</p>
                  <div className="field">
                    <label className="label">From</label>
                    <div className="control">
                      <input name="from" required onChange={onInputChange} defaultValue={moment().format('YYYY-MM-DD')} className="input" type="date" />
                    </div>
                  </div>
                  <div className="field">
                    <label className="label">To</label>
                    <div className="control">
                      <input name="to" required onChange={onInputChange} defaultValue={moment().format('YYYY-MM-DD')} className="input" type="date" />
                    </div>
                  </div>
                  <div className="field">
                    <div className="control">
                      <button name="generate" disabled className="button is-danger" type="submit">Generate</button>
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

const mapStateToProps = (state: RootState) => {
  return {
    pdfEventlistenersAdded: state.pdfEventlisteners.value.added
  }
}
const connected = connect(mapStateToProps)(Component);
export const PDFExport = connected

