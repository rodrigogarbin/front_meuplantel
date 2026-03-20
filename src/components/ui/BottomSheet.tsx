/**
 * Componente BottomSheet / Modal
 * 
 * Exibe como bottom sheet no mobile e modal central no desktop
 * Usando Headless UI Dialog para acessibilidade
 */

import { Fragment, ReactNode } from 'react'
import { Dialog, Transition } from '@headlessui/react'

interface BottomSheetProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: ReactNode
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {/* Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto overflow-x-hidden">
                    {/* Mobile: bottom sheet / Desktop: centered modal */}
                    <div className="flex min-h-full items-end sm:items-center justify-center sm:p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="w-full sm:max-w-lg transform bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-xl transition-all max-h-[85vh] flex flex-col overflow-hidden">
                                {/* Handle bar for mobile */}
                                <div className="sm:hidden flex justify-center pt-3 pb-1">
                                    <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                                </div>

                                {/* Header */}
                                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700">
                                    <Dialog.Title className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                        {title}
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-5 pb-safe-bottom">
                                    {children}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}
