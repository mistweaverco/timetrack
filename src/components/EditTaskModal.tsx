import React, { FC, useRef } from 'react';
import { connect } from 'react-redux';
import { RootState } from './Store';
import { TimeInputComponent } from './TimeInputComponent';
import { InfoboxComponent } from './InfoboxComponent';
import { useAppDispatch } from './Store/hooks';
import { replaceActiveTask } from './Store/slices/activeTasks';
import { replaceTask } from './Store/slices/tasks';

interface BaseLayoutProps {
  activeTasks: ActiveTask[];
  task: DBTask;
  callback?: (status: boolean, editedTaskData?: DBTask) => void;
}

const Component: FC<BaseLayoutProps> = ({ activeTasks, callback, task }) => {
  const ref = useRef<HTMLFormElement>(null)
  const dispatch = useAppDispatch();

  const onEditButtonClick = async (evt: React.MouseEvent) => {
    evt.preventDefault();
    const form = ref.current;
    const formData = new FormData(form);
    const description = formData.get("description") as string
    const seconds = formData.get("seconds") as string

    const rpcResult = await window.electron.editTask({
      name: task.name,
      description,
      project_name: task.project_name,
      seconds: parseInt(seconds, 10),
      date: task.date
    })

    if (rpcResult.success) {
      const activeTask = activeTasks.find((at) => at.name === task.name && at.project_name === task.project_name && at.date === task.date)
      if (activeTask) {
        dispatch(replaceActiveTask({
          name: rpcResult.name,
          oldname: rpcResult.name,
          project_name: rpcResult.project_name,
          description: rpcResult.description,
          date: rpcResult.date,
          seconds: rpcResult.seconds,
          isActive: activeTask.isActive
        }))
      }
      dispatch(replaceTask({
        name: rpcResult.name,
        oldname: rpcResult.name,
        seconds: rpcResult.seconds,
        project_name: rpcResult.project_name,
        date: rpcResult.date,
        description: rpcResult.description,
      }))
    }

    callback && callback(true, {
      name: task.name,
      project_name: task.project_name,
      description,
      seconds: parseInt(seconds),
      date: task.date
    })
  }

  const onCancelButtonClick = (evt: React.MouseEvent) => {
    evt.preventDefault();
    callback && callback(false)
  }

  const activeTask = activeTasks.find(t => t.name === task.name && t.date === task.date && t.project_name === task.project_name)

  return <>
    <div className="modal is-active">
      <div className="modal-background"></div>
      <div className="modal-card">
          <form ref={ref}>
            <header className="modal-card-head">
              <p className="modal-card-title">Edit Task</p>
            </header>
            <section className="modal-card-body">
              <div className="field">
                <label className="label">Task Description</label>
                <div className="control">
                  <textarea name="description" className="textarea" placeholder="Task Description" defaultValue={task.description}></textarea>
                </div>
              </div>
              <div className="field">
                <label className="label">Task Duration</label>
                <div className="control">
                  { (activeTask !== undefined) ?
                    <>
                      <InfoboxComponent title="Warning" type="warning" collapsed={true}>
                        Editing the <strong>duration</strong> of an <strong>active task</strong> is not allowed.
                        You can stop the task first, and then edit the duration.
                      </InfoboxComponent>
                      <TimeInputComponent task={activeTask} />
                    </>
                    : <TimeInputComponent task={task} addUpHours={true} />
                }
                </div>
              </div>
            </section>
            <footer className="modal-card-foot">
              <div data-buttons className="buttons">
                <button type="submit" className="button is-warning" onClick={onEditButtonClick}>Edit</button>
                <button className="button" onClick={onCancelButtonClick}>Cancel</button>
              </div>
            </footer>
          </form>
      </div>
    </div>
  </>;
};

const mapStateToProps = (state: RootState) => {
  return {
    activeTasks: state.activeTasks.value
  }
}
const connected = connect(mapStateToProps)(Component);
export const EditTaskModal = connected

