import React, { FC, useRef, useState  } from 'react';
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import moment from 'moment';
import { LoadingComponent } from './LoadingComponent';
import { EditProjectModal } from './EditProjectModal'
import { DeleteProjectModal } from './DeleteProjectModal'
import { EditTaskModal } from './EditTaskModal'
import { DeleteTaskModal } from './DeleteTaskModal'
import { DeleteTaskDefinitionModal } from './DeleteTaskDefinitionModal'
import { RootState } from './Store';
import { connect } from 'react-redux';
import { InfoboxComponent } from './InfoboxComponent';
import { getHMSStringFromSeconds } from '@lib/Utils';
import { EditTaskDefinitionModal } from './EditTaskDefinitionModal';

type Props = {
  activeTasks: ActiveTask[]
  searchResult: SearchQueryResult
  setSearchResults: React.RefCallback<SearchQueryResult>
  setModal: React.Dispatch<React.SetStateAction<React.ReactNode>>
}

type SearchResultsComponentProps = {
  activeTasks: ActiveTask[]
  searchResult: SearchQueryResult
  setSearchResults: React.RefCallback<SearchQueryResult>
  searchIn: React.RefObject<HTMLSelectElement>
  setModal: React.Dispatch<React.SetStateAction<React.ReactNode>>
}


const SearchResultsProjectsComponent: FC<Props> = ({ activeTasks, searchResult, setSearchResults, setModal }) => {

  const delModalCallback = (status: boolean, data: DBProject) => {
    if (status) {
      const filteredProjects = searchResult.projects.filter((project: DBProject) => project.name !== data.name);
      searchResult.projects = filteredProjects;
      setSearchResults(searchResult);
    }
    setModal(null)
  }

  const showDeleteConfirmModal = (evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.preventDefault();
    const data = JSON.parse(evt.currentTarget.dataset.data) as DBProject;
    setModal(<DeleteProjectModal project={data} callback={(status) => delModalCallback(status, data)} />);
  }

  const editModalCallback = (status: boolean, data: DBProject, editedData: DBProject) => {
    if (status) {
      const filteredProjects = searchResult.projects.map((project: DBProject) => {
        if (project.name === data.name) {
          data.name = editedData.name;
          return data;
        }
        return project;
      });
      searchResult.projects = filteredProjects;
      setSearchResults(searchResult);
    }
    setModal(null)
  }

  const showEditModal = (evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.preventDefault();
    const data = JSON.parse(evt.currentTarget.dataset.data) as DBProject;
    setModal(<EditProjectModal project={data} callback={(status: boolean, editedData: DBProject) => editModalCallback(status, data, editedData)} />);
  }

  type ButtonWrapperProps = {
    project: DBProject
  }

  const ButtonWrapperComponent: FC<ButtonWrapperProps> = ({ project }) => {
    const activeTask = activeTasks.find((at) => at.project_name === project.name)
    if (activeTask) {
      return <>
        <InfoboxComponent title="Warning" type="warning">
          A task belonging to this project is currently active,
          you need to stop it to perform any action.
        </InfoboxComponent>
      </>
    } else {
      return <>
        <button className="button is-warning card-footer-item" data-data={JSON.stringify(project)} onClick={showEditModal}>Edit</button>
        <button className="button is-danger card-footer-item" data-data={JSON.stringify(project)} onClick={showDeleteConfirmModal}>Delete</button>
      </>
    }
  }

  return <>
    <div>
      <div className="field">
        <div className="control">
          <section className="hero">
            <div className="hero-body">
              <p className="title">Projects</p>
            </div>
          </section>
        </div>
      </div>
      { searchResult.projects.length ?
        searchResult.projects.map((project: DBProject, idx: number) =>
          <div key={idx}>
            <div className="card">
              <div className="card-content">
                <div className="media">
                  <div className="media-content">
                    <p className="title is-4">{project.name}</p>
                  </div>
                </div>
              </div>
              <footer className="card-footer">
                <ButtonWrapperComponent project={project} />
              </footer>
            </div>
          </div>
        )
        : <div>No projects found</div>
      }
    </div>
  </>;
}

