// ============================================
// Scanner.js - Unificado para Câmera e USB
// Com Bip Sonoro Funcional e Design Responsivo
// ============================================

const scanner = {
  // Modo câmera
  ativo: false,
  reader: null,
  callback: null,
  
  // Modo USB
  bufferUSB: '',
  timeoutUSB: null,
  usbAtivo: true,
  
  // Áudio
  audioInicializado: false,
  
  // Configuração com TODOS os formatos
  hints: new Map([
    [ZXing.DecodeHintType.POSSIBLE_FORMATS, [
      ZXing.BarcodeFormat.QR_CODE,
      ZXing.BarcodeFormat.EAN_13,
      ZXing.BarcodeFormat.EAN_8,
      ZXing.BarcodeFormat.UPC_A,
      ZXing.BarcodeFormat.UPC_E,
      ZXing.BarcodeFormat.CODE_128,
      ZXing.BarcodeFormat.CODE_39,
      ZXing.BarcodeFormat.CODE_93,
      ZXing.BarcodeFormat.CODABAR,
      ZXing.BarcodeFormat.ITF,
      ZXing.BarcodeFormat.DATA_MATRIX,
      ZXing.BarcodeFormat.PDF_417,
      ZXing.BarcodeFormat.AZTEC
    ]],
    [ZXing.DecodeHintType.TRY_HARDER, true]
  ]),
  
  // ========== INICIALIZAÇÃO DO SCANNER USB ==========
  inicializarUSB() {
    document.addEventListener('keypress', (e) => {
      if (!this.usbAtivo) return;
      
      // Ignorar se estiver digitando em um input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      // Se for ENTER
      if (e.key === 'Enter' || e.keyCode === 13) {
        e.preventDefault();
        e.stopPropagation();
        
        if (this.bufferUSB.length > 5) {
          this.processarCodigoUSB(this.bufferUSB);
        }
        
        this.bufferUSB = '';
        return;
      }
      
      // Acumula caracteres
      this.bufferUSB += e.key;
      
      // Reset do timeout
      clearTimeout(this.timeoutUSB);
      this.timeoutUSB = setTimeout(() => {
        if (this.bufferUSB.length > 5) {
          this.processarCodigoUSB(this.bufferUSB);
        }
        this.bufferUSB = '';
      }, 50);
    });
    
    // Prevenir comportamento do Enter
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.bufferUSB.length > 0) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  },
  
  processarCodigoUSB(codigo) {
    console.log('📟 Leitor USB:', codigo);
    this.tocarBip();
    this.flashVerde();
    this.processarCodigo(codigo, 'USB');
  },
  
  // ========== INICIALIZAR ÁUDIO (PARA MOBILE) ==========
  inicializarAudio() {
    const eventos = ['touchstart', 'click'];
    
    eventos.forEach(evento => {
      document.addEventListener(evento, () => {
        if (!this.audioInicializado) {
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            ctx.resume();
            this.audioInicializado = true;
            console.log('✅ Áudio inicializado!');
          } catch (e) {
            console.log('ℹ️ Áudio será ativado na primeira interação');
          }
        }
      }, { once: true });
    });
  },
  
  // ========== BIP SONORO ==========
  tocarBip() {
    // Método 1: Web Audio API (leve e funcional)
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      const now = audioContext.currentTime;
      
      // Primeiro bip (800Hz)
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.type = 'square';
      osc1.frequency.value = 800;
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc1.connect(gain1);
      gain1.connect(audioContext.destination);
      osc1.start(now);
      osc1.stop(now + 0.1);
      
      // Segundo bip (1000Hz)
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.type = 'square';
      osc2.frequency.value = 1000;
      gain2.gain.setValueAtTime(0.15, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.22);
      
      return;
      
    } catch (e) {
      console.log('Web Audio falhou, usando fallback');
    }
    
    // Método 2: Fallback simples
    try {
      const audio = new Audio();
      audio.src = 'data:audio/wav;base64,UklGRlwAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVoAAACAgIGBgYF/f39/f3+AgICBgYGBgoKCg4ODhISEhYWFhoaGh4eHiIiIiYmJioqKi4uLjIyMjY2Njo6Oj4+PkJCQkZGRkpKSk5OTlJSUlZWVlpaWl5eXmJiYmZmZmpqam5ubnJycnZ2dnp6en5+foKCgoaGhoqKio6OjpKSkpaWlpqamp6enqKioqampqqqqq6urrKysra2trq6ur6+vsLCwsbGxsrKys7OztLS0tbW1tra2t7e3uLi4ubm5urq6u7u7vLy8vb29vr6+v7+/wMDAwcHBwsLCw8PDxMTExcXFxsbGx8fHyMjIycnJysrKy8vLzMzMzc3Nzs7Oz8/P0NDQ0dHR0tLS09PT1NTU1dXV1tbW19fX2NjY2dnZ2tra29vb3Nzc3d3d3t7e39/f4ODg4eHh4uLi4+Pj5OTk5eXl5ubm5+fn6Ojo6enp6urq6+vr7Ozs7e3t7u7u7+/v8PDw8fHx8vLy8/Pz9PT09fX19vb29/f3+Pj4+fn5+vr6+/v7/Pz8/f39/v7+////AAA=';
      audio.volume = 0.3;
      audio.play();
    } catch (e) {
      // Silêncio
    }
  },
  
  // ========== FEEDBACK VISUAL ==========
  flashVerde() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(16, 185, 129, 0.3);
      z-index: 99999;
      pointer-events: none;
      animation: flash 0.3s ease;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes flash {
        0% { opacity: 1; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(overlay);
    
    setTimeout(() => {
      overlay.remove();
      style.remove();
    }, 300);
  },
  
  // ========== MODO CÂMERA ==========
  async abrirCamera(callback) {
    this.callback = callback || this.handlePadrao;
    document.getElementById('scannerModal').style.display = 'block';
    
    try {
      this.reader = new ZXing.BrowserMultiFormatReader(this.hints);
      const devices = await this.reader.listVideoInputDevices();
      
      // Preferir câmera traseira
      const device = devices.find(d => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('traseira') ||
        d.label.toLowerCase().includes('environment')
      ) || devices[0];
      
      if (!device) {
        app.mostrarToast('Nenhuma câmera encontrada', 'error');
        this.fecharCamera();
        return;
      }
      
      this.ativo = true;
      
      await this.reader.decodeFromVideoDevice(
        device.deviceId,
        'scanner-video',
        (resultado, erro) => {
          if (resultado && this.ativo) {
            const codigo = resultado.text;
            const formato = resultado.format;
            
            // Tocar bip
            this.tocarBip();
            
            // Feedback visual
            this.flashVerde();
            
            // Vibração
            if (navigator.vibrate) navigator.vibrate(50);
            
            // Mostrar formato detectado
            const formatoNome = this.getFormatoNome(formato);
            document.getElementById('lastScanText').innerHTML = `
              ✅ ${codigo}<br>
              <small>Formato: ${formatoNome}</small>
            `;
            
            // Executar callback
            if (this.callback) {
              this.callback(codigo, formato);
            } else {
              this.processarCodigo(codigo, 'Câmera');
            }
            
            // Fechar após detectar
            setTimeout(() => this.fecharCamera(), 800);
          }
        }
      );
      
      document.getElementById('lastScanText').innerHTML = `
        🔍 Escaneando...<br>
        <small>QR Code ou Código de Barras</small>
      `;
      
    } catch (error) {
      console.error('Erro na câmera:', error);
      app.mostrarToast('Erro ao acessar câmera', 'error');
      this.fecharCamera();
    }
  },
  
  fecharCamera() {
    this.ativo = false;
    if (this.reader) {
      this.reader.reset();
      this.reader = null;
    }
    document.getElementById('scannerModal').style.display = 'none';
    const video = document.getElementById('scanner-video');
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach(t => t.stop());
      video.srcObject = null;
    }
  },
  
  // ========== PROCESSAMENTO UNIFICADO ==========
  processarCodigo(codigo, origem = 'Desconhecido') {
    console.log(`📟 Código detectado (${origem}):`, codigo);
    
    // Atualiza campos de busca
    const buscaVenda = document.getElementById('buscaVenda');
    const buscaEstoque = document.getElementById('buscaEstoque');
    const codigoInput = document.getElementById('codigoInput');
    
    if (buscaVenda) {
      buscaVenda.value = codigo;
      buscaVenda.dispatchEvent(new Event('input'));
    }
    
    if (buscaEstoque) {
      buscaEstoque.value = codigo;
      buscaEstoque.dispatchEvent(new Event('input'));
    }
    
    if (codigoInput) {
      codigoInput.value = codigo;
      app.mostrarToast(`Código preenchido: ${codigo}`, 'success');
    }
    
    // Processa baseado na tela atual
    if (app.paginaAtual === 'vendas') {
      const produto = storage.produtos.find(p => p.codigo === codigo);
      if (produto) {
        if (produto.quantidade > 0) {
          vendas.adicionar(produto.id);
          app.mostrarToast(`✅ ${produto.nome} adicionado`, 'success');
        } else {
          app.mostrarToast(`❌ ${produto.nome} sem estoque!`, 'error');
        }
      } else {
        app.mostrarToast(`❌ Produto não cadastrado`, 'error');
      }
      
    } else if (app.paginaAtual === 'estoque') {
      const produto = storage.produtos.find(p => p.codigo === codigo);
      if (produto) {
        app.mostrarToast(`${produto.nome} - R$ ${produto.preco.toFixed(2)} | Estoque: ${produto.quantidade}`);
      } else {
        app.mostrarToast(`Produto não encontrado`, 'error');
      }
    }
  },
  
  handlePadrao(codigo) {
    this.processarCodigo(codigo, 'Câmera');
  },
  
  // ========== UTILITÁRIOS ==========
  getFormatoNome(formato) {
    const formatos = {
      11: 'QR Code',
      1: 'Aztec',
      2: 'Codabar',
      3: 'Code 39',
      4: 'Code 93',
      5: 'Code 128',
      6: 'Data Matrix',
      7: 'EAN-8',
      8: 'EAN-13',
      9: 'ITF',
      10: 'MaxiCode',
      12: 'PDF 417',
      13: 'UPC-A',
      14: 'UPC-E'
    };
    return formatos[formato] || 'Código de Barras';
  },
  
  usarCodigoManual() {
    const input = document.getElementById('manualBarcode');
    const codigo = input.value.trim();
    if (codigo) {
      this.tocarBip();
      this.flashVerde();
      if (this.callback) {
        this.callback(codigo);
      } else {
        this.processarCodigo(codigo, 'Manual');
      }
      this.fecharCamera();
      input.value = '';
    }
  },
  
  toggleUSB() {
    this.usbAtivo = !this.usbAtivo;
    app.mostrarToast(`Leitor USB ${this.usbAtivo ? 'ATIVADO' : 'DESATIVADO'}`, 'info');
  },
  
  // Métodos públicos
  abrir(callback) {
    this.abrirCamera(callback);
  },
  
  fechar() {
    this.fecharCamera();
  },
  
  usarManual() {
    this.usarCodigoManual();
  }
};

// ========== INICIALIZAÇÃO AUTOMÁTICA ==========
document.addEventListener('DOMContentLoaded', () => {
  scanner.inicializarUSB();
  scanner.inicializarAudio();
  console.log('✅ Scanner inicializado - Câmera + USB + Bip Sonoro');
});