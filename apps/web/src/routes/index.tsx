import { createFileRoute, redirect } from '@tanstack/react-router'
import { getActiveWebSession } from '../features/auth/route-guard'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const session = await getActiveWebSession()
    if (session) {
      throw redirect({ to: '/learn' })
    }

    throw redirect({
      to: '/auth',
      search: { returnTo: '/learn' },
    })
  },
})
