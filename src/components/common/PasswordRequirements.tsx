import { Check, X } from 'lucide-react'
import { validatePassword } from '../../utils/password.ts'
import './PasswordRequirements.css'

export interface PasswordRequirementsProps {
  password: string
  showAlways?: boolean
  className?: string
  id?: string
}

export function PasswordRequirements({
  password,
  showAlways = false,
  className = '',
  id,
}: PasswordRequirementsProps) {
  if (!showAlways && password.length === 0) {
    return null
  }

  const { rules } = validatePassword(password)

  return (
    <ul
      id={id}
      className={`password-requirements-list${className ? ` ${className}` : ''}`}
      aria-label="Requisitos de contraseña"
    >
      {rules.map((rule) => (
        <li
          key={rule.id}
          className={`password-requirement-item ${rule.isMet ? 'is-met' : 'is-unmet'}`}
          aria-label={`${rule.label}: ${rule.isMet ? 'cumplido' : 'pendiente'}`}
        >
          <span className="requirement-icon" aria-hidden="true">
            {rule.isMet ? <Check size={14} /> : <X size={14} />}
          </span>
          <span className="requirement-label">{rule.label}</span>
        </li>
      ))}
    </ul>
  )
}
