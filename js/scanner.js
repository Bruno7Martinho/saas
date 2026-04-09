// ============================================
// Scanner.js - Versão FUNCIONAL e ESTÁVEL
// Câmera + USB + Bip Sonoro
// ============================================

const scanner = {
  // Câmera
  ativo: false,
  reader: null,
  callback: null,
  
  // USB
  bufferUSB: '',
  timeoutUSB: null,
  usbAtivo: true,
  
  // Áudio
  audioContext: null,

  // ========== INICIALIZAR ==========
  inicializar() {
    this.inicializarUSB();
    this.prepararAudio();
    console.log('✅ Scanner pronto!');
  },

  // ========== SCANNER USB ==========
  inicializarUSB() {
    document.addEventListener('keypress', (e) => {
      if (!this.usbAtivo) return;
      
      // Não processar se estiver digitando em um campo
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      // Enter = fim do código
      if (e.key === 'Enter') {
        e.preventDefault();
        if (this.bufferUSB.length > 3) {
          this.processarCodigo(this.bufferUSB);
        }
        this.bufferUSB = '';
        return;
      }
      
      this.bufferUSB += e.key;
      
      clearTimeout(this.timeoutUSB);
      this.timeoutUSB = setTimeout(() => {
        if (this.bufferUSB.length > 3) {
          this.processarCodigo(this.bufferUSB);
        }
        this.bufferUSB = '';
      }, 50);
    });
  },

  // ========== ÁUDIO ==========
  prepararAudio() {
    const ativar = () => {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.audioContext.resume();
      } catch (e) {
        console.log('Áudio não suportado');
      }
    };
    
    document.addEventListener('touchstart', ativar, { once: true });
    document.addEventListener('click', ativar, { once: true });
  },

  tocarBip() {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const ctx = this.audioContext;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.value = 800;
      gain.gain.value = 0.15;
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.log('Bip falhou');
    }
  },

  // ========== CÂMERA - FUNCIONANDO ==========
  async abrir(callback) {
    this.callback = callback || this.processarCodigo.bind(this);
    
    const modal = document.getElementById('scannerModal');
    if (!modal) {
      console.error('Modal não encontrado!');
      return;
    }
    
    modal.style.display = 'block';
    
    try {
      // Criar reader
      this.reader = new ZXing.BrowserMultiFormatReader();
      
      // Listar câmeras
      const devices = await this.reader.listVideoInputDevices();
      
      if (devices.length === 0) {
        throw new Error('Nenhuma câmera encontrada');
      }
      
      // Preferir câmera traseira
      const device = devices.find(d => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('traseira') ||
        d.label.toLowerCase().includes('environment')
      ) || devices[0];
      
      console.log('📷 Usando câmera:', device.label);
      
      this.ativo = true;
      
      // Iniciar decodificação
      await this.reader.decodeFromVideoDevice(
        device.deviceId,
        'scanner-video',
        (resultado, erro) => {
          if (resultado && this.ativo) {
            const codigo = resultado.text;
            
            // Bip
            this.tocarBip();
            
            // Atualizar texto
            const lastScan = document.getElementById('lastScanText');
            if (lastScan) {
              lastScan.textContent = `✅ ${codigo}`;
            }
            
            // Callback
            if (this.callback) {
              this.callback(codigo);
            }
            
            // Fechar
            setTimeout(() => this.fechar(), 500);
          }
        }
      );
      
      const lastScan = document.getElementById('lastScanText');
      if (lastScan) {
        lastScan.textContent = '🔍 Escaneando...';
      }
      
    } catch (error) {
      console.error('Erro na câmera:', error);
      
      if (typeof app !== 'undefined' && app.mostrarToast) {
        app.mostrarToast('Erro ao acessar câmera', 'error');
      }
      
      this.fechar();
    }
  },

  fechar() {
    this.ativo = false;
    
    const modal = document.getElementById('scannerModal');
    if (modal) modal.style.display = 'none';
    
    // Parar câmera
    if (this.reader) {
      this.reader.reset();
      this.reader = null;
    }
    
    // Limpar video
    const video = document.getElementById('scanner-video');
    if (video && video.srcObject) {
      const tracks = video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;
    }
  },

  // ========== PROCESSAR CÓDIGO ==========
  processarCodigo(codigo) {
    console.log('📟 Código detectado:', codigo);
    
    // Preencher campos
    const inputCodigo = document.getElementById('codigoInput');
    const buscaVenda = document.getElementById('buscaVenda');
    const buscaEstoque = document.getElementById('buscaEstoque');
    
    if (inputCodigo) inputCodigo.value = codigo;
    if (buscaVenda) {
      buscaVenda.value = codigo;
      buscaVenda.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (buscaEstoque) {
      buscaEstoque.value = codigo;
      buscaEstoque.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Ações por página
    if (typeof app !== 'undefined' && app.paginaAtual) {
      if (app.paginaAtual === 'vendas') {
        const produto = storage.produtos.find(p => p.codigo === codigo);
        if (produto) {
          if (produto.quantidade > 0) {
            vendas.adicionar(produto.id);
            app.mostrarToast(`✅ ${produto.nome}`, 'success');
          } else {
            app.mostrarToast(`❌ Sem estoque`, 'error');
          }
        } else {
          app.mostrarToast(`❌ Não cadastrado`, 'error');
        }
      } else if (app.paginaAtual === 'estoque') {
        const produto = storage.produtos.find(p => p.codigo === codigo);
        if (produto) {
          app.mostrarToast(`${produto.nome} - R$ ${produto.preco.toFixed(2)}`, 'info');
        }
      } else {
        app.mostrarToast(`Código: ${codigo}`, 'info');
      }
    }
  },

  // ========== ENTRADA MANUAL ==========
  usarManual() {
    const input = document.getElementById('manualBarcode');
    if (input && input.value) {
      this.tocarBip();
      this.processarCodigo(input.value);
      this.fechar();
      input.value = '';
    }
  },

  toggleUSB() {
    this.usbAtivo = !this.usbAtivo;
    if (typeof app !== 'undefined' && app.mostrarToast) {
      app.mostrarToast(`USB ${this.usbAtivo ? 'ON' : 'OFF'}`, 'info');
    }
  }
};

// Iniciar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  scanner.inicializar();
});