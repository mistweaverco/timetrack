import { FC } from 'react';
import { ModalComponent } from './ModalComponent'
import { useAppDispatch } from './Store/hooks'
import { deleteTask } from './Store/slices/tasks'

type Props = {
  task: DBTask
  callback?: (status: boolean) => void
}

const Component: FC<Props> = ({ task, callback }) => {
  const dispatch = useAppDispatch();

  const confirmCallback = async (evt: React.MouseEvent) => {
    evt.preventDefault();
    const rpcResult = await window.electron.deleteTask(task);
    if (rpcResult.success) {
      dispatch(deleteTask(task));
      callback && callback(true);
    }
  };

  const cancelCallback = async (evt: React.MouseEvent) => {
    evt.preventDefault();
    callback && callback(false);
  };

  return ModalComponent({
    title: 'Delete Task',
    children: <>
      <p>Are you sure you want to delete this task</p>
    </>,
    buttons: <>
      <button className="button is-danger" onClick={confirmCallback}>Yes</button>
      <button className="button is-primary" onClick={cancelCallback}>No</button>
    </>
  });
}

export const DeleteTaskModal = Component;
