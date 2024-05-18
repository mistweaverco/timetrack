import { FC, useState, useRef } from 'react';
import { connect } from 'react-redux';
import { RootState } from './Store';
import { removeActiveClassnameTaskDefinitions } from './../lib/Utils';
import { ModalConfirm } from './ModalConfirm';
import { useAppDispatch, useAppSelector } from './Store/hooks'
import { removeTaskDefinition, appendTaskDefinition, replaceTaskDefinition } from './Store/slices/taskDefinitions'
import { setSelectedTaskDefinition, removeSelectedTaskDefinition } from './Store/slices/selectedTaskDefinition'
import { EditTaskDefinitionModal } from './EditTaskDefinitionModal';
import clsx from 'clsx';

type Props = {
  taskDefinitions: DBTaskDefinition[]
  activeTasks: ActiveTask[]
  selectedProject: DBProject
}

const Component: FC<Props> = ({ activeTasks, selectedProject, taskDefinitions }) => {
  const dispatch = useAppDispatch();
  const selectedTaskDefinition = useAppSelector((state) => state.selectedTaskDefinition.value)
  const [modal, setModal] = useState(null)

  const onFormSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    const form = evt.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get("name") as string
    const project_name = selectedProject.name
    const rpcResult = await window.electron.addTaskDefinition({
      name,
      project_name
    })
    if (rpcResult.success) {
      dispatch(appendTaskDefinition({ name, project_name: project_name }));
    }
  }

  const onEditCallback = async (status: boolean, data: DBTaskDefinition) => {
    if (status) {
      dispatch(setSelectedTaskDefinition({ name: data.name, project_name: data.project_name }));
    }
    setModal(null)
  }

  const onEditButtonClick = async (evt: React.MouseEvent) => {
    evt.preventDefault();
    setModal(<EditTaskDefinitionModal taskDefinition={selectedTaskDefinition} callback={onEditCallback} />)
  }

  const onModalConfirmCallback = async (status: boolean) => {
    if (status) {
      const taskDefinition = taskDefinitions.find((td) => td.name === selectedTaskDefinition.name)
      if (taskDefinition) {
        const rpcResult = await window.electron.deleteTaskDefinition({
          name: taskDefinition.name,
          project_name: taskDefinition.project_name
        })
        if (rpcResult.success) {
          dispatch(removeTaskDefinition({
            name: selectedTaskDefinition.name,
            project_name: taskDefinition.project_name
          }));
          dispatch(removeSelectedTaskDefinition());
          // TODO fix
          // dirty hack to force a reload of the task definitions
          window.location.reload();
        }
      }
    }
    setModal(null)
  }

  const onDeleteButtonClick = async (evt: React.MouseEvent) => {
    evt.preventDefault();
    setModal(<ModalConfirm message="Are you sure you want to delete this task definition?" callback={onModalConfirmCallback} />)
  }

  const onTaskDefintionSelect = async (evt: React.MouseEvent) => {
    evt.preventDefault();
    const target = evt.target as HTMLDivElement
    const root = target.closest('[data-name]') as HTMLDivElement
    const name = root.dataset.name as string
    const project_name = root.dataset.projectName as string
    dispatch(setSelectedTaskDefinition({ name, project_name }))
  }

  const ButtonWrapperComponent: FC = () => {
    const activeTask = activeTasks.find((at) => at.name === selectedTaskDefinition.name && at.project_name === selectedTaskDefinition.project_name)
    if (activeTask) {
      return <>
        <article className="message is-warning">
          <div className="message-header">
            <p>Warning</p>
          </div>
          <div className="message-body">
            Task is currently active, please stop it before deleting or editing.
          </div>
        </article>
      </>
    } else {
      return <>
        <button className="button is-warning m-1" onClick={onEditButtonClick}>Edit</button>
        <button className="button is-danger m-1" onClick={onDeleteButtonClick}>Delete</button>
      </>
    }
  }

  return <>
    {modal}
    {selectedProject.name ?
      <section className="section" data-taskdef-section>
        <h1 className="title">Tasksdefinitions</h1>
        <h2 className="subtitle">All available Tasksdefs for a given project</h2>
          <div className="fixed-grid has-3-cols">
            <div className="grid">
              <div className="cell">
                <nav className="panel">
                  <p className="panel-heading">New</p>
                  <form onSubmit={onFormSubmit} className="p-4">
                    <div className="field">
                      <label className="label">Taskdef Name</label>
                      <div className="control">
                        <input name="name" className="input" type="text" placeholder="Taskdef Name" />
                      </div>
                    </div>
                    <div className="field">
                      <div className="control">
                        <button className="button is-primary" type="submit">Add Taskdef</button>
                      </div>
                    </div>
                  </form>
                </nav>
              </div>

            { taskDefinitions.length ?
              <div className="cell">
                <nav className="panel">
                  <p className="panel-heading">Available</p>
                  <div>
                    { taskDefinitions.map((taskdef, idx: number) => (
                      <div key={idx} onClick={onTaskDefintionSelect} className={clsx('panel-block', (taskdef.name === selectedTaskDefinition.name && taskdef.project_name && selectedTaskDefinition.project_name ? 'is-active' : null))} data-idx={idx} data-project-name={taskdef.project_name} data-name={taskdef.name}>
                        <span className="panel-icon">
                          <i className="fas fa-book" aria-hidden="true"></i>
                        </span>
                        <p className="bd-notification is-info">{taskdef.name}</p>
                      </div>
                    )) }
                  </div>
                </nav>
              </div>
            : null }

            { selectedTaskDefinition.name ?
              <div data-taskdef-actions-container className="cell">
                <nav className="panel">
                  <p className="panel-heading">Actions</p>
                  <form data-buttons className="p-4">
                    <div className="field">
                      <div data-buttons className="control">
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
    : null }
  </>;
};

const mapStateToProps = (state: RootState) => {
  return {
    taskDefinitions: state.taskDefinitions.value,
    selectedProject: state.selectedProject.value,
    activeTasks: state.activeTasks.value
  }
}
const connected = connect(mapStateToProps)(Component);
export const TaskDefinitions = connected

