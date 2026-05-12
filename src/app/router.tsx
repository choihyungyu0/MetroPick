import { createBrowserRouter } from 'react-router-dom'

import { DashboardPage } from '@/pages/DashboardPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ReportPage } from '@/pages/ReportPage'
import { ScenarioPage } from '@/pages/ScenarioPage'
import { AppShell } from '@/shared/components/AppShell'

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      {
        path: '/',
        element: <DashboardPage />,
      },
      {
        path: '/scenario',
        element: <ScenarioPage />,
      },
      {
        path: '/report',
        element: <ReportPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
