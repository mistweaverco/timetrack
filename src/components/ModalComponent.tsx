import React, { FC, ReactNode } from 'react';
import { clsx } from 'clsx';

interface BaseLayoutProps {
  title?: string;
  children: ReactNode;
  buttons: ReactNode;
}

const Component: FC<BaseLayoutProps> = ({ children, buttons }) => {
  return <>
    <div className="modal is-active">
      <div className="modal-background"></div>
      <div className="modal-content">
        <div className="box">
          {children ? children : null }
          <div className="buttons">
            { buttons ? buttons : null }
          </div>
        </div>
      </div>
    </div>
  </>;
};

export const ModalComponent = Component;
