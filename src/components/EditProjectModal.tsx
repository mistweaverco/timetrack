import React, { FC, ReactNode, useRef } from 'react';
import { replaceProject } from './Store/slices/projects'
import { useAppDispatch } from './Store/hooks'

interface BaseLayoutProps {
  children?: ReactNode;
  project: DBProject;
  callback?: (status: boolean) => void;
}

export const EditProjectModal: FC<BaseLayoutProps> = ({ callback, project }) => {
  const ref = useRef<HTMLFormElement>(null);
  const dispatch = useAppDispatch();

  const onEditButtonClick = async (evt: React.MouseEvent) => {
    evt.preventDefault();
    const form = ref.current.querySelector('form') as HTMLFormElement;
    const formData = new FormData(form);
    const oldname = formData.get("oldname") as string
    const name = formData.get("name") as string
    const rpcResult = await window.electron.editProject({ oldname, name })
    if (rpcResult.success) {
      dispatch(replaceProject({ name, oldname }));
    }
    callback && callback(true);
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
            <p className="modal-card-title">Edit Project</p>
          </header>
          <section className="modal-card-body">
            <div className="field">
              <label className="label">Project Name</label>
              <div className="control">
                <input type="hidden" name="oldname" defaultValue={project.name} />
                <input className="input" name="name" required defaultValue={project.name} type="text" placeholder="Project Name" />
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

