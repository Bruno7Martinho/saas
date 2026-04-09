// historico.js - Histórico de Vendas (CORRIGIDO com forma de pagamento)

const historico = {
  vendasFiltradas: [],
  
  async renderizar() {
    // Mostrar loading
    document.getElementById('content').innerHTML = `
      <div class="card" style="text-align: center; padding: 60px;">
        <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #2563eb;"></i>
        <p style="margin-top: 20px;">Carregando histórico de vendas...</p>
      </div>
    `;
    
    // Carregar vendas
    await this.carregarVendas();
    
    // Renderizar tela
    this.renderizarTela();
  },
  
  async carregarVendas() {
    console.log('📊 Carregando vendas do banco...');
    
    try {
      if (window.db && window.db.buscarVendas) {
        const vendasDB = await window.db.buscarVendas(100);
        this.vendasFiltradas = vendasDB;
        console.log(`✅ ${vendasDB.length} vendas carregadas`);
      } else {
        this.vendasFiltradas = storage.vendas || [];
        console.log(`📦 ${this.vendasFiltradas.length} vendas locais`);
      }
    } catch (error) {
      console.error('❌ Erro:', error);
      this.vendasFiltradas = storage.vendas || [];
    }
  },
  
  renderizarTela() {
    const totalVendas = this.vendasFiltradas.length;
    const faturamentoTotal = this.vendasFiltradas.reduce((acc, v) => acc + (v.total || 0), 0);
    
    // Vendas de hoje
    const hoje = new Date().toDateString();
    const vendasHoje = this.vendasFiltradas.filter(v => {
      if (!v.data) return false;
      return new Date(v.data).toDateString() === hoje;
    });
    const faturamentoHoje = vendasHoje.reduce((acc, v) => acc + (v.total || 0), 0);
    
    // Totais por forma de pagamento
    const totaisPagamento = {
      dinheiro: 0,
      cartao_credito: 0,
      cartao_debito: 0,
      pix: 0,
      outros: 0
    };
    
    this.vendasFiltradas.forEach(v => {
      const forma = v.forma_pagamento || 'dinheiro';
      if (totaisPagamento.hasOwnProperty(forma)) {
        totaisPagamento[forma] += v.total || 0;
      } else {
        totaisPagamento.outros += v.total || 0;
      }
    });
    
    document.getElementById('content').innerHTML = `
      <div class="card">
        <div class="flex-between mb-4">
          <h2><i class="fas fa-history"></i> Histórico de Vendas</h2>
          <div class="flex">
            <button class="btn btn-outline" onclick="historico.recarregar()">
              <i class="fas fa-sync-alt"></i> Atualizar
            </button>
            <input type="text" id="buscaHistorico" placeholder="Buscar por data, valor ou cliente..." style="width: 250px;">
            <button class="btn btn-outline" onclick="historico.exportar()">
              <i class="fas fa-download"></i> Exportar
            </button>
          </div>
        </div>
        
        <!-- Cards de resumo -->
        <div class="grid-4 mb-4">
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
          <div class="stat-card">
            <div class="stat-label">Ticket Médio</div>
            <div class="stat-value">R$ ${totalVendas > 0 ? (faturamentoTotal / totalVendas).toFixed(2) : '0.00'}</div>
          </div>
        </div>
        
        <!-- Resumo por forma de pagamento -->
        <div class="card mb-4" style="padding: 16px;">
          <h4 style="margin-bottom: 16px;"><i class="fas fa-credit-card"></i> Resumo por Forma de Pagamento</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <i class="fas fa-money-bill-wave" style="color: #10b981;"></i>
              <span><strong>Dinheiro:</strong> R$ ${totaisPagamento.dinheiro.toFixed(2)}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <i class="far fa-credit-card" style="color: #2563eb;"></i>
              <span><strong>Crédito:</strong> R$ ${totaisPagamento.cartao_credito.toFixed(2)}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <i class="fas fa-credit-card" style="color: #d97706;"></i>
              <span><strong>Débito:</strong> R$ ${totaisPagamento.cartao_debito.toFixed(2)}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <i class="fas fa-qrcode" style="color: #8b5cf6;"></i>
              <span><strong>PIX:</strong> R$ ${totaisPagamento.pix.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <!-- Filtros rápidos -->
        <div class="flex mb-4" style="gap: 8px;">
          <button class="btn btn-sm btn-outline" onclick="historico.filtrar('hoje')">
            <i class="fas fa-calendar-day"></i> Hoje
          </button>
          <button class="btn btn-sm btn-outline" onclick="historico.filtrar('semana')">
            <i class="fas fa-calendar-week"></i> Esta Semana
          </button>
          <button class="btn btn-sm btn-outline" onclick="historico.filtrar('mes')">
            <i class="fas fa-calendar-alt"></i> Este Mês
          </button>
          <button class="btn btn-sm btn-outline" onclick="historico.filtrar('todos')">
            <i class="fas fa-list"></i> Todas
          </button>
        </div>
        
        <!-- Lista de vendas -->
        <div class="table-wrapper">
          <table id="tabelaHistorico">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Cliente</th>
                <th>Itens</th>
                <th>Forma Pgto</th>
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
          <td colspan="6" style="text-align: center; padding: 40px; color: #6b7280;">
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
      const formaPgto = this.formatarFormaPagamento(v.forma_pagamento || 'dinheiro');
      
      return `
        <tr>
          <td>${dataFormatada}</td>
          <td>${v.cliente || 'Cliente Balcão'}</td>
          <td>${itensCount} ${itensCount === 1 ? 'item' : 'itens'}</td>
          <td>${formaPgto}</td>
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
  
  formatarFormaPagamento(forma) {
    const formas = {
      dinheiro: '💵 Dinheiro',
      cartao_credito: '💳 Crédito',
      cartao_debito: '💳 Débito',
      pix: '📱 PIX',
      outros: '💰 Outros'
    };
    return formas[forma] || forma;
  },
  
  attachEventos() {
    document.getElementById('buscaHistorico')?.addEventListener('input', (e) => {
      const termo = e.target.value.toLowerCase();
      const filtradas = this.vendasFiltradas.filter(v => {
        const data = v.data ? new Date(v.data).toLocaleString('pt-BR').toLowerCase() : '';
        const total = (v.total || 0).toString();
        const cliente = (v.cliente || '').toLowerCase();
        const forma = this.formatarFormaPagamento(v.forma_pagamento || '').toLowerCase();
        
        return data.includes(termo) || total.includes(termo) || cliente.includes(termo) || forma.includes(termo);
      });
      
      document.querySelector('#tabelaHistorico tbody').innerHTML = this.renderizarLinhas(filtradas);
    });
  },
  
  async recarregar() {
    await this.carregarVendas();
    this.renderizarTela();
    app.mostrarToast('Histórico atualizado!', 'success');
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
    const formaPgto = this.formatarFormaPagamento(venda.forma_pagamento || 'dinheiro');
    
    let itensHtml = '';
    if (venda.itens && venda.itens.length > 0) {
      itensHtml = venda.itens.map(item => `
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
          <span>
            <strong>${item.quantidade}x</strong> ${item.nome || 'Produto'}<br>
            <small style="color: #6b7280;">R$ ${(item.preco_unitario || item.preco || 0).toFixed(2)} cada</small>
          </span>
          <span style="font-weight: 600;">R$ ${((item.preco_unitario || item.preco || 0) * item.quantidade).toFixed(2)}</span>
        </div>
      `).join('');
    } else {
      itensHtml = '<p style="color: #6b7280; text-align: center; padding: 20px;">Sem itens registrados</p>';
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal" style="max-width: 500px;">
        <h3 style="margin-bottom: 20px;"><i class="fas fa-receipt"></i> Detalhes da Venda</h3>
        
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
          <p><strong>📅 Data:</strong> ${data}</p>
          <p><strong>👤 Cliente:</strong> ${venda.cliente || 'Cliente Balcão'}</p>
          <p><strong>💳 Forma de Pagamento:</strong> ${formaPgto}</p>
          <p><strong>💰 Total:</strong> <span style="font-size: 1.2rem; color: #059669;">R$ ${(venda.total || 0).toFixed(2)}</span></p>
        </div>
        
        <h4 style="margin-bottom: 12px;">📋 Itens da Venda</h4>
        <div style="max-height: 300px; overflow-y: auto; margin-bottom: 20px;">
          ${itensHtml}
        </div>
        
        <div style="border-top: 2px solid #e5e7eb; padding-top: 16px; display: flex; justify-content: space-between;">
          <span style="font-weight: 600;">Total de itens:</span>
          <span>${venda.itens ? venda.itens.reduce((acc, i) => acc + i.quantidade, 0) : 0}</span>
        </div>
        
        <button class="btn btn-primary w-full mt-4" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-check"></i> Fechar
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
  },
  
  exportar() {
    const dados = {
      exportado: new Date().toISOString(),
      totalVendas: this.vendasFiltradas.length,
      faturamentoTotal: this.vendasFiltradas.reduce((acc, v) => acc + (v.total || 0), 0),
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