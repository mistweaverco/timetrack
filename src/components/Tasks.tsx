import React, { FC, ReactNode } from 'react';

interface BaseLayoutProps {
  children?: ReactNode;
}

export const Tasks: FC<BaseLayoutProps> = ({ children }) => {
  return <>
    <section className="section">
      <h1 className="title">Tasks</h1>
      <h2 className="subtitle">All available Tasks for a given project</h2>
      <div className="fixed-grid has-3-cols">
        <div className="grid">
          <div className="cell">
            <nav className="panel">
              <p className="panel-heading">New</p>
              <form data-task-form className="p-4">
                <div className="field">
                  <label className="label">Task Defintion</label>
                  <div className="control">
                    <div className="select">
                      <select name="name">
                        <option defaultValue="">Loading...</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="field">
                  <label className="label">Task Description</label>
                  <div className="control">
                    <textarea name="description" className="textarea" placeholder="Task Description"></textarea>
                  </div>
                </div>
                <div className="field">
                  <label className="label">Task Duration</label>
                  <div className="control">
                    <input name="seconds" className="input" type="number" defaultValue="0" min="0" />
                  </div>
                </div>
                <div className="field">
                  <div className="control">
                    <button className="button is-primary" type="submit">Add Task</button>
                  </div>
                </div>
              </form>
            </nav>
          </div>

          <div className="cell">
            <nav className="panel">
              <p className="panel-heading">Available</p>
              <p className="panel-tabs">
                <a className="is-active">Today</a>
                <a>All</a>
              </p>
              <div data-task-list className="is-hidden">
                <div data-task-item className="panel-block">
                  <span className="panel-icon">
                    <i className="fas fa-book" aria-hidden="true"></i>
                  </span>
                  <div className="grid has-1-cols">
                    <div className="columns">
                      <div className="column">
                        <p data-task-name className="bd-notification is-info">Loading ...</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid has-2-cols">
                    <div className="columns">
                      <div className="column">
                        <p data-task-time className="bd-notification is-info">Loading ...</p>
                      </div>
                      <div className="column">
                        <p data-task-date className="bd-notification is-info">Loading ...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </nav>
          </div>

          <div data-task-actions-container className="cell is-hidden">
            <nav className="panel">
              <p className="panel-heading">Actions</p>
              <form data-buttons className="p-4">
                <div className="field">
                  <div data-buttons className="control">
                    <button className="button is-primary" data-action-type="toggle-task">Start</button>
                    <button className="button is-warning" data-action-type="edit-task">Edit</button>
                    <button className="button is-danger" data-action-type="delete-task">Delete</button>
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

