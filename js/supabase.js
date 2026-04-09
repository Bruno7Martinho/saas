// js/supabase.js - Conexão com Supabase

// SUAS CREDENCIAIS (já configuradas)
const SUPABASE_URL = 'https://yirwnkeuenwgfkhtxhsv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpcmd3a2V1ZW53Z2ZraHRoeHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2OTMyODYsImV4cCI6MjA5MTI2OTI4Nn0.mYH6-AQTTQ5QliqJmk8rQ8uuLds8QdLmGs7LAXmIqsM';

// Inicializar cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('✅ Supabase conectado!');

// ========== BANCO DE DADOS ==========
const db = {
  // Buscar todos os produtos
  async buscarProdutos() {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('nome');
    
    if (error) {
      console.error('Erro ao buscar produtos:', error);
      return [];
    }
    
    // Converter para o formato que seu sistema espera
    return data.map(p => ({
      id: p.id.toString(),
      nome: p.nome,
      codigo: p.codigo_barras,
      preco: p.preco,
      quantidade: p.quantidade,
      estoqueMinimo: p.estoque_minimo || 10,
      categoria: p.categoria || 'Geral',
      fornecedor: p.fornecedor || ''
    }));
  },
  
  // Adicionar novo produto
  async adicionarProduto(produto) {
    const { data, error } = await supabase
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
      .select();
    
    if (error) {
      console.error('Erro ao adicionar:', error);
      return null;
    }
    
    return {
      ...produto,
      id: data[0].id.toString()
    };
  },
  
  // Atualizar produto
  async atualizarProduto(id, dados) {
    const { error } = await supabase
      .from('produtos')
      .update({
        nome: dados.nome,
        preco: dados.preco,
        quantidade: dados.quantidade,
        estoque_minimo: dados.estoqueMinimo
      })
      .eq('id', id);
    
    return !error;
  },
  
  // Remover produto
  async removerProduto(id) {
    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id);
    
    return !error;
  },
  
  // Buscar produto por código de barras
  async buscarPorCodigo(codigo) {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('codigo_barras', codigo)
      .single();
    
    if (error) return null;
    
    return {
      id: data.id.toString(),
      nome: data.nome,
      codigo: data.codigo_barras,
      preco: data.preco,
      quantidade: data.quantidade,
      estoqueMinimo: data.estoque_minimo
    };
  },
  
  // ========== VENDAS ==========
  async salvarVenda(venda) {
    // 1. Inserir a venda
    const { data: vendaData, error: vendaError } = await supabase
      .from('vendas')
      .insert({
        total: venda.total,
        cliente: venda.cliente || 'Cliente Balcão'
      })
      .select()
      .single();
    
    if (vendaError) {
      console.error('Erro ao salvar venda:', vendaError);
      return null;
    }
    
    // 2. Inserir os itens da venda
    const itens = venda.itens.map(item => ({
      venda_id: vendaData.id,
      produto_id: item.id,
      nome_produto: item.nome,
      quantidade: item.quantidade,
      preco_unitario: item.preco
    }));
    
    const { error: itensError } = await supabase
      .from('itens_venda')
      .insert(itens);
    
    if (itensError) {
      console.error('Erro ao salvar itens:', itensError);
    }
    
    // 3. Atualizar estoque dos produtos
    for (const item of venda.itens) {
      await supabase.rpc('atualizar_estoque', {
        p_produto_id: item.id,
        p_quantidade: item.quantidade
      });
    }
    
    return vendaData;
  },
  
  // Buscar vendas recentes
  async buscarVendas(limite = 50) {
    const { data, error } = await supabase
      .from('vendas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limite);
    
    if (error) return [];
    
    return data.map(v => ({
      id: v.id.toString(),
      data: v.created_at,
      total: v.total,
      cliente: v.cliente
    }));
  },
  
  // ========== CONFIGURAÇÕES ==========
  async buscarConfiguracoes() {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('*')
      .limit(1)
      .single();
    
    if (error) {
      // Retornar configurações padrão
      return {
        nome_loja: 'Minha Conveniência',
        alerta_estoque: 10,
        tema: 'light',
        moeda: 'BRL'
      };
    }
    
    return data;
  },
  
  async salvarConfiguracoes(config) {
    const { error } = await supabase
      .from('configuracoes')
      .update({
        nome_loja: config.nomeLoja,
        alerta_estoque: config.alertaEstoque,
        tema: config.tema,
        moeda: config.moeda
      })
      .eq('id', 1);
    
    return !error;
  }
};

// Testar conexão
db.buscarProdutos().then(produtos => {
  console.log(`📦 ${produtos.length} produtos carregados do Supabase!`);
});