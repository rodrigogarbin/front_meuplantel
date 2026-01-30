/**
 * Router da aplicação
 */

import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { LoginPage, RegisterPage, ForgotPasswordPage, EmailVerificationPage } from '@/features/auth'
import { DashboardPage } from '@/features/dashboard'
import { PassarosPage, PassaroFormPage, ArvoreGenealogicaPage } from '@/features/passaros'
import { CasaisPage, CasalFormPage } from '@/features/casais'
import { PosturasPage } from '@/features/posturas'
import { ConfigPage, EspeciesPage, ProfileEditPage } from '@/features/config'
import { MainLayout } from '@/components/layout'
import { PrivateRoute } from './PrivateRoute'
import { EmailVerificationGuard } from './EmailVerificationGuard'

/**
 * Layout wrapper para rotas autenticadas (com verificação de email)
 */
function AuthenticatedLayout() {
    return (
        <PrivateRoute>
            <EmailVerificationGuard>
                <MainLayout>
                    <Outlet />
                </MainLayout>
            </EmailVerificationGuard>
        </PrivateRoute>
    )
}

/**
 * Layout simples para rotas autenticadas sem bottom nav (com verificação de email)
 */
function SimpleAuthLayout() {
    return (
        <PrivateRoute>
            <EmailVerificationGuard>
                <Outlet />
            </EmailVerificationGuard>
        </PrivateRoute>
    )
}

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage />,
    },
    {
        path: '/register',
        element: <RegisterPage />,
    },
    {
        path: '/forgot-password',
        element: <ForgotPasswordPage />,
    },
    {
        // Rota de verificação de email (requer autenticação, mas sem guard de email)
        path: '/verificar-email',
        element: (
            <PrivateRoute>
                <EmailVerificationPage />
            </PrivateRoute>
        ),
    },
    {
        // Rotas autenticadas com layout compartilhado (bottom nav)
        element: <AuthenticatedLayout />,
        children: [
            {
                path: '/',
                element: <DashboardPage />,
            },
            {
                path: '/passaros',
                element: <PassarosPage />,
            },
            {
                path: '/casais',
                element: <CasaisPage />,
            },
            {
                path: '/posturas',
                element: <PosturasPage />,
            },
            {
                path: '/config',
                element: <ConfigPage />,
            },
            {
                path: '/passaros/:id/arvore',
                element: <ArvoreGenealogicaPage />,
            },
        ],
    },
    {
        // Rotas autenticadas sem bottom nav (formulários full-screen)
        element: <SimpleAuthLayout />,
        children: [
            {
                path: '/passaros/novo',
                element: <PassaroFormPage />,
            },
            {
                path: '/passaros/:id/editar',
                element: <PassaroFormPage />,
            },
            {
                path: '/casais/novo',
                element: <CasalFormPage />,
            },
            {
                path: '/casais/:id/editar',
                element: <CasalFormPage />,
            },
            {
                path: '/config/especies',
                element: <EspeciesPage />,
            },
            {
                path: '/config/perfil',
                element: <ProfileEditPage />,
            },
        ],
    },
    {
        // Catch-all para rotas não encontradas
        path: '*',
        element: <Navigate to="/" replace />,
    },
])
