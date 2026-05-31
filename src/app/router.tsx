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
import { FinanceiroPage } from '@/features/financeiro/FinanceiroPage'
import { MedicamentosPage, DoencasPage, SintomasPage } from '@/features/medicamentos'
import { ChatPage } from '@/features/chat'
import { CertificadoVerificacaoPage } from '@/features/certificado/CertificadoVerificacaoPage'
import { UnsubscribePage } from '@/pages/UnsubscribePage'
import { MainLayout } from '@/components/layout'
import { PrivateRoute } from './PrivateRoute'
import { EmailVerificationGuard } from './EmailVerificationGuard'
import { useFeatureFlagsStore } from '@/features/featureFlags'
import type { FeatureFlagChave } from '@/features/featureFlags'

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
 * Protege rotas que exigem uma feature flag habilitada.
 * Redireciona para home se a feature não estiver ativa.
 */
function FeatureGuard({ flag, children }: { flag: FeatureFlagChave; children: React.ReactNode }) {
    const isEnabled = useFeatureFlagsStore((s) => s.isEnabled)
    if (!isEnabled(flag)) return <Navigate to="/" replace />
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
                path: '/financeiro',
                element: <FeatureGuard flag="financeiro"><FinanceiroPage /></FeatureGuard>,
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
                element: <AdminRoute><ChatPage /></AdminRoute>,
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
                element: <FeatureGuard flag="medicamentos"><MedicamentosPage /></FeatureGuard>,
            },
            {
                path: '/doencas',
                element: <FeatureGuard flag="medicamentos"><DoencasPage /></FeatureGuard>,
            },
            {
                path: '/sintomas',
                element: <FeatureGuard flag="medicamentos"><SintomasPage /></FeatureGuard>,
            },
        ],
    },
    {
        // Rota pública de verificação de certificado genealógico (sem autenticação)
        path: '/verificar/:token',
        element: <CertificadoVerificacaoPage />,
    },
    {
        // Rota pública de descadastro de emails de campanha (sem autenticação)
        path: '/unsubscribe',
        element: <UnsubscribePage />,
    },
    {
        // Catch-all para rotas não encontradas
        path: '*',
        element: <Navigate to="/" replace />,
    },
])
