import { FormInput } from './Form/FormInput';
import { FC, ReactNode } from 'react';

interface BaseLayoutProps {
  children?: ReactNode;
}

const Form: FC<BaseLayoutProps> = ({ children }) => {
  return <>
    <form className="p-4">
      {children}
    </form>
  </>;
};

export {
  Form,
  FormInput,
};
