// Relatorios.js - Análises e Estatísticas

const relatorios = {
  renderizar() {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    // Cálculos
    const vendasMes = storage.vendas.filter(v => {
      const data = new Date(v.data);
      return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
    });
    
    const faturamentoMes = vendasMes.reduce((acc, v) => acc + v.total, 0);
    const ticketMedio = vendasMes.length ? faturamentoMes / vendasMes.length : 0;
    
    // Produtos mais vendidos
    const produtosVendidos = {};
    storage.vendas.forEach(v => {
      v.itens.forEach(item => {
        produtosVendidos[item.nome] = (produtosVendidos[item.nome] || 0) + item.quantidade;
      });
    });
    
    const topProdutos = Object.entries(produtosVendidos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    // Vendas por dia da semana
    const vendasPorDia = { Dom: 0, Seg: 0, Ter: 0, Qua: 0, Qui: 0, Sex: 0, Sab: 0 };
    vendasMes.forEach(v => {
      const dia = new Date(v.data).getDay();
      const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
      vendasPorDia[dias[dia]] += v.total;
    });
    
    document.getElementById('content').innerHTML = `
      <div class="card">
        <div class="flex-between mb-4">
          <h2><i class="fas fa-chart-bar"></i> Relatórios e Análises</h2>
          <div class="flex">
            <select id="periodoRelatorio" class="w-auto">
              <option value="hoje">Hoje</option>
              <option value="semana">Esta Semana</option>
              <option value="mes" selected>Este Mês</option>
              <option value="ano">Este Ano</option>
            </select>
            <button class="btn btn-primary" onclick="relatorios.exportar()">
              <i class="fas fa-download"></i> Exportar
            </button>
          </div>
        </div>
        
        <!-- Cards de resumo -->
        <div class="grid-4 mb-4">
          <div class="stat-card">
            <div class="stat-label">Faturamento</div>
            <div class="stat-value">R$ ${faturamentoMes.toFixed(2)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Vendas</div>
            <div class="stat-value">${vendasMes.length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Ticket Médio</div>
            <div class="stat-value">R$ ${ticketMedio.toFixed(2)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Produtos Vendidos</div>
            <div class="stat-value">${vendasMes.reduce((acc, v) => acc + v.itens.length, 0)}</div>
          </div>
        </div>
        
        <!-- Gráficos -->
        <div class="grid-2 mb-4">
          <div class="card">
            <h3>Vendas por Dia da Semana</h3>
            <canvas id="chartVendasDia" height="200"></canvas>
          </div>
          <div class="card">
            <h3>Produtos Mais Vendidos</h3>
            <div id="topProdutos">
              ${topProdutos.map(([nome, qtd], i) => `
                <div class="flex-between" style="padding: 8px 0;">
                  <span>${i+1}º ${nome}</span>
                  <span class="badge">${qtd} un</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        
        <!-- Últimas vendas -->
        <div class="card">
          <h3>Últimas Vendas</h3>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Itens</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${storage.vendas.slice(-10).reverse().map(v => `
                  <tr>
                    <td>${new Date(v.data).toLocaleString()}</td>
                    <td>${v.itens.length} itens</td>
                    <td>R$ ${v.total.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    
    // Renderizar gráfico
    setTimeout(() => this.renderizarGrafico(vendasPorDia), 100);
  },
  
  renderizarGrafico(dados) {
    const ctx = document.getElementById('chartVendasDia')?.getContext('2d');
    if (ctx) {
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: Object.keys(dados),
          datasets: [{
            label: 'Vendas (R$)',
            data: Object.values(dados),
            backgroundColor: '#2563eb'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
  },
  
  exportar() {
    const dados = {
      produtos: storage.produtos,
      vendas: storage.vendas,
      exportado: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    app.mostrarToast('Relatório exportado!', 'success');
  }
};