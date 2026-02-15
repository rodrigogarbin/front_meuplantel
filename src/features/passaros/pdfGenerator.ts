/**
 * Gerador de PDF do certificado genealógico
 * Usa jsPDF para criar PDF com árvore genealógica completa
 */

import { jsPDF } from 'jspdf'
import type { Anel } from '@/types'
import { SexoEnum } from '@/types'
import { formatRingComplete, getFotoUrl } from '@/lib/passaro'
import { loadMeuPlantelLogo, imageUrlToBase64 } from '@/lib/imageUtils'
import { API_BASE_URL } from '@/lib/api'

// Tipo recursivo para o pássaro na árvore genealógica
export interface PassaroArvore {
    passaro_id: number
    descr?: string | null
    dt_nasc?: string | null
    sexo?: number | null
    passaro_pai_id?: number | null
    passaro_mae_id?: number | null
    foto?: string | null
    anel?: Anel | null
    pai?: PassaroArvore | null
    mae?: PassaroArvore | null
}

export interface UserProfile {
    name?: string | null
    sg_clube?: string | null
    nro_criador?: string | number | null
}

export interface PDFGeneratorOptions {
    passaro: PassaroArvore
    userProfile: UserProfile | null
    endogamia?: number
    includePhotos?: boolean
}

// Constantes de dimensões (mm)
const CARD_WIDTH = {
    lg: 32,
    md: 28,
    sm: 24
}

const CARD_HEIGHT = {
    lg: 18,
    md: 16,
    sm: 14
}

const FONT_SIZE = {
    lg: 8,
    md: 7,
    sm: 6
}

// Cores por sexo (RGB)
const COLORS = {
    male: {
        bg: [219, 234, 254] as [number, number, number],      // #dbeafe
        border: [59, 130, 246] as [number, number, number],   // #3b82f6
        text: [30, 64, 175] as [number, number, number]       // #1e40af
    },
    female: {
        bg: [252, 231, 243] as [number, number, number],      // #fce7f3
        border: [236, 72, 153] as [number, number, number],   // #ec4899
        text: [157, 23, 77] as [number, number, number]       // #9d174d
    },
    unknown: {
        bg: [249, 250, 251] as [number, number, number],      // #f9fafb
        border: [209, 213, 219] as [number, number, number],  // #d1d5db
        text: [107, 114, 128] as [number, number, number]     // #6b7280
    },
    connector: [245, 158, 11] as [number, number, number]     // #f59e0b (amarelo)
}

/**
 * Obtém cores baseadas no sexo
 */
function getSexoColors(sexo?: number | null) {
    if (sexo === SexoEnum.MACHO) return COLORS.male
    if (sexo === SexoEnum.FEMEA) return COLORS.female
    return COLORS.unknown
}

/**
 * Renderiza um card de pássaro no PDF
 */
async function renderBirdCard(
    pdf: jsPDF,
    passaro: PassaroArvore | null,
    x: number,
    y: number,
    size: 'lg' | 'md' | 'sm',
    isMain: boolean = false,
    includePhoto: boolean = true
): Promise<void> {
    const width = CARD_WIDTH[size]
    const height = CARD_HEIGHT[size]
    const fontSize = FONT_SIZE[size]

    if (!passaro) {
        // Card vazio (pássaro desconhecido)
        pdf.setDrawColor(...COLORS.unknown.border)
        pdf.setFillColor(...COLORS.unknown.bg)
        pdf.setLineWidth(0.3)
        // Desenha borda tracejada (sem setLineDash pois não está disponível em todas as versões)
        pdf.roundedRect(x, y, width, height, 2, 2, 'D')
        pdf.roundedRect(x, y, width, height, 2, 2, 'F')

        pdf.setTextColor(...COLORS.unknown.text)
        pdf.setFontSize(fontSize)
        pdf.text('?', x + width / 2, y + height / 2, { align: 'center', baseline: 'middle' })
        return
    }

    const colors = getSexoColors(passaro.sexo)

    // Card background
    pdf.setFillColor(...colors.bg)
    pdf.setDrawColor(...colors.border)
    pdf.setLineWidth(isMain ? 0.8 : 0.4)
    pdf.roundedRect(x, y, width, height, 2, 2, 'FD')

    // Variáveis para layout
    let textStartX = x + 2
    let hasPhoto = false
    const photoSize = 10 // 10mm para foto

    // Foto à esquerda (se disponível e includePhoto=true)
    if (passaro.foto && includePhoto) {
        try {
            console.log(`📸 Tentando carregar foto para pássaro ${passaro.passaro_id}:`, passaro.foto)
            const photoUrl = getFotoUrl(passaro.foto, API_BASE_URL)
            console.log(`🔗 URL da foto:`, photoUrl)

            if (photoUrl) {
                const photoBase64 = await imageUrlToBase64(photoUrl)
                console.log(`🖼️ Base64 obtido:`, photoBase64 ? `${photoBase64.substring(0, 50)}...` : 'null')

                if (photoBase64) {
                    // Centraliza foto verticalmente no card
                    const photoY = y + (height - photoSize) / 2
                    console.log(`✅ Adicionando imagem no PDF na posição (${x + 2}, ${photoY})`)
                    pdf.addImage(photoBase64, 'JPEG', x + 2, photoY, photoSize, photoSize)
                    textStartX = x + photoSize + 4 // Texto começa após a foto
                    hasPhoto = true
                } else {
                    console.warn(`⚠️ Base64 null para pássaro ${passaro.passaro_id}`)
                }
            } else {
                console.warn(`⚠️ PhotoUrl null para pássaro ${passaro.passaro_id}`)
            }
        } catch (error) {
            console.error(`❌ Erro ao carregar foto do pássaro ${passaro.passaro_id}:`, error)
        }
    } else {
        if (!passaro.foto) {
            console.log(`ℹ️ Pássaro ${passaro.passaro_id} não tem foto`)
        }
    }

    // Área de texto (à direita da foto se houver, ou centralizado)
    const textWidth = hasPhoto ? width - photoSize - 6 : width - 4
    const textCenterX = hasPhoto ? textStartX + textWidth / 2 : x + width / 2

    // Anel
    const ring = formatRingComplete(passaro.anel) || `#${passaro.passaro_id}`
    pdf.setTextColor(...colors.text)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(fontSize)

    // Se tem descrição, anel fica mais em cima
    const ringY = passaro.descr ? y + height / 2 - 2 : y + height / 2
    pdf.text(ring, textCenterX, ringY, {
        align: 'center',
        baseline: 'middle',
        maxWidth: textWidth
    })

    // Descrição (abaixo do anel)
    if (passaro.descr) {
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(fontSize - 1)
        pdf.text(passaro.descr, textCenterX, y + height / 2 + 3, {
            align: 'center',
            baseline: 'middle',
            maxWidth: textWidth
        })
    }
}

/**
 * Renderiza linhas conectoras horizontais
 */
function renderHorizontalLine(pdf: jsPDF, x: number, y: number, length: number): void {
    pdf.setDrawColor(...COLORS.connector)
    pdf.setLineWidth(0.5)
    pdf.line(x, y, x + length, y)
}

/**
 * Renderiza linhas conectoras verticais
 */
function renderVerticalLine(pdf: jsPDF, x: number, y1: number, y2: number): void {
    pdf.setDrawColor(...COLORS.connector)
    pdf.setLineWidth(0.5)
    pdf.line(x, y1, x, y2)
}

/**
 * Renderiza par de ancestrais (pai e mãe) recursivamente
 */
