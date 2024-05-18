import { FC, useEffect, useRef, useState } from 'react';
import moment from 'moment';
import { connect } from 'react-redux';
import { Datafetcher } from './../lib/Datafetcher';
import type { RootState } from './Store'
import { useAppDispatch, useAppSelector } from './Store/hooks'
import { replaceTask, replaceTasks, appendTask, deleteTask } from './Store/slices/tasks'
import { replaceTaskDefinitions } from './Store/slices/taskDefinitions'
import { setSelectedTask, removeSelectedTask } from './Store/slices/selectedTask'
import { appendActiveTask, replaceActiveTask } from './Store/slices/activeTasks'
import { EditTaskModal } from './EditTaskModal';
import { TimerComponent } from './TimerComponent';
import { TimeInputComponent } from './TimeInputComponent';
import { InfoboxComponent } from './InfoboxComponent';
import clsx from 'clsx';
import { DeleteTaskModal } from './DeleteTaskModal';

type Props = {
  selectedProject: {
    name: string | null
  },
  activeTasks: ActiveTask[],
  tasks: DBTask[]
}

type WrappedTimerComponentProps = {
  task: DBTask
}

const Component: FC<Props> = ({ selectedProject, activeTasks, tasks }) => {
  const dispatch = useAppDispatch();
  const tasksDefinitions = useAppSelector((state) => state.taskDefinitions.value)
  const selectedTask = useAppSelector((state) => state.selectedTask.value)
  const [modal, setModal] = useState(null)
  const useModalEditRef = useRef(null)

  const WrappedTimerComponent: FC<WrappedTimerComponentProps> = ({ task }) => {
    const activeTask = activeTasks.find((at) => at.name === task.name && at.project_name === task.project_name && at.date === task.date)
    if (activeTask) {
      return (
        <div>Task is running</div>
      )
    } else {
      return <TimerComponent task={task} />
    }
  }

  const onFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const task = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      project_name: selectedProject.name as string,
      seconds: parseInt(formData.get('seconds') as string),
      date: moment().local().format('YYYY-MM-DD')
    }
    const rpcResult = await window.electron.addTask({
      name: task.name,
      description: task.description,
      project_name: task.project_name,
      seconds: task.seconds,
    })
    if (rpcResult.success) {
      dispatch(appendTask(task))
    }
  }

  const onTaskStartClick = async (evt: React.MouseEvent) => {
    evt.preventDefault();
    // TODO we have this kind of .find often, maybe we can refactor it
    // and find a better way to reuse it
    const task = tasks.find((t) => t.name === selectedTask.name && t.project_name === selectedTask.project_name && t.date === selectedTask.date)
    if (task) {
      const rpcResult = await window.electron.startActiveTask({
        name: task.name,
        project_name: task.project_name,
        description: task.description,
        date: task.date,
        seconds: task.seconds
      })
      if (rpcResult.success) {
        dispatch(appendActiveTask({
          name: task.name,
          project_name: task.project_name,
          description: task.description,
          date: task.date,
          seconds: task.seconds,
          isActive: true
        }))
      }
    }
  }

  const onTaskEditCallback = async () => {
    setModal(null)
  }

  const onTaskEditClick = async (evt: React.MouseEvent) => {
    evt.preventDefault();
    const task = tasks.find((t) => t.name === selectedTask.name && t.project_name === selectedTask.project_name && t.date === selectedTask.date)
    if (task) {
      setModal(<EditTaskModal callback={onTaskEditCallback} task={task} />)
    }
  }

  const onTaskDeleteCallback = async (status: boolean) => {
    if (status) {
      dispatch(removeSelectedTask());
    }
    setModal(null)
  }

  const onTaskDeleteClick = async (evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.preventDefault();
    const task = JSON.parse(evt.currentTarget.dataset.data as string);
    setModal(<DeleteTaskModal task={task} callback={onTaskDeleteCallback} />)
  }

  const fetchTaskDefinitions = async () => {
    if (!selectedProject.name) return;
    const td = await Datafetcher.getTaskDefinitions(selectedProject.name);
    dispatch(replaceTaskDefinitions(td))
  }

  const fetchTasks = async () => {
    if (!selectedProject.name) return;
    const t = await Datafetcher.getTasksToday(selectedProject.name);
    dispatch(replaceTasks(t))
  }

  const onTaskSelect = async (evt: React.MouseEvent) => {
    const target = evt.target as HTMLDivElement
    const root = target.closest('[data-name]') as HTMLDivElement
    const name = root.dataset.name as string
    dispatch(setSelectedTask({
      name: name,
      seconds: parseInt(root.dataset.seconds as string, 10),
      project_name: root.dataset.projectName as string,
      date: root.dataset.date as string
    }))
  }

  const ButtonWrapperComponent: FC = () => {
    const activeTask = activeTasks.find((at) => at.name === selectedTask.name && at.project_name === selectedTask.project_name && at.date === selectedTask.date)
    if (activeTask) {
      return <>
        <InfoboxComponent title="Warning" type="warning">
          Task is currently active,
          you need to stop it to perform a delete action.
        </InfoboxComponent>
        <button className="button is-warning m-1" onClick={onTaskEditClick}>Edit</button>
      </>
    } else {
      return <>
        <button className="button is-primary m-1" onClick={onTaskStartClick}>Start</button>
        <button className="button is-warning m-1" onClick={onTaskEditClick}>Edit</button>
        <button className="button is-danger m-1" data-data={JSON.stringify(selectedTask)} onClick={onTaskDeleteClick}>Delete</button>
      </>
    }
  }

  useEffect(() => {
    fetchTaskDefinitions();
    fetchTasks();
  }, [selectedProject])

  const emptyDummyTask: DBTask = {
    name: "",
    description: "",
    project_name: "",
    seconds: 0,
    date: ""
  }

  if (tasksDefinitions.length) {
    return <>
      {modal}
      <section className="section">
        <h1 className="title">Tasks</h1>
        <h2 className="subtitle">All available Tasks for a given project</h2>
        <div className="fixed-grid has-3-cols">
          <div className="grid">
            <div className="cell">
              <nav className="panel">
                <p className="panel-heading">New</p>
                <form onSubmit={onFormSubmit} className="p-4">
                  <div className="field">
                    <label className="label">Task Defintion</label>
                    <div className="control">
                      <div className="select">
                        <select name="name">
                          {tasksDefinitions.map((td, idx: number) => <option key={idx}>{td.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="field">
                    <label className="label">Task Description</label>
                    <div className="control">
                      <textarea name="description" className="textarea" placeholder="Task Description"></textarea>
                    </div>
                  </div>
                  <div className="field">
                    <label className="label">Task Duration</label>
                    <div className="control">
                      <TimeInputComponent task={emptyDummyTask} />
                    </div>
                  </div>
                  <div className="field">
                    <div className="control">
                      <button className="button is-primary" type="submit">Add Task</button>
                    </div>
                  </div>
                </form>
              </nav>
            </div>

            {tasks.length ?
              <div className="cell">
                <nav className="panel">
                  <p className="panel-heading">Today</p>
                  <div data-tasks-list>
                    {tasks.map((task, idx: number) => {
                      return <div className={clsx('p-4', 'tasklist-item', (task.name === selectedTask.name && task.project_name === selectedTask.project_name && task.date === selectedTask.date ? 'is-active': null))} key={idx} data-name={task.name} data-description={task.description} data-seconds={task.seconds} data-project-name={task.project_name} data-date={task.date} onClick={onTaskSelect}>
                        <div className="columns">
                          <div className="column">
                            <p className="bd-notification">{task.name}</p>
                            <div className="columns is-mobile">
                              <div className="column">
                                <WrappedTimerComponent task={task} />
                              </div>
                              <div className="column">
                                <p className="bd-notification">{task.date}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    })}
                  </div>
                </nav>
              </div>
            : null}

            { selectedTask.name !== null ?
              <div data-task-actions-container className="cell">
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
    </>;
  } else {
    return null;
  }
};

const mapStateToProps = (state: RootState) => {
  return {
    selectedProject: state.selectedProject.value,
    activeTasks: state.activeTasks.value,
    tasks: state.tasks.value
  }
}
const connected = connect(mapStateToProps)(Component);
export const Tasks = connected

