import React, { FC } from 'react';
import { connect } from 'react-redux';
import { RootState } from './Store';
import { TimeInputComponent } from './TimeInputComponent';
import { InfoboxComponent } from './InfoboxComponent';

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

