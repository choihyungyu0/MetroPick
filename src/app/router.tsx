import { createBrowserRouter } from 'react-router-dom'

import { DashboardPage } from '@/pages/DashboardPage'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ReportPage } from '@/pages/ReportPage'
import { ScenarioPage } from '@/pages/ScenarioPage'
import { SignupPage } from '@/pages/SignupPage'
import { AppShell } from '@/shared/components/AppShell'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    element: <AppShell />,
    children: [
      {
        path: '/dashboard',
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
