import React, { FC, ReactNode } from 'react';

interface BaseLayoutProps {
  children?: ReactNode;
}

export const TaskDefinitions: FC<BaseLayoutProps> = ({ children }) => {
  return <>
    <section className="section is-hidden" data-taskdef-section>
      <h1 className="title">Tasksdefinitions</h1>
      <h2 className="subtitle">All available Tasksdefs for a given project</h2>
      <div className="fixed-grid has-3-cols">
        <div className="grid">
          <div className="cell">
            <nav className="panel">
              <p className="panel-heading">New</p>
              <form data-add-taskdef-form className="p-4">
                <div className="field">
                  <label className="label">Taskdef Name</label>
                  <div className="control">
                    <input name="name" className="input" type="text" placeholder="Taskdef Name" />
                  </div>
                </div>
                <div className="field">
                  <div className="control">
                    <button className="button is-primary" type="submit">Add Taskdef</button>
                  </div>
                </div>
              </form>
            </nav>
          </div>
          <div className="cell">
            <nav className="panel">
              <p className="panel-heading">Available</p>
              <div data-taskdef-list>
                <div data-taskdef-item className="panel-block">
                  <span className="panel-icon">
                    <i className="fas fa-book" aria-hidden="true"></i>
                  </span>
                  <p data-taskdef-name className="bd-notification is-info">Loading ...</p>
                </div>
              </div>
            </nav>
          </div>

          <div data-taskdef-actions-container className="cell is-hidden">
            <nav className="panel">
              <p className="panel-heading">Actions</p>
              <form data-buttons className="p-4">
                <div className="field">
                  <div data-buttons className="control">
                    <button className="button is-warning" data-action-type="edit-taskdef">Edit</button>
                    <button className="button is-danger" data-action-type="delete-taskdef">Delete</button>
                  </div>
                </div>
              </form>
            </nav>
          </div>

        </div>
      </div>
    </section>
  </>;
};

