// App.js - Inicialização e navegação (Versão CORRIGIDA)
const app = {
  paginaAtual: 'estoque',
  
  inicializar() {
    storage.inicializar();
    this.inicializarAtalhos();
    this.carregarTema();
    this.atualizarHeader();
    this.mudarPagina('estoque');
  },
  
  carregarTema() {
    const tema = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', tema);
  },
  
  atualizarHeader() {
    const config = JSON.parse(localStorage.getItem('conv_config') || '{}');
    const logoElement = document.querySelector('.logo span');
    if (logoElement && config.nomeLoja) {
      logoElement.textContent = config.nomeLoja;
    }
    
    const updateTime = document.getElementById('lastUpdate');
    if (updateTime) {
      updateTime.textContent = new Date().toLocaleString('pt-BR');
    }
  },
  
  inicializarAtalhos() {
    document.addEventListener('keydown', (e) => {
      if (e.altKey) {
        switch(e.key.toLowerCase()) {
          case 'e':
            e.preventDefault();
            this.mudarPagina('estoque');
            this.mostrarToast('📦 Estoque', 'info');
            break;
          case 'v':
            e.preventDefault();
            this.mudarPagina('vendas');
            this.mostrarToast('🛒 Vendas', 'info');
            break;
          case 'r':
            e.preventDefault();
            this.mudarPagina('relatorios');
            this.mostrarToast('📊 Relatórios', 'info');
            break;
          case 'c':
            e.preventDefault();
            this.mudarPagina('configuracoes');
            this.mostrarToast('⚙️ Configurações', 'info');
            break;
          case 's':
            e.preventDefault();
            if (typeof scanner !== 'undefined') scanner.abrir();
            break;
        }
      }
      
      if (e.key === 'Escape') {
        if (typeof scanner !== 'undefined') scanner.fechar();
        document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
      }
    });
  },
  
  mudarPagina(pagina) {
    const content = document.getElementById('content');
    
    content.style.opacity = '0';
    content.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
      this.paginaAtual = pagina;
      
      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.page === pagina) btn.classList.add('active');
      });
      
      // Atualizar breadcrumb
      this.atualizarBreadcrumb(pagina);
      
      // Renderizar página com verificação de existência
      try {
        if (pagina === 'estoque' && typeof estoque !== 'undefined') {
          estoque.renderizar();
        } else if (pagina === 'vendas' && typeof vendas !== 'undefined') {
          vendas.renderizar();
        } else if (pagina === 'cadastro') {
          this.renderizarCadastro();
        } else if (pagina === 'relatorios' && typeof relatorios !== 'undefined') {
          relatorios.renderizar();
        } else if (pagina === 'fornecedores' && typeof fornecedores !== 'undefined') {
          fornecedores.renderizar();
        } else if (pagina === 'configuracoes' && typeof configuracoes !== 'undefined') {
          configuracoes.renderizar();
        } else {
          this.renderizarEmBreve(pagina);
        }
      } catch (error) {
        console.error('Erro ao renderizar página:', error);
        this.renderizarEmBreve(pagina);
      }
      
      content.style.opacity = '1';
      content.style.transform = 'translateY(0)';
      
      localStorage.setItem('ultimaPagina', pagina);
    }, 150);
  },
  
  atualizarBreadcrumb(pagina) {
    const breadcrumb = document.getElementById('breadcrumb');
    if (!breadcrumb) return;
    
    const nomes = {
      estoque: 'Estoque',
      vendas: 'Vendas',
      cadastro: 'Cadastrar Produto',
      relatorios: 'Relatórios',
      fornecedores: 'Fornecedores',
      configuracoes: 'Configurações'
    };
    
    breadcrumb.innerHTML = `
      <i class="fas fa-home"></i> 
      <span>${nomes[pagina] || pagina}</span>
    `;
  },
  
  renderizarEmBreve(pagina) {
    const titulos = {
      relatorios: 'Relatórios',
      fornecedores: 'Fornecedores',
      configuracoes: 'Configurações'
    };
    
    document.getElementById('content').innerHTML = `
      <div class="card" style="text-align: center; padding: 60px 20px;">
        <i class="fas fa-tools" style="font-size: 64px; color: #cbd5e1; margin-bottom: 24px;"></i>
        <h2 style="margin-bottom: 16px;">${titulos[pagina] || pagina}</h2>
        <p style="color: #6b7280; margin-bottom: 24px;">Este módulo estará disponível em breve!</p>
        <button class="btn btn-primary" onclick="app.mudarPagina('estoque')">
          <i class="fas fa-arrow-left"></i> Voltar para Estoque
        </button>
      </div>
    `;
  },
  
  renderizarCadastro() {
    // Verificar se fornecedores existe, se não, criar array vazio
    const fornecedoresLista = (typeof fornecedores !== 'undefined' && fornecedores.lista) ? fornecedores.lista : [];
    
    document.getElementById('content').innerHTML = `
      <div class="card" style="max-width: 600px;">
        <div class="flex-between mb-4">
          <h2><i class="fas fa-plus-circle"></i> Cadastrar Produto</h2>
          <button class="btn btn-outline btn-sm" onclick="app.mudarPagina('estoque')">
            <i class="fas fa-arrow-left"></i> Voltar
          </button>
        </div>
        
        <form onsubmit="app.cadastrarProduto(event)">
          <div class="mb-4">
            <label>Nome do Produto <span style="color: #dc2626;">*</span></label>
            <input type="text" id="nomeInput" class="w-full" placeholder="Ex: Água Mineral 500ml" required>
          </div>
          
          <div class="mb-4">
            <label>Código de Barras <span style="color: #dc2626;">*</span></label>
            <div class="flex">
              <input type="text" id="codigoInput" class="w-full" placeholder="Ex: 7891234567890" required>
              <button type="button" class="btn btn-primary" onclick="scanner.abrir((c) => document.getElementById('codigoInput').value = c)">
                <i class="fas fa-barcode"></i> Escanear
              </button>
            </div>
          </div>
          
          <div class="grid-2 mb-4">
            <div>
              <label>Preço de Venda <span style="color: #dc2626;">*</span></label>
              <input type="number" id="precoInput" step="0.01" min="0" class="w-full" placeholder="0,00" required>
            </div>
            <div>
              <label>Quantidade Inicial <span style="color: #dc2626;">*</span></label>
              <input type="number" id="qtdInput" class="w-full" min="0" placeholder="0" required>
            </div>
          </div>
          
          <div class="grid-2 mb-4">
            <div>
              <label>Estoque Mínimo</label>
              <input type="number" id="minInput" value="10" min="1" class="w-full">
            </div>
            <div>
              <label>Fornecedor</label>
              <select id="fornecedorInput" class="w-full">
                <option value="">Selecione...</option>
                ${fornecedoresLista.map(f => `<option value="${f.nome}">${f.nome}</option>`).join('')}
              </select>
            </div>
          </div>
          
          <div class="mb-4">
            <label>Categoria</label>
            <select id="categoriaInput" class="w-full">
              <option value="Geral">Geral</option>
              <option value="Bebidas">Bebidas</option>
              <option value="Alimentos">Alimentos</option>
              <option value="Limpeza">Limpeza</option>
              <option value="Higiene">Higiene</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          
          <hr class="mb-4">
          
          <div class="flex" style="gap: 12px;">
            <button type="submit" class="btn btn-primary" style="flex: 2;">
              <i class="fas fa-save"></i> Cadastrar Produto
            </button>
            <button type="reset" class="btn btn-outline" style="flex: 1;">
              <i class="fas fa-undo"></i> Limpar
            </button>
          </div>
        </form>
      </div>
    `;
    
    setTimeout(() => document.getElementById('nomeInput')?.focus(), 100);
  },
  
  cadastrarProduto(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nomeInput').value.trim();
    const codigo = document.getElementById('codigoInput').value.trim();
    const preco = parseFloat(document.getElementById('precoInput').value);
    const quantidade = parseInt(document.getElementById('qtdInput').value);
    const minimo = parseInt(document.getElementById('minInput').value);
    const fornecedor = document.getElementById('fornecedorInput')?.value || '';
    const categoria = document.getElementById('categoriaInput')?.value || 'Geral';
    
    if (!nome || !codigo) {
      this.mostrarToast('Preencha todos os campos obrigatórios!', 'error');
      return;
    }
    
    if (preco <= 0) {
      this.mostrarToast('Preço deve ser maior que zero!', 'error');
      return;
    }
    
    if (storage.produtos.find(p => p.codigo === codigo)) {
      this.mostrarToast('Código já cadastrado!', 'error');
      return;
    }
    
    storage.adicionarProduto({ 
      nome, 
      codigo, 
      preco, 
      quantidade, 
      estoqueMinimo: minimo,
      fornecedor,
      categoria,
      dataCadastro: new Date().toISOString()
    });
    
    this.mostrarToast('Produto cadastrado com sucesso!', 'success');
    this.mudarPagina('estoque');
  },
  
  mostrarToast(mensagem, tipo = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    const cores = {
      success: '#059669',
      error: '#dc2626',
      warning: '#d97706',
      info: '#1f2937'
    };
    
    const icones = {
      success: 'check-circle',
      error: 'times-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    
    toast.style.cssText = `
      background: ${cores[tipo] || cores.info};
      color: white;
      padding: 14px 20px;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 280px;
      margin-bottom: 10px;
      animation: slideIn 0.3s ease;
    `;
    
    toast.innerHTML = `
      <i class="fas fa-${icones[tipo]}"></i>
      <span style="flex: 1;">${mensagem}</span>
      <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; opacity: 0.7;">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
};

// Estilos para animação
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(100%); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  @keyframes slideOut {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(100%); }
  }
  
  #content {
    transition: opacity 0.15s, transform 0.15s;
  }
`;
document.head.appendChild(style);

// Iniciar aplicação
document.addEventListener('DOMContentLoaded', () => {
  app.inicializar();
  
  const ultimaPagina = localStorage.getItem('ultimaPagina');
  if (ultimaPagina && ultimaPagina !== 'estoque') {
    setTimeout(() => app.mudarPagina(ultimaPagina), 100);
  }
});

window.app = app;