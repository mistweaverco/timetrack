import { FC } from 'react';
import { ModalComponent } from './ModalComponent'
import { useAppDispatch } from './Store/hooks'
import { removeTaskDefinition } from './Store/slices/taskDefinitions'
import { InfoboxComponent } from './InfoboxComponent';
import { deleteTask } from './Store/slices/tasks';
import { removeSelectedTaskDefinition } from './Store/slices/selectedTaskDefinition';
import { removeSelectedTask } from './Store/slices/selectedTask';
import { removeSelectedProject } from './Store/slices/selectedProject';

// TODO: Make sure that task definitions are either not deleted when a task is active that belongs to them,
// or we need to make sure that the task is removed as well
// ---
// Don't get this wrong, it is in fact removed by the db function,
// but if it is currently running, it will be present in the "backend" and will cause issues.

type Props = {
  taskDefinition: DBTaskDefinition
  callback?: (status: boolean) => void
}

const Component: FC<Props> = ({ taskDefinition, callback }) => {
  const dispatch = useAppDispatch();

  const confirmCallback = async (evt: React.MouseEvent) => {
    evt.preventDefault();

    // we need to first fetch the tasks that are using this task definition
    // and remove them (in the redux store)
    // then we can remove the task definition
    // this is because the task definition name is used as a foreign key in the tasks table
    const rpcTasks = await window.electron.getTasksByNameAndProject({
      name: taskDefinition.name,
      project_name: taskDefinition.project_name
    })

    const rpcResult = await window.electron.deleteTaskDefinition(taskDefinition);

    if (rpcResult.success) {
      dispatch(removeTaskDefinition(taskDefinition));
      // this is not really necessary, but I might fix it later
      dispatch(removeSelectedProject());
      // these are necessary
      dispatch(removeSelectedTask());
      dispatch(removeSelectedTaskDefinition());
      rpcTasks.forEach((task: DBTask) => {
        dispatch(deleteTask({
          name: task.name,
          project_name: task.project_name,
          date: task.date
        }));
      });
      callback && callback(true);
    }
  };

  const cancelCallback = async (evt: React.MouseEvent) => {
    evt.preventDefault();
    callback && callback(false);
  };

  return ModalComponent({
    title: 'Delete Task Definition',
    children: <>
      <InfoboxComponent type="danger" title="Warning">
        <p>Deleting a task definition is a hazardious action.</p>
        <p>If you delete a task definition, it'll also delete all its tasks.</p>
        <p>Maybe consider marking it as inactive?</p>
      </InfoboxComponent>
      <p>Are you sure you want to delete this task definition?</p>
    </>,
    buttons: <>
      <button className="button is-danger" onClick={confirmCallback}>Yes</button>
      <button className="button is-primary" onClick={cancelCallback}>No</button>
    </>
  });
}

export const DeleteTaskDefinitionModal = Component;
