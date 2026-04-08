// Vendas.js - Sistema de vendas e carrinho
const vendas = {
  carrinho: [],
  
  renderizar() {
    const total = this.carrinho.reduce((acc, i) => acc + (i.preco * i.quantidade), 0);
    
    document.getElementById('content').innerHTML = `
      <div class="grid-2">
        <!-- Lado esquerdo: Busca de produtos -->
        <div class="card">
          <h3 class="mb-4"><i class="fas fa-search"></i> Buscar Produtos</h3>
          <div class="flex mb-4">
            <input type="text" id="buscaVenda" placeholder="Nome ou código" class="w-full">
            <button class="btn btn-primary" onclick="scanner.abrir(vendas.handleScanner)">
              <i class="fas fa-barcode"></i>
            </button>
          </div>
          <div id="listaProdutos" style="max-height: 500px; overflow-y: auto;">
            ${this.renderizarListaProdutos()}
          </div>
        </div>
        
        <!-- Lado direito: Carrinho -->
        <div class="card">
          <div class="flex-between mb-4">
            <h3><i class="fas fa-shopping-cart"></i> Carrinho</h3>
            ${this.carrinho.length > 0 ? `
              <button class="btn btn-sm" onclick="vendas.limparCarrinho()">
                <i class="fas fa-trash"></i> Limpar
              </button>
            ` : ''}
          </div>
          
          <div id="carrinhoContainer" style="max-height: 400px; overflow-y: auto;">
            ${this.renderizarCarrinho()}
          </div>
          
          <hr style="margin: 16px 0; border: none; border-top: 2px solid #e5e7eb;">
          
          <div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 16px;">
            Total: R$ ${total.toFixed(2)}
          </div>
          
          <button class="btn btn-success w-full" onclick="vendas.finalizar()" ${this.carrinho.length === 0 ? 'disabled' : ''}>
            <i class="fas fa-check-circle"></i> Finalizar Venda
          </button>
        </div>
      </div>
    `;
    
    this.attachEventos();
  },
  
  renderizarListaProdutos(filtro = '') {
    const filtrados = filtro ? 
      storage.produtos.filter(p => 
        p.nome.toLowerCase().includes(filtro) || 
        p.codigo.includes(filtro)
      ) : 
      storage.produtos;
    
    return filtrados.map(p => `
      <div class="carrinho-item">
        <div style="flex: 1;">
          <div style="font-weight: 500;">${p.nome}</div>
          <div style="color: #6b7280; font-size: 0.9rem;">
            R$ ${p.preco.toFixed(2)} | Estoque: ${p.quantidade}
          </div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="vendas.adicionar('${p.id}')" ${p.quantidade === 0 ? 'disabled' : ''}>
          <i class="fas fa-plus"></i> Adicionar
        </button>
      </div>
    `).join('');
  },
  
  renderizarCarrinho() {
    if (this.carrinho.length === 0) {
      return '<p style="color: #9ca3af; text-align: center; padding: 20px;">Carrinho vazio</p>';
    }
    
    return this.carrinho.map((item, index) => `
      <div class="carrinho-item">
        <div style="flex: 1;">
          <div style="font-weight: 500;">${item.nome}</div>
          <div style="color: #6b7280; font-size: 0.9rem;">
            R$ ${item.preco.toFixed(2)} cada
          </div>
        </div>
        
        <div class="carrinho-controles">
          <div class="carrinho-qtd">
            <button onclick="vendas.diminuirQuantidade(${index})">-</button>
            <span>${item.quantidade}</span>
            <button onclick="vendas.aumentarQuantidade(${index})">+</button>
          </div>
          
          <div style="min-width: 80px; text-align: right; font-weight: 600;">
            R$ ${(item.preco * item.quantidade).toFixed(2)}
          </div>
          
          <button class="btn btn-sm" onclick="vendas.remover(${index})" style="color: #dc2626;">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
  },
  
  attachEventos() {
    const buscaInput = document.getElementById('buscaVenda');
    if (buscaInput) {
      buscaInput.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        document.getElementById('listaProdutos').innerHTML = this.renderizarListaProdutos(termo);
      });
    }
  },
  
  handleScanner(codigo) {
    const produto = storage.produtos.find(p => p.codigo === codigo);
    if (produto) {
      if (produto.quantidade > 0) {
        vendas.adicionar(produto.id);
        app.mostrarToast(`${produto.nome} adicionado`, 'success');
      } else {
        app.mostrarToast('Produto sem estoque!', 'error');
      }
    } else {
      app.mostrarToast(`Produto não encontrado: ${codigo}`, 'error');
    }
  },
  
  adicionar(produtoId) {
    const produto = storage.produtos.find(p => p.id === produtoId);
    if (!produto || produto.quantidade === 0) {
      app.mostrarToast('Produto sem estoque!', 'error');
      return;
    }
    
    const item = this.carrinho.find(i => i.id === produtoId);
    if (item) {
      if (item.quantidade < produto.quantidade) {
        item.quantidade++;
      } else {
        app.mostrarToast('Quantidade máxima atingida!', 'error');
        return;
      }
    } else {
      this.carrinho.push({ ...produto, quantidade: 1 });
    }
    
    this.renderizar();
  },
  
  aumentarQuantidade(index) {
    const item = this.carrinho[index];
    const produto = storage.produtos.find(p => p.id === item.id);
    
    if (item.quantidade < produto.quantidade) {
      item.quantidade++;
      this.renderizar();
    } else {
      app.mostrarToast('Estoque máximo atingido!', 'error');
    }
  },
  
  diminuirQuantidade(index) {
    const item = this.carrinho[index];
    if (item.quantidade > 1) {
      item.quantidade--;
      this.renderizar();
    } else {
      this.remover(index);
    }
  },
  
  remover(index) {
    this.carrinho.splice(index, 1);
    this.renderizar();
  },
  
  limparCarrinho() {
    if (confirm('Limpar carrinho?')) {
      this.carrinho = [];
      this.renderizar();
    }
  },
  
  finalizar() {
    // Verificar estoque
    for (let item of this.carrinho) {
      const produto = storage.produtos.find(p => p.id === item.id);
      if (!produto || produto.quantidade < item.quantidade) {
        app.mostrarToast(`Estoque insuficiente para ${item.nome}`, 'error');
        return;
      }
    }
    
    // Atualizar estoque
    this.carrinho.forEach(item => {
      const produto = storage.produtos.find(p => p.id === item.id);
      produto.quantidade -= item.quantidade;
    });
    
    // Registrar venda
    const total = this.carrinho.reduce((acc, i) => acc + (i.preco * i.quantidade), 0);
    storage.adicionarVenda({
      itens: [...this.carrinho],
      total
    });
    
    app.mostrarToast(`Venda finalizada! Total: R$ ${total.toFixed(2)}`, 'success');
    this.carrinho = [];
    this.renderizar();
  }
};