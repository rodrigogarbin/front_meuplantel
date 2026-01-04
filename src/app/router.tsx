/**
 * Router da aplicação
 */

import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { LoginPage, RegisterPage } from '@/features/auth'
import { DashboardPage } from '@/features/dashboard'
import { PassarosPage, PassaroFormPage, ArvoreGenealogicaPage } from '@/features/passaros'
import { CasaisPage, CasalFormPage } from '@/features/casais'
import { PosturasPage } from '@/features/posturas'
import { ConfigPage, EspeciesPage, ProfileEditPage } from '@/features/config'
import { MainLayout } from '@/components/layout'
import { PrivateRoute } from './PrivateRoute'

/**
 * Layout wrapper para rotas autenticadas
 */
function AuthenticatedLayout() {
    return (
        <PrivateRoute>
            <MainLayout>
                <Outlet />
            </MainLayout>
        </PrivateRoute>
    )
}

/**
 * Layout simples para rotas autenticadas sem bottom nav
 */
function SimpleAuthLayout() {
    return (
        <PrivateRoute>
            <Outlet />
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
                path: '/passaros/:id/arvore',
                element: <ArvoreGenealogicaPage />,
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
