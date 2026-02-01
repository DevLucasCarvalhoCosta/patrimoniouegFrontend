// Testes automatizados de Categorias com Selenium WebDriver e Mocha
// Para rodar: npm run dev (para subir o frontend) e npx mocha tests/selenium/categorias.test.js

const { Builder, By, until, Key } = require('selenium-webdriver');
require('chromedriver');
const assert = require('assert');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizarTexto(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

describe('Cadastro de Categorias', function () {
  this.timeout(40000);
  let driver;

  before(async () => {
    driver = await new Builder().forBrowser('chrome').build();
    await driver.manage().window().maximize(); // <-- Adiciona esta linha para maximizar a janela
  });

  after(async () => {
    await driver.quit();
  });

  async function login() {
    await driver.get('http://localhost:8889/login');
    const emailInput = await driver.wait(until.elementLocated(By.css('input[placeholder="Email"]')), 10000);
    await emailInput.clear();
    await emailInput.sendKeys('admin@patrimonioueg.com.br');
    const senhaInput = await driver.findElement(By.css('input[placeholder="Senha"]'));
    await senhaInput.clear();
    await senhaInput.sendKeys('admin123');
    const loginButton = await driver.findElement(By.css('button[type="submit"]'));
    await loginButton.click();
    await driver.wait(until.urlContains('/dashboard'), 20000);
    try {
      const fecharBtn = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(.,'Fechar')]")),
        2000
      );
      if (fecharBtn) {
        await fecharBtn.click();
        await delay(300);
      }
    } catch (e) {}
  }

  async function irParaCategorias() {
    await driver.wait(until.elementLocated(By.css('.ant-menu')), 8000);
    await aguardarLoadingSumir();
    await delay(800);

    // Expande menu Admin
    const adminMenu = await driver.findElement(By.xpath("//span[contains(text(),'Admin')]/parent::div | //span[contains(text(),'Admin')]/.."));
    await aguardarLoadingSumir();
    await adminMenu.click();
    await delay(800);

    // Clica no menu Categorias
    const categoriasMenu = await driver.findElement(By.xpath("//span[contains(text(),'Categorias')]/parent::div | //span[contains(text(),'Categorias')]/.."));
    await aguardarLoadingSumir();
    await categoriasMenu.click();
    await delay(800);

    await driver.wait(until.urlContains('/admin/categorias'), 8000);
    await aguardarLoadingSumir();
    await delay(800);
  }

  async function abrirModalNovaCategoria() {
    const novaCategoriaBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(.,'Nova Categoria')]")), 5000);
    await novaCategoriaBtn.click();
    await delay(300);
    await driver.wait(until.elementLocated(By.xpath("//div[contains(@class,'ant-modal') and .//div[contains(text(),'Nova Categoria') or contains(text(),'Editar Categoria')]]")), 5000);
    await delay(300);
  }

  async function limparCamposCategoria() {
    const inputs = await driver.findElements(By.css('.ant-modal input'));
    for (const input of inputs) {
      const disabled = await input.getAttribute('disabled');
      const readonly = await input.getAttribute('readonly');
      if (!disabled && !readonly) {
        try { await input.clear(); } catch (e) { }
      }
    }
    const textareas = await driver.findElements(By.css('.ant-modal textarea'));
    for (const ta of textareas) {
      const disabled = await ta.getAttribute('disabled');
      const readonly = await ta.getAttribute('readonly');
      if (!disabled && !readonly) {
        try { await ta.clear(); } catch (e) { }
      }
    }
  }

  it('deve acessar o cadastro de categorias e abrir o modal de nova categoria', async () => {
    await login();
    await irParaCategorias();
    await abrirModalNovaCategoria();
    const modal = await driver.findElement(By.xpath("//div[contains(@class,'ant-modal') and .//div[contains(text(),'Nova Categoria') or contains(text(),'Editar Categoria')]]"));
    assert.ok(await modal.isDisplayed());
  });

  it('deve validar obrigatoriedade dos campos principais', async () => {
    await login();
    await irParaCategorias();
    await abrirModalNovaCategoria();
    await limparCamposCategoria();
    const salvarBtn = await driver.findElement(By.xpath("//div[contains(@class,'ant-modal')]//button[span[contains(text(),'OK') or contains(text(),'Salvar')]]"));
    await salvarBtn.click();
    await delay(700);
    const erroNome = await driver.findElement(By.xpath("//label[contains(.,'Nome')]/ancestor::div[contains(@class,'ant-form-item')]//div[contains(@class,'ant-form-item-explain-error')]"));
    assert.ok(await erroNome.isDisplayed(), 'Erro de obrigatoriedade não exibido para Nome');
  });

  it('deve validar limites e tipos dos campos', async () => {
    await login();
    await irParaCategorias();
    await abrirModalNovaCategoria();
    await limparCamposCategoria();
    const nomeInput = await driver.findElement(By.xpath("//label[contains(.,'Nome')]/ancestor::div[contains(@class,'ant-form-item')]//input"));
    await nomeInput.sendKeys('A'.repeat(200));
    const descricaoInput = await driver.findElement(By.xpath("//label[contains(.,'Descrição')]/ancestor::div[contains(@class,'ant-form-item')]//textarea"));
    await descricaoInput.sendKeys('B'.repeat(1000));
    const salvarBtn = await driver.findElement(By.xpath("//div[contains(@class,'ant-modal')]//button[span[contains(text(),'OK') or contains(text(),'Salvar')]]"));
    await salvarBtn.click();
    await delay(700);
    // Adapte aqui caso o frontend mostre mensagem de erro para tamanho máximo
  });

  // Função robusta para deletar a categoria em qualquer página
  async function deletarCategoriaSeExistir(nome) {
    await login();
    await irParaCategorias();
    await delay(800);

    // Ir para a última página da tabela
    const pageButtons = await driver.findElements(By.css('.ant-pagination-item'));
    let lastPageBtn = null;
    let lastPageNum = 1;
    for (const btn of pageButtons) {
      if (!(await btn.isDisplayed())) continue;
      const text = await btn.getText();
      const num = parseInt(text, 10);
      if (!isNaN(num) && num > lastPageNum) {
        lastPageNum = num;
        lastPageBtn = btn;
      }
    }
    if (lastPageBtn) {
      const isActive = (await lastPageBtn.getAttribute('class')).includes('ant-pagination-item-active');
      if (!isActive) {
        await delay(800);
        await lastPageBtn.click();
        await delay(800);
      }
    }

    // Procura a categoria na última página
    await delay(500);
    const linhas = await driver.findElements(By.xpath(`//tr[td[contains(text(),'${nome}')]]`));
    if (linhas.length > 0) {
      const linhaCategoria = linhas[0];
      const excluirBtn = await linhaCategoria.findElement(By.xpath(".//button[span[contains(text(),'Excluir')]]"));
      await excluirBtn.click();
      await delay(500);
      // Confirma exclusão se houver popover/modal
      try {
        const confirmarBtn = await driver.wait(
          until.elementLocated(By.xpath("//div[contains(@class,'ant-popover')]//button[span[contains(text(),'Excluir')]]")),
          5000
        );
        await confirmarBtn.click();
        await delay(1200);
      } catch (e) {}
    }
  }

  it('deve cadastrar uma categoria com sucesso', async () => {
    await login();
    await irParaCategorias();
    const nome = 'Selenium Categoria Teste 001';

    // Garante que a categoria não existe antes de cadastrar
    await deletarCategoriaSeExistir(nome);

    await abrirModalNovaCategoria();
    const nomeInput = await driver.findElement(By.xpath("//label[contains(.,'Nome')]/ancestor::div[contains(@class,'ant-form-item')]//input"));
    await nomeInput.clear();
    await nomeInput.sendKeys(nome);
    const descricaoInput = await driver.findElement(By.xpath("//label[contains(.,'Descrição')]/ancestor::div[contains(@class,'ant-form-item')]//textarea"));
    await descricaoInput.clear();
    await descricaoInput.sendKeys('Descrição teste selenium');
    const salvarBtn = await driver.findElement(By.xpath("//div[contains(@class,'ant-modal')]//button[span[contains(text(),'OK') or contains(text(),'Salvar')]]"));
    await salvarBtn.click();
    await delay(1000);

    // Valida mensagem de sucesso (toast)
    let toastText = '';
    try {
      const toast = await driver.wait(
        until.elementLocated(By.css('.ant-message-notice-content, .ant-message-success')),
        7000
      );
      toastText = await toast.getAttribute('textContent');
    } catch (e) {}
    assert.ok(
      toastText && normalizarTexto(toastText).includes('categoria criada'),
      `Mensagem de sucesso não exibida ou diferente: ${toastText}`
    );

    // Ir para a última página para validar se a categoria aparece
    const pageButtons = await driver.findElements(By.css('.ant-pagination-item'));
    let lastPageBtn = null;
    let lastPageNum = 1;
    for (const btn of pageButtons) {
      if (!(await btn.isDisplayed())) continue;
      const text = await btn.getText();
      const num = parseInt(text, 10);
      if (!isNaN(num) && num > lastPageNum) {
        lastPageNum = num;
        lastPageBtn = btn;
      }
    }
    if (lastPageBtn) {
      const isActive = (await lastPageBtn.getAttribute('class')).includes('ant-pagination-item-active');
      if (!isActive) {
        await delay(800);
        await lastPageBtn.click();
        await delay(800);
      }
    }

    // Verifica se a categoria aparece na tabela da última página
    const tabela = await driver.findElement(By.css('.ant-table'));
    const textoTabela = await tabela.getText();
    assert.ok(textoTabela.includes(nome), 'Categoria não encontrada na tabela');
  });

  it('não deve permitir cadastrar categoria com nome já existente', async () => {
    await login();
    await irParaCategorias();
    await abrirModalNovaCategoria();
    const nome = 'Selenium Categoria Teste 001';
    const nomeInput = await driver.findElement(By.xpath("//label[contains(.,'Nome')]/ancestor::div[contains(@class,'ant-form-item')]//input"));
    await nomeInput.clear();
    await nomeInput.sendKeys(nome);
    const salvarBtn = await driver.findElement(By.xpath("//div[contains(@class,'ant-modal')]//button[span[contains(text(),'OK') or contains(text(),'Salvar')]]"));
    await salvarBtn.click();
    await delay(1000);
    // Valida mensagem de erro (toast ou no formulário)
    let erroMsg = '';
    try {
      const toast = await driver.wait(
        until.elementLocated(By.css('.ant-message-notice-content, .ant-message-error, .ant-message-warning')),
        9000
      );
      erroMsg = await toast.getAttribute('textContent');
    } catch (e) {
      try {
        const erroNome = await driver.findElement(By.xpath("//label[contains(.,'Nome')]/ancestor::div[contains(@class,'ant-form-item')]//div[contains(@class,'ant-form-item-explain-error')]"));
        erroMsg = await erroNome.getText();
      } catch (e2) {}
    }
    assert.ok(
      erroMsg && normalizarTexto(erroMsg).includes('ja existe uma categoria com este nome'),
      `Mensagem de erro de duplicidade não exibida ou diferente: ${erroMsg}`
    );
  });

  it('deve editar uma categoria cadastrada', async () => {
    await login();
    await irParaCategorias();
    const nome = 'Selenium Categoria Teste 001';
    const nomeEditado = 'Selenium Categoria Teste Editada';
    // Busca a categoria na tabela
    const linhaCategoria = await driver.findElement(By.xpath(`//tr[td[contains(text(),'${nome}')]]`));
    const editarBtn = await linhaCategoria.findElement(By.xpath(".//button[span[contains(text(),'Editar')]]"));
    await editarBtn.click();
    await delay(500);
    const modal = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'ant-modal') and .//div[contains(text(),'Editar Categoria')]]")),
      10000
    );
    await driver.wait(until.elementIsVisible(modal), 10000);
    const nomeInput = await modal.findElement(By.xpath(".//label[contains(.,'Nome')]/ancestor::div[contains(@class,'ant-form-item')]//input"));
    await nomeInput.clear();
    await nomeInput.sendKeys(nomeEditado);
    const salvarBtn = await driver.findElement(By.xpath("//div[contains(@class,'ant-modal')]//button[span[contains(text(),'OK') or contains(text(),'Salvar')]]"));
    await salvarBtn.click();
    await delay(1000);
    // Toast de sucesso
    let toastText = '';
    try {
      const toast = await driver.wait(
        until.elementLocated(By.css('.ant-message-notice-content, .ant-message-success')),
        7000
      );
      toastText = await toast.getAttribute('textContent');
    } catch (e) {}
    assert.ok(
      toastText && normalizarTexto(toastText).includes('categoria atualizada'),
      `Mensagem de sucesso não exibida ou diferente: ${toastText}`
    );
    // Verifica se o nome editado aparece na tabela
    const tabela = await driver.findElement(By.css('.ant-table'));
    const textoTabela = await tabela.getText();
    assert.ok(textoTabela.includes(nomeEditado), 'Nome editado não encontrado na tabela');
  });

  it('deve excluir uma categoria cadastrada', async () => {
    await login();
    await irParaCategorias();
    const nome = 'Selenium Categoria Teste Editada';
    // Busca a categoria na tabela
    const linhaCategoria = await driver.findElement(By.xpath(`//tr[td[contains(text(),'${nome}')]]`));
    const excluirBtn = await linhaCategoria.findElement(By.xpath(".//button[span[contains(text(),'Excluir')]]"));
    await excluirBtn.click();
    await delay(500);
    // Toast de sucesso
    let toastText = '';
    try {
      const toast = await driver.wait(
        until.elementLocated(By.css('.ant-message-notice-content, .ant-message-success')),
        7000
      );
      toastText = await toast.getAttribute('textContent');
    } catch (e) {}
    assert.ok(
      toastText && normalizarTexto(toastText).includes('excluida'),
      `Mensagem de sucesso não exibida ou diferente: ${toastText}`
    );
    // Verifica se a categoria não aparece mais na tabela
    const tabela = await driver.findElement(By.css('.ant-table'));
    const textoTabela = await tabela.getText();
    assert.ok(!textoTabela.includes(nome), 'Categoria ainda encontrada na tabela após exclusão');
  });

  async function aguardarLoadingSumir(timeout = 10000) {
    try {
      await driver.wait(async () => {
        const spinners = await driver.findElements(By.css('.ant-spin-spinning, .app-loading-wrapper[aria-busy="true"]'));
        for (const spinner of spinners) {
          if (await spinner.isDisplayed()) return false;
        }
        return true;
      }, timeout);
    } catch (e) { /* ignora timeout */ }
  }

});