const SearchResultsTaskDefinitionsComponent: FC<Props> = ({ activeTasks, searchResult, setModal, setSearchResults }) => {
  const delModalCallback = (status: boolean, data: DBTaskDefinition) => {
    if (status) {
      const f = (td: DBTaskDefinition) => {
        if (td.name !== data.name || td.project_name !== data.project_name) {
          return td;
        }
      }
      searchResult.task_definitions = searchResult.task_definitions.filter(f);
      setSearchResults(searchResult);
    }
    setModal(null)
  }

  const showDeleteConfirmModal = (evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.preventDefault();
    const data = JSON.parse(evt.currentTarget.dataset.data) as DBTaskDefinition;
    setModal(<DeleteTaskDefinitionModal taskDefinition={data} callback={(status) => delModalCallback(status, data)} />);
  }

  const editModalCallback = (status: boolean, data: DBTaskDefinition,  editedData: DBTaskDefinition) => {
    if (status) {
      const f = (td: DBTaskDefinition) => {
        if (td.name === data.name && td.project_name === data.project_name) {
          return editedData;
        }
        return td;
      }
      searchResult.task_definitions = searchResult.task_definitions.map(f);
      setSearchResults(searchResult);
    }
    setModal(null)
  }

  const showEditModal = (evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.preventDefault();
    const data = JSON.parse(evt.currentTarget.dataset.data) as DBTaskDefinition;
    setModal(<EditTaskDefinitionModal taskDefinition={data} callback={(status, editedData) => editModalCallback(status, data, editedData)} />);
  }

  type ButtonWrapperProps = {
    taskdef: DBTaskDefinition
  }

  const ButtonWrapperComponent: FC<ButtonWrapperProps> = ({ taskdef }) => {
    const activeTask = activeTasks.find((at) => at.name === taskdef.name && at.project_name === taskdef.project_name)
    if (activeTask) {
      return <>
        <InfoboxComponent title="Warning" type="warning">
          A task belonging to this task definition is currently active,
          you need to stop it to perform any action.
        </InfoboxComponent>
      </>
    } else {
      return <>
        <button className="button is-warning card-footer-item" data-data={JSON.stringify(taskdef)} onClick={showEditModal}>Edit</button>
        <button className="button is-danger card-footer-item" data-data={JSON.stringify(taskdef)} onClick={showDeleteConfirmModal}>Delete</button>
      </>
    }
  }

  return <>
    <div>
      <div className="field">
        <div className="control">
          <section className="hero">
            <div className="hero-body">
              <p className="title">Task Definitions</p>
            </div>
          </section>
        </div>
      </div>
      { searchResult.task_definitions.length ?
        searchResult.task_definitions.map((taskdef: DBTaskDefinition, idx: number) =>
          <div key={idx}>
            <div className="card">
              <div className="card-content">
                <div className="media">
                  <div className="media-content">
                    <p className="title is-4">{taskdef.name}</p>
                    <p className="subtitle is-6">{taskdef.project_name}</p>
                  </div>
                </div>
              </div>
              <footer className="card-footer">
                <ButtonWrapperComponent taskdef={taskdef} />
              </footer>
            </div>
          </div>
        )
        : <div>No task definitions found</div>
      }
    </div>
  </>;
}
const SearchResultsTasksComponent: FC<Props> = ({ activeTasks, searchResult, setModal, setSearchResults }) => {
  const delModalCallback = (status: boolean, data: DBTask) => {
    if (status) {
      const f = (t: DBTask) => {
        if (t.name !== data.name || t.project_name !== data.project_name || t.date !== data.date) {
          return t;
        }
      }
      searchResult.tasks = searchResult.tasks.filter(f);
      setSearchResults(searchResult);
    }
    setModal(null)
  }

  const showDeleteConfirmModal = (evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.preventDefault();
    const data = JSON.parse(evt.currentTarget.dataset.data) as DBTask;
    setModal(<DeleteTaskModal task={data} callback={(status) => delModalCallback(status, data)} />);
  }

  const editModalCallback = (status: boolean, data: DBTask) => {
    if (status) {
      const f = (t: DBTask) => {
        if (t.name === data.name && t.project_name === data.project_name && t.date === data.date) {
          return data;
        }
        return t;
      }
      searchResult.tasks = searchResult.tasks.map(f);
      setSearchResults(searchResult);
    }
    setModal(null)
  }

  const showEditModal = (evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.preventDefault();
    const data = JSON.parse(evt.currentTarget.dataset.data) as DBTask;
    setModal(<EditTaskModal task={data} callback={(status, editedData) => editModalCallback(status, editedData)} />);
  }

  type ButtonWrapperProps = {
    task: DBTask
  }

  const ButtonWrapperComponent: FC<ButtonWrapperProps> = ({ task }) => {
    const activeTask = activeTasks.find((at) => at.name === task.name && at.project_name === task.project_name)
    if (activeTask) {
      return <>
        <InfoboxComponent title="Warning" type="warning">
          This task is currently active,
          you need to stop it to perform any action.
        </InfoboxComponent>
      </>
    } else {
      return <>
        <button className="button is-warning card-footer-item" data-data={JSON.stringify(task)} onClick={showEditModal}>Edit</button>
        <button className="button is-danger card-footer-item" data-data={JSON.stringify(task)} onClick={showDeleteConfirmModal}>Delete</button>
      </>
    }
  }

  return <>
    <div>
      <div className="field">
        <div className="control">
          <section className="hero">
            <div className="hero-body">
              <p className="title">Tasks</p>
            </div>
          </section>
        </div>
      </div>
      { searchResult.tasks.length ?
        searchResult.tasks.map((task: DBTask, idx: number) =>
          <div key={idx}>
            <div className="card">
              <div className="card-content">
                <div className="media">
                  <div className="media-content">
                    <p className="title is-4">{task.name}</p>
                    <p className="subtitle is-6">{task.project_name}</p>
                  </div>
                </div>
                <div className="content">
                  { task.description.length > 0 ?
                    <Markdown remarkPlugins={[remarkGfm]}>{task.description}</Markdown>
                  : null }
                  <br />
                  <div className="icon-text">
                    <span className="icon has-text-info">
                      <i className="fas fa-calendar"></i>
                    </span>
                    <span>{task.date}</span>
                  </div>
                  <div className="icon-text">
                    <span className="icon has-text-info">
                      <i className="fas fa-clock"></i>
                    </span>
                    <span>{getHMSStringFromSeconds(task.seconds)}</span>
                  </div>
                </div>
              </div>
              <footer className="card-footer">
                <ButtonWrapperComponent task={task} />
              </footer>
            </div>
          </div>
        )
        : <div>No tasks found</div>
      }
    </div>
  </>;
}


