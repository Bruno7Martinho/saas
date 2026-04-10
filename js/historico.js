// historico.js - CORRIGIDO com Cupom Fiscal NFC-e e forma de pagamento

const historico = {
  vendasFiltradas: [],
  
  async renderizar() {
    document.getElementById('content').innerHTML = `
      <div class="card" style="text-align: center; padding: 60px;">
        <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #2563eb;"></i>
        <p style="margin-top: 20px;">Carregando histórico de vendas...</p>
      </div>
    `;
    
    await this.carregarVendas();
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
    
    const hoje = new Date().toDateString();
    const vendasHoje = this.vendasFiltradas.filter(v => {
      if (!v.data) return false;
      return new Date(v.data).toDateString() === hoje;
    });
    const faturamentoHoje = vendasHoje.reduce((acc, v) => acc + (v.total || 0), 0);
    
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
            <input type="text" id="buscaHistorico" placeholder="Buscar..." style="width: 200px;">
            <button class="btn btn-outline" onclick="historico.exportar()">
              <i class="fas fa-download"></i> Exportar
            </button>
          </div>
        </div>
        
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
        
        <div class="card mb-4" style="padding: 16px;">
          <h4 style="margin-bottom: 16px;"><i class="fas fa-credit-card"></i> Resumo por Forma de Pagamento</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px;">
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
        
        <div class="flex mb-4" style="gap: 8px;">
          <button class="btn btn-sm btn-outline" onclick="historico.filtrar('hoje')">📅 Hoje</button>
          <button class="btn btn-sm btn-outline" onclick="historico.filtrar('semana')">📆 Semana</button>
          <button class="btn btn-sm btn-outline" onclick="historico.filtrar('mes')">📊 Mês</button>
          <button class="btn btn-sm btn-outline" onclick="historico.filtrar('todos')">📋 Todas</button>
        </div>
        
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
      return `<tr><td colspan="6" style="text-align: center; padding: 40px;">Nenhuma venda registrada</td></tr>`;
    }
    
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
              <i class="fas fa-receipt"></i> Cupom
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
        return data.includes(termo) || total.includes(termo) || cliente.includes(termo);
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
      filtradas = this.vendasFiltradas.filter(v => v.data && new Date(v.data).toDateString() === hojeStr);
    } else if (periodo === 'semana') {
      const umaSemanaAtras = new Date();
      umaSemanaAtras.setDate(hoje.getDate() - 7);
      filtradas = this.vendasFiltradas.filter(v => v.data && new Date(v.data) >= umaSemanaAtras);
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
    
    this.mostrarCupomFiscal(venda);
  },
  
  // ========== CUPOM FISCAL ESTILO NFC-e ==========
  mostrarCupomFiscal(venda) {
    const data = venda.data ? new Date(venda.data) : new Date();
    const dataFormatada = data.toLocaleDateString('pt-BR');
    const horaFormatada = data.toLocaleTimeString('pt-BR');
    const formaPgto = this.formatarFormaPagamento(venda.forma_pagamento || 'dinheiro');
    const numeroCupom = String(venda.id || Date.now()).slice(-6).padStart(6, '0');
    
    // Calcular totais
    const subtotal = venda.itens ? venda.itens.reduce((acc, i) => acc + ((i.preco_unitario || i.preco || 0) * i.quantidade), 0) : 0;
    const total = venda.total || subtotal;
    
    let itensHtml = '';
    if (venda.itens && venda.itens.length > 0) {
      itensHtml = venda.itens.map(item => {
        const preco = item.preco_unitario || item.preco || 0;
        const subtotalItem = preco * item.quantidade;
        return `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #d1d5db;">
            <div style="flex: 1;">
              <span style="font-weight: 600;">${item.nome || 'Produto'}</span><br>
              <span style="font-size: 0.85rem; color: #6b7280;">
                ${item.quantidade} x R$ ${preco.toFixed(2)}
              </span>
            </div>
            <span style="font-weight: 600;">R$ ${subtotalItem.toFixed(2)}</span>
          </div>
        `;
      }).join('');
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal" style="max-width: 420px; padding: 0; overflow: hidden;">
        <!-- Cabeçalho do Cupom -->
        <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); color: white; padding: 20px; text-align: center;">
          <i class="fas fa-receipt" style="font-size: 32px; margin-bottom: 8px;"></i>
          <h2 style="margin: 0; font-size: 1.3rem;">CUPOM FISCAL</h2>
          <p style="opacity: 0.8; margin-top: 4px;">NFC-e Nº ${numeroCupom}</p>
        </div>
        
        <!-- Informações da Loja -->
        <div style="padding: 20px; text-align: center; border-bottom: 1px dashed #d1d5db;">
          <h3 style="margin: 0 0 8px 0;">🏪 MINHA CONVENIÊNCIA</h3>
          <p style="color: #6b7280; font-size: 0.9rem; margin: 0;">
            CNPJ: 00.000.000/0001-00<br>
            Av. Principal, 123 - Centro<br>
            São Paulo - SP
          </p>
        </div>
        
        <!-- Data e Cliente -->
        <div style="padding: 16px 20px; background: #f9fafb;">
          <div style="display: flex; justify-content: space-between;">
            <span><i class="far fa-calendar"></i> ${dataFormatada}</span>
            <span><i class="far fa-clock"></i> ${horaFormatada}</span>
          </div>
          <div style="margin-top: 8px;">
            <i class="far fa-user"></i> Cliente: ${venda.cliente || 'Cliente Balcão'}
          </div>
        </div>
        
        <!-- Itens -->
        <div style="padding: 20px;">
          <h4 style="margin-bottom: 16px;">📋 ITENS</h4>
          <div style="max-height: 300px; overflow-y: auto;">
            ${itensHtml || '<p style="color: #6b7280; text-align: center;">Nenhum item</p>'}
          </div>
        </div>
        
        <!-- Totais -->
        <div style="padding: 16px 20px; background: #f9fafb; border-top: 2px solid #d1d5db;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Subtotal:</span>
            <span>R$ ${subtotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Desconto:</span>
            <span>R$ 0,00</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: 700; margin-top: 12px; padding-top: 12px; border-top: 2px solid #d1d5db;">
            <span>TOTAL:</span>
            <span style="color: #059669;">R$ ${total.toFixed(2)}</span>
          </div>
        </div>
        
        <!-- Forma de Pagamento -->
        <div style="padding: 16px 20px; text-align: center;">
          <p style="margin: 0;">
            <i class="fas fa-credit-card"></i> 
            Forma de Pagamento: <strong>${formaPgto}</strong>
          </p>
        </div>
        
        <!-- QR Code e Chave de Acesso -->
        <div style="padding: 20px; text-align: center; border-top: 1px dashed #d1d5db;">
          <div style="background: white; padding: 12px; border-radius: 8px; display: inline-block; margin-bottom: 12px;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('NFCe:' + numeroCupom + '|' + total.toFixed(2))}" 
                 alt="QR Code" style="width: 100px; height: 100px;">
          </div>
          <p style="font-size: 0.75rem; color: #6b7280; word-break: break-all;">
            <strong>Chave de Acesso:</strong><br>
            ${this.gerarChaveAcesso(numeroCupom, data)}
          </p>
          <p style="font-size: 0.7rem; color: #9ca3af; margin-top: 12px;">
            Consulte pela chave de acesso em:<br>
            www.sefaz.sp.gov.br/nfce
          </p>
        </div>
        
        <!-- Ações -->
        <div style="padding: 16px 20px; display: flex; gap: 12px; border-top: 1px solid #e5e7eb;">
          <button class="btn btn-outline btn-sm" style="flex: 1;" onclick="historico.imprimirCupom()">
            <i class="fas fa-print"></i> Imprimir
          </button>
          <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="this.closest('.modal-overlay').remove()">
            <i class="fas fa-check"></i> Fechar
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  },
  
  gerarChaveAcesso(numero, data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `3525${ano}${mes}${dia}${numero}${random}12345678901234`;
  },
  
  imprimirCupom() {
    app.mostrarToast('Enviando para impressora...', 'info');
    window.print();
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