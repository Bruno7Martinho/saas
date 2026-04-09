// js/supabase.js - Versão COMPLETA e CORRIGIDA

// Verificar se já existe, se não, criar
if (!window.supabaseClient) {
  const SUPABASE_URL = 'https://yirwnkeuenwgfkhtHxsv.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpcndua2V1ZW53Z2ZraHRoeHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2OTMyODYsImV4cCI6MjA5MTI2OTI4Nn0.mYH6-AQTTQ5QliqJmk8rQ8uuLds8QdLmGs7LAXmIqsM';
  
  window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log('✅ Cliente Supabase criado');
}

// Criar o objeto db COMPLETO
window.db = {
  // ========== PRODUTOS ==========
  async buscarProdutos() {
    try {
      console.log('🔍 Buscando produtos do Supabase...');
      
      const { data, error } = await window.supabaseClient
        .from('produtos')
        .select('*')
        .order('nome');
      
      if (error) {
        console.error('❌ Erro ao buscar produtos:', error);
        return [];
      }
      
      console.log(`✅ ${data.length} produtos encontrados`);
      
      return data.map(p => ({
        id: String(p.id),
        nome: p.nome,
        codigo: p.codigo_barras,
        preco: Number(p.preco),
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
      console.log('➕ Adicionando produto:', produto.nome);
      
      const { data, error } = await window.supabaseClient
        .from('produtos')
        .insert({
          nome: produto.nome,
          codigo_barras: produto.codigo,
          preco: produto.preco,
          quantidade: produto.quantidade,
          estoque_minimo: produto.estoqueMinimo || 10,
          categoria: produto.categoria || 'Geral',
          fornecedor: produto.fornecedor || ''
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Erro ao adicionar:', error);
        throw error;
      }
      
      console.log('✅ Produto adicionado:', data);
      return data;
      
    } catch (e) {
      console.error('❌ Erro:', e);
      throw e;
    }
  },
  
  async atualizarProduto(id, dados) {
    try {
      console.log('✏️ Atualizando produto:', id);
      
      const { error } = await window.supabaseClient
        .from('produtos')
        .update({
          nome: dados.nome,
          preco: dados.preco,
          quantidade: dados.quantidade,
          estoque_minimo: dados.estoqueMinimo
        })
        .eq('id', id);
      
      if (error) {
        console.error('❌ Erro ao atualizar:', error);
        throw error;
      }
      
      console.log('✅ Produto atualizado');
      return true;
      
    } catch (e) {
      console.error('❌ Erro:', e);
      throw e;
    }
  },
  
  async removerProduto(id) {
    try {
      console.log('🗑️ Removendo produto:', id);
      
      const { error } = await window.supabaseClient
        .from('produtos')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Erro ao remover:', error);
        throw error;
      }
      
      console.log('✅ Produto removido');
      return true;
      
    } catch (e) {
      console.error('❌ Erro:', e);
      throw e;
    }
  },
  
  async buscarPorCodigo(codigo) {
    try {
      const { data, error } = await window.supabaseClient
        .from('produtos')
        .select('*')
        .eq('codigo_barras', codigo)
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
    console.log('💾 Salvando venda no Supabase...');
    
    try {
      // 1. Inserir a venda
      const { data: vendaData, error: vendaError } = await window.supabaseClient
        .from('vendas')
        .insert({
          total: venda.total,
          cliente: venda.cliente || 'Cliente Balcão'
        })
        .select()
        .single();
      
      if (vendaError) {
        console.error('❌ Erro ao salvar venda:', vendaError);
        throw vendaError;
      }
      
      console.log('✅ Venda salva, ID:', vendaData.id);
      
      // 2. Inserir os itens da venda
      if (venda.itens && venda.itens.length > 0) {
        const itensParaInserir = venda.itens.map(item => ({
          venda_id: vendaData.id,
          produto_id: item.id,
          nome_produto: item.nome,
          quantidade: item.quantidade,
          preco_unitario: item.preco
        }));
        
        const { error: itensError } = await window.supabaseClient
          .from('itens_venda')
          .insert(itensParaInserir);
        
        if (itensError) {
          console.error('❌ Erro ao salvar itens:', itensError);
        } else {
          console.log(`✅ ${itensParaInserir.length} itens salvos`);
        }
      }
      
      // 3. Atualizar estoque dos produtos
      for (const item of venda.itens) {
        // Buscar quantidade atual
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
          
          console.log(`📦 Estoque atualizado: ${item.nome} = ${novaQuantidade}`);
        }
      }
      
      return vendaData;
      
    } catch (error) {
      console.error('❌ Erro ao processar venda:', error);
      throw error;
    }
  },
  
  async buscarVendas(limite = 100) {
    console.log('🔍 Buscando vendas do Supabase...');
    
    try {
      // Buscar vendas
      const { data: vendas, error } = await window.supabaseClient
        .from('vendas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limite);
      
      if (error) {
        console.error('❌ Erro ao buscar vendas:', error);
        return [];
      }
      
      console.log(`✅ ${vendas.length} vendas encontradas`);
      
      // Para cada venda, buscar os itens
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
      console.error('Erro:', e);
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
        // Retornar padrão se não existir
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

console.log('✅ db disponível globalmente com todas as funções!');