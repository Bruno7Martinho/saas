// estoque.js - CORRIGIDO (com loading e atualização)

const estoque = {
  renderizar() {
    // Mostrar loading enquanto carrega
    document.getElementById('content').innerHTML = `
      <div class="card" style="text-align: center; padding: 60px;">
        <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #2563eb;"></i>
        <p style="margin-top: 20px;">Carregando produtos...</p>
      </div>
    `;
    
    // Carregar dados e depois renderizar
    this.carregarEAtualizar();
  },
  
  async carregarEAtualizar() {
    // Garantir que os dados estão carregados
    if (storage.produtos.length === 0) {
      await storage.inicializar();
    }
    
    this.renderizarTabela();
  },
  
  renderizarTabela() {
    const produtosBaixo = storage.produtos.filter(p => p.quantidade <= (p.estoqueMinimo || 10));
    
    document.getElementById('content').innerHTML = `
      <div class="card">
        <div class="flex-between mb-4">
          <h2><i class="fas fa-boxes"></i> Controle de Estoque</h2>
          <div class="flex">
            <input type="text" id="buscaEstoque" placeholder="Buscar produto..." style="width: 250px;">
            <button class="btn btn-primary" onclick="estoque.abrirModalLote()">
              <i class="fas fa-upload"></i> Importar Lote
            </button>
            <button class="btn btn-success" onclick="app.mudarPagina('cadastro')">
              <i class="fas fa-plus"></i> Novo
            </button>
          </div>
        </div>
        
        ${produtosBaixo.length > 0 ? `
          <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 12px; margin-bottom: 16px;">
            <i class="fas fa-exclamation-triangle" style="color: #d97706;"></i>
            <strong>${produtosBaixo.length} produtos com estoque baixo</strong>
          </div>
        ` : ''}
        
        <div class="table-wrapper">
          <table id="tabelaEstoque">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Código</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th>Mínimo</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${this.renderizarLinhas(storage.produtos)}
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    this.attachEventos();
  },
  
  renderizarLinhas(produtos) {
    if (produtos.length === 0) {
      return `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px; color: #6b7280;">
            <i class="fas fa-box-open" style="font-size: 48px; margin-bottom: 16px;"></i>
            <p>Nenhum produto cadastrado</p>
            <button class="btn btn-primary" onclick="app.mudarPagina('cadastro')">
              Cadastrar Produto
            </button>
          </td>
        </tr>
      `;
    }
    
    return produtos.map(p => `
      <tr>
        <td>${p.nome}</td>
        <td><code>${p.codigo}</code></td>
        <td>R$ ${p.preco.toFixed(2)}</td>
        <td>${p.quantidade}</td>
        <td>${p.estoqueMinimo || 10}</td>
        <td>
          ${p.quantidade <= (p.estoqueMinimo || 10) ? 
            '<span class="badge badge-danger">Baixo</span>' : 
            '<span class="badge badge-success">Normal</span>'}
        </td>
        <td>
          <div class="flex">
            <button class="btn btn-sm" onclick="estoque.ajustar('${p.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm" onclick="estoque.excluir('${p.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },
  
  attachEventos() {
    document.getElementById('buscaEstoque')?.addEventListener('input', (e) => {
      const termo = e.target.value.toLowerCase();
      const filtrados = storage.produtos.filter(p => 
        p.nome.toLowerCase().includes(termo) || p.codigo.includes(termo)
      );
      document.querySelector('#tabelaEstoque tbody').innerHTML = this.renderizarLinhas(filtrados);
    });
  },
  
  ajustar(id) {
    const produto = storage.produtos.find(p => p.id === id);
    if (!produto) return;
    
    const novaQtd = prompt(`Quantidade atual: ${produto.quantidade}\nNova quantidade:`, produto.quantidade);
    if (novaQtd !== null && !isNaN(novaQtd)) {
      produto.quantidade = parseInt(novaQtd);
      storage.salvar();
      storage.atualizarProduto(id, { quantidade: produto.quantidade });
      this.renderizarTabela();
      app.mostrarToast('Estoque atualizado!', 'success');
    }
  },
  
  async excluir(id) {
    if (!confirm('Excluir este produto?')) return;
    
    await storage.removerProduto(id);
    this.renderizarTabela();
    app.mostrarToast('Produto excluído!', 'success');
  },
  
  abrirModalLote() {
    // Sua função de importação em lote aqui
    app.mostrarToast('Funcionalidade em desenvolvimento', 'info');
  }
};