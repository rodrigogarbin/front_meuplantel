/**
 * Página de callback do login social
 *
 * Rota dedicada que recebe o redirect do backend após autenticação OAuth,
 * processando o ?token= sem conflitar com rotas Blade do Laravel em produção.
 */

import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from './authStore'
import { API_BASE_URL } from '@/lib/api'
import { BirdLogo } from '@/components/BirdLogo'

export function SocialCallbackPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    useEffect(() => {
        const socialError = searchParams.get('social_error')
        if (socialError) {
            navigate(`/login?social_error=${encodeURIComponent(socialError)}`, { replace: true })
            return
        }

        const token = searchParams.get('token')
        if (!token) {
            navigate('/login', { replace: true })
            return
        }

        const isNewUser = searchParams.get('new_user') === '1'

        axios
            .get(`${API_BASE_URL}/api/v1/me`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                const data = res.data.data || res.data
                useAuthStore.setState({
                    token,
                    user: {
                        usuario_id:     data.usuario_id,
                        nome:           data.name,
                        username:       data.name,
                        email:          data.email,
                        needs_email:    data.needs_email,
                        email_verified: data.email_verified,
                        is_admin:       data.is_admin,
                        sg_clube:       data.sg_clube,
                        nro_criador:    data.nro_criador,
                    },
                    expiresAt:       Date.now() + 3600 * 1000,
                    isAuthenticated: true,
                    isLoading:       false,
                })
                navigate(isNewUser ? '/completar-perfil' : '/', { replace: true })
            })
            .catch(() => {
                navigate('/login?social_error=Sess%C3%A3o+expirada.+Fa%C3%A7a+login+novamente.', { replace: true })
            })
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <BirdLogo size="lg" />
                <svg className="animate-spin h-8 w-8 text-white/60" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-white/60 text-sm">Autenticando...</p>
            </div>
        </div>
    )
}
