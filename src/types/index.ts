/**
 * Tipos de dados do sistema MeuPlantel
 */

// Anel/Anilha do pássaro
export interface Anel {
    anel_id?: number
    ano: number
    nro: number
    nro_criador?: string | null
    sg_clube?: string | null
    ident_extra?: string | null
}

// Mutação genética
export interface Mutacao {
    mutacao_id?: number
    descr?: string | null
    descricao?: string | null
}

// Grupo de espécies
export interface Grupo {
    grupo_id: number
    descr: string
    dias_choco?: number | null
    dias_anilha?: number | null
    dias_separa?: number | null
}

// Espécie cadastrada pelo usuário
export interface EspecieUsuario {
    especie_usuario_id?: number
    id?: number // API v1 retorna como 'id'
    descr?: string | null
    grupo_id?: number | null
    dias_choco?: number | null
    dias_anilha?: number | null
    dias_separa?: number | null
}

// Referência a um pássaro (pai/mãe)
export interface PassaroRef {
    passaro_id: number
    descr?: string | null
    anel?: Anel | null
    mutacao?: Mutacao | null
}

// Pássaro completo
export interface Passaro {
    passaro_id: number
    descr?: string | null
    dt_nasc?: string | null
    sexo?: number | null // 1 = macho, 2 = fêmea
    sit?: number | null // 1 = ativo
    obs?: string | null
    foto?: string | null
    portador?: string | null
    especie_usuario_id?: number | null
    mutacao_id?: number | null
    passaro_pai_id?: number | null
    passaro_mae_id?: number | null
    transferido_em?: string | null
    anel?: Anel | null
    mutacao?: Mutacao | null
    // CasalResource retorna como 'especie'
    especie?: EspecieUsuario | null
    pai?: PassaroRef | null
    mae?: PassaroRef | null
}

// Payload para criar pássaro
export interface CreatePassaroPayload {
    // Dados do Anel
    ano: number
    nro: number
    nro_criador?: string | null
    sg_clube?: string | null
    clube_usuario_id?: number | null
    // Dados do Pássaro
    sexo: number // 1 = macho, 2 = fêmea
    dt_nasc: string // formato YYYY-MM-DD
    especie_usuario_id?: number | null
    mutacao_id?: number | null
    grupo_id?: number | null
    passaro_pai_id?: number | null
    passaro_mae_id?: number | null
    obs?: string | null
    sit?: number | null
    descr?: string | null
    portador?: string | null
    postura_id?: number | null
}

// Payload para atualizar pássaro
export interface UpdatePassaroPayload extends Partial<CreatePassaroPayload> {
    passaro_id: number
}

// Usuário autenticado
export interface User {
    usuario_id: number
    nome: string
    username: string
    email?: string | null
    needs_email?: boolean
    email_verified?: boolean
    is_admin?: boolean
    is_demo?: boolean
    sg_clube?: string | null
    nro_criador?: string | null
}

// Usuário retornado pelo endpoint de impersonação (backend usa 'name' em vez de 'nome')
export interface ImpersonateUser {
    usuario_id: number
    name: string
    email?: string | null
    needs_email?: boolean
    email_verified?: boolean
    is_admin?: boolean
}

// Resposta de impersonação
export interface ImpersonateResponse {
    expires_in: number
    user: ImpersonateUser
    impersonating: boolean
}

// Resposta de login
export interface LoginResponse {
    expires_in: number
    user: User
}

// Resposta de refresh
export interface RefreshResponse {
    expires_in: number
}

// Filtros para busca de pássaros
export interface PassaroFilters {
    sit?: number
    sexo?: number
    passaro_pai_id?: number
    passaro_mae_id?: number
    ano?: number
    nro?: string    // Busca parcial por número do anel
    descr?: string  // Busca parcial por descrição
    search?: string // Busca por anel OU descrição
    especie_usuario_id?: number | number[] // Filtro por espécie (um ou vários IDs)
}

// Sexo enum helpers
export const SexoEnum = {
    MACHO: 1,
    FEMEA: 2,
    INDEFINIDO: 0,
} as const

export type SexoType = (typeof SexoEnum)[keyof typeof SexoEnum]

export const SexoLabels: Record<number, string> = {
    [SexoEnum.MACHO]: 'Macho',
    [SexoEnum.FEMEA]: 'Fêmea',
    [SexoEnum.INDEFINIDO]: 'Indefinido',
}

// Situação enum helpers
export const SituacaoEnum = {
    ATIVO: 1,
    INATIVO: 2,
    TRANSFERIDO: 3,
    OBITO: 4,
} as const

export type SituacaoType = (typeof SituacaoEnum)[keyof typeof SituacaoEnum]

export const SituacaoLabels: Record<number, string> = {
    [SituacaoEnum.ATIVO]: 'Ativo',
    [SituacaoEnum.INATIVO]: 'Inativo',
    [SituacaoEnum.TRANSFERIDO]: 'Transferido',
    [SituacaoEnum.OBITO]: 'Óbito',
}

// Portador de mutação
export interface Portador {
    descr: string
    tp: number // 1 = portador, 2 = possível portador
}

export const PortadorTipo = {
    PORTADOR: 1,
    POSSIVEL_PORTADOR: 2,
} as const

