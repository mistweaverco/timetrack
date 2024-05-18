import { FC, ReactNode } from 'react';

interface BaseLayoutProps {
  title: string;
  children: ReactNode;
  buttons: ReactNode;
}

const Component: FC<BaseLayoutProps> = ({ title, children, buttons }) => {
  return <>
    <div className="modal is-active">
      <div className="modal-background"></div>
      <div className="modal-card">
        <form>
          <header className="modal-card-head">
            <p className="modal-card-title">{title}</p>
          </header>
          <section className="modal-card-body">
            {children ? children : null }
          </section>
          <footer className="modal-card-foot">
            <div className="buttons">
              { buttons ? buttons : null }
            </div>
          </footer>
        </form>
      </div>
    </div>
  </>;
};

export const ModalComponent = Component;
