import React, { FC, ReactNode, useRef } from 'react';
import { useAppDispatch } from './Store/hooks';
import { replaceTask } from './Store/slices/tasks';
import { replaceTaskDefinition } from './Store/slices/taskDefinitions';
import { removeSelectedTask } from './Store/slices/selectedTask';
import { removeSelectedTaskDefinition } from './Store/slices/selectedTaskDefinition';

// TODO: Make sure that task definitions are either not updated when a task is active that belongs to them,
// or we need to make sure that the task is updated as well

interface BaseLayoutProps {
  children?: ReactNode;
  taskDefinition: DBTaskDefinition;
  callback?: (status: boolean, editedTaskDefinitionData?: DBTaskDefinition) => void;
}

export const EditTaskDefinitionModal: FC<BaseLayoutProps> = ({ callback, taskDefinition }) => {
  const ref = useRef<HTMLFormElement>(null)
  const dispatch = useAppDispatch();

  const onEditButtonClick = async (evt: React.MouseEvent) => {
    evt.preventDefault();
    const form = ref.current;
    const formData = new FormData(form);
    const oldname = taskDefinition.name
    const name = formData.get("name") as string
    const project_name = taskDefinition.project_name

    // we need to first fetch the tasks that are using this task definition
    // and update them with the new name (in the redux store)
    // then we can update the task definition name
    // this is because the task definition name is used as a foreign key in the tasks table
    const rpcTasks = await window.electron.getTasksByNameAndProject({
      name: oldname,
      project_name
    })

    const rpcResult = await window.electron.editTaskDefinition({
      oldname: oldname,
      name: name,
      project_name
    })

    if (rpcResult.success) {
      dispatch(replaceTaskDefinition({
        name, oldname, project_name: project_name
      }));

      rpcTasks.forEach((task: DBTask) => {
        dispatch(replaceTask({
          name,
          oldname,
          project_name,
          description: task.description,
          seconds: task.seconds,
          date: task.date
        }));
      });

      // we also need to unset the selections
      // it's up to the callback to decide if it wants to set the new selection
      dispatch(removeSelectedTask());
      dispatch(removeSelectedTaskDefinition());
    }
    callback && callback(true, { name, project_name });
  }

  const onCancelButtonClick = (evt: React.MouseEvent) => {
    evt.preventDefault();
    callback && callback(false);
  }

  return <>
    <div className="modal is-active">
      <div className="modal-background"></div>
      <div className="modal-card">
        <form ref={ref}>
          <header className="modal-card-head">
            <p className="modal-card-title">Edit Task Definition</p>
          </header>
          <section className="modal-card-body">
            <div className="field">
              <label className="label">Task Definition Name</label>
              <div className="control">
                <input className="input" name="name" required defaultValue={taskDefinition.name} type="text" placeholder="Task Definition Name" />
              </div>
            </div>
          </section>
          <footer className="modal-card-foot">
            <div data-buttons className="buttons">
              <button className="button is-warning" onClick={onEditButtonClick}>Edit</button>
              <button className="button" onClick={onCancelButtonClick}>Cancel</button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  </>;
};

