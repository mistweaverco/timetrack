import React, { FC, ReactNode, useRef } from 'react';
import { clsx } from 'clsx';

type Props = {
  title: string;
  type: "info" | "warning" | "danger";
  children: ReactNode;
  collapsed?: boolean;
}

export const InfoboxComponent: FC<Props> = ({ title, type, children, collapsed }) => {
  const refButton = useRef<HTMLButtonElement>(null);
  const refBox = useRef<HTMLDivElement>(null);

  const onButtonClick = (evt: React.MouseEvent) => {
    evt.preventDefault();
    if (refButton.current) {
      refButton.current.classList.toggle('is-hidden');
    }
    if (refBox.current) {
      refBox.current.classList.toggle('is-hidden');
    }
  }

  return <>
    { collapsed ?
      <button ref={refButton} className={clsx('p-3', 'has-text-'+type)} onClick={onButtonClick}>
        <span className="icon">
          <i className={clsx('fas', type === 'info' ? 'fa-info-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle')}></i>
        </span>
        {title}
        <span className="icon">
          <i className="fas fa-angle-right"></i>
        </span>
      </button>
      : null
    }
    <article ref={refBox} className={clsx('message', 'is-'+type, (collapsed ? 'is-hidden': null), 'is'+type)}>
      <div className="message-header">
        <p>
          <span className="icon">
            <i className={clsx('fas', type === 'info' ? 'fa-info-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle')}></i>
          </span>
          {title}
        </p>
      </div>
      <div className="message-body">
        {children}
      </div>
    </article>
  </>;
}

