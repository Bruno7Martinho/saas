// Configuracoes.js - Configurações do Sistema

const configuracoes = {
  dados: {
    nomeLoja: 'Minha Conveniência',
    alertaEstoque: 10,
    tema: 'light',
    moeda: 'BRL',
    imposto: 0
  },
  
  inicializar() {
    const saved = localStorage.getItem('conv_config');
    if (saved) this.dados = JSON.parse(saved);
    
    // Carregar tema salvo
    const tema = localStorage.getItem('theme') || this.dados.tema || 'light';
    document.documentElement.setAttribute('data-theme', tema);
    this.dados.tema = tema;
  },
  
  salvar() {
    localStorage.setItem('conv_config', JSON.stringify(this.dados));
    this.aplicar();
  },
  
  aplicar() {
    // Atualizar título da página
    document.title = this.dados.nomeLoja;
    
    // Atualizar nome da loja no header
    const logoElement = document.querySelector('.logo span');
    if (logoElement) {
      logoElement.textContent = this.dados.nomeLoja;
    }
    
    // Aplicar tema
    this.aplicarTema();
    
    // Atualizar alerta de estoque em todos os produtos
    if (this.dados.alertaEstoque) {
      storage.produtos.forEach(p => {
        p.estoqueMinimo = this.dados.alertaEstoque;
      });
      storage.salvar();
    }
  },
  
  aplicarTema() {
    const tema = this.dados.tema || 'light';
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem('theme', tema);
  },
  
  renderizar() {
    this.inicializar();
    
    document.getElementById('content').innerHTML = `
      <div class="card" style="max-width: 600px;">
        <h2 class="mb-4"><i class="fas fa-cog"></i> Configurações do Sistema</h2>
        
        <form onsubmit="configuracoes.salvarConfig(event)">
          <div class="mb-4">
            <label><i class="fas fa-store"></i> Nome da Loja</label>
            <input type="text" id="confNome" value="${this.dados.nomeLoja}" class="w-full" placeholder="Nome da sua loja">
          </div>
          
          <div class="mb-4">
            <label><i class="fas fa-exclamation-triangle"></i> Alerta de Estoque Baixo</label>
            <input type="number" id="confAlerta" value="${this.dados.alertaEstoque}" class="w-full" min="1" max="100">
            <small class="text-gray">Notificar quando estoque estiver abaixo deste valor</small>
          </div>
          
          <div class="mb-4">
            <label><i class="fas fa-palette"></i> Tema</label>
            <select id="confTema" class="w-full">
              <option value="light" ${this.dados.tema === 'light' ? 'selected' : ''}>☀️ Claro</option>
              <option value="dark" ${this.dados.tema === 'dark' ? 'selected' : ''}>🌙 Escuro</option>
            </select>
          </div>
          
          <div class="mb-4">
            <label><i class="fas fa-money-bill"></i> Moeda</label>
            <select id="confMoeda" class="w-full">
              <option value="BRL" ${this.dados.moeda === 'BRL' ? 'selected' : ''}>R$ Real (BRL)</option>
              <option value="USD" ${this.dados.moeda === 'USD' ? 'selected' : ''}>$ Dólar (USD)</option>
              <option value="EUR" ${this.dados.moeda === 'EUR' ? 'selected' : ''}>€ Euro (EUR)</option>
            </select>
          </div>
          
          <div class="mb-4">
            <label><i class="fas fa-percent"></i> Imposto Padrão (%)</label>
            <input type="number" id="confImposto" value="${this.dados.imposto}" step="0.1" min="0" max="100" class="w-full">
          </div>
          
          <hr class="mb-4">
          
          <h3 class="mb-4"><i class="fas fa-tools"></i> Ações do Sistema</h3>
          
          <div class="grid-2 mb-4">
            <button type="button" class="btn btn-outline" onclick="configuracoes.backup()">
              <i class="fas fa-download"></i> Backup
            </button>
            <button type="button" class="btn btn-outline" onclick="configuracoes.restaurar()">
              <i class="fas fa-upload"></i> Restaurar
            </button>
            <button type="button" class="btn btn-outline" onclick="configuracoes.exportarDados()">
              <i class="fas fa-file-export"></i> Exportar
            </button>
            <button type="button" class="btn btn-outline" onclick="configuracoes.sobre()">
              <i class="fas fa-info-circle"></i> Sobre
            </button>
          </div>
          
          <div class="mb-4">
            <button type="button" class="btn btn-danger w-full" onclick="configuracoes.limparDados()">
              <i class="fas fa-trash"></i> Limpar Todos os Dados
            </button>
          </div>
          
          <hr class="mb-4">
          
          <button type="submit" class="btn btn-success w-full">
            <i class="fas fa-save"></i> Salvar Configurações
          </button>
        </form>
      </div>
    `;
  },
  
  salvarConfig(e) {
    e.preventDefault();
    
    const novoTema = document.getElementById('confTema').value;
    const temaMudou = novoTema !== this.dados.tema;
    
    this.dados = {
      nomeLoja: document.getElementById('confNome').value,
      alertaEstoque: parseInt(document.getElementById('confAlerta').value),
      tema: novoTema,
      moeda: document.getElementById('confMoeda').value,
      imposto: parseFloat(document.getElementById('confImposto').value)
    };
    
    this.salvar();
    
    if (temaMudou) {
      this.aplicarTema();
    }
    
    app.mostrarToast('Configurações salvas com sucesso!', 'success');
  },
  
  backup() {
    const dados = {
      produtos: storage.produtos,
      vendas: storage.vendas,
      fornecedores: fornecedores.lista,
      configuracoes: this.dados,
      data: new Date().toISOString(),
      versao: '2.0.0'
    };
    
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${this.dados.nomeLoja.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    app.mostrarToast('Backup criado com sucesso!', 'success');
  },
  
  restaurar() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const dados = JSON.parse(event.target.result);
          
          if (confirm('Restaurar backup? Isso substituirá TODOS os dados atuais!')) {
            storage.produtos = dados.produtos || [];
            storage.vendas = dados.vendas || [];
            storage.salvar();
            
            if (dados.fornecedores) {
              fornecedores.lista = dados.fornecedores;
              fornecedores.salvar();
            }
            
            if (dados.configuracoes) {
              this.dados = dados.configuracoes;
              this.salvar();
            }
            
            app.mostrarToast('Backup restaurado com sucesso!', 'success');
            setTimeout(() => location.reload(), 1500);
          }
        } catch (e) {
          app.mostrarToast('Arquivo de backup inválido!', 'error');
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  },
  
  exportarDados() {
    const dados = {
      produtos: storage.produtos,
      vendas: storage.vendas,
      fornecedores: fornecedores.lista,
      resumo: {
        totalProdutos: storage.produtos.length,
        totalVendas: storage.vendas.length,
        faturamentoTotal: storage.vendas.reduce((acc, v) => acc + v.total, 0)
      }
    };
    
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dados_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    app.mostrarToast('Dados exportados!', 'success');
  },
  
  limparDados() {
    if (confirm('⚠️ ATENÇÃO! Isso apagará PERMANENTEMENTE todos os dados!\n\nEsta ação NÃO pode ser desfeita.')) {
      if (confirm('🚨 ÚLTIMA CONFIRMAÇÃO!\n\nTem certeza absoluta que deseja limpar TODOS os dados?')) {
        localStorage.clear();
        app.mostrarToast('Dados limpos! Reiniciando sistema...', 'success');
        setTimeout(() => location.reload(), 1500);
      }
    }
  },
  
  sobre() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal" style="max-width: 400px; text-align: center;">
        <i class="fas fa-store" style="font-size: 48px; color: #2563eb; margin-bottom: 16px;"></i>
        <h2 style="margin-bottom: 8px;">${this.dados.nomeLoja}</h2>
        <p style="color: #6b7280; margin-bottom: 20px;">Sistema de Gestão Completo</p>
        
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
          <p><strong>Versão:</strong> 2.0.0</p>
          <p><strong>Build:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Licença:</strong> Comercial</p>
        </div>
        
        <p style="color: #6b7280; margin-bottom: 20px;">
          Desenvolvido com 💙 para facilitar sua gestão
        </p>
        
        <p style="color: #9ca3af; font-size: 0.85rem;">
          © 2026 - Todos os direitos reservados
        </p>
        
        <button class="btn btn-primary w-full mt-4" onclick="this.closest('.modal-overlay').remove()">
          Fechar
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  }
};