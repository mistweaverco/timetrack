import React, { FC, ReactNode } from 'react';

interface BaseLayoutProps {
  children?: ReactNode;
  message?: string;
  callback?: (status: boolean) => void;
}

export const ModalConfirm: FC<BaseLayoutProps> = ({ callback, message, children }) => {
  const onYesButtonClick = (evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.preventDefault();
    if (callback) {
      callback(true);
    }
  }

  const onNoButtonClick = (evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.preventDefault();
    if (callback) {
      callback(false);
    }
  }

  return <>
    <div className="modal is-active">
      <div className="modal-background"></div>
      <div className="modal-content">
        <div className="box">
          {children ? children : <p>{message ? message : "Are you sure?" }</p>}
          <div className="buttons">
            <button className="button is-danger" onClick={onYesButtonClick}>Yes</button>
            <button className="button is-primary" onClick={onNoButtonClick}>No</button>
          </div>
        </div>
      </div>
    </div>
  </>;
};

