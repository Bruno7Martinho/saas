// Estoque.js - Gestão de produtos
const estoque = {
  renderizar() {
    const produtosBaixo = storage.produtos.filter(p => p.quantidade <= p.estoqueMinimo);
    
    document.getElementById('content').innerHTML = `
      <div class="card">
        <div class="flex-between mb-4">
          <h2><i class="fas fa-boxes"></i> Controle de Estoque</h2>
          <div class="flex">
            <input type="text" id="buscaEstoque" placeholder="Buscar produto..." style="width: 250px;">
            <button class="btn btn-primary" onclick="estoque.abrirModalLote()">
              <i class="fas fa-upload"></i> Importar Lote
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
              ${this.renderizarTabela()}
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    this.attachEventos();
  },
  
  renderizarTabela(produtos = storage.produtos) {
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
    document.getElementById('buscaEstoque').addEventListener('input', (e) => {
      const termo = e.target.value.toLowerCase();
      const filtrados = storage.produtos.filter(p => 
        p.nome.toLowerCase().includes(termo) || p.codigo.includes(termo)
      );
      document.querySelector('#tabelaEstoque tbody').innerHTML = this.renderizarTabela(filtrados);
    });
  },
  
  ajustar(id) {
    const produto = storage.produtos.find(p => p.id === id);
    if (!produto) return;
    
    const novaQtd = prompt(`Quantidade atual: ${produto.quantidade}\nNova quantidade:`, produto.quantidade);
    if (novaQtd !== null && !isNaN(novaQtd)) {
      storage.atualizarProduto(id, { quantidade: parseInt(novaQtd) });
      app.mostrarToast('Estoque atualizado!', 'success');
      this.renderizar();
    }
  },
  
  excluir(id) {
    if (confirm('Excluir este produto?')) {
      storage.removerProduto(id);
      app.mostrarToast('Produto excluído!', 'success');
      this.renderizar();
    }
  },
  
  abrirModalLote() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <h3><i class="fas fa-upload"></i> Importar Produtos em Lote</h3>
        <p style="color: #6b7280; margin: 12px 0;">
          Formato: <code>Nome; Código; Preço; Quantidade; Estoque Mínimo</code>
        </p>
        <textarea id="loteInput" rows="10" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px;" placeholder="Água 500ml;7891234567890;2.50;50;10&#10;Refrigerante;7892345678901;4.99;30;15"></textarea>
        
        <div class="flex mt-4" style="justify-content: flex-end;">
          <button class="btn" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
          <button class="btn btn-primary" onclick="estoque.processarLote()">Importar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },
  
  processarLote() {
    const texto = document.getElementById('loteInput').value;
    const linhas = texto.split('\n').filter(l => l.trim());
    let adicionados = 0;
    
    linhas.forEach(linha => {
      const partes = linha.split(';').map(p => p.trim());
      if (partes.length >= 4) {
        const [nome, codigo, preco, quantidade, minimo] = partes;
        
        if (!storage.produtos.find(p => p.codigo === codigo)) {
          storage.adicionarProduto({
            nome,
            codigo,
            preco: parseFloat(preco),
            quantidade: parseInt(quantidade),
            estoqueMinimo: minimo ? parseInt(minimo) : 10
          });
          adicionados++;
        }
      }
    });
    
    document.querySelector('.modal-overlay').remove();
    app.mostrarToast(`${adicionados} produtos importados!`, 'success');
    this.renderizar();
  }
};