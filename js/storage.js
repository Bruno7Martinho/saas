// Storage.js - Gerenciamento de dados
const storage = {
  produtos: [],
  vendas: [],
  
  inicializar() {
    const dados = localStorage.getItem('conveniencia_data');
    if (dados) {
      const data = JSON.parse(dados);
      this.produtos = data.produtos || [];
      this.vendas = data.vendas || [];
    } else {
      // Dados de exemplo
      this.produtos = [
        { id: '1', nome: 'Água Mineral 500ml', codigo: '7891234567890', preco: 2.50, quantidade: 45, estoqueMinimo: 10 },
        { id: '2', nome: 'Refrigerante Lata', codigo: '7892345678901', preco: 4.99, quantidade: 20, estoqueMinimo: 15 },
        { id: '3', nome: 'Chocolate 100g', codigo: '7893456789012', preco: 7.90, quantidade: 15, estoqueMinimo: 10 },
      ];
      this.vendas = [];
      this.salvar();
    }
    this.atualizarStats();
  },
  
  salvar() {
    localStorage.setItem('conveniencia_data', JSON.stringify({
      produtos: this.produtos,
      vendas: this.vendas
    }));
  },
  
  atualizarStats() {
    document.getElementById('totalProdutos').textContent = this.produtos.length;
    const hoje = new Date().toDateString();
    const vendasHoje = this.vendas.filter(v => 
      new Date(v.data).toDateString() === hoje
    ).length;
    document.getElementById('vendasHoje').textContent = vendasHoje;
  },
  
  adicionarProduto(produto) {
    produto.id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    this.produtos.push(produto);
    this.salvar();
    this.atualizarStats();
  },
  
  atualizarProduto(id, dados) {
    const index = this.produtos.findIndex(p => p.id === id);
    if (index !== -1) {
      this.produtos[index] = { ...this.produtos[index], ...dados };
      this.salvar();
    }
  },
  
  removerProduto(id) {
    this.produtos = this.produtos.filter(p => p.id !== id);
    this.salvar();
    this.atualizarStats();
  },
  
  adicionarVenda(venda) {
    venda.id = 'v' + Date.now();
    venda.data = new Date().toISOString();
    this.vendas.push(venda);
    this.salvar();
    this.atualizarStats();
  }
};