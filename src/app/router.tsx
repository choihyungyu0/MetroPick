import { createBrowserRouter, type RouteObject } from 'react-router-dom'

import { AIPredictionPage } from '@/pages/AIPredictionPage'
import { CommercialAnalysisPage } from '@/pages/CommercialAnalysisPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { MyPage } from '@/pages/MyPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { OnboardingBusinessTypePage } from '@/pages/OnboardingBusinessTypePage'
import { OnboardingInitialSetupPage } from '@/pages/OnboardingInitialSetupPage'
import { OnboardingNotificationsPage } from '@/pages/OnboardingNotificationsPage'
import { OnboardingStationPage } from '@/pages/OnboardingStationPage'
import { RecommendationPage } from '@/pages/RecommendationPage'
import { ReportPage } from '@/pages/ReportPage'
import { SignupPage } from '@/pages/SignupPage'

export const appRoutes = [
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
    path: '/onboarding',
    element: <OnboardingInitialSetupPage />,
  },
  {
    path: '/onboarding/stations',
    element: <OnboardingStationPage />,
  },
  {
    path: '/onboarding/business-type',
    element: <OnboardingBusinessTypePage />,
  },
  {
    path: '/onboarding/notifications',
    element: <OnboardingNotificationsPage />,
  },
  {
    path: '/dashboard',
    element: <DashboardPage />,
  },
  {
    path: '/commercial-analysis',
    element: <CommercialAnalysisPage />,
  },
  {
    path: '/ai-prediction',
    element: <AIPredictionPage />,
  },
  {
    path: '/recommendation',
    element: <RecommendationPage />,
  },
  {
    path: '/report',
    element: <ReportPage />,
  },
  {
    path: '/mypage',
    element: <MyPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
] satisfies RouteObject[]

export const router = createBrowserRouter(appRoutes)
