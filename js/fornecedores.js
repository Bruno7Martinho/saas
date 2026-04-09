// Fornecedores.js - Gestão de Fornecedores

const fornecedores = {
  lista: [],
  
  inicializar() {
    const dados = localStorage.getItem('conv_fornecedores');
    this.lista = dados ? JSON.parse(dados) : [
      { id: 'f1', nome: 'Distribuidora ABC', contato: '(11) 9999-9999', email: 'abc@email.com', cnpj: '00.000.000/0001-00' },
      { id: 'f2', nome: 'Atacadão Alimentos', contato: '(11) 8888-8888', email: 'atacado@email.com', cnpj: '11.111.111/0001-11' }
    ];
  },
  
  salvar() {
    localStorage.setItem('conv_fornecedores', JSON.stringify(this.lista));
  },
  
  renderizar() {
    this.inicializar();
    
    document.getElementById('content').innerHTML = `
      <div class="card">
        <div class="flex-between mb-4">
          <h2><i class="fas fa-truck"></i> Fornecedores</h2>
          <button class="btn btn-primary" onclick="fornecedores.novo()">
            <i class="fas fa-plus"></i> Novo Fornecedor
          </button>
        </div>
        
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Contato</th>
                <th>Email</th>
                <th>CNPJ</th>
                <th>Produtos</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${this.lista.map(f => {
                const qtdProdutos = storage.produtos.filter(p => p.fornecedor === f.nome).length;
                return `
                  <tr>
                    <td>${f.nome}</td>
                    <td>${f.contato}</td>
                    <td>${f.email}</td>
                    <td>${f.cnpj}</td>
                    <td><span class="badge">${qtdProdutos} produtos</span></td>
                    <td>
                      <div class="flex">
                        <button class="btn btn-sm" onclick="fornecedores.editar('${f.id}')">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm" onclick="fornecedores.verProdutos('${f.nome}')">
                          <i class="fas fa-box"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },
  
  novo() {
    const nome = prompt('Nome do fornecedor:');
    if (!nome) return;
    
    const contato = prompt('Telefone:');
    const email = prompt('Email:');
    const cnpj = prompt('CNPJ:');
    
    this.lista.push({
      id: 'f' + Date.now(),
      nome,
      contato: contato || '',
      email: email || '',
      cnpj: cnpj || ''
    });
    
    this.salvar();
    this.renderizar();
    app.mostrarToast('Fornecedor cadastrado!', 'success');
  },
  
  editar(id) {
    const f = this.lista.find(f => f.id === id);
    if (!f) return;
    
    f.nome = prompt('Nome:', f.nome) || f.nome;
    f.contato = prompt('Contato:', f.contato) || f.contato;
    f.email = prompt('Email:', f.email) || f.email;
    
    this.salvar();
    this.renderizar();
    app.mostrarToast('Fornecedor atualizado!', 'success');
  },
  
  verProdutos(nome) {
    const produtos = storage.produtos.filter(p => p.fornecedor === nome);
    
    if (produtos.length === 0) {
      app.mostrarToast('Nenhum produto deste fornecedor', 'info');
      return;
    }
    
    let mensagem = `Produtos de ${nome}:\n\n`;
    produtos.forEach(p => {
      mensagem += `• ${p.nome} - Estoque: ${p.quantidade}\n`;
    });
    
    alert(mensagem);
  }
};