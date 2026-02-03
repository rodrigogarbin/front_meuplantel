# CLAUDE.md - MeuPlantel Frontend

## Visão Geral do Projeto

**Nome:** meuplantel-app
**Tipo:** Aplicação web frontend React + TypeScript (PWA)
**Propósito:** Sistema de gerenciamento de plantel de pássaros (criação de Agapornis/Periquitos)

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
│   ├── router.tsx      # Rotas da aplicação
│   ├── PrivateRoute.tsx # Guard de autenticação
│   └── EmailVerificationGuard.tsx # Guard de verificação de e-mail
├── components/          # Componentes reutilizáveis
│   ├── layout/         # Componentes de layout (MainLayout, BottomNav)
│   └── ui/             # Componentes de UI (inputs, buttons, modals, etc)
├── features/            # Features organizadas por domínio
│   ├── auth/           # Autenticação (login, registro, verificação)
│   ├── admin/          # Admin dashboard e gestão de usuários
│   ├── passaros/       # Gestão de pássaros e genealogia
│   ├── casais/         # Gestão de casais e reprodução
│   ├── posturas/       # Gestão de posturas/ninhadas
│   ├── config/         # Configurações e perfil
│   └── dashboard/      # Dashboard principal
├── hooks/               # Custom React hooks
├── lib/                 # Utilitários e configurações
│   ├── api.ts          # Cliente Axios configurado
│   └── theme/          # Sistema de temas (light/dark/system)
├── types/               # Definições de tipos TypeScript
├── main.tsx            # Entry point da aplicação
└── index.css           # Estilos globais (Tailwind)
```

## Scripts Disponíveis

- `pnpm dev` - Inicia servidor de desenvolvimento
- `pnpm build` - Build de produção (TypeScript + Vite)
- `pnpm lint` - Executa ESLint
- `pnpm preview` - Preview do build de produção

## Características Principais

### Domínio de Negócio
O MeuPlantel é um sistema para criadores de pássaros (principalmente Agapornis) que permite:
- Cadastro e gestão de pássaros com genealogia completa
- Formação de casais para reprodução
- Registro de posturas (ninhadas) com acompanhamento de ovos e filhotes
- Cálculo de consanguinidade (Coeficiente de Wright)
- Visualização de árvore genealógica
- QR codes para identificação de gaiolas
- Scanner OCR para número de gaiolas

### Componentes UI Personalizados
- **QrScanner** - Scanner de QR codes para gaiolas (deep link `/gaiola/:id`)
- **NumberScanner** - Scanner OCR de números de gaiola usando Tesseract.js
- **PassaroAutocomplete** - Autocomplete para seleção de pássaros (pai/mãe)
- **PullToRefresh** - Pull-to-refresh em listas (mobile-first)
- **BottomSheet** - Modal drawer para detalhes (mobile)
- **SegmentedControl** - Controle segmentado (tabs)
- **TagsInput** - Input de tags para mutações
- **Skeleton** - Loading states
- **ErrorState** - Estados de erro
- **StatCard** - Cards de estatísticas do dashboard

### PWA Support
- **PWAInstallBanner** - Banner de instalação do PWA
- Configurado para funcionar offline
- Ícones e manifest configurados

### Features Especiais
- **Impersonação de Usuários** - Admins podem logar como outros usuários
- **Admin Dashboard** - Estatísticas globais do sistema e gestão de usuários
- **Consanguinidade** - Cálculo automático do coeficiente de endogamia
- **Árvore Genealógica** - Visualização interativa da genealogia
- **Scanner QR/OCR** - Leitura de QR codes e números de gaiola pela câmera
- **Verificação de E-mail** - Fluxo de verificação com badge e notificações

### Temas
- Sistema de temas (light/dark/system) em `lib/theme`
- Persistido em localStorage
- Inicializado antes do render

### Segurança
- JWT Authentication com refresh
- hCaptcha para registro
- Guards de autenticação e verificação de e-mail

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

## Comandos Docker (Desenvolvimento)

```bash
# Build do frontend (SEMPRE após mudanças)
docker exec www-php bash -c 'source /root/.bashrc && cd /var/www/meuplantel/frontend && pnpm run build'

# Dev server frontend (porta 8000)
docker exec -it www-php bash -c 'cd /var/www/meuplantel/frontend && pnpm run dev --host 0.0.0.0 --port 8000'

# Instalar dependências
docker exec www-php bash -c 'source /root/.bashrc && cd /var/www/meuplantel/frontend && pnpm install'
```

## Deploy

- **Production**: https://meuplantel.com, https://agapornis.com.br
- **API**: https://api.meuplantel.com
- **Branches**: `master` (prod), `homolog` (staging)
- **CI/CD**: GitHub Actions com FTP sync

## Convenções do Projeto

### Nomenclatura (Português + Inglês)
- **Componentes React**: PascalCase em inglês (`PassarosPage`, `CasalDetailsSheet`)
- **Variáveis de domínio**: português (`passaro`, `casal`, `postura`, `gaiola`)
- **Labels/UI**: português brasileiro
- **Tipos/Interfaces**: inglês com domínio em português (`Passaro`, `Casal`, `PosturaLog`)

### Glossário de Domínio
| Português | Inglês | Descrição |
|-----------|--------|-----------|
| Passaro | Bird | Pássaro individual com genealogia |
| Casal | Couple | Par reprodutor (macho + fêmea) |
| Gaiola | Cage | Gaiola física, representa um casal |
| Postura | Clutch | Ninhada/tentativa de reprodução |
| Anel | Ring/Band | Anilha de identificação |
| Especie | Species | Espécie do pássaro |
| Mutacao | Mutation | Mutação genética/variante de cor |
| Macho | Male | Pássaro macho (sexo=1) |
| Femea | Female | Pássaro fêmea (sexo=2) |
| Arvore | Tree | Árvore genealógica |
| Endogamia | Inbreeding | Coeficiente de consanguinidade |

### Status Comuns
- **Passaro.sit**: 1=Ativo, 2=Vendido, 3=Morto, 4=Emprestado
- **Passaro.sexo**: 1=Macho, 2=Fêmea
- **Gaiola**: `vigen_final=NULL` = casal ativo

## Pontos de Atenção para IA

1. **Mobile-First**: Toda UI é pensada para mobile (PWA), BottomSheet em vez de modais
2. **OCR/QR**: Scanner de números de gaiola (Tesseract) e QR codes (html5-qrcode)
3. **Safe Areas iOS**: Classes `safe-top`, `safe-bottom` para notch/home indicator
4. **Fullscreen Overlays**: Scanner usa `z-[60]`, modais `z-50`, FABs `z-40`
5. **Admin Features**: Impersonação, dashboard com stats, gestão de usuários
6. **Genealogia**: Árvore recursiva com cálculo de consanguinidade
7. **Verificação E-mail**: Badge em Config e BottomNav quando não verificado
8. **Docker**: Build roda via `docker exec www-php bash -c 'cd frontend && pnpm run build'`

## APIs e Integrações

- **Backend API**: Laravel REST API em `/api/v1/` (JWT auth)
- **hCaptcha**: Proteção contra bots no registro
- **Câmera**: QR codes e OCR via getUserMedia
- **TanStack Query**: Cache, refetch, optimistic updates

## Considerações de Desenvolvimento

- Sempre execute `pnpm dev` para testar mudanças localmente
- Execute `pnpm lint` antes de commits
- Build com `pnpm build` valida TypeScript
- Componentes devem ser tipados adequadamente
- Siga padrões de acessibilidade (HeadlessUI)
- Considere performance em dispositivos móveis

---

**Última atualização:** 2026-02-03
