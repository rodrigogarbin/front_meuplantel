/**
 * Router da aplicação
 */

import { createBrowserRouter, Navigate, Outlet, useParams } from 'react-router-dom'
import { useUser } from '@/features/auth'
import { LoginPage, RegisterPage, ForgotPasswordPage, EmailVerificationPage, CompletarPerfilPage, SocialCallbackPage } from '@/features/auth'
import { AdminPage } from '@/features/admin'
import { DashboardPage } from '@/features/dashboard'
import { PassarosPage, PassaroFormPage, ArvoreGenealogicaPage } from '@/features/passaros'
import { CasaisPage, CasalFormPage } from '@/features/casais'
import { PosturasPage } from '@/features/posturas'
import { ConfigPage, EspeciesPage, ProfileEditPage, GestaoConfigPage } from '@/features/config'
import { GestaoPage } from '@/features/gestao/GestaoPage'
import { MedicamentosPage, DoencasPage, SintomasPage } from '@/features/medicamentos'
import { ChatPage } from '@/features/chat'
import { MainLayout } from '@/components/layout'
import { PrivateRoute } from './PrivateRoute'
import { EmailVerificationGuard } from './EmailVerificationGuard'

/**
 * Protege rotas que exigem is_admin=true.
 * O backend bloqueia as requests de qualquer forma, mas sem este guard
 * a página admin renderiza e dispara requests desnecessárias.
 */
function AdminRoute({ children }: { children: React.ReactNode }) {
    const user = useUser()
    if (!user?.is_admin) return <Navigate to="/" replace />
    return <>{children}</>
}

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
 * Redireciona /gaiola/:id para /casais?casal=id (deep link do QR code da gaiola).
 * URL curta para não conflitar com /casais/novo e /casais/:id/editar.
 */
function GaiolaRedirect() {
    const { id } = useParams<{ id: string }>()
    const numId = Number(id)
    if (Number.isNaN(numId) || numId < 1) return <Navigate to="/casais" replace />
    return <Navigate to={`/casais?casal=${id}`} replace />
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
        // Callback dedicado para OAuth social — evita conflito com a rota Blade /login em produção
        path: '/social-callback',
        element: <SocialCallbackPage />,
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
        // Rota de completar perfil após login social (sem guard de email)
        path: '/completar-perfil',
        element: (
            <PrivateRoute>
                <CompletarPerfilPage />
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
                path: '/gaiola/:id',
                element: <GaiolaRedirect />,
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
                path: '/admin',
                element: <AdminRoute><AdminPage /></AdminRoute>,
            },
            {
                path: '/gestao',
                element: <GestaoPage />,
            },
            {
                path: '/passaros/:id/arvore',
                element: <ArvoreGenealogicaPage />,
            },
            {
                path: '/config/perfil',
                element: <ProfileEditPage />,
            },
            {
                path: '/chat',
                element: <ChatPage />,
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
                path: '/config/gestao',
                element: <GestaoConfigPage />,
            },
            {
                path: '/medicamentos',
                element: <MedicamentosPage />,
            },
            {
                path: '/doencas',
                element: <DoencasPage />,
            },
            {
                path: '/sintomas',
                element: <SintomasPage />,
            },
        ],
    },
    {
        // Catch-all para rotas não encontradas
        path: '*',
        element: <Navigate to="/" replace />,
    },
])
