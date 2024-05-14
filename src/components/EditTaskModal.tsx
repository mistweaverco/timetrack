import React, { FC } from 'react';
import { connect } from 'react-redux';
import { RootState } from './Store';
import { TimeInputComponent } from './TimeInputComponent';

interface BaseLayoutProps {
  activeTasks: ActiveTask[];
  task: DBTask;
  useRef: React.RefObject<HTMLDivElement>;
  callback: (status: boolean) => void;
}

const Component: FC<BaseLayoutProps> = ({ activeTasks, callback, task, useRef }) => {
  const onEditButtonClick = (evt: React.MouseEvent) => {
    evt.preventDefault();
    if (callback) {
      callback(true);
    }
  }

  const onCancelButtonClick = (evt: React.MouseEvent) => {
    evt.preventDefault();
    if (callback) {
      callback(false);
    }
  }

  const activeTask = activeTasks.find(t => t.name === task.name && t.date === task.date && t.project_name === task.project_name)

  return <>
    <div className="modal is-active" ref={useRef}>
      <div className="modal-background"></div>
      <div className="modal-card">
          <form>
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
                    <article className="message is-warning">
                      <div className="message-header">
                        <p>Warning</p>
                      </div>
                      <div className="message-body">
                        Editing the <strong>duration</strong> of an <strong>active task</strong> is not allowed.
                        You can stop the task first, and then edit the duration.
                      </div>
                      <div className="control is-loading">
                        <input type="hidden" name="seconds" defaultValue={activeTask.seconds} />
                        <input className="input" disabled defaultValue={activeTask.seconds} />
                      </div>
                    </article>
                    : <TimeInputComponent task={task} />
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

