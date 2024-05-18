import { FC } from 'react';
import { ModalComponent } from './ModalComponent'
import { useAppDispatch } from './Store/hooks'
import { deleteProject } from './Store/slices/projects'
import { InfoboxComponent } from './InfoboxComponent';

type Props = {
  project: DBProject
  callback?: (status: boolean) => void
}

const Component: FC<Props> = ({ project, callback }) => {
  const dispatch = useAppDispatch();

  const confirmCallback = async (evt: React.MouseEvent) => {
    evt.preventDefault();
    const rpcResult = await window.electron.deleteProject(project.name);
    if (rpcResult.success) {
      dispatch(deleteProject({ name: project.name }));
      callback && callback(true);
    }
  };

  const cancelCallback = async (evt: React.MouseEvent) => {
    evt.preventDefault();
    callback && callback(false);
  };

  return ModalComponent({
    title: 'Delete Project',
    children: <>
      <p>Are you sure you want to delete this project?</p>
      <InfoboxComponent type="danger" title="Warning">
        <p>Deleting a project is a hazardious action.</p>
        <p>If you delete a project, it'll also delete all its tasks and task-definitions.</p>
        <p>Maybe consider marking it as inactive?</p>
      </InfoboxComponent>
    </>,
    buttons: <>
      <button className="button is-danger" onClick={confirmCallback}>Yes</button>
      <button className="button is-primary" onClick={cancelCallback}>No</button>
    </>
  });
}

export const DeleteProjectModal = Component;
