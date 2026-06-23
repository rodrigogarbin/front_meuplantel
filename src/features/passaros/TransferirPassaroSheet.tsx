/**
 * Sheet para transferir um pássaro para outro usuário
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Input } from '@/components/ui/Input'
import { Toast, useToast } from '@/components/ui'
import { useTransferirPassaro } from './passarosApi'

interface TransferirPassaroSheetProps {
    passaroId: number
    open: boolean
    onClose: () => void
}

export function TransferirPassaroSheet({ passaroId, open, onClose }: TransferirPassaroSheetProps) {
    const navigate = useNavigate()
    const { toast, showToast, hideToast } = useToast()
    const [email, setEmail] = useState('')
    const [fieldError, setFieldError] = useState<string | null>(null)

    const transferirMutation = useTransferirPassaro()

    const handleClose = () => {
        setEmail('')
        setFieldError(null)
        onClose()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFieldError(null)

        const emailTrimmed = email.trim()
        if (!emailTrimmed) {
            setFieldError('Informe o e-mail do destinatário.')
            return
        }

        try {
            await transferirMutation.mutateAsync({ passaroId, email: emailTrimmed })
            showToast('Ave transferida com sucesso.', 'success')
            handleClose()
            setTimeout(() => navigate('/passaros', { replace: true }), 800)
        } catch (error: unknown) {
            const axiosError = error as { response?: { status?: number; data?: { message?: string } } }
            const status = axiosError?.response?.status
            const message = axiosError?.response?.data?.message

            if (status === 404) {
                setFieldError('Nenhum usuário encontrado com este e-mail.')
            } else if (status === 409) {
                setFieldError('Pássaro está em um casal ativo. Encerre o casal antes de transferir.')
            } else if (status === 422) {
                setFieldError(message ?? 'Não é possível transferir para si mesmo.')
            } else {
                setFieldError(message ?? 'Erro ao transferir a ave. Tente novamente.')
            }
        }
    }

    return (
        <>
            <BottomSheet isOpen={open} onClose={handleClose} title="Transferir ave">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Aviso de ação permanente */}
                    <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                            Após a transferência, você não poderá mais editar esta ave. O novo dono terá controle total.
                        </p>
                    </div>

                    {/* Campo de e-mail */}
                    <div className="space-y-1">
                        <Input
                            label="E-mail do novo dono"
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value)
                                if (fieldError) setFieldError(null)
                            }}
                            placeholder="email@exemplo.com"
                            autoComplete="off"
                            inputMode="email"
                        />
                        {fieldError && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{fieldError}</p>
                        )}
                    </div>

                    {/* Botão transferir */}
                    <button
                        type="submit"
                        disabled={transferirMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {transferirMutation.isPending ? (
                            <>
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Transferindo...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Transferir
                            </>
                        )}
                    </button>
                </form>
            </BottomSheet>

            {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
        </>
    )
}
