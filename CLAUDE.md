# CLAUDE.md

## Visão Geral do Projeto

**Nome:** meuplantel-app
**Tipo:** Aplicação web frontend React + TypeScript
**Propósito:** Sistema de gerenciamento de planos de telefonia

## Stack Tecnológico

### Core
- **React 18.3.1** - Framework UI
- **TypeScript 5.6.2** - Linguagem principal
- **Vite 6.0.5** - Build tool e dev server
- **TailwindCSS 3.4.17** - Framework CSS utilitário

### Gerenciamento de Estado & Data Fetching
- **Zustand 5.0.2** - Gerenciamento de estado global
- **@tanstack/react-query 5.62.0** - Data fetching, cache e sincronização
- **Axios 1.7.9** - Cliente HTTP

### Roteamento
- **React Router DOM 7.1.0** - Roteamento cliente

### Features Especiais
- **html5-qrcode 2.3.8** - Scanner de QR codes
- **qrcode.react 4.1.0** - Geração de QR codes
- **tesseract.js 7.0.0** - OCR (reconhecimento de texto em imagens)
- **@hcaptcha/react-hcaptcha 1.17.4** - Proteção contra bots
- **@headlessui/react 2.2.0** - Componentes UI acessíveis

## Estrutura de Diretórios

```
/src
├── app/                 # Configuração principal da aplicação
├── components/          # Componentes reutilizáveis
│   ├── layout/         # Componentes de layout
│   └── ui/             # Componentes de UI (inputs, buttons, etc)
├── features/            # Features organizadas por domínio
├── hooks/               # Custom React hooks
├── lib/                 # Utilitários e configurações (ex: theme)
├── types/               # Definições de tipos TypeScript
├── main.tsx            # Entry point da aplicação
└── index.css           # Estilos globais
```

## Scripts Disponíveis

- `pnpm dev` - Inicia servidor de desenvolvimento
- `pnpm build` - Build de produção (TypeScript + Vite)
- `pnpm lint` - Executa ESLint
- `pnpm preview` - Preview do build de produção

## Características Principais

### Componentes UI Personalizados
- **QrScanner** - Scanner de QR codes
- **NumberScanner** - Scanner de números (provavelmente usa OCR)
- **PassaroAutocomplete** - Autocomplete personalizado
- **PullToRefresh** - Funcionalidade mobile de pull-to-refresh
- **SegmentedControl** - Controle segmentado
- **TagsInput** - Input de tags
- **Skeleton** - Loading states
- **ErrorState** - Estados de erro

### PWA Support
- Componente **PWAInstallBanner** indica suporte para Progressive Web App

### Temas
- Sistema de temas implementado em `lib/theme`
- Inicializado antes do render da aplicação

### Segurança
- Integração com hCaptcha para proteção contra bots

## Convenções de Desenvolvimento

### TypeScript
- Strict mode habilitado
- Type checking antes do build

### Linting
- ESLint configurado com:
  - React hooks rules
  - React refresh plugin
  - TypeScript ESLint

### Styling
- TailwindCSS para estilos
- PostCSS configurado
- Autoprefixer para compatibilidade de browsers

## Git Workflow

### Branch Atual
- `claude/create-claude-md-JdvXK`

### Branches Principais
- Main branch para PRs (conforme configuração do projeto)

### Commits Recentes
- Melhorias na página admin
- Ajustes no fluxo de validação de e-mail
- Alterações de ícone e implementação de impersonalização
- Inclusão de opção para impersonalizar usuários
- Melhorias na experiência do usuário

## Pontos de Atenção para IA

1. **OCR e QR Codes**: O projeto tem forte dependência em funcionalidades de câmera e processamento de imagens
2. **Mobile-First**: Presença de componentes como PullToRefresh indica foco em experiência mobile
3. **PWA**: Projeto configurado como Progressive Web App
4. **Admin Features**: Funcionalidades administrativas incluindo impersonalização de usuários
5. **Validação de E-mail**: Sistema de validação de e-mail implementado
6. **Temas**: Sistema de temas dinâmico (provavelmente dark/light mode)

## APIs e Integrações

- Backend API (via Axios)
- hCaptcha API
- Câmera do dispositivo (QR codes e OCR)

## Considerações de Desenvolvimento

- Sempre execute `pnpm dev` para testar mudanças localmente
- Execute `pnpm lint` antes de commits
- Build com `pnpm build` valida TypeScript
- Componentes devem ser tipados adequadamente
- Siga padrões de acessibilidade (HeadlessUI)
- Considere performance em dispositivos móveis

---

**Última atualização:** 2026-02-03
