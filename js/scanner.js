// ============================================
// Scanner.js - Versão OTIMIZADA (RÁPIDA)
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
  
  // Cache de áudio para performance
  audioContext: null,

  // ========== INICIALIZAR ==========
  inicializar() {
    this.inicializarUSB();
    this.prepararAudio();
    console.log('✅ Scanner rápido inicializado');
  },

  // ========== SCANNER USB (OTIMIZADO) ==========
  inicializarUSB() {
    document.addEventListener('keypress', (e) => {
      if (!this.usbAtivo) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
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
      }, 30); // Mais rápido
    });
  },

  // ========== ÁUDIO OTIMIZADO ==========
  prepararAudio() {
    // Pré-criar contexto de áudio
    const ativar = () => {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.audioContext.resume();
      } catch (e) {}
    };
    
    document.addEventListener('touchstart', ativar, { once: true });
    document.addEventListener('click', ativar, { once: true });
  },

  tocarBip() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return;
      }
    }
    
    try {
      const ctx = this.audioContext;
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.value = 800;
      gain.gain.value = 0.15;
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.08); // Mais curto
    } catch (e) {}
  },

  // ========== CÂMERA OTIMIZADA ==========
  abrir(callback) {
    this.callback = callback || this.processarCodigo.bind(this);
    
    const modal = document.getElementById('scannerModal');
    if (!modal) return;
    
    modal.style.display = 'block';
    
    // Configuração mais leve
    const hints = new Map();
    hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
      ZXing.BarcodeFormat.EAN_13,
      ZXing.BarcodeFormat.EAN_8,
      ZXing.BarcodeFormat.UPC_A,
      ZXing.BarcodeFormat.CODE_128,
      ZXing.BarcodeFormat.QR_CODE
    ]);
    
    // Usar câmera traseira diretamente
    ZXing.BrowserMultiFormatReader.decodeFromVideoDevice(
      null,
      'scanner-video',
      (result, err) => {
        if (result) {
          const codigo = result.text;
          
          // Feedback imediato
          this.tocarBip();
          document.getElementById('lastScanText').textContent = `✅ ${codigo}`;
          
          if (this.callback) this.callback(codigo);
          
          // Fechar rápido
          setTimeout(() => this.fechar(), 300);
        }
      },
      hints
    ).catch(err => {
      console.error('Erro câmera:', err);
      this.fechar();
    });
    
    document.getElementById('lastScanText').textContent = '🔍 Escaneando...';
  },

  fechar() {
    const modal = document.getElementById('scannerModal');
    if (modal) modal.style.display = 'none';
    
    // Limpar recursos
    const video = document.getElementById('scanner-video');
    if (video && video.srcObject) {
      const tracks = video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;
    }
  },

  // ========== PROCESSAR CÓDIGO (RÁPIDO) ==========
  processarCodigo(codigo) {
    // Remover caracteres não numéricos se for EAN/UPC
    codigo = codigo.replace(/[^0-9]/g, '');
    
    // Preencher campos rapidamente
    const inputCodigo = document.getElementById('codigoInput');
    const buscaVenda = document.getElementById('buscaVenda');
    
    if (inputCodigo) inputCodigo.value = codigo;
    if (buscaVenda) {
      buscaVenda.value = codigo;
      buscaVenda.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Ações por página (verificação rápida)
    if (typeof app !== 'undefined' && app.paginaAtual === 'vendas') {
      const produto = storage.produtos.find(p => p.codigo === codigo);
      if (produto) {
        if (produto.quantidade > 0) {
          vendas.adicionar(produto.id);
          app.mostrarToast(`✅ ${produto.nome}`, 'success');
        } else {
          app.mostrarToast(`❌ Sem estoque`, 'error');
        }
      } else {
        app.mostrarToast(`❌ Não encontrado`, 'error');
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
    if (typeof app !== 'undefined') {
      app.mostrarToast(`USB ${this.usbAtivo ? 'ON' : 'OFF'}`, 'info');
    }
  }
};

// Iniciar
document.addEventListener('DOMContentLoaded', () => scanner.inicializar());