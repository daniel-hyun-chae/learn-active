import type { ButtonHTMLAttributes } from 'react'
import { tokenVars } from '@app/shared-tokens'

export function PrimaryButton({
  style,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        backgroundColor: tokenVars.color.primary,
        color: tokenVars.color.text,
        borderRadius: tokenVars.radius.md,
        border: `${tokenVars.border.width.sm} solid ${tokenVars.color.border}`,
        padding: `${tokenVars.spacing.sm} ${tokenVars.spacing.lg}`,
        fontSize: tokenVars.font.size.md,
        fontWeight: tokenVars.font.weight.medium,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    />
  )
}
