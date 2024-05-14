import { FC, useEffect } from 'react';
import { connect } from 'react-redux';
import type { RootState } from './Store'
import { useAppDispatch } from './Store/hooks'
import { removeActiveTask, replaceActiveTasks } from './Store/slices/activeTasks'
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

  useEffect(() => {
    fetchActiveTasks();
  }, []);

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
        name: root.dataset.name,
        project_name: root.dataset.projectName,
        date: root.dataset.date
      }));
      // TODO fix
      // dirty hack to force a reload of the task definitions
      window.location.reload();
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
                      <TimerComponent task={task} countup={task.isActive} />
                    </td>
                    <td>{task.date}</td>
                    <td>
                      <button className="button is-primary is-small" onClick={stopTask}>Stop</button>
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
