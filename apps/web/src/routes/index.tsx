import { createFileRoute, redirect } from '@tanstack/react-router'
import { getActiveWebSession } from '../features/auth/route-guard'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    await getActiveWebSession()
    throw redirect({ to: '/courses' })
  },
})
