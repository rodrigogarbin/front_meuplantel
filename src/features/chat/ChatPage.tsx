/**
 * ChatPage — Assistente do Plantel (Fase 1: Alertas)
 */

import { useEffect, useRef, useState } from 'react'
import { useSendMessage, type ChatAlertas } from './chatApi'

interface Message {
    id: number
    role: 'user' | 'assistant'
    text: string
    alertas?: ChatAlertas
    timestamp: Date
}

const SUGGESTIONS = [
    { label: '🥚 Ovos nascendo essa semana', mensagem: 'Quais ovos vão nascer essa semana?' },
    { label: '🔖 Pássaros para anilhar', mensagem: 'Quais pássaros precisam ser anilhados?' },
    { label: '🐦 Pássaros para separar', mensagem: 'Quais pássaros precisam ser separados?' },
]

let nextId = 1

function renderText(text: string) {
    return text.split('\n').map((line, i) => {
        // Renderiza *texto* como negrito
        const parts = line.split(/(\*[^*]+\*)/g)
        return (
            <span key={i}>
                {parts.map((part, j) =>
                    part.startsWith('*') && part.endsWith('*') ? (
                        <strong key={j}>{part.slice(1, -1)}</strong>
                    ) : (
                        <span key={j}>{part}</span>
                    )
                )}
                {i < text.split('\n').length - 1 && <br />}
            </span>
        )
    })
}

function MessageBubble({ msg }: { msg: Message }) {
    const isUser = msg.role === 'user'
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
            <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    isUser
                        ? 'bg-blue-500 text-white rounded-br-sm'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm shadow-sm border border-gray-100 dark:border-gray-700'
                }`}
            >
                {renderText(msg.text)}
            </div>
        </div>
    )
}

function TypingIndicator() {
    return (
        <div className="flex justify-start mb-3">
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
            </div>
        </div>
    )
}

export function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const bottomRef = useRef<HTMLDivElement>(null)
    const { mutate: sendMessage, isPending } = useSendMessage()

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isPending])

    function handleSend(text: string) {
        const trimmed = text.trim()
        if (!trimmed || isPending) return

        const userMsg: Message = {
            id: nextId++,
            role: 'user',
            text: trimmed,
            timestamp: new Date(),
        }
        setMessages((prev) => [...prev, userMsg])
        setInput('')

        sendMessage(
            { mensagem: trimmed },
            {
                onSuccess: (data) => {
                    const assistantMsg: Message = {
                        id: nextId++,
                        role: 'assistant',
                        text: data.resposta,
                        alertas: data.alertas,
                        timestamp: new Date(),
                    }
                    setMessages((prev) => [...prev, assistantMsg])
                },
                onError: () => {
                    const errorMsg: Message = {
                        id: nextId++,
                        role: 'assistant',
                        text: 'Não foi possível obter resposta. Tente novamente.',
                        timestamp: new Date(),
                    }
                    setMessages((prev) => [...prev, errorMsg])
                },
            }
        )
    }

    const isEmpty = messages.length === 0

    return (
        <div className="flex flex-col h-[calc(100dvh-5rem)]">
            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assistente</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Alertas e informações do seu plantel</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50 dark:bg-gray-900">
                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center h-full gap-6 pb-4">
                        <div className="text-center">
                            <div className="text-4xl mb-2">🐦</div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                Olá! Posso te ajudar a acompanhar o seu plantel.
                            </p>
                            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                                Escolha uma sugestão ou faça uma pergunta.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 w-full max-w-xs">
                            {SUGGESTIONS.map((s) => (
                                <button
                                    key={s.mensagem}
                                    onClick={() => handleSend(s.mensagem)}
                                    disabled={isPending}
                                    className="w-full text-left px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-gray-700 transition-colors shadow-sm"
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg) => (
                            <MessageBubble key={msg.id} msg={msg} />
                        ))}
                        {isPending && <TypingIndicator />}
                    </>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 safe-bottom">
                <div className="flex gap-2 items-end">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSend(input)
                            }
                        }}
                        placeholder="Pergunte sobre seu plantel…"
                        rows={1}
                        disabled={isPending}
                        className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 max-h-32"
                    />
                    <button
                        onClick={() => handleSend(input)}
                        disabled={!input.trim() || isPending}
                        className="shrink-0 w-10 h-10 bg-blue-500 disabled:bg-gray-300 dark:disabled:bg-gray-600 rounded-xl flex items-center justify-center transition-colors"
                    >
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}
