import { FC, useEffect } from 'react';
import { connect } from 'react-redux';
import type { RootState } from './Store'
import { useAppDispatch } from './Store/hooks'
import { removeActiveTask, replaceActiveTasks, replaceActiveTask, pauseActiveTask } from './Store/slices/activeTasks'
import { replaceTask } from './Store/slices/tasks'
import { TimerComponent } from './TimerComponent';

interface BaseLayoutProps {
  activeTasks: ActiveTask[]
}

const Component: FC<BaseLayoutProps> = ({ activeTasks }) => {
  const dispatch = useAppDispatch();

  const fetchActiveTasks = async () => {
    const rpcResult = await window.electron.getActiveTasks();
    if (rpcResult && rpcResult.length) {
      dispatch(replaceActiveTasks(rpcResult));
    }
  }

  const onVisibilityChange = () => {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        // restoring from background
        // possible throttling of the UI might have happened
        // fetch active tasks again from backend
        fetchActiveTasks();
      }
    });
  }

  useEffect(() => {
    fetchActiveTasks();
    onVisibilityChange()
  }, []);

  const startTask = async (evt: React.MouseEvent) => {
    evt.preventDefault();
    const target = evt.target as HTMLButtonElement;
    const root = target.closest('tr');
    const rpcResult = await window.electron.startActiveTask({
      project_name: root.dataset.projectName,
      name: root.dataset.name,
      date: root.dataset.date,
      seconds: parseInt(root.dataset.seconds, 10),
      description: root.dataset.description,
    });
    if (rpcResult.success) {
      dispatch(replaceActiveTask({
        oldname: rpcResult.name,
        name: rpcResult.name,
        description: rpcResult.description,
        project_name: rpcResult.project_name,
        date: rpcResult.date,
        seconds: rpcResult.seconds,
        isActive: true,
      }));
    }
  }
  const stopTask = async (evt: React.MouseEvent) => {
    evt.preventDefault();
    const target = evt.target as HTMLButtonElement;
    const root = target.closest('tr');
    const rpcResult = await window.electron.stopActiveTask({
      project_name: root.dataset.projectName,
      name: root.dataset.name,
      date: root.dataset.date
    });
    if (rpcResult.success) {
      dispatch(removeActiveTask({
        name: rpcResult.name,
        project_name: rpcResult.project_name,
        date: rpcResult.date,
      }));
      dispatch(replaceTask({
        name: rpcResult.name,
        oldname: rpcResult.name,
        project_name: rpcResult.project_name,
        date: rpcResult.date,
        seconds: rpcResult.seconds,
        description: root.dataset.description,
      }));
    }
  }

  const pauseTask = async (evt: React.MouseEvent) => {
    evt.preventDefault();
    const target = evt.target as HTMLButtonElement;
    const root = target.closest('tr');
    const rpcResult = await window.electron.pauseActiveTask({
      project_name: root.dataset.projectName,
      name: root.dataset.name,
      description: root.dataset.description,
      date: root.dataset.date,
      seconds: parseInt(root.dataset.seconds, 10),
    });
    if (rpcResult.success) {
      dispatch(pauseActiveTask({
        name: root.dataset.name,
        project_name: root.dataset.projectName,
        date: root.dataset.date
      }));
    }
  }

  return <>
    { activeTasks.length ?
      <section className="section">
        <nav className="panel">
          <p className="panel-heading">Active Tasks</p>
          <div className="panel-block">
            <table className="table is-fullwidth">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Task Name</th>
                  <th>Task Elapsed</th>
                  <th>Task Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeTasks.map((task, idx: number) => {
                  return <tr key={idx}
                    data-project-name={task.project_name}
                    data-name={task.name}
                    data-description={task.description}
                    data-seconds={task.seconds}
                    data-active={task.isActive}
                    data-date={task.date}
                  >
                    <td>{task.project_name}</td>
                    <td>{task.name}</td>
                    <td>
                      <TimerComponent task={task} />
                    </td>
                    <td>{task.date}</td>
                    <td>
                      { task.isActive ?
                        <button className="button is-warning is-small m-1" onClick={pauseTask}>Pause</button>
                        : <button className="button is-success is-small m-1" onClick={startTask}>Resume</button>
                      }
                      <button className="button is-danger is-small m-1" onClick={stopTask}>Stop</button>
                    </td>
                  </tr>
                })}
              </tbody>
            </table>
          </div>
        </nav>
      </section>
      : null }
  </>;
};

const mapStateToProps = (state: RootState) => {
  return { activeTasks: state.activeTasks.value }
}
const connected = connect(mapStateToProps)(Component);
export const ActiveTasks = connected
