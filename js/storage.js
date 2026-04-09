// storage.js - Versão com Supabase
const storage = {
  produtos: [],
  vendas: [],
  
  async inicializar() {
    console.log('🔄 Carregando dados do Supabase...');
    
    try {
      // Buscar produtos do Supabase
      this.produtos = await db.buscarProdutos();
      console.log(`✅ ${this.produtos.length} produtos carregados`);
      
      // Buscar vendas do Supabase
      this.vendas = await db.buscarVendas(100);
      console.log(`✅ ${this.vendas.length} vendas carregadas`);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      
      // Fallback para dados locais se der erro
      const dados = localStorage.getItem('conveniencia_data');
      if (dados) {
        const data = JSON.parse(dados);
        this.produtos = data.produtos || [];
        this.vendas = data.vendas || [];
      }
    }
    
    this.atualizarStats();
  },
  
  salvar() {
    // Backup local (opcional)
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
  
  async adicionarProduto(produto) {
    try {
      // Salvar no Supabase
      const novo = await db.adicionarProduto(produto);
      
      if (novo) {
        this.produtos.push(novo);
        this.salvar();
        this.atualizarStats();
        return novo;
      }
    } catch (error) {
      console.error('Erro ao adicionar:', error);
      
      // Fallback local
      produto.id = Date.now().toString();
      this.produtos.push(produto);
      this.salvar();
      this.atualizarStats();
    }
    
    return null;
  },
  
  async atualizarProduto(id, dados) {
    try {
      await db.atualizarProduto(id, dados);
      
      const index = this.produtos.findIndex(p => p.id === id);
      if (index !== -1) {
        this.produtos[index] = { ...this.produtos[index], ...dados };
        this.salvar();
      }
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    }
  },
  
  async removerProduto(id) {
    try {
      await db.removerProduto(id);
      
      this.produtos = this.produtos.filter(p => p.id !== id);
      this.salvar();
      this.atualizarStats();
    } catch (error) {
      console.error('Erro ao remover:', error);
    }
  },
  
  async adicionarVenda(venda) {
    try {
      const nova = await db.salvarVenda(venda);
      
      if (nova) {
        venda.id = nova.id.toString();
        venda.data = nova.created_at;
        this.vendas.push(venda);
        this.salvar();
        this.atualizarStats();
        return venda;
      }
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
      
      // Fallback local
      venda.id = 'v' + Date.now();
      venda.data = new Date().toISOString();
      this.vendas.push(venda);
      this.salvar();
      this.atualizarStats();
    }
    
    return null;
  }
};