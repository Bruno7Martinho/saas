// historico.js - Histórico de Vendas

const historico = {
  vendasFiltradas: [],
  
  renderizar() {
    // Carregar vendas
    this.vendasFiltradas = storage.vendas || [];
    
    const totalVendas = this.vendasFiltradas.length;
    const faturamentoTotal = this.vendasFiltradas.reduce((acc, v) => acc + (v.total || 0), 0);
    
    // Vendas de hoje
    const hoje = new Date().toDateString();
    const vendasHoje = this.vendasFiltradas.filter(v => {
      if (!v.data) return false;
      return new Date(v.data).toDateString() === hoje;
    });
    const faturamentoHoje = vendasHoje.reduce((acc, v) => acc + (v.total || 0), 0);
    
    document.getElementById('content').innerHTML = `
      <div class="card">
        <div class="flex-between mb-4">
          <h2><i class="fas fa-history"></i> Histórico de Vendas</h2>
          <div class="flex">
            <input type="text" id="buscaHistorico" placeholder="Buscar por data ou valor..." style="width: 250px;">
            <button class="btn btn-outline" onclick="historico.exportar()">
              <i class="fas fa-download"></i> Exportar
            </button>
          </div>
        </div>
        
        <!-- Cards de resumo -->
        <div class="grid-3 mb-4">
          <div class="stat-card">
            <div class="stat-label">Total de Vendas</div>
            <div class="stat-value">${totalVendas}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Faturamento Total</div>
            <div class="stat-value">R$ ${faturamentoTotal.toFixed(2)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Vendas Hoje</div>
            <div class="stat-value">${vendasHoje.length}</div>
            <div class="stat-trend">R$ ${faturamentoHoje.toFixed(2)}</div>
          </div>
        </div>
        
        <!-- Filtros rápidos -->
        <div class="flex mb-4" style="gap: 8px;">
          <button class="btn btn-sm btn-outline" onclick="historico.filtrar('hoje')">📅 Hoje</button>
          <button class="btn btn-sm btn-outline" onclick="historico.filtrar('semana')">📆 Esta Semana</button>
          <button class="btn btn-sm btn-outline" onclick="historico.filtrar('mes')">📊 Este Mês</button>
          <button class="btn btn-sm btn-outline" onclick="historico.filtrar('todos')">📋 Todas</button>
        </div>
        
        <!-- Lista de vendas -->
        <div class="table-wrapper">
          <table id="tabelaHistorico">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Cliente</th>
                <th>Itens</th>
                <th>Total</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${this.renderizarLinhas(this.vendasFiltradas)}
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    this.attachEventos();
  },
  
  renderizarLinhas(vendas) {
    if (!vendas || vendas.length === 0) {
      return `
        <tr>
          <td colspan="5" style="text-align: center; padding: 40px; color: #6b7280;">
            <i class="fas fa-receipt" style="font-size: 48px; margin-bottom: 16px;"></i>
            <p>Nenhuma venda registrada</p>
            <button class="btn btn-primary" onclick="app.mudarPagina('vendas')">
              Ir para Vendas
            </button>
          </td>
        </tr>
      `;
    }
    
    // Ordenar por data (mais recente primeiro)
    const vendasOrdenadas = [...vendas].sort((a, b) => {
      if (!a.data) return 1;
      if (!b.data) return -1;
      return new Date(b.data) - new Date(a.data);
    });
    
    return vendasOrdenadas.map(v => {
      const data = v.data ? new Date(v.data) : new Date();
      const dataFormatada = data.toLocaleString('pt-BR');
      const itensCount = v.itens ? v.itens.length : 0;
      
      return `
        <tr>
          <td>${dataFormatada}</td>
          <td>${v.cliente || 'Cliente Balcão'}</td>
          <td>${itensCount} ${itensCount === 1 ? 'item' : 'itens'}</td>
          <td><strong>R$ ${(v.total || 0).toFixed(2)}</strong></td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="historico.verDetalhes('${v.id}')">
              <i class="fas fa-eye"></i> Ver
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },
  
  attachEventos() {
    document.getElementById('buscaHistorico')?.addEventListener('input', (e) => {
      const termo = e.target.value.toLowerCase();
      const filtradas = this.vendasFiltradas.filter(v => {
        const data = v.data ? new Date(v.data).toLocaleString('pt-BR').toLowerCase() : '';
        const total = (v.total || 0).toString();
        const cliente = (v.cliente || '').toLowerCase();
        
        return data.includes(termo) || total.includes(termo) || cliente.includes(termo);
      });
      
      document.querySelector('#tabelaHistorico tbody').innerHTML = this.renderizarLinhas(filtradas);
    });
  },
  
  filtrar(periodo) {
    const hoje = new Date();
    let filtradas = [];
    
    if (periodo === 'hoje') {
      const hojeStr = hoje.toDateString();
      filtradas = this.vendasFiltradas.filter(v => {
        if (!v.data) return false;
        return new Date(v.data).toDateString() === hojeStr;
      });
    } else if (periodo === 'semana') {
      const umaSemanaAtras = new Date();
      umaSemanaAtras.setDate(hoje.getDate() - 7);
      
      filtradas = this.vendasFiltradas.filter(v => {
        if (!v.data) return false;
        return new Date(v.data) >= umaSemanaAtras;
      });
    } else if (periodo === 'mes') {
      const mesAtual = hoje.getMonth();
      const anoAtual = hoje.getFullYear();
      
      filtradas = this.vendasFiltradas.filter(v => {
        if (!v.data) return false;
        const dataVenda = new Date(v.data);
        return dataVenda.getMonth() === mesAtual && dataVenda.getFullYear() === anoAtual;
      });
    } else {
      filtradas = this.vendasFiltradas;
    }
    
    document.querySelector('#tabelaHistorico tbody').innerHTML = this.renderizarLinhas(filtradas);
    app.mostrarToast(`${filtradas.length} vendas encontradas`, 'info');
  },
  
  verDetalhes(vendaId) {
    const venda = this.vendasFiltradas.find(v => v.id === vendaId);
    if (!venda) return;
    
    const data = venda.data ? new Date(venda.data).toLocaleString('pt-BR') : 'N/A';
    
    let itensHtml = '';
    if (venda.itens && venda.itens.length > 0) {
      itensHtml = venda.itens.map(item => `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span>${item.quantidade}x ${item.nome}</span>
          <span>R$ ${(item.preco * item.quantidade).toFixed(2)}</span>
        </div>
      `).join('');
    } else {
      itensHtml = '<p>Sem itens registrados</p>';
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal" style="max-width: 500px;">
        <h3><i class="fas fa-receipt"></i> Detalhes da Venda</h3>
        
        <div style="margin: 20px 0;">
          <p><strong>Data:</strong> ${data}</p>
          <p><strong>Cliente:</strong> ${venda.cliente || 'Cliente Balcão'}</p>
          <p><strong>Total:</strong> R$ ${(venda.total || 0).toFixed(2)}</p>
        </div>
        
        <h4>Itens:</h4>
        <div style="max-height: 300px; overflow-y: auto; margin: 16px 0;">
          ${itensHtml}
        </div>
        
        <button class="btn btn-primary w-full" onclick="this.closest('.modal-overlay').remove()">
          Fechar
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
  },
  
  exportar() {
    const dados = {
      exportado: new Date().toISOString(),
      totalVendas: this.vendasFiltradas.length,
      vendas: this.vendasFiltradas
    };
    
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico_vendas_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    app.mostrarToast('Histórico exportado!', 'success');
  }
};