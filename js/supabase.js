// js/supabase.js - CORRIGIDO (Erro 400 resolvido)

// Verificar se já existe, se não, criar
if (!window.supabaseClient) {
  const SUPABASE_URL = 'https://yirwnkeuenwgfkhthxsv.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpcndua2V1ZW53Z2ZraHRoeHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2OTMyODYsImV4cCI6MjA5MTI2OTI4Nn0.mYH6-AQTTQ5QliqJmk8rQ8uuLds8QdLmGs7LAXmIqsM';
  
  window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
    db: { schema: 'public' }
  });
  console.log('✅ Cliente Supabase criado');
}

// Criar o objeto db COMPLETO
window.db = {
  // ========== PRODUTOS ==========
  async buscarProdutos() {
    try {
      console.log('🔍 Buscando produtos...');
      
      const { data, error } = await window.supabaseClient
        .from('produtos')
        .select('*')
        .order('nome');
      
      if (error) {
        console.error('❌ Erro ao buscar:', error);
        return [];
      }
      
      console.log(`✅ ${data?.length || 0} produtos encontrados`);
      
      if (!data) return [];
      
      return data.map(p => ({
        id: String(p.id),
        nome: p.nome || '',
        codigo: p.codigo_barras || '',
        preco: Number(p.preco) || 0,
        quantidade: p.quantidade || 0,
        estoqueMinimo: p.estoque_minimo || 10,
        categoria: p.categoria || 'Geral',
        fornecedor: p.fornecedor || ''
      }));
    } catch (e) {
      console.error('❌ Erro:', e);
      return [];
    }
  },
  
  async adicionarProduto(produto) {
    try {
      console.log('📤 Enviando para Supabase:', produto);
      
      // Garantir que todos os campos obrigatórios existam
      const dadosParaInserir = {
        nome: produto.nome,
        codigo_barras: String(produto.codigo),
        preco: Number(produto.preco),
        quantidade: Number(produto.quantidade) || 0,
        estoque_minimo: Number(produto.estoqueMinimo) || 10,
        categoria: produto.categoria || 'Geral',
        fornecedor: produto.fornecedor || ''
      };
      
      const { data, error } = await window.supabaseClient
        .from('produtos')
        .insert(dadosParaInserir)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Erro Supabase:', error);
        
        // Se for erro de código duplicado
        if (error.code === '23505') {
          throw new Error('Código de barras já cadastrado!');
        }
        
        throw new Error(error.message || 'Erro ao salvar');
      }
      
      console.log('✅ Produto salvo:', data);
      return data;
      
    } catch (e) {
      console.error('❌ Exceção:', e);
      throw e;
    }
  },
  
  async atualizarProduto(id, dados) {
    try {
      const { error } = await window.supabaseClient
        .from('produtos')
        .update({
          nome: dados.nome,
          preco: dados.preco,
          quantidade: dados.quantidade,
          estoque_minimo: dados.estoqueMinimo
        })
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('❌ Erro ao atualizar:', e);
      throw e;
    }
  },
  
  async removerProduto(id) {
    try {
      const { error } = await window.supabaseClient
        .from('produtos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('❌ Erro ao remover:', e);
      throw e;
    }
  },
  
  async buscarPorCodigo(codigo) {
    try {
      const { data, error } = await window.supabaseClient
        .from('produtos')
        .select('*')
        .eq('codigo_barras', String(codigo))
        .single();
      
      if (error) return null;
      
      return {
        id: String(data.id),
        nome: data.nome,
        codigo: data.codigo_barras,
        preco: Number(data.preco),
        quantidade: data.quantidade
      };
    } catch (e) {
      return null;
    }
  },
  
  // ========== VENDAS ==========
  async salvarVenda(venda) {
    console.log('💾 Salvando venda:', venda);
    
    try {
      // 1. Inserir a venda
      const { data: vendaData, error: vendaError } = await window.supabaseClient
        .from('vendas')
        .insert({
          total: Number(venda.total),
          cliente: venda.cliente || 'Cliente Balcão',
          forma_pagamento: venda.forma_pagamento || 'dinheiro'
        })
        .select()
        .single();
      
      if (vendaError) throw vendaError;
      
      console.log('✅ Venda salva, ID:', vendaData.id);
      
      // 2. Inserir os itens
      if (venda.itens && venda.itens.length > 0) {
        const itensParaInserir = venda.itens.map(item => ({
          venda_id: vendaData.id,
          produto_id: item.id,
          nome_produto: item.nome || 'Produto',
          quantidade: Number(item.quantidade),
          preco_unitario: Number(item.preco || item.preco_unitario || 0)
        }));
        
        const { error: itensError } = await window.supabaseClient
          .from('itens_venda')
          .insert(itensParaInserir);
        
        if (itensError) console.error('❌ Erro ao salvar itens:', itensError);
        else console.log(`✅ ${itensParaInserir.length} itens salvos`);
      }
      
      // 3. Atualizar estoque
      for (const item of venda.itens) {
        const { data: produto } = await window.supabaseClient
          .from('produtos')
          .select('quantidade')
          .eq('id', item.id)
          .single();
        
        if (produto) {
          const novaQuantidade = produto.quantidade - item.quantidade;
          await window.supabaseClient
            .from('produtos')
            .update({ quantidade: novaQuantidade })
            .eq('id', item.id);
        }
      }
      
      return vendaData;
      
    } catch (error) {
      console.error('❌ Erro ao processar venda:', error);
      throw error;
    }
  },
  
  async buscarVendas(limite = 100) {
    try {
      const { data: vendas, error } = await window.supabaseClient
        .from('vendas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limite);
      
      if (error) return [];
      
      const vendasComItens = [];
      
      for (const venda of vendas) {
        const { data: itens } = await window.supabaseClient
          .from('itens_venda')
          .select('*')
          .eq('venda_id', venda.id);
        
        vendasComItens.push({
          id: String(venda.id),
          data: venda.created_at,
          total: venda.total,
          cliente: venda.cliente,
          forma_pagamento: venda.forma_pagamento,
          itens: itens || []
        });
      }
      
      return vendasComItens;
      
    } catch (error) {
      console.error('❌ Erro:', error);
      return [];
    }
  },
  
  async buscarVendasPorData(dataInicio, dataFim) {
    try {
      const { data, error } = await window.supabaseClient
        .from('vendas')
        .select('*')
        .gte('created_at', dataInicio)
        .lte('created_at', dataFim)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (e) {
      return [];
    }
  },
  
  // ========== CONFIGURAÇÕES ==========
  async buscarConfiguracoes() {
    try {
      const { data, error } = await window.supabaseClient
        .from('configuracoes')
        .select('*')
        .limit(1)
        .single();
      
      if (error) {
        return {
          nome_loja: 'Minha Conveniência',
          alerta_estoque: 10,
          tema: 'light',
          moeda: 'BRL'
        };
      }
      
      return data;
    } catch (e) {
      return null;
    }
  },
  
  async salvarConfiguracoes(config) {
    try {
      const { error } = await window.supabaseClient
        .from('configuracoes')
        .update({
          nome_loja: config.nomeLoja,
          alerta_estoque: config.alertaEstoque,
          tema: config.tema,
          moeda: config.moeda
        })
        .eq('id', 1);
      
      return !error;
    } catch (e) {
      return false;
    }
  }
};

console.log('✅ db disponível com todas as funções!');