const SearchResultsComponent: FC<SearchResultsComponentProps> = ({ activeTasks, searchIn, searchResult, setModal, setSearchResults}) => {
  if (!searchResult) {
    return null;
  }
  const form = searchIn.current.closest('form') as HTMLFormElement;
  const formData = new FormData(form);
  const si = formData.getAll('search_in') as string[];
  return <>
    { si.includes('projects') ? <SearchResultsProjectsComponent activeTasks={activeTasks} setModal={setModal} searchResult={searchResult} setSearchResults={setSearchResults} /> : null }
    { si.includes('task_definitions') ? <SearchResultsTaskDefinitionsComponent activeTasks={activeTasks} setModal={setModal} searchResult={searchResult} setSearchResults={setSearchResults} /> : null }
    { si.includes('tasks') ? <SearchResultsTasksComponent activeTasks={activeTasks} setModal={setModal} searchResult={searchResult} setSearchResults={setSearchResults} /> : null }
  </>;
}

type ComponentProps = {
  activeTasks: ActiveTask[]
}

const Component: FC<ComponentProps> = ({ activeTasks }) => {
  const [searchResult, setSearchResults] = useState<SearchQueryResult>(null);
  const [showLoading, setLoading] = useState<boolean>(false);
  const [modal, setModal] = useState<React.ReactNode>(null);

  const searchRef = useRef<HTMLButtonElement>(null)
  const searchInRef = useRef<HTMLSelectElement>(null)

  // This is by intention on every input element, instead of the form element onChange,
  // because there seems to be a bug, where the onChange does not get triggered after a change
  // on the input element has occured.
  const onInputChange = (e: React.FormEvent<HTMLInputElement | HTMLSelectElement>) => {
    const form = e.currentTarget.closest('form') as HTMLFormElement;
    const isFormValid = form.checkValidity();
    const input = e.currentTarget as HTMLInputElement;
    const icon = input.nextElementSibling?.children[0];
      if (icon) {
        if (input.checkValidity()) {
          icon.classList.remove('has-text-danger');
          icon.classList.remove('fa-xmark');
          icon.classList.add('has-text-success');
          icon.classList.add('fa-check');
        } else {
          icon.classList.remove('has-text-success');
          icon.classList.remove('fa-check');
          icon.classList.add('has-text-danger');
          icon.classList.add('fa-xmark');
        }
      }
    if (!isFormValid) {
      searchRef.current?.setAttribute('disabled', 'disabled');
      searchRef.current?.classList.remove('is-primary');
      searchRef.current?.classList.add('is-danger');
    } else {
      searchRef.current?.removeAttribute('disabled');
      searchRef.current?.classList.add('is-primary');
      searchRef.current?.classList.remove('is-danger');
    }
  }

  const onFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget as HTMLFormElement;
    const isFormValid = form.checkValidity();
    if (!isFormValid) {
      return;
    }
    searchRef.current?.classList.add('is-loading');
    setSearchResults(null);
    setLoading(true);
    const formData = new FormData(form);
    const rawfrom = formData.get('from_date') as string;
    const rawto = formData.get('to_date') as string;
    const from_date = moment(rawfrom).format('YYYY-MM-DD');
    const to_date = moment(rawto).format('YYYY-MM-DD');
    const active_state = formData.get('active_state') as string;
    const project_name = formData.get('project_name') as string;
    const task_name = formData.get('task_name') as string;
    const task_definition_name = formData.get('task_definition_name') as string;
    const task_description = formData.get('task_description') as string;
    const query: SearchQuery = {
      search_in: formData.getAll('search_in') as string[],
      from_date,
      to_date,
      active_state,
      task: {
        project_name,
        task_name,
        task_definition_name,
        task_description,
      }
    };
    const rpcResult = await window.electron.getSearchResult(query);
    setLoading(false);
    setSearchResults(rpcResult);
    searchRef.current?.classList.remove('is-loading');
  }

  return <>
    {modal ? modal : null}
    <section className="section">
      <h1 className="title">Search</h1>
      <h2 className="subtitle">You can export search across tasks and projects.</h2>
      <form className="search-form" onSubmit={onFormSubmit}>
        <div className="fixed-grid has-3-cols">
          <div className="grid">
            <div className="cell">
              <nav className="panel">
                <p className="panel-heading">Query</p>
                <div className="field">
                  <label className="label">Search in</label>
                  <div className="control has-icons-right select is-multiple">
                    <select ref={searchInRef} required onChange={onInputChange} multiple name="search_in">
                      <option value="tasks">Tasks</option>
                      <option value="projects">Projects</option>
                      <option value="task_definitions">Task Definitions</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label className="label">From</label>
                  <div className="control has-icons-right">
                    <input name="from_date" required defaultValue={moment().format('YYYY-MM-DD')} onChange={onInputChange} className="input" type="date" />
                    <span className="icon is-small is-right">
                      <i className="fas fa-check has-text-success"></i>
                    </span>
                  </div>
                </div>
                <div className="field">
                  <label className="label">To</label>
                  <div className="control has-icons-right">
                    <input name="to_date" required defaultValue={moment().format('YYYY-MM-DD')} onChange={onInputChange} className="input" type="date" />
                    <span className="icon is-small is-right">
                      <i className="fas fa-check has-text-success"></i>
                    </span>
                  </div>
                </div>
                <div className="field">
                  <label className="label">Active State</label>
                  <div className="control">
                    <div className="select">
                      <select required onChange={onInputChange} name="active_state">
                        <option value="all">All</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="field">
                  <label className="label">Project Name</label>
                  <div className="control has-icons-right">
                    <input required onChange={onInputChange} name="project_name" defaultValue="*" className="input" type="text" placeholder="Project Name" />
                    <span className="icon is-small is-right">
                      <i className="fas fa-check has-text-success"></i>
                    </span>
                  </div>
                </div>
                <div className="field">
                  <label className="label">Task Name</label>
                  <div className="control has-icons-right">
                    <input required onChange={onInputChange} name="task_name" defaultValue="*" className="input" type="text" placeholder="Task Name" />
                    <span className="icon is-small is-right">
                      <i className="fas fa-check has-text-success"></i>
                    </span>
                  </div>
                </div>
                <div className="field">
                  <label className="label">Task Description</label>
                  <div className="control has-icons-right">
                    <input required onChange={onInputChange} name="task_description" defaultValue="*" className="input" type="text" placeholder="Task Description" />
                    <span className="icon is-small is-right">
                      <i className="fas fa-check has-text-success"></i>
                    </span>
                  </div>
                </div>
                <div className="field">
                  <label className="label">Task Definition Name</label>
                  <div className="control has-icons-right">
                    <input required onChange={onInputChange} name="task_definition_name" defaultValue="*" className="input" type="text" placeholder="Task Definition Name" />
                    <span className="icon is-small is-right">
                      <i className="fas fa-check has-text-success"></i>
                    </span>
                  </div>
                </div>
                <div className="field">
                  <div className="control">
                    <button ref={searchRef} className="button is-primary" type="submit">Search</button>
                  </div>
                </div>
              </nav>
            </div>

            {showLoading ?
              <div className="cell is-col-span-2">
                <nav className="panel">
                  <p className="panel-heading">Loading</p>
                  <div className="field">
                    <LoadingComponent />
                  </div>
                </nav>
              </div>
              : null}

            {searchResult ?
              <div className="cell is-col-span-2">
                <nav className="panel">
                  <p className="panel-heading">Results</p>
                  <div className="field">
                    <SearchResultsComponent
                      activeTasks={activeTasks}
                      setModal={setModal}
                      searchIn={searchInRef}
                      setSearchResults={setSearchResults}
                      searchResult={searchResult} />
                  </div>
                </nav>
              </div>
              : null}

          </div>
        </div>
      </form>
    </section>
  </>;
};

const mapStateToProps = (state: RootState) => {
  return {
    activeTasks: state.activeTasks.value
  }
}
const connected = connect(mapStateToProps)(Component);
export const Search = connected

