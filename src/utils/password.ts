export interface PasswordRuleResult {
  id: string
  label: string
  isMet: boolean
}

export interface PasswordValidationResult {
  isValid: boolean
  rules: PasswordRuleResult[]
  hasMinLength: boolean
  hasUppercase: boolean
  hasLowercase: boolean
  hasNumber: boolean
  hasSpecial: boolean
}

export function validatePassword(password: string): PasswordValidationResult {
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)

  const rules: PasswordRuleResult[] = [
    {
      id: 'min-length',
      label: `Mínimo 8 caracteres (${password.length}/8)`,
      isMet: hasMinLength,
    },
    {
      id: 'uppercase',
      label: 'Al menos una mayúscula (A-Z)',
      isMet: hasUppercase,
    },
    {
      id: 'lowercase',
      label: 'Al menos una minúscula (a-z)',
      isMet: hasLowercase,
    },
    {
      id: 'number',
      label: 'Al menos un número (0-9)',
      isMet: hasNumber,
    },
    {
      id: 'special',
      label: 'Al menos un carácter especial (!@#$...)',
      isMet: hasSpecial,
    },
  ]

  const isValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial

  return {
    isValid,
    rules,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
  }
}
