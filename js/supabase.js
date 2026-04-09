// js/supabase.js - Versão CORRIGIDA (sem declarar supabase novamente)

// Verificar se já existe, se não, criar
if (!window.supabaseClient) {
  const SUPABASE_URL = 'https://yirwnkeuenwgfkhtHxsv.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpcndua2V1ZW53Z2ZraHRoeHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2OTMyODYsImV4cCI6MjA5MTI2OTI4Nn0.mYH6-AQTTQ5QliqJmk8rQ8uuLds8QdLmGs7LAXmIqsM';
  
  window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// Criar o objeto db
window.db = {
  async buscarProdutos() {
    try {
      const { data, error } = await window.supabaseClient
        .from('produtos')
        .select('*')
        .order('nome');
      
      if (error) {
        console.error('Erro ao buscar:', error);
        return [];
      }
      
      return data.map(p => ({
        id: String(p.id),
        nome: p.nome,
        codigo: p.codigo_barras,
        preco: Number(p.preco),
        quantidade: p.quantidade || 0,
        estoqueMinimo: p.estoque_minimo || 10
      }));
    } catch (e) {
      console.error('Erro:', e);
      return [];
    }
  },
  
  async adicionarProduto(produto) {
    const { data, error } = await window.supabaseClient
      .from('produtos')
      .insert({
        nome: produto.nome,
        codigo_barras: produto.codigo,
        preco: produto.preco,
        quantidade: produto.quantidade,
        estoque_minimo: produto.estoqueMinimo || 10
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async salvarVenda(venda) {
    const { data, error } = await window.supabaseClient
      .from('vendas')
      .insert({
        total: venda.total,
        cliente: venda.cliente || 'Cliente Balcão'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

console.log('✅ db disponível globalmente!');