import type { BemImportacao, DadosPDFExtraidos } from '@/interface/importacao';

/**
 * Processa PDF de relatórios patrimoniais da UEG e extrai dados de bens
 * Formato específico do Sistema de Patrimônio Mobiliário da UEG
 */
export class PDFProcessor {
  private static async extrairTextoPDF(arquivo: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          // Para usar com pdfjs-dist
          if (window.pdfjsLib) {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let textoCompleto = '';
            
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
              const page = await pdf.getPage(pageNum);
              const textContent = await page.getTextContent();
              const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
              textoCompleto += pageText + '\n';
            }
            
            resolve(textoCompleto);
          } else {
            reject(new Error('PDF.js não carregado'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsArrayBuffer(arquivo);
    });
  }

  /**
   * Função principal para processar PDF do relatório patrimonial UEG
   */
  static async processarPDF(arquivo: File): Promise<DadosPDFExtraidos> {
    try {
      // Extrair texto do PDF
      const textoExtraido = await this.extrairTextoPDF(arquivo);
      
      // Processar especificamente o formato UEG
      const bensDetectados = await this.analisarRelatorioUEG(textoExtraido);
      
      // Calcular estatísticas
      const estatisticas = {
        total_bens: bensDetectados.length,
        campos_preenchidos: {
          numero_patrimonio: bensDetectados.filter(b => b.numero_patrimonio).length,
          nome_bem: bensDetectados.filter(b => b.nome_bem).length,
          marca: bensDetectados.filter(b => b.marca && b.marca !== 'MARCA NÃO INFORMADA').length,
          modelo: bensDetectados.filter(b => b.modelo).length,
          numero_serie: bensDetectados.filter(b => b.numero_serie).length,
        },
      };
      
      return {
        texto_extraido: textoExtraido,
        bens_detectados: bensDetectados,
        estatisticas,
      };
    } catch (error) {
      console.error('Erro ao processar PDF:', error);
      throw new Error(`Erro ao processar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
  * Analisa relatório patrimonial UEG baseado no formato específico
  * Formato da linha: DESCRIÇÃO + R$ VALOR_ATUAL + TOMBAMENTO(9d) + TOMBAMENTO_ANT(7d) + ESPÉCIE + CLASSE + R$ VALOR_AQUISIÇÃO + MARCA + ESTADO
   */
  static async analisarRelatorioUEG(texto: string): Promise<BemImportacao[]> {
    const bens: BemImportacao[] = [];
    const linhas = texto.split('\n');
    
    let orgao = 'UNIVERSIDADE ESTADUAL DE GOIÁS - UEG';
    let unidadeAdmin = '';
    let localizacaoAtual = '';
    
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i]?.trim();
      if (!linha) continue;
      
      // Extrair informações de contexto
      if (linha.includes('ÓRGÃO:')) {
        orgao = linha.replace(/.*ÓRGÃO:\s*/i, '').trim();
        continue;
      }
      
      if (linha.includes('UNIDADE ADM.:')) {
        unidadeAdmin = linha.replace(/.*UNIDADE ADM\.:\s*/i, '').trim();
        continue;
      }
      
      if (linha.includes('LOCALIZAÇÃO:')) {
        localizacaoAtual = linha.replace(/.*LOCALIZAÇÃO:\s*/i, '').trim();
        continue;
      }
      
      // Pular cabeçalhos e linhas irrelevantes
      if (this.isLinhaIrrelevante(linha)) {
        continue;
      }
      
      // Verificar se é uma linha de bem (contém número de tombamento de 9 dígitos)
      const matchTombamento = linha.match(/\b(\d{9})\b/);
      if (matchTombamento) {
        const bem = this.extrairBemDaLinha(linha, orgao, unidadeAdmin, localizacaoAtual);
        if (bem) {
          bens.push(bem);
        }
      }
    }
    
    return bens;
  }

  /**
   * Verifica se a linha deve ser ignorada
   */
  private static isLinhaIrrelevante(linha: string): boolean {
    const patterns = [
      /DESCRIÇÃO.*VALOR ATUAL.*TOMBAMENTO/i,
      /TOMBAMENTO.*N\.\s*SÉRIE/i,
      /Pág\.\s*\d+\s*de\s*\d+/i,
      /Sistema de Patrimônio/i,
      /Secretaria de Estado/i,
      /Por Exercício:/i,
      /Situação do Bem:/i,
    ];
    
    return patterns.some(pattern => pattern.test(linha));
  }

  /**
   * Extrai dados de bem de uma linha específica
   * Exemplo: "RÉGUA PARA RACK DE SOM R$ 15,43 000760130 0139853 RÉGUA MÁQUINAS, INSTALAÇÕES E UTENSÍLIOS DE ESCRITÓRIO R$ 150,00 BOM MARCA NÃO INFORMADA"
   */
  private static extrairBemDaLinha(
    linha: string, 
    orgao: string, 
    unidadeAdmin: string, 
    localizacao: string
  ): BemImportacao | null {
    try {
      // 1. Encontrar número de tombamento (9 dígitos)
      const matchTombamento = linha.match(/\b(\d{9})\b/);
      if (!matchTombamento) return null;
      
      const numeroPatrimonio = matchTombamento[1];
      
      // 2. Dividir linha em seções baseado no tombamento
      const partes = linha.split(numeroPatrimonio);
      if (partes.length < 2) return null;
      
      const antesTombamento = partes[0].trim();
      const depoisTombamento = partes[1].trim();
      
      // 3. Extrair descrição (remove o valor atual)
      let descricao = antesTombamento;
      const matchDescricaoValor = antesTombamento.match(/^(.+?)\s+R\$\s*[\d.,]+\s*$/);
      if (matchDescricaoValor) {
        descricao = matchDescricaoValor[1].trim();
      }
      
      // 4. Processar dados após tombamento
      const dadosExtras = this.processarDadosAposTombamento(depoisTombamento, linha);
      
      // 5. Determinar categoria baseada na classe
      const categoria = this.mapearCategoriaUEG(dadosExtras.classe || dadosExtras.especie || descricao);

      // 6. Determinar nome do bem: preferir espécie quando disponível
      const nome_bem = (dadosExtras.especie && dadosExtras.especie.trim())
        ? dadosExtras.especie.trim()
        : (descricao || `Bem ${numeroPatrimonio}`);
      
      return {
        numero_patrimonio: numeroPatrimonio,
  nome_bem,
        descricao: descricao,
        marca: dadosExtras.marca && dadosExtras.marca !== 'MARCA NÃO INFORMADA' ? dadosExtras.marca : undefined,
        modelo: dadosExtras.modelo,
        numero_serie: dadosExtras.numeroSerie,
  // valores monetários
  valor_aquisicao: dadosExtras.valorAquisicao,
  valor_atual: dadosExtras.valorAtual,
        data_aquisicao: new Date().toISOString().split('T')[0],
        estado_conservacao: this.normalizarEstado(dadosExtras.estado),
        observacoes: dadosExtras.observacoes,
        local: {
          nome_local: localizacao || 'Local não especificado',
          tipo_local: this.identificarTipoLocal(localizacao),
          andar: this.extrairAndar(localizacao),
          bloco: this.extrairBloco(localizacao),
          setor: {
            nome_setor: unidadeAdmin || orgao,
            descricao: unidadeAdmin ? `Unidade: ${unidadeAdmin}` : `Órgão: ${orgao}`,
          },
        },
        categoria: {
          nome_categoria: categoria,
          descricao: `Classe original: ${dadosExtras.classe || dadosExtras.especie || 'Não informada'}`,
          codigo_categoria: this.gerarCodigoCategoria(categoria),
        },
      };
    } catch (error) {
      console.error('Erro ao processar linha:', linha, error);
      return null;
    }
  }

  /**
   * Processa dados que vêm após o número de tombamento
   * Formato esperado: TOMBAMENTO_ANT(7d) + ESPÉCIE + CLASSE + R$ VALOR + MARCA + ESTADO
   */
  private static processarDadosAposTombamento(texto: string, linhaCompleta: string): {
    tombamentoAnterior?: string;
    especie?: string;
    classe?: string;
    valorAtual?: number;
    valorAquisicao?: number;
    marca?: string;
    estado?: string;
    numeroSerie?: string;
    modelo?: string;
    observacoes?: string;
  } {
    const resultado: any = {};
    
    // 1. Extrair tombamento anterior (7 dígitos)
    const matchTombamentoAnt = texto.match(/^\s*(\d{7})/);
    if (matchTombamentoAnt) {
      resultado.tombamentoAnterior = matchTombamentoAnt[1];
      // Remove tombamento anterior do texto para processar o resto
      texto = texto.replace(matchTombamentoAnt[0], '').trim();
    }
    
    // 2. Extrair valores monetários da linha completa
    const valoresR$ = linhaCompleta.match(/R\$\s*([\d.,]+)/g);
    if (valoresR$ && valoresR$.length >= 1) {
      // Primeiro valor é o valor atual
      const valorAtual = valoresR$[0];
      resultado.valorAtual = this.parseValor(valorAtual.replace('R$', '').trim());
      // Último valor é geralmente valor de aquisição
      if (valoresR$.length >= 2) {
        const valorAquisicao = valoresR$[valoresR$.length - 1];
        resultado.valorAquisicao = this.parseValor(valorAquisicao.replace('R$', '').trim());
      }
    }
    
    // 3. Extrair estado de conservação
    const matchEstado = texto.match(/\b(BOM|NOVO|REGULAR|RUIM|PÉSSIMO)\b/i);
    if (matchEstado) {
      resultado.estado = matchEstado[1];
    }
    
    // 4. Extrair marca (texto entre valor e estado)
    let marca = '';
    if (resultado.estado) {
      // Dividir por R$ para encontrar seção com marca
      const secaoMarca = texto.split(/R\$\s*[\d.,]+/).pop()?.trim();
      if (secaoMarca) {
        // Remover estado para ficar só com a marca
        const marcaSemEstado = secaoMarca.replace(/\b(BOM|NOVO|REGULAR|RUIM|PÉSSIMO)\b/i, '').trim();
        if (marcaSemEstado && marcaSemEstado !== 'MARCA NÃO INFORMADA') {
          marca = marcaSemEstado;
        } else if (secaoMarca.includes('MARCA NÃO INFORMADA')) {
          marca = 'MARCA NÃO INFORMADA';
        }
      }
    }
    resultado.marca = marca;
    
    // 5. Extrair espécie e classe (entre tombamento anterior e valor de aquisição)
    const textoEntrePatrimonios = texto.replace(/R\$\s*[\d.,]+.*$/, '').trim();
    
    if (textoEntrePatrimonios) {
      // Dividir em partes para separar espécie e classe
      const partes = textoEntrePatrimonios.split(/\s{2,}/).filter(p => p.trim());
      
      if (partes.length >= 1) {
        resultado.especie = partes[0].trim();
      }
      
      if (partes.length >= 2) {
        resultado.classe = partes.slice(1).join(' ').trim();
      } else if (partes.length === 1) {
        // Se só tem uma parte, pode ser classe
        resultado.classe = partes[0].trim();
      }
    }
    
    return resultado;
  }

  /**
   * Converte valor monetário string para número
   */
  private static parseValor(valorStr: string): number {
    if (!valorStr) return 0;
    const valorLimpo = valorStr.replace(/\./g, '').replace(',', '.');
    const valor = parseFloat(valorLimpo);
    return isNaN(valor) ? 0 : valor;
  }

  /**
   * Normaliza estado de conservação
   */
  private static normalizarEstado(estado?: string): string {
    if (!estado) return 'bom';
    
    const estadoMap: Record<string, string> = {
      'BOM': 'bom',
      'NOVO': 'novo',
      'REGULAR': 'regular', 
      'RUIM': 'ruim',
      'PÉSSIMO': 'péssimo',
    };
    
    return estadoMap[estado.toUpperCase()] || 'bom';
  }

  /**
   * Mapeia classe UEG para categorias do sistema
   */
  private static mapearCategoriaUEG(classeOuEspecie: string): string {
    if (!classeOuEspecie) return 'Outros Equipamentos';
    
    const texto = classeOuEspecie.toLowerCase();
    
    // Mapeamento baseado nas classes do exemplo fornecido
    if (texto.includes('equipamentos para áudio, vídeo e foto')) {
      return 'Equipamentos de Áudio e Vídeo';
    }
    if (texto.includes('aparelhos e utensílios domésticos')) {
      return 'Aparelhos e Utensílios Domésticos';
    }
    if (texto.includes('mobiliário em geral')) {
      return 'Mobiliário';
    }
    if (texto.includes('máquinas, instalações e utensílios de escritório')) {
      return 'Equipamentos de Escritório';
    }
    if (texto.includes('equipamentos de proteção, segurança')) {
      return 'Equipamentos de Segurança';
    }
    if (texto.includes('equipamentos de processamento de dados')) {
      return 'Equipamentos de Informática';
    }
    if (texto.includes('veículos')) {
      return 'Veículos';
    }
    
    // Mapeamento por tipo de equipamento
    if (texto.includes('ar condicionado')) {
      return 'Aparelhos e Utensílios Domésticos';
    }
    if (texto.includes('mesa') || texto.includes('cadeira') || texto.includes('rack')) {
      return 'Mobiliário';
    }
    if (texto.includes('microfone') || texto.includes('amplificador') || texto.includes('caixa de som')) {
      return 'Equipamentos de Áudio e Vídeo';
    }
    
    // Usar a classe original se não encontrar mapeamento específico
    return classeOuEspecie;
  }

  /**
   * Identifica tipo de local baseado no nome
   */
  private static identificarTipoLocal(nomeLocal: string): string {
    if (!nomeLocal) return 'sala';
    
    const nome = nomeLocal.toLowerCase();
    
    if (nome.includes('auditório')) return 'auditório';
    if (nome.includes('laboratório') || nome.includes('lab')) return 'laboratório';
    if (nome.includes('sala de aula')) return 'sala_aula';
    if (nome.includes('biblioteca')) return 'biblioteca';
    if (nome.includes('secretaria')) return 'secretaria';
    if (nome.includes('coordenação')) return 'coordenação';
    if (nome.includes('diretoria')) return 'diretoria';
    if (nome.includes('almoxarifado')) return 'almoxarifado';
    if (nome.includes('depósito')) return 'depósito';
    
    return 'sala';
  }

  /**
   * Extrai andar do nome do local
   */
  private static extrairAndar(local: string): string | undefined {
    if (!local) return undefined;
    const match = local.match(/(\d+)[ºª°]?\s*andar/i);
    return match ? `${match[1]}º andar` : undefined;
  }

  /**
   * Extrai bloco do nome do local
   */
  private static extrairBloco(local: string): string | undefined {
    if (!local) return undefined;
    const match = local.match(/bloco\s*([A-Z0-9]+)/i);
    return match ? `Bloco ${match[1].toUpperCase()}` : undefined;
  }

  /**
   * Gera código de categoria
   */
  private static gerarCodigoCategoria(nomeCategoria: string): string {
    const mapeamento: Record<string, string> = {
      'Equipamentos de Áudio e Vídeo': 'EAV001',
      'Aparelhos e Utensílios Domésticos': 'AUD001',
      'Mobiliário': 'MOB001',
      'Equipamentos de Escritório': 'EES001',
      'Equipamentos de Segurança': 'ESE001',
      'Equipamentos de Informática': 'EIN001',
      'Veículos': 'VEI001',
      'Outros Equipamentos': 'OUT001',
    };
    
    return mapeamento[nomeCategoria] || 'OUT001';
  }

  /**
   * Validar dados extraídos
   */
  static validarDadosExtraidos(bens: BemImportacao[]): {
    validos: BemImportacao[];
    invalidos: Array<{ bem: Partial<BemImportacao>; erros: string[] }>;
  } {
    const validos: BemImportacao[] = [];
    const invalidos: Array<{ bem: Partial<BemImportacao>; erros: string[] }> = [];
    
    bens.forEach(bem => {
      const erros: string[] = [];
      
      if (!bem.numero_patrimonio?.trim()) {
        erros.push('Número de patrimônio é obrigatório');
      }
      
      if (!bem.nome_bem?.trim()) {
        erros.push('Nome do bem é obrigatório');
      }
      
      if (!bem.local?.nome_local?.trim()) {
        erros.push('Local é obrigatório');
      }
      
      if (!bem.local?.setor?.nome_setor?.trim()) {
        erros.push('Setor é obrigatório');
      }
      
      if (!bem.categoria?.nome_categoria?.trim()) {
        erros.push('Categoria é obrigatória');
      }
      
      // Validar formato do número de patrimônio
      if (bem.numero_patrimonio && !bem.numero_patrimonio.match(/^\d{9}$/)) {
        erros.push('Número de patrimônio deve ter 9 dígitos');
      }
      
      if (erros.length === 0) {
        validos.push(bem);
      } else {
        invalidos.push({ bem, erros });
      }
    });
    
    return { validos, invalidos };
  }

  /**
   * Detecta padrões específicos do relatório UEG para melhor extração
   */
  static detectarPadroesUEG(texto: string): {
    hasUnidadeAdmin: boolean;
    hasLocalizacao: boolean;
    hasTabela: boolean;
    numeroLinhasBens: number;
  } {
    const linhas = texto.split('\n');
    
    return {
      hasUnidadeAdmin: linhas.some(l => l.includes('UNIDADE ADM.:')),
      hasLocalizacao: linhas.some(l => l.includes('LOCALIZAÇÃO:')),
      hasTabela: linhas.some(l => l.includes('DESCRIÇÃO') && l.includes('VALOR ATUAL')),
      numeroLinhasBens: linhas.filter(l => /\b\d{9}\b/.test(l)).length,
    };
  }
}

// Declarar PDF.js para TypeScript
declare global {
  interface Window {
    pdfjsLib: any;
  }
}
