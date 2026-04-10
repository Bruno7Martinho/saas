// Scanner.js - COMPLETO com linha vermelha animada (estilo laser)

const scanner = {
  ativo: false,
  reader: null,
  callback: null,
  animationFrame: null,
  linhaPosition: 0,
  
  // Modo USB
  bufferUSB: '',
  timeoutUSB: null,
  usbAtivo: true,
  
  // Áudio
  audioContext: null,
  audioInicializado: false,

  // ========== INICIALIZAR ==========
  inicializar() {
    this.inicializarUSB();
    this.inicializarAudio();
    console.log('✅ Scanner pronto!');
  },

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
      }, 50);
    });
  },

  inicializarAudio() {
    const ativar = () => {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.audioContext.resume();
        this.audioInicializado = true;
      } catch (e) {}
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
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.value = 800;
      gain.gain.value = 0.15;
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  },

  // ========== CÂMERA COM LINHA VERMELHA ==========
  async abrir(callback) {
    this.callback = callback || this.processarCodigo.bind(this);
    
    const modal = document.getElementById('scannerModal');
    if (!modal) return;
    
    modal.style.display = 'block';
    
    // Adicionar linha vermelha se não existir
    this.criarLinhaVermelha();
    
    // Iniciar animação da linha
    this.iniciarAnimacaoLinha();
    
    try {
      this.reader = new ZXing.BrowserMultiFormatReader();
      const devices = await this.reader.listVideoInputDevices();
      
      if (devices.length === 0) {
        throw new Error('Nenhuma câmera encontrada');
      }
      
      const device = devices.find(d => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('traseira') ||
        d.label.toLowerCase().includes('environment')
      ) || devices[0];
      
      console.log('📷 Usando câmera:', device.label);
      
      this.ativo = true;
      
      await this.reader.decodeFromVideoDevice(
        device.deviceId,
        'scanner-video',
        (resultado, erro) => {
          if (resultado && this.ativo) {
            const codigo = resultado.text;
            
            this.tocarBip();
            
            const lastScan = document.getElementById('lastScanText');
            if (lastScan) {
              lastScan.innerHTML = `✅ ${codigo}<br><small>Formato: ${this.getFormatoNome(resultado.format)}</small>`;
            }
            
            if (this.callback) {
              this.callback(codigo);
            }
            
            setTimeout(() => this.fechar(), 500);
          }
        }
      );
      
      const lastScan = document.getElementById('lastScanText');
      if (lastScan) {
        lastScan.innerHTML = '🔍 Escaneando...<br><small>Posicione o código na área verde</small>';
      }
      
    } catch (error) {
      console.error('Erro na câmera:', error);
      if (typeof app !== 'undefined') {
        app.mostrarToast('Erro ao acessar câmera', 'error');
      }
      this.fechar();
    }
  },

  // ========== LINHA VERMELHA ANIMADA ==========
  criarLinhaVermelha() {
    const container = document.querySelector('.scanner-video-container');
    if (!container) return;
    
    // Remover linha antiga se existir
    const linhaAntiga = document.getElementById('scanner-laser-line');
    if (linhaAntiga) linhaAntiga.remove();
    
    // Criar nova linha
    const linha = document.createElement('div');
    linha.id = 'scanner-laser-line';
    linha.style.cssText = `
      position: absolute;
      left: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, 
        transparent 0%, 
        #ff0000 20%, 
        #ff0000 80%, 
        transparent 100%
      );
      box-shadow: 0 0 10px #ff0000, 0 0 20px #ff0000;
      pointer-events: none;
      z-index: 100;
      opacity: 0.8;
    `;
    
    container.appendChild(linha);
  },

  iniciarAnimacaoLinha() {
    const linha = document.getElementById('scanner-laser-line');
    const container = document.querySelector('.scanner-video-container');
    
    if (!linha || !container) return;
    
    const containerHeight = container.clientHeight;
    this.linhaPosition = 0;
    let direction = 1;
    
    const animar = () => {
      if (!this.ativo) return;
      
      const containerHeight = container.clientHeight;
      
      this.linhaPosition += direction * 3;
      
      if (this.linhaPosition >= containerHeight - 2) {
        this.linhaPosition = containerHeight - 2;
        direction = -1;
      } else if (this.linhaPosition <= 0) {
        this.linhaPosition = 0;
        direction = 1;
      }
      
      linha.style.top = this.linhaPosition + 'px';
      
      this.animationFrame = requestAnimationFrame(animar);
    };
    
    this.animationFrame = requestAnimationFrame(animar);
  },

  pararAnimacaoLinha() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    const linha = document.getElementById('scanner-laser-line');
    if (linha) linha.remove();
  },

  // ========== FECHAR ==========
  fechar() {
    this.ativo = false;
    this.pararAnimacaoLinha();
    
    const modal = document.getElementById('scannerModal');
    if (modal) modal.style.display = 'none';
    
    if (this.reader) {
      this.reader.reset();
      this.reader = null;
    }
    
    const video = document.getElementById('scanner-video');
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
  },

  // ========== PROCESSAR CÓDIGO ==========
  processarCodigo(codigo) {
    console.log('📟 Código:', codigo);
    
    const inputCodigo = document.getElementById('codigoInput');
    const buscaVenda = document.getElementById('buscaVenda');
    
    if (inputCodigo) inputCodigo.value = codigo;
    if (buscaVenda) {
      buscaVenda.value = codigo;
      buscaVenda.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
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

  getFormatoNome(formato) {
    const formatos = {
      11: 'QR Code',
      5: 'Code 128',
      3: 'Code 39',
      8: 'EAN-13',
      7: 'EAN-8',
      13: 'UPC-A',
      14: 'UPC-E'
    };
    return formatos[formato] || 'Código de Barras';
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