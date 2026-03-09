import React from 'react';

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`
          w-full 
          min-h-[120px]
          border 
          ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'}
          rounded-md 
          px-3 py-2 
          text-gray-800 
          bg-white
          placeholder:text-gray-500 
          focus:ring-2 
          outline-none 
          transition-all
          disabled:opacity-60 disabled:bg-gray-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
    );
  }
);

FormTextarea.displayName = 'FormTextarea';
