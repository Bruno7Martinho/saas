// Scanner.js - Leitor de código de barras
const scanner = {
  ativo: false,
  reader: null,
  callback: null,
  
  async abrir(callback) {
    this.callback = callback || this.handlePadrao;
    document.getElementById('scannerModal').style.display = 'block';
    
    try {
      this.reader = new ZXing.BrowserMultiFormatReader();
      const devices = await this.reader.listVideoInputDevices();
      
      const device = devices.find(d => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('traseira')
      ) || devices[0];
      
      if (!device) {
        app.mostrarToast('Nenhuma câmera encontrada', 'error');
        this.fechar();
        return;
      }
      
      this.ativo = true;
      
      await this.reader.decodeFromVideoDevice(
        device.deviceId,
        'scanner-video',
        (resultado, erro) => {
          if (resultado && this.ativo) {
            const codigo = resultado.text;
            document.getElementById('lastScanText').textContent = `✅ ${codigo}`;
            
            if (navigator.vibrate) navigator.vibrate(50);
            
            if (this.callback) {
              this.callback(codigo);
            }
            
            setTimeout(() => this.fechar(), 800);
          }
        }
      );
      
      document.getElementById('lastScanText').textContent = '🔍 Escaneando...';
    } catch (error) {
      app.mostrarToast('Erro ao acessar câmera', 'error');
      this.fechar();
    }
  },
  
  fechar() {
    this.ativo = false;
    if (this.reader) {
      this.reader.reset();
      this.reader = null;
    }
    document.getElementById('scannerModal').style.display = 'none';
    const video = document.getElementById('scanner-video');
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(t => t.stop());
      video.srcObject = null;
    }
  },
  
  usarManual() {
    const input = document.getElementById('manualBarcode');
    const codigo = input.value.trim();
    if (codigo && this.callback) {
      this.callback(codigo);
      this.fechar();
      input.value = '';
    }
  },
  
  handlePadrao(codigo) {
    const produto = storage.produtos.find(p => p.codigo === codigo);
    if (produto) {
      app.mostrarToast(`${produto.nome} - R$ ${produto.preco.toFixed(2)} | Estoque: ${produto.quantidade}`);
    } else {
      app.mostrarToast(`Código não cadastrado: ${codigo}`, 'error');
    }
  }
};