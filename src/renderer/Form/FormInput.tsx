import { FC } from 'react';

interface BaseLayoutProps {
  label: string;
  type: string;
  placeholder: string;
}

export const FormInput: FC<BaseLayoutProps> = ({ label, type, placeholder }) => {
  return <>
    <div className="field">
      <label className="label">{label}</label>
      <div className="control">
        <input className="input" type={type} placeholder={placeholder} />
      </div>
    </div>
  </>;
};
