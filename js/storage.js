// storage.js - Versão CORRIGIDA com Supabase
const storage = {
  produtos: [],
  vendas: [],
  
  async inicializar() {
    console.log('🔄 Carregando dados do Supabase...');
    
    try {
      // Verificar se db existe
      if (!window.db) {
        console.error('❌ db não encontrado! Verifique o supabase.js');
        this.carregarFallback();
        return;
      }
      
      // Buscar produtos do Supabase
      this.produtos = await window.db.buscarProdutos();
      console.log(`✅ ${this.produtos.length} produtos carregados`);
      
      // Buscar vendas (se a função existir)
      if (window.db.buscarVendas) {
        this.vendas = await window.db.buscarVendas(100);
        console.log(`✅ ${this.vendas.length} vendas carregadas`);
      } else {
        this.vendas = [];
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error.message);
      this.carregarFallback();
    }
    
    this.atualizarStats();
  },
  
  carregarFallback() {
    console.log('📦 Carregando dados locais (fallback)...');
    const dados = localStorage.getItem('conveniencia_data');
    if (dados) {
      try {
        const data = JSON.parse(dados);
        this.produtos = data.produtos || [];
        this.vendas = data.vendas || [];
      } catch (e) {
        this.produtos = [];
        this.vendas = [];
      }
    } else {
      // Dados de exemplo se não tiver nada
      this.produtos = [
        { id: '1', nome: 'Água Mineral 500ml', codigo: '7891234567890', preco: 2.50, quantidade: 45, estoqueMinimo: 10 },
        { id: '2', nome: 'Refrigerante Lata', codigo: '7892345678901', preco: 4.99, quantidade: 20, estoqueMinimo: 15 },
      ];
      this.vendas = [];
    }
  },
  
  salvar() {
    // Backup local
    localStorage.setItem('conveniencia_data', JSON.stringify({
      produtos: this.produtos,
      vendas: this.vendas
    }));
  },
  
  atualizarStats() {
    const totalEl = document.getElementById('totalProdutos');
    if (totalEl) totalEl.textContent = this.produtos.length;
    
    const vendasEl = document.getElementById('vendasHoje');
    if (vendasEl) {
      const hoje = new Date().toDateString();
      const vendasHoje = this.vendas.filter(v => {
        if (!v.data) return false;
        return new Date(v.data).toDateString() === hoje;
      }).length;
      vendasEl.textContent = vendasHoje;
    }
  },
  
  async adicionarProduto(produto) {
    try {
      // Salvar no Supabase
      if (window.db && window.db.adicionarProduto) {
        const novo = await window.db.adicionarProduto(produto);
        
        if (novo) {
          // Adicionar à lista local
          this.produtos.push({
            ...produto,
            id: novo.id || Date.now().toString()
          });
          this.salvar();
          this.atualizarStats();
          return novo;
        }
      } else {
        throw new Error('db não disponível');
      }
    } catch (error) {
      console.error('⚠️ Erro ao salvar no Supabase, usando localStorage:', error.message);
      
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
      if (window.db && window.db.atualizarProduto) {
        await window.db.atualizarProduto(id, dados);
      }
      
      const index = this.produtos.findIndex(p => p.id === id);
      if (index !== -1) {
        this.produtos[index] = { ...this.produtos[index], ...dados };
        this.salvar();
      }
    } catch (error) {
      console.error('⚠️ Erro ao atualizar:', error.message);
    }
  },
  
  async removerProduto(id) {
    try {
      if (window.db && window.db.removerProduto) {
        await window.db.removerProduto(id);
      }
      
      this.produtos = this.produtos.filter(p => p.id !== id);
      this.salvar();
      this.atualizarStats();
    } catch (error) {
      console.error('⚠️ Erro ao remover:', error.message);
    }
  },
  
  async adicionarVenda(venda) {
    try {
      if (window.db && window.db.salvarVenda) {
        const nova = await window.db.salvarVenda(venda);
        
        if (nova) {
          venda.id = nova.id?.toString() || 'v' + Date.now();
          venda.data = nova.created_at || new Date().toISOString();
          this.vendas.push(venda);
          this.salvar();
          this.atualizarStats();
          
          // Atualizar estoque dos produtos vendidos
          await this.atualizarEstoqueVenda(venda.itens);
          
          return venda;
        }
      } else {
        throw new Error('db não disponível');
      }
    } catch (error) {
      console.error('⚠️ Erro ao salvar venda, usando localStorage:', error.message);
      
      // Fallback local
      venda.id = 'v' + Date.now();
      venda.data = new Date().toISOString();
      this.vendas.push(venda);
      
      // Atualizar estoque local
      venda.itens.forEach(item => {
        const produto = this.produtos.find(p => p.id === item.id);
        if (produto) produto.quantidade -= item.quantidade;
      });
      
      this.salvar();
      this.atualizarStats();
    }
    
    return null;
  },
  
  async atualizarEstoqueVenda(itens) {
    for (const item of itens) {
      const produto = this.produtos.find(p => p.id === item.id);
      if (produto) {
        produto.quantidade -= item.quantidade;
        
        // Atualizar no Supabase
        if (window.db && window.db.atualizarProduto) {
          await window.db.atualizarProduto(item.id, {
            quantidade: produto.quantidade
          });
        }
      }
    }
    this.salvar();
  },
  
  // Buscar produto por código de barras
  buscarPorCodigo(codigo) {
    return this.produtos.find(p => p.codigo === codigo);
  },
  
  // Buscar produto por ID
  buscarPorId(id) {
    return this.produtos.find(p => p.id === id);
  }
};