import { FC, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from './Store/hooks'
import { replaceProjects, appendProject } from './Store/slices/projects'
import { setSelectedProject, removeSelectedProject } from './Store/slices/selectedProject'
import { removeSelectedTaskDefinition } from './Store/slices/selectedTaskDefinition'
import { removeSelectedTask } from './Store/slices/selectedTask'
import { Datafetcher } from './../lib/Datafetcher';
import { DeleteProjectModal } from './DeleteProjectModal';
import { EditProjectModal } from './EditProjectModal';
import { InfoboxComponent } from './InfoboxComponent';
import clsx from 'clsx';
import { RootState } from './Store';
import { connect } from 'react-redux';

type Props = {
  activeTasks: ActiveTask[],
}


export const Component: FC<Props> = ({ activeTasks }) => {
  const dispatch = useAppDispatch();
  const projects = useAppSelector((state) => state.projects.value)
  const selectedProject = useAppSelector((state) => state.selectedProject.value)
  const [useModal, setModal] = useState<React.ReactNode>(null)

  const onFormSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    const form = evt.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get("name") as string
    const rpcResult = await window.electron.addProject(name)
    if (rpcResult.success) {
      dispatch(appendProject({ name }));
    }
  }

  const onProjectSelect = async (evt: React.MouseEvent) => {
    const target = evt.target as HTMLDivElement
    const root = target.closest('[data-name]') as HTMLDivElement
    const name = root.dataset.name as string
    dispatch(removeSelectedTask())
    dispatch(removeSelectedTaskDefinition())
    dispatch(setSelectedProject({ name: name }))
  }

  const onConfirmCallback = async (status: boolean) => {
    if (status) {
      const project = projects.find((p) => p.name === selectedProject.name)
      if (project) {
        dispatch(removeSelectedProject());
      }
    }
    setModal(null)
  }

  const onDeleteButtonClick = async (evt: React.MouseEvent) => {
    evt.preventDefault();
    setModal(<DeleteProjectModal project={selectedProject} callback={onConfirmCallback} />)
  }

  const onEditProjectCallback = async (status: boolean, editedProjectData: DBProject) => {
    if (status) {
      dispatch(setSelectedProject({ name: editedProjectData.name }));
    }
    setModal(null)
  }

  const onEditButtonClick = async (evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.preventDefault();
    // TODO - fix this - this is a problem when there is an associated task or task definition
    // active and we edit the project name ... we need to update the selected project name
    // in the redux store, but we also need to update the active tasks in the backend ...
    const data = JSON.parse(evt.currentTarget.dataset.data as string) as DBProject
    setModal(<EditProjectModal  project={data} callback={(status, data) => onEditProjectCallback(status, data)} />)
  }

  const fetchProjects = async () => {
    const ps = await Datafetcher.getProjects();
    dispatch(replaceProjects(ps))
  }

  const ButtonWrapperComponent: FC = () => {
    const activeTask = activeTasks.find((at) => at.project_name === selectedProject.name)
    if (activeTask) {
      return <>
        <InfoboxComponent title="Warning" type="warning">
          A task belonging to this project is currently active,
          you need to stop it to perform any action.
        </InfoboxComponent>
      </>
    } else {
      return <>
        <button className="button is-warning m-1" data-data={JSON.stringify(selectedProject)} onClick={onEditButtonClick}>Edit</button>
        <button className="button is-danger m-1" data-data={JSON.stringify(selectedProject)} onClick={onDeleteButtonClick}>Delete</button>
      </>
    }
  }


  useEffect(() => {
    fetchProjects();
  }, [])

  return <>
    {useModal}
    <section className="section">
      <h1 className="title">Projects</h1>
      <h2 className="subtitle">All available projects</h2>
      <div className="fixed-grid has-3-cols">
        <div className="grid">
          <div className="cell">
            <nav className="panel">
              <p className="panel-heading">New</p>
              <form className="p-4" onSubmit={onFormSubmit}>
                <div className="field">
                  <label className="label">Project Name</label>
                  <div className="control">
                    <input name="name" className="input" type="text" placeholder="Project Name" />
                  </div>
                </div>
                <div className="field">
                  <div className="control">
                    <button className="button is-primary" type="submit">Add Project</button>
                  </div>
                </div>
              </form>
            </nav>
          </div>
          <div className="cell">
            <nav className="panel">
              <p className="panel-heading">Available</p>
              <div>
                {projects.map((project, idx: number) => (
                  <div key={idx} className={clsx('panel-block', (project.name === selectedProject.name ? 'is-active' : null))} data-idx={idx} data-name={project.name} onClick={onProjectSelect}>
                    <p data-project-item-header className="bd-notification is-info">{project.name}</p>
                  </div>
                ))}
              </div>
            </nav>
          </div>
          {selectedProject.name !== null ?
          <div data-project-actions-container className="cell">
            <nav className="panel">
              <p className="panel-heading">Actions</p>
              <form data-buttons className="p-4">
                <div className="field">
                  <div className="control">
                    <ButtonWrapperComponent />
                  </div>
                </div>
              </form>
            </nav>
          </div>
        : null }
        </div>
      </div>
    </section>
  </>;
};

const mapStateToProps = (state: RootState) => {
  return {
    activeTasks: state.activeTasks.value,
  }
}

const connected = connect(mapStateToProps)(Component);
export const Projects = connected

