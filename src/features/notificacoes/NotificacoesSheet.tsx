/**
 * Componente NotificacoesSheet
 * Bottom sheet com lista de notificações do usuário
 */

import { useNavigate } from 'react-router-dom'
import { BottomSheet } from '@/components/ui'
import {
  useNotificacoes,
  useMarcarLida,
  useMarcarTodasLidas,
  type Notificacao,
} from './notificacoesApi'

interface NotificacoesSheetProps {
  isOpen: boolean
  onClose: () => void
}

// Ícone de sino para cada item
function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
      />
    </svg>
  )
}

// Skeleton de loading para cada item de notificação
function NotificacaoSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-3 animate-pulse">
      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
      </div>
    </div>
  )
}

// Item individual de notificação
interface NotificacaoItemProps {
  notificacao: Notificacao
  onPress: (notificacao: Notificacao) => void
}

function NotificacaoItem({ notificacao, onPress }: NotificacaoItemProps) {
  const isNaoLida = notificacao.lida_em === null

  return (
    <button
      onClick={() => onPress(notificacao)}
      className={`w-full flex gap-3 px-4 py-3 text-left transition-colors active:bg-gray-100 dark:active:bg-gray-700 ${
        isNaoLida
          ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
      }`}
    >
      {/* Ícone */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          isNaoLida
            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
        }`}
      >
        <BellIcon className="w-4 h-4" />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm leading-snug ${
              isNaoLida
                ? 'font-semibold text-gray-900 dark:text-gray-100'
                : 'font-medium text-gray-700 dark:text-gray-300'
            }`}
          >
            {notificacao.titulo}
          </p>
          {isNaoLida && (
            <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed line-clamp-2">
          {notificacao.corpo}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {notificacao.tempo_relativo}
        </p>
      </div>
    </button>
  )
}

export function NotificacoesSheet({ isOpen, onClose }: NotificacoesSheetProps) {
  const navigate = useNavigate()
  const { data: notificacoes, isLoading } = useNotificacoes()
  const marcarLida = useMarcarLida()
  const marcarTodasLidas = useMarcarTodasLidas()

  const naoLidas = notificacoes?.filter((n) => n.lida_em === null) ?? []
  const temNaoLidas = naoLidas.length > 0

  function handlePressNotificacao(notificacao: Notificacao) {
    // Marca como lida se ainda não estiver
    if (notificacao.lida_em === null) {
      marcarLida.mutate(notificacao.id)
    }

    // Navega para a URL se houver
    if (notificacao.url) {
      onClose()
      // Se for URL relativa (começa com /), usa navigate. Caso contrário, abre em nova aba.
      if (notificacao.url.startsWith('/')) {
        navigate(notificacao.url)
      } else {
        window.open(notificacao.url, '_blank', 'noopener,noreferrer')
      }
    }
  }

  function handleMarcarTodasLidas() {
    marcarTodasLidas.mutate()
  }

  // Header com botão "Marcar todas como lidas"
  const headerAction = temNaoLidas ? (
    <button
      onClick={handleMarcarTodasLidas}
      disabled={marcarTodasLidas.isPending}
      className="text-xs text-blue-600 dark:text-blue-400 font-medium disabled:opacity-50 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
    >
      {marcarTodasLidas.isPending ? 'Marcando...' : 'Marcar todas como lidas'}
    </button>
  ) : null

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Notificações">
      {/* Ação do header — botão fora do título, dentro do conteúdo no topo */}
      {headerAction && (
        <div className="-mt-2 mb-3 flex justify-end">
          {headerAction}
        </div>
      )}

      {/* Estado de loading */}
      {isLoading && (
        <div className="-mx-5">
          <NotificacaoSkeleton />
          <NotificacaoSkeleton />
          <NotificacaoSkeleton />
        </div>
      )}

      {/* Lista de notificações */}
      {!isLoading && notificacoes && notificacoes.length > 0 && (
        <div className="-mx-5 divide-y divide-gray-100 dark:divide-gray-700">
          {notificacoes.map((notificacao) => (
            <NotificacaoItem
              key={notificacao.id}
              notificacao={notificacao}
              onPress={handlePressNotificacao}
            />
          ))}
        </div>
      )}

      {/* Estado vazio */}
      {!isLoading && (!notificacoes || notificacoes.length === 0) && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <BellIcon className="w-7 h-7 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Nenhuma notificação
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Você está em dia com tudo
          </p>
        </div>
      )}
    </BottomSheet>
  )
}
