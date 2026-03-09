import React from 'react';

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const FormLabel = ({ className = '', required, children, ...props }: FormLabelProps) => {
  return (
    <label
      className={`
        block 
        text-sm 
        font-medium 
        text-gray-700 
        mb-1
        ${className}
      `}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};
