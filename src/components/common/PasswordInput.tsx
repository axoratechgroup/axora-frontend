import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  hasError?: boolean
}

export function PasswordInput({ hasError, className, disabled, ...rest }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="password-input-wrapper">
      <input
        {...rest}
        type={showPassword ? 'text' : 'password'}
        className={`form-input${hasError ? ' has-error' : ''}${className ? ` ${className}` : ''}`}
        disabled={disabled}
      />
      <button
        type="button"
        className="password-toggle-btn"
        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        onClick={() => setShowPassword((prev) => !prev)}
        disabled={disabled}
      >
        {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  )
}
