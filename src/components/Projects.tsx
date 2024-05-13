import React, { FC, ReactNode, useEffect } from 'react';
import { produce } from 'immer';

interface BaseLayoutProps {
  children?: ReactNode;
  projects?: any[];
}

export const Projects: FC<BaseLayoutProps> = ({ projects }) => {

  return <>
    <section className="section">
      <h1 className="title">Projects</h1>
      <h2 className="subtitle">All available projects</h2>
      <div className="fixed-grid has-3-cols">
        <div className="grid">
          <div className="cell">
            <nav className="panel">
              <p className="panel-heading">New</p>
              <form className="p-4">
                <div className="field">
                  <label className="label">Project Name</label>
                  <div className="control">
                    <input className="input" type="text" placeholder="Project Name" />
                  </div>
                </div>
                <div className="field">
                  <div className="control">
                    <button className="button is-primary" type="submit">Add Project</button>
                  </div>
                </div>
              </form>
            </nav>
          </div>
          <div className="cell">
            <nav className="panel">
              <p className="panel-heading">Available</p>
              <div data-project-list>
                {projects && projects.length && projects.map((project: any) => (
                  <div key={project} data-project-item className="panel-block">
                    <span className="panel-icon">
                      <i className="fas fa-book" aria-hidden="true"></i>
                    </span>
                    <p data-project-item-header className="bd-notification is-info">{project.name}</p>
                  </div>
                ))}
              </div>
            </nav>
          </div>
          <div data-project-actions-container className="cell is-hidden">
            <nav className="panel">
              <p className="panel-heading">Actions</p>
              <form data-buttons className="p-4">
                <div className="field">
                  <div className="control">
                    <button className="button is-warning" data-action-type="edit-project">Edit</button>
                    <button className="button is-danger" data-action-type="delete-project">Delete</button>
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