async function renderAncestorPair(
    pdf: jsPDF,
    pai: PassaroArvore | null | undefined,
    mae: PassaroArvore | null | undefined,
    x: number,
    y: number,
    level: number,
    maxLevel: number,
    includePhotos: boolean
): Promise<void> {
    console.log(`📊 Renderizando nível ${level} na posição (${x}, ${y})`)
    const size = level >= 2 ? 'sm' : 'md'
    const cardHeight = CARD_HEIGHT[size]
    const cardWidth = CARD_WIDTH[size]
    const spacing = 15 // Espaçamento vertical entre pai e mãe (aumentado para evitar sobreposição)

    // Renderiza pai (em cima)
    console.log(`👨 Renderizando pai no nível ${level}:`, pai ? `ID ${pai.passaro_id}` : 'null')
    await renderBirdCard(pdf, pai ?? null, x, y, size, false, includePhotos)

    // Renderiza mãe (embaixo)
    const maeY = y + cardHeight + spacing
    console.log(`👩 Renderizando mãe no nível ${level}:`, mae ? `ID ${mae.passaro_id}` : 'null')
    await renderBirdCard(pdf, mae ?? null, x, maeY, size, false, includePhotos)

    // Linha vertical conectora entre pai e mãe
    const lineX = x - 5
    const lineY1 = y + cardHeight / 2
    const lineY2 = maeY + cardHeight / 2
    renderVerticalLine(pdf, lineX, lineY1, lineY2)

    // Recursão para próxima geração
    if (level < maxLevel) {
        const nextX = x + cardWidth + 18 // Espaçamento horizontal aumentado
        const connectorLength = 10

        // Linha conectora horizontal do pai
        if (pai && (pai.pai || pai.mae)) {
            const paiConnectorY = y + cardHeight / 2
            renderHorizontalLine(pdf, x + cardWidth, paiConnectorY, connectorLength)

            await renderAncestorPair(
                pdf,
                pai.pai,
                pai.mae,
                nextX,
                y,
                level + 1,
                maxLevel,
                includePhotos
            )
        }

        // Linha conectora horizontal da mãe
        if (mae && (mae.pai || mae.mae)) {
            const maeConnectorY = maeY + cardHeight / 2
            renderHorizontalLine(pdf, x + cardWidth, maeConnectorY, connectorLength)

            await renderAncestorPair(
                pdf,
                mae.pai,
                mae.mae,
                nextX,
                maeY,
                level + 1,
                maxLevel,
                includePhotos
            )
        }
    }
}

/**
 * Renderiza cabeçalho do PDF
 */
async function renderHeader(pdf: jsPDF): Promise<void> {
    try {
        // Logo
        console.log('🖼️ Carregando logo para o cabeçalho...')
        const logoBase64 = await loadMeuPlantelLogo(60) // 60px
        console.log('✅ Logo carregado, adicionando ao PDF na posição (10, 10)')
        pdf.addImage(logoBase64, 'PNG', 10, 10, 15, 15)
        console.log('✅ Logo adicionado com sucesso!')
    } catch (error) {
        console.error('❌ Erro ao carregar logo MeuPlantel:', error)
    }

    // Título principal
    pdf.setTextColor(33, 150, 243) // #2196f3
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(18)
    pdf.text('MEUPLANTEL.COM', 30, 18)

    // Subtítulo
    pdf.setTextColor(107, 114, 128) // #6b7280
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.text('Sistema de Gerenciamento de Criação de Aves', 30, 23)

    // Linha separadora
    pdf.setDrawColor(30, 64, 175) // #1e40af
    pdf.setLineWidth(0.5)
    pdf.line(10, 28, 287, 28)

    // Título do certificado
    pdf.setTextColor(30, 64, 175) // #1e40af
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(14)
    pdf.text('CERTIFICADO GENEALÓGICO', 148.5, 38, { align: 'center' })
}

/**
 * Renderiza rodapé do PDF
 */
