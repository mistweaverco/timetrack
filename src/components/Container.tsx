import { FC, ReactNode } from 'react';

interface BaseLayoutProps {
  children?: ReactNode;
}

export const Container: FC<BaseLayoutProps> = ({ children }) => (
  <div id="content" className="container">
    {children}
  </div>
);
