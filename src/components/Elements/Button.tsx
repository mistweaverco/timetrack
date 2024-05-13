import React, { FC } from 'react';
import { clsx } from 'clsx';


interface BaseLayoutProps {
  text: string;
  type: "button" | "submit" | "reset" | undefined;
  is: "is-primary" | "is-secondary" | "is-success" | "is-danger" | "is-warning" | "is-info" | undefined;
}

export const Button: FC<BaseLayoutProps> = ({ text, type, is }) => {
  return <>
    <button type={type} className={clsx('button', is)}>{text}</button>
  </>;
};