function renderFooter(
    pdf: jsPDF,
    userProfile: UserProfile | null,
    endogamia?: number
): void {
    const footerY = 190

    // Linha separadora
    pdf.setDrawColor(229, 231, 235) // #e5e7eb
    pdf.setLineWidth(0.3)
    pdf.line(10, footerY, 287, footerY)

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(107, 114, 128) // #6b7280

    // Criador
    pdf.setFont('helvetica', 'bold')
    pdf.text('Criador', 30, footerY + 5, { align: 'center' })
    pdf.setFont('helvetica', 'normal')
    pdf.text(userProfile?.name || 'Não informado', 30, footerY + 10, { align: 'center' })

    // Registro
    const registro = userProfile?.sg_clube && userProfile?.nro_criador
        ? `${userProfile.sg_clube} ${userProfile.nro_criador}`.trim()
        : 'Não informado'
    pdf.setFont('helvetica', 'bold')
    pdf.text('Registro', 100, footerY + 5, { align: 'center' })
    pdf.setFont('helvetica', 'normal')
    pdf.text(registro, 100, footerY + 10, { align: 'center' })

    // Consanguinidade (se > 0)
    if (endogamia && endogamia > 0) {
        pdf.setFont('helvetica', 'bold')
        pdf.text('Consanguinidade', 170, footerY + 5, { align: 'center' })
        pdf.setFont('helvetica', 'normal')
        pdf.text(`${(endogamia * 100).toFixed(1)}%`, 170, footerY + 10, { align: 'center' })
    }

    // Data de emissão
    const dataEmissao = new Date().toLocaleDateString('pt-BR')
    pdf.setFont('helvetica', 'bold')
    pdf.text('Emissão', 245, footerY + 5, { align: 'center' })
    pdf.setFont('helvetica', 'normal')
    pdf.text(dataEmissao, 245, footerY + 10, { align: 'center' })

    // Legenda de cores
    const legendY = footerY + 5
    const legendX = 140

    // Macho
    pdf.setFillColor(...COLORS.male.bg)
    pdf.setDrawColor(...COLORS.male.border)
    pdf.roundedRect(legendX, legendY - 2, 3, 3, 0.5, 0.5, 'FD')
    pdf.setTextColor(107, 114, 128)
    pdf.text('Macho', legendX + 5, legendY)

    // Fêmea
    pdf.setFillColor(...COLORS.female.bg)
    pdf.setDrawColor(...COLORS.female.border)
    pdf.roundedRect(legendX + 20, legendY - 2, 3, 3, 0.5, 0.5, 'FD')
    pdf.text('Fêmea', legendX + 25, legendY)
}

/**
 * Gera PDF do certificado genealógico
 * @returns Promise com Blob do PDF
 */
export async function generateGenealogyPDF(
    options: PDFGeneratorOptions
): Promise<Blob> {
    const { passaro, userProfile, endogamia, includePhotos = true } = options

    console.log('🔵 Iniciando geração do PDF...', { passaro, includePhotos })

    try {
        // Cria PDF A4 landscape
        console.log('📄 Criando documento PDF...')
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
            compress: true
        })

        // Renderiza cabeçalho
        console.log('📋 Renderizando cabeçalho...')
        await renderHeader(pdf)

        // Árvore genealógica
        const treeStartY = 50 // Posição Y inicial
        let currentX = 15 // Posição X inicial com mais margem

        // Pássaro principal
        console.log('🐦 Renderizando pássaro principal...')
        await renderBirdCard(pdf, passaro, currentX, treeStartY, 'lg', true, includePhotos)
        currentX += CARD_WIDTH.lg + 8 // Espaço após card principal

        // Linha conectora
        const mainConnectorY = treeStartY + CARD_HEIGHT.lg / 2
        renderHorizontalLine(pdf, currentX, mainConnectorY, 10)
        currentX += 15 // Espaço antes dos ancestrais

        // Ancestrais (3 gerações)
        console.log('👨‍👩‍👧‍👦 Renderizando ancestrais...')
        console.log('Pai:', passaro.pai ? `ID ${passaro.pai.passaro_id}` : 'null')
        console.log('Mãe:', passaro.mae ? `ID ${passaro.mae.passaro_id}` : 'null')

        // Calcula Y para centralizar ancestrais em relação ao pássaro principal
        const pairHeight = CARD_HEIGHT.md * 2 + 15 // altura pai + espaço + altura mãe
        const ancestorsStartY = treeStartY + (CARD_HEIGHT.lg / 2) - (pairHeight / 2)

        await renderAncestorPair(
            pdf,
            passaro.pai,
            passaro.mae,
            currentX,
            ancestorsStartY,
            1,
            3,
            includePhotos
        )

        // Rodapé
        console.log('📝 Renderizando rodapé...')
        renderFooter(pdf, userProfile, endogamia)

        // Retorna como Blob
        console.log('✅ PDF gerado com sucesso!')
        const blob = pdf.output('blob')
        console.log('📦 Tamanho do blob:', blob.size, 'bytes')
        return blob
    } catch (error) {
        console.error('❌ Erro ao gerar PDF:', error)
        console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A')
        throw new Error(
            error instanceof Error
                ? `Erro ao gerar PDF: ${error.message}`
                : 'Erro desconhecido ao gerar PDF'
        )
    }
}