// Postura (ovo)
export interface Postura {
    postura_id: number
    gaiola_id: number
    gaiola_origem_id?: number | null // ID do casal de origem (quando transferido)
    transferido?: boolean // Flag indicando se foi transferido
    nro?: number | null
    data?: string | null
    data_nasc?: string | null
    sit?: number | null
    passaro_id?: number | null
    nro_rodada?: number | null
    nro_anel?: number | null
    ano_anel?: number | null
    obs?: string | null
    data_separa?: string | null
    casal?: {
        id: number
        nro: number
        dias_choco?: number | null
        dias_anilha?: number | null
        dias_separa?: number | null
        macho?: {
            id: number
            descr?: string | null
            anel?: {
                ano: number
                nro: number
                sg_clube?: string | null
            }
        }
        femea?: {
            id: number
            descr?: string | null
            anel?: {
                ano: number
                nro: number
                sg_clube?: string | null
            }
        }
    } | null
    casal_origem?: {
        id: number
        nro: number
        macho?: {
            id: number
            descr?: string | null
            anel?: {
                ano: number
                nro: number
                sg_clube?: string | null
            }
        }
        femea?: {
            id: number
            descr?: string | null
            anel?: {
                ano: number
                nro: number
                sg_clube?: string | null
            }
        }
    } | null
}

// Situação da postura
export const SitPostura = {
    CHOCO: 0,
    NASCIDO: 1,
    BRANCO: 2,
    EMBRIAO_MORTO: 3,
    FILHOTE_MORTO: 4,
    FERTIL: 5,
} as const

export type SitPosturaType = (typeof SitPostura)[keyof typeof SitPostura]

export const SitPosturaLabels: Record<number, string> = {
    [SitPostura.CHOCO]: 'Chocando',
    [SitPostura.NASCIDO]: 'Nascido',
    [SitPostura.BRANCO]: 'Branco/Infértil',
    [SitPostura.EMBRIAO_MORTO]: 'Embrião Morto',
    [SitPostura.FILHOTE_MORTO]: 'Filhote Morto',
    [SitPostura.FERTIL]: 'Fértil',
}

// Color classes (Tailwind) for each postura status — used in UI components
export const SitPosturaColors: Record<number, string> = {
    [SitPostura.CHOCO]: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    [SitPostura.NASCIDO]: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
    [SitPostura.BRANCO]: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    [SitPostura.EMBRIAO_MORTO]: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    [SitPostura.FILHOTE_MORTO]: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    [SitPostura.FERTIL]: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
}

// Payload para criar postura
export interface CreatePosturaPayload {
    data: string // formato YYYY-MM-DD
    sit: number // 0 = Choco (padrão para novo ovo)
    data_nasc?: string | null
    nro_rodada?: number | null
    passaro_id?: number | null
    nro_anel?: number | null
    ano_anel?: number | null
    obs?: string | null
}

// Casal (Gaiola)
export interface Casal {
    id?: number // API retorna como 'id'
    gaiola_id?: number // Campo original do banco
    nro?: number | null
    usuario_id?: number | null
    passaro_macho_id?: number | null
    passaro_femea_id?: number | null
    vigen_inicial?: string | null
    vigen_final?: string | null
    nro_rodadas?: number | null
    descr_pai?: string | null
    descr_mae?: string | null
    macho?: Passaro | null
    femea?: Passaro | null
    posturas?: Postura[]
    posturas_transferidas?: Postura[] // Ovos que foram transferidos DESTE casal para outro
    ativo?: boolean
    // Campos calculados que a API pode retornar
    total_ovos?: number
    total_nascidos?: number
}

// Filtros para busca de casais
export interface CasalFilters {
    sit?: number // 1 = ativos (sem vigen_final)
    passaro_macho_id?: number
    passaro_femea_id?: number
    nro?: number
}

// Payload para criar/atualizar casal
export interface CreateCasalPayload {
    nro: number
    passaro_macho_id?: number | null
    passaro_femea_id?: number | null
    vigen_inicial?: string | null // formato YYYY-MM-DD
    vigen_final?: string | null
    descr_pai?: string | null
    descr_mae?: string | null
}

export interface UpdateCasalPayload extends Partial<CreateCasalPayload> {
    gaiola_id: number
}

// ========================================
// Medicamentos, Doenças e Sintomas
// ========================================

// Sintoma
export interface Sintoma {
    sintoma_id: number
    id?: number // API pode retornar como 'id'
    nome: string
    descricao?: string | null
}

// Doença
export interface Doenca {
    doenca_id: number
    id?: number // API pode retornar como 'id'
    nome: string
    descricao?: string | null
    sintomas?: Sintoma[]
}

// Medicamento
export interface Medicamento {
    medicamento_id: number
    id?: number // API pode retornar como 'id'
    nome: string
    dosagem?: string | null
    principio_ativo?: string | null
    doencas?: Doenca[]
}

// Payload para criar medicamento
export interface CreateMedicamentoPayload {
    nome: string
    dosagem?: string | null
    principio_ativo?: string | null
    doenca_ids?: number[]
}

// Payload para atualizar medicamento
export interface UpdateMedicamentoPayload extends Partial<CreateMedicamentoPayload> {
    medicamento_id: number
}
