import { FC, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from './Store/hooks'
import { replaceProject, replaceProjects, appendProject, deleteProject } from './Store/slices/projects'
import { setSelectedProject, removeSelectedProject } from './Store/slices/selectedProject'
import { removeSelectedTaskDefinition } from './Store/slices/selectedTaskDefinition'
import { Datafetcher } from './../lib/Datafetcher';
import { removeActiveClassnameProjects, removeActiveClassnameTaskDefinitions } from './../lib/Utils';
import { ModalConfirm } from './ModalConfirm';
import { EditProjectModal } from './EditProjectModal';

export const Projects: FC = () => {
  const dispatch = useAppDispatch();
  const projects = useAppSelector((state) => state.projects.value)
  const selectedProject = useAppSelector((state) => state.selectedProject.value)
  const [useModalConfirm, setModalConfirm] = useState(null)
  const [useModalEdit, setModalEdit] = useState(null)
  const useModalEditRef = useRef(null)

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
    removeActiveClassnameProjects();
    removeActiveClassnameTaskDefinitions();
    dispatch(removeSelectedTaskDefinition())
    dispatch(setSelectedProject({ name: name }))
    root.classList.add('is-active');
  }

  const onConfirmCallback = async (status: boolean) => {
    if (status) {
      const project = projects.find((p) => p.name === selectedProject.name)
      if (project) {
        const rpcResult = await window.electron.deleteProject(project.name)
        if (rpcResult.success) {
          dispatch(deleteProject({ name: selectedProject.name }));
          dispatch(removeSelectedProject());
        }
      }
    }
    setModalConfirm(null)
  }

  const onDeleteButtonClick = async (evt: React.MouseEvent) => {
    evt.preventDefault();
    setModalConfirm(<ModalConfirm message="Are you sure you want to delete this project?" callback={onConfirmCallback} />)
  }

  const onEditProjectCallback = async (status: boolean) => {
    if (status) {
      const form = useModalEditRef.current.querySelector('form') as HTMLFormElement;
      const formData = new FormData(form);
      const oldname = formData.get("oldname") as string
      const name = formData.get("name") as string
      const rpcResult = await window.electron.editProject({ oldname, name })
      if (rpcResult.success) {
        dispatch(replaceProject({ name, oldname }));
        dispatch(setSelectedProject({ name: name }));
      }
    }
    setModalEdit(null)
  }

  const onEditButtonClick = async (evt: React.MouseEvent) => {
    evt.preventDefault();
    setModalEdit(<EditProjectModal useRef={useModalEditRef} name={selectedProject.name} callback={onEditProjectCallback} />)
  }

  const fetchProjects = async () => {
    const ps = await Datafetcher.getProjects();
    dispatch(replaceProjects(ps))
  }

  useEffect(() => {
    fetchProjects();
  }, [])

  return <>
    {useModalConfirm}
    {useModalEdit}
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
              <div data-projects-list>
                {projects.map((project, idx: number) => (
                  <div key={idx} className="panel-block" data-idx={idx} data-name={project.name} onClick={onProjectSelect}>
                    <span className="panel-icon">
                      <i className="fas fa-book" aria-hidden="true"></i>
                    </span>
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
                    <button className="button is-warning m-1" onClick={onEditButtonClick}>Edit</button>
                    <button className="button is-danger m-1" onClick={onDeleteButtonClick}>Delete</button>
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
