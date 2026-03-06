import type { HTMLAttributes } from 'react'
import { tokenVars } from '@app/shared-tokens'

export function Surface({ style, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      style={{
        backgroundColor: tokenVars.color.surface,
        borderRadius: tokenVars.radius.lg,
        border: `${tokenVars.border.width.sm} solid ${tokenVars.color.border}`,
        padding: tokenVars.spacing.lg,
        ...style,
      }}
    />
  )
}
