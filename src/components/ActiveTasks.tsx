import React, { FC, ReactNode } from 'react';

interface BaseLayoutProps {
  children?: ReactNode;
}

export const ActiveTasks: FC<BaseLayoutProps> = ({ children }) => {
  return <>
    <section className="section">
      <nav className="panel">
        <p className="panel-heading">Active Tasks</p>
        <div className="notification">
            No <strong>active</strong> tasks found.
        </div>
        <div className="panel-block is-hidden">
          <table className="table is-fullwidth">
            <thead>
              <tr>
                <th>Project</th>
                <th>Task Name</th>
                <th>Task Elapsed</th>
                <th>Task Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        </div>
      </nav>
    </section>
  </>;
};

