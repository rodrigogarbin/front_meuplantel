/**
 * Utilitários para conversão de imagens
 * Usados na geração de PDF com jsPDF
 */

/**
 * Converte SVG string para PNG base64
 * @param svgString - Conteúdo do SVG
 * @param width - Largura da imagem final em pixels
 * @param height - Altura da imagem final em pixels
 * @returns Promise com base64 string (formato: data:image/png;base64,...)
 */
export async function svgToBase64PNG(
    svgString: string,
    width: number,
    height: number
): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            // Cria blob URL temporário do SVG
            const blob = new Blob([svgString], { type: 'image/svg+xml' })
            const url = URL.createObjectURL(blob)

            // Cria elemento de imagem
            const img = new Image()
            img.width = width
            img.height = height

            img.onload = () => {
                try {
                    // Cria canvas para renderização
                    const canvas = document.createElement('canvas')
                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')

                    if (!ctx) {
                        throw new Error('Não foi possível criar contexto 2D do canvas')
                    }

                    // Renderiza imagem no canvas
                    ctx.drawImage(img, 0, 0, width, height)

                    // Converte para PNG base64
                    const base64 = canvas.toDataURL('image/png')

                    // Limpa blob URL
                    URL.revokeObjectURL(url)

                    resolve(base64)
                } catch (error) {
                    URL.revokeObjectURL(url)
                    reject(error)
                }
            }

            img.onerror = (error) => {
                URL.revokeObjectURL(url)
                reject(new Error('Erro ao carregar SVG: ' + error))
            }

            img.src = url
        } catch (error) {
            reject(error)
        }
    })
}

/**
 * Busca imagem de URL e converte para base64
 * @param url - URL da imagem
 * @param timeout - Timeout em ms (padrão: 3000ms)
 * @returns Promise com base64 string ou null se falhar
 */
export async function imageUrlToBase64(
    url: string,
    timeout = 3000
): Promise<string | null> {
    return new Promise((resolve) => {
        try {
            const img = new Image()
            img.crossOrigin = 'anonymous' // Permite CORS se o servidor suportar

            // Timeout para evitar travamento
            const timeoutId = setTimeout(() => {
                console.warn(`Timeout ao carregar imagem: ${url}`)
                resolve(null)
            }, timeout)

            img.onload = () => {
                try {
                    clearTimeout(timeoutId)

                    // Cria canvas
                    const canvas = document.createElement('canvas')
                    canvas.width = img.width
                    canvas.height = img.height
                    const ctx = canvas.getContext('2d')

                    if (!ctx) {
                        console.warn('Não foi possível criar contexto 2D do canvas')
                        resolve(null)
                        return
                    }

                    // Renderiza imagem
                    ctx.drawImage(img, 0, 0)

                    // Converte para JPEG base64 (melhor compressão)
                    const base64 = canvas.toDataURL('image/jpeg', 0.7)

                    resolve(base64)
                } catch (error) {
                    clearTimeout(timeoutId)
                    console.warn('Erro ao converter imagem para base64:', error)
                    resolve(null)
                }
            }

            img.onerror = (error) => {
                clearTimeout(timeoutId)
                console.warn('Erro ao carregar imagem:', url, error)
                resolve(null)
            }

            img.src = url
        } catch (error) {
            console.warn('Erro ao processar imagem:', error)
            resolve(null)
        }
    })
}

/**
 * Carrega o logo do MeuPlantel como PNG base64
 * @param size - Tamanho do logo em pixels (padrão: 80)
 * @returns Promise com base64 PNG do logo
 */
export async function loadMeuPlantelLogo(size = 80): Promise<string> {
    console.log('🖼️ Carregando logo MeuPlantel...')
    try {
        // Busca o favicon SVG do public
        const response = await fetch('/favicon.svg')

        if (!response.ok) {
            throw new Error(`Não foi possível carregar logo: HTTP ${response.status}`)
        }

        const svgString = await response.text()
        console.log('✅ SVG carregado, tamanho:', svgString.length, 'chars')

        // Converte para PNG base64
        console.log('🔄 Convertendo SVG para PNG base64...')
        const base64 = await svgToBase64PNG(svgString, size, size)
        console.log('✅ Logo convertido com sucesso!')

        return base64
    } catch (error) {
        console.error('❌ Erro ao carregar logo MeuPlantel:', error)

        // Fallback: tenta usar PNG pré-renderizado
        console.log('🔄 Tentando fallback para PNG...')
        try {
            const pngBase64 = await imageUrlToBase64('/icons/icon-192x192.png')
            if (pngBase64) {
                console.log('✅ Fallback PNG carregado!')
                return pngBase64
            }
        } catch (fbError) {
            console.error('❌ Fallback PNG também falhou:', fbError)
        }

        throw new Error('Não foi possível carregar logo do MeuPlantel')
    }
}
