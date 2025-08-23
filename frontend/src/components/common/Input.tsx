import { forwardRef } from 'react'
import { clsx } from 'clsx'
import { InputProps } from '@/types'

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="label text-gray-700" htmlFor={props.id}>
            {label}
          </label>
        )}
        <input
          className={clsx(
            'input',
            error && 'input-error',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input