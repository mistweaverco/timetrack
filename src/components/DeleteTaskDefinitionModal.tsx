import { FC } from 'react';
import { ModalComponent } from './ModalComponent'
import { useAppDispatch } from './Store/hooks'
import { removeTaskDefinition } from './Store/slices/taskDefinitions'
import { InfoboxComponent } from './InfoboxComponent';

type Props = {
  taskDefinition: DBTaskDefinition
  callback?: (status: boolean) => void
}

const Component: FC<Props> = ({ taskDefinition, callback }) => {
  const dispatch = useAppDispatch();

  const confirmCallback = async (evt: React.MouseEvent) => {
    evt.preventDefault();
    const rpcResult = await window.electron.deleteTaskDefinition(taskDefinition);
    if (rpcResult.success) {
      dispatch(removeTaskDefinition(taskDefinition));
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
