// App.js - Inicialização e navegação
const app = {
  paginaAtual: 'estoque',
  
  inicializar() {
    storage.inicializar();
    this.mudarPagina('estoque');
  },
  
  mudarPagina(pagina) {
    this.paginaAtual = pagina;
    
    // Atualizar navegação
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.page === pagina) btn.classList.add('active');
    });
    
    // Renderizar página
    if (pagina === 'estoque') estoque.renderizar();
    else if (pagina === 'vendas') vendas.renderizar();
    else if (pagina === 'cadastro') this.renderizarCadastro();
  },
  
  renderizarCadastro() {
    document.getElementById('content').innerHTML = `
      <div class="card" style="max-width: 500px;">
        <h2 class="mb-4"><i class="fas fa-plus-circle"></i> Cadastrar Produto</h2>
        <form onsubmit="app.cadastrarProduto(event)">
          <div class="mb-4">
            <label>Nome *</label>
            <input type="text" id="nomeInput" class="w-full" required>
          </div>
          
          <div class="mb-4">
            <label>Código de Barras *</label>
            <div class="flex">
              <input type="text" id="codigoInput" class="w-full" required>
              <button type="button" class="btn" onclick="scanner.abrir((c) => document.getElementById('codigoInput').value = c)">
                <i class="fas fa-barcode"></i>
              </button>
            </div>
          </div>
          
          <div class="grid-2 mb-4">
            <div>
              <label>Preço *</label>
              <input type="number" id="precoInput" step="0.01" class="w-full" required>
            </div>
            <div>
              <label>Quantidade *</label>
              <input type="number" id="qtdInput" class="w-full" required>
            </div>
          </div>
          
          <div class="mb-4">
            <label>Estoque Mínimo</label>
            <input type="number" id="minInput" value="10" class="w-full">
          </div>
          
          <button type="submit" class="btn btn-primary w-full">
            <i class="fas fa-save"></i> Cadastrar
          </button>
        </form>
      </div>
    `;
  },
  
  cadastrarProduto(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nomeInput').value.trim();
    const codigo = document.getElementById('codigoInput').value.trim();
    const preco = parseFloat(document.getElementById('precoInput').value);
    const quantidade = parseInt(document.getElementById('qtdInput').value);
    const minimo = parseInt(document.getElementById('minInput').value);
    
    if (storage.produtos.find(p => p.codigo === codigo)) {
      this.mostrarToast('Código já cadastrado!', 'error');
      return;
    }
    
    storage.adicionarProduto({ nome, codigo, preco, quantidade, estoqueMinimo: minimo });
    this.mostrarToast('Produto cadastrado!', 'success');
    this.mudarPagina('estoque');
  },
  
  mostrarToast(mensagem, tipo = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.background = tipo === 'error' ? '#dc2626' : tipo === 'success' ? '#059669' : '#1f2937';
    toast.innerHTML = `<i class="fas fa-${tipo === 'success' ? 'check' : tipo === 'error' ? 'times' : 'info'}-circle"></i> ${mensagem}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
};

// Iniciar aplicação
app.inicializar();