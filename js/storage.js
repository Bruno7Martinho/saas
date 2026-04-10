// storage.js - CORRIGIDO (salva forma de pagamento e itens corretamente)

const storage = {
  produtos: [],
  vendas: [],
  
  async inicializar() {
    console.log('🔄 Carregando dados do Supabase...');
    
    try {
      if (!window.db) {
        console.error('❌ db não encontrado!');
        this.carregarFallback();
        return;
      }
      
      this.produtos = await window.db.buscarProdutos();
      console.log(`✅ ${this.produtos.length} produtos carregados`);
      
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
    console.log('📦 Carregando dados locais...');
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
      this.produtos = [
        { id: '1', nome: 'Água Mineral 500ml', codigo: '7891234567890', preco: 2.50, quantidade: 45, estoqueMinimo: 10 },
        { id: '2', nome: 'Refrigerante Lata', codigo: '7892345678901', preco: 4.99, quantidade: 20, estoqueMinimo: 15 },
      ];
      this.vendas = [];
    }
  },
  
  salvar() {
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
      if (window.db && window.db.adicionarProduto) {
        const novo = await window.db.adicionarProduto(produto);
        if (novo) {
          this.produtos.push({ ...produto, id: novo.id || Date.now().toString() });
          this.salvar();
          this.atualizarStats();
          return novo;
        }
      }
    } catch (error) {
      console.error('⚠️ Erro ao salvar no Supabase:', error.message);
    }
    
    produto.id = Date.now().toString();
    this.produtos.push(produto);
    this.salvar();
    this.atualizarStats();
    return null;
  },
  
  async removerProduto(id) {
    try {
      if (window.db && window.db.removerProduto) {
        await window.db.removerProduto(id);
      }
    } catch (error) {
      console.error('⚠️ Erro ao remover:', error.message);
    }
    
    this.produtos = this.produtos.filter(p => p.id !== id);
    this.salvar();
    this.atualizarStats();
  },
  
  async adicionarVenda(venda) {
    console.log('🛒 Salvando venda:', venda);
    
    try {
      // Garantir que os itens tenham nome
      const itensFormatados = venda.itens.map(item => ({
        id: item.id,
        nome: item.nome || 'Produto',
        quantidade: item.quantidade,
        preco_unitario: item.preco || item.preco_unitario || 0
      }));
      
      const vendaFormatada = {
        ...venda,
        itens: itensFormatados,
        forma_pagamento: venda.forma_pagamento || 'dinheiro',
        cliente: venda.cliente || 'Cliente Balcão'
      };
      
      console.log('📦 Venda formatada:', vendaFormatada);
      
      if (window.db && window.db.salvarVenda) {
        const nova = await window.db.salvarVenda(vendaFormatada);
        
        if (nova) {
          vendaFormatada.id = nova.id?.toString() || 'v' + Date.now();
          vendaFormatada.data = nova.created_at || new Date().toISOString();
          this.vendas.push(vendaFormatada);
          this.salvar();
          this.atualizarStats();
          
          // Atualizar estoque
          for (const item of venda.itens) {
            const produto = this.produtos.find(p => p.id === item.id);
            if (produto) {
              produto.quantidade -= item.quantidade;
            }
          }
          
          console.log('✅ Venda salva com sucesso!');
          return vendaFormatada;
        }
      }
      
      throw new Error('Supabase não disponível');
      
    } catch (error) {
      console.error('⚠️ Erro ao salvar venda, usando localStorage:', error.message);
      
      // Fallback local
      const vendaLocal = {
        ...venda,
        id: 'v' + Date.now(),
        data: new Date().toISOString(),
        forma_pagamento: venda.forma_pagamento || 'dinheiro',
        itens: venda.itens.map(item => ({
          ...item,
          nome: item.nome || 'Produto',
          preco_unitario: item.preco || 0
        }))
      };
      
      this.vendas.push(vendaLocal);
      
      // Atualizar estoque
      for (const item of venda.itens) {
        const produto = this.produtos.find(p => p.id === item.id);
        if (produto) produto.quantidade -= item.quantidade;
      }
      
      this.salvar();
      this.atualizarStats();
      
      app.mostrarToast('Venda salva localmente', 'warning');
      return vendaLocal;
    }
  },
  
  buscarPorCodigo(codigo) {
    return this.produtos.find(p => p.codigo === codigo);
  },
  
  buscarPorId(id) {
    return this.produtos.find(p => p.id === id);
  }
};