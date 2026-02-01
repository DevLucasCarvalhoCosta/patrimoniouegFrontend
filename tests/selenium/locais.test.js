// Testes automatizados de Locais com Selenium WebDriver e Mocha
// Para rodar: npm run dev (para subir o frontend) e npx mocha tests/selenium/locais.test.js

const { Builder, By, until, Key } = require('selenium-webdriver');
const assert = require('assert');

// tests/selenium/locais.test.js
require('chromedriver');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizarTexto(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

describe('Cadastro de Locais', function () {
  this.timeout(40000);
  let driver;

  before(async () => {
    driver = await new Builder().forBrowser('chrome').build();
    await driver.manage().window().maximize(); // Maximiza a janela do navegador
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

  async function irParaLocais() {
    await driver.wait(until.elementLocated(By.css('.ant-menu')), 8000);
    await delay(800);
    await aguardarLoadingSumir();
    await delay(300);
    const adminMenu = await driver.findElement(By.xpath("//span[contains(text(),'Admin')]/parent::div | //span[contains(text(),'Admin')]/.."));
    await adminMenu.click();
    await delay(800);
    const locaisMenu = await driver.findElement(By.xpath("//span[contains(text(),'Locais')]/parent::div | //span[contains(text(),'Locais')]/.."));
    await locaisMenu.click();
    await delay(800);
    await driver.wait(until.urlContains('/admin/locais'), 8000);
    await delay(800);
  }

  async function abrirModalNovoLocal() {
    const novoLocalBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(.,'Novo Local')]")), 5000);
    await novoLocalBtn.click();
    await delay(300);
    await driver.wait(until.elementLocated(By.xpath("//div[contains(@class,'ant-modal') and .//div[contains(text(),'Novo Local') or contains(text(),'Editar Local')]]")), 5000);
    await delay(300);
  }

  async function limparCamposLocal() {
    const inputs = await driver.findElements(By.css('.ant-modal input'));
    for (const input of inputs) {
      const disabled = await input.getAttribute('disabled');
      const readonly = await input.getAttribute('readonly');
      const type = await input.getAttribute('type');
      if (!disabled && !readonly && type !== 'checkbox' && type !== 'radio') {
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

  async function aguardarLoadingSumir(timeout = 10000) {
    try {
      await driver.wait(async () => {
        const loadings = await driver.findElements(By.css('.ant-spin-spinning'));
        return loadings.length === 0;
      }, timeout);
    } catch (e) { }
  }

  // Função robusta para deletar o local em qualquer página (busca na última página)
  async function deletarLocalSeExistir(nome) {
    await login();
    await irParaLocais();
    await aguardarLoadingSumir();
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
        await aguardarLoadingSumir();
        await delay(800);
        await lastPageBtn.click();
        await aguardarLoadingSumir();
        await delay(800);
      }
    }

    // Procura o local na última página
    await aguardarLoadingSumir();
    await delay(500);
    const linhas = await driver.findElements(By.xpath(`//tr[td[contains(text(),'${nome}')]]`));
    if (linhas.length > 0) {
      const linhaLocal = linhas[0];
      const excluirBtn = await linhaLocal.findElement(By.xpath(".//button[span[contains(text(),'Excluir')]]"));
      await aguardarLoadingSumir();
      await delay(200);
      await excluirBtn.click();
      await aguardarLoadingSumir();
      await delay(500);
      const confirmarBtn = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(@class,'ant-popover')]//button[span[contains(text(),'Excluir')]]")),
        5000
      );
      await driver.wait(until.elementIsVisible(confirmarBtn), 3000);
      await driver.wait(until.elementIsEnabled(confirmarBtn), 3000);
      await confirmarBtn.click();
      await aguardarLoadingSumir();
      await delay(1200);
    }
  }

  it('deve acessar o cadastro de locais e abrir o modal de novo local', async () => {
    await login();
    await irParaLocais();
    await abrirModalNovoLocal();
    const modal = await driver.findElement(By.xpath("//div[contains(@class,'ant-modal') and .//div[contains(text(),'Novo Local') or contains(text(),'Editar Local')]]"));
    assert.ok(await modal.isDisplayed());
  });

  it('deve validar obrigatoriedade dos campos principais', async () => {
    await login();
    await irParaLocais();
    await abrirModalNovoLocal();
    await limparCamposLocal();
    const salvarBtn = await driver.findElement(By.xpath("//div[contains(@class,'ant-modal')]//button[span[contains(text(),'OK') or contains(text(),'Salvar')]]"));
    await salvarBtn.click();
    await delay(700);
    const erroNome = await driver.findElement(By.xpath("//label[contains(.,'Nome')]/ancestor::div[contains(@class,'ant-form-item')]//div[contains(@class,'ant-form-item-explain-error')]"));
    assert.ok(await erroNome.isDisplayed(), 'Erro de obrigatoriedade não exibido para Nome');
  });

  it.only('deve validar limites e tipos dos campos', async () => {
    await login();
    await irParaLocais();
    await abrirModalNovoLocal();
    await limparCamposLocal();

    // Nome muito longo
    const nomeInput = await driver.findElement(By.xpath("//label[contains(.,'Nome')]/ancestor::div[contains(@class,'ant-form-item')]//input"));
    await nomeInput.sendKeys('A'.repeat(200));

    // Descrição muito longa
    const descricaoInput = await driver.findElement(By.xpath("//label[contains(.,'Descrição')]/ancestor::div[contains(@class,'ant-form-item')]//textarea"));
    await descricaoInput.sendKeys('B'.repeat(1000));

    // Código do Setor: valor negativo
    const setorInput = await driver.findElement(By.xpath("//label[contains(.,'Código do Setor')]/ancestor::div[contains(@class,'ant-form-item')]//input"));
    await setorInput.clear();
    await setorInput.sendKeys('-5', Key.TAB); // Força blur
    await delay(300);

    let salvarBtn = await driver.findElement(By.xpath("//div[contains(@class,'ant-modal')]//button[span[contains(text(),'OK') or contains(text(),'Salvar')]]"));
    await salvarBtn.click();
    await delay(700);

    // Verifica mensagem de erro para Código do Setor negativo
    let erroSetor = await driver.findElement(By.xpath("//label[contains(.,'Código do Setor')]/ancestor::div[contains(@class,'ant-form-item')]//div[contains(@class,'ant-form-item-explain-error')]"));
    assert.ok(await erroSetor.isDisplayed(), 'Erro de valor negativo não exibido para Código do Setor');

    // Código do Setor: valor zero
    await setorInput.clear();
    await setorInput.sendKeys('0');
    await salvarBtn.click();
    await delay(700);
    erroSetor = await driver.findElement(By.xpath("//label[contains(.,'Código do Setor')]/ancestor::div[contains(@class,'ant-form-item')]//div[contains(@class,'ant-form-item-explain-error')]"));
    assert.ok(await erroSetor.isDisplayed(), 'Erro de valor zero não exibido para Código do Setor');

    // Código do Setor: texto
    await setorInput.clear();
    await setorInput.sendKeys('abc');
    await salvarBtn.click();
    await delay(700);
    erroSetor = await driver.findElement(By.xpath("//label[contains(.,'Código do Setor')]/ancestor::div[contains(@class,'ant-form-item')]//div[contains(@class,'ant-form-item-explain-error')]"));
    assert.ok(await erroSetor.isDisplayed(), 'Erro de texto não exibido para Código do Setor');

    // Código do Setor: valor muito grande
    await setorInput.clear();
    await setorInput.sendKeys('9999999999');
    await salvarBtn.click();
    await delay(700);
    // Se houver validação de tamanho máximo, verifique aqui

    // Adapte as mensagens de erro conforme o frontend
  });

  it('deve cadastrar um local com sucesso', async () => {
    await login();
    await irParaLocais();
    const nome = 'Selenium Local Teste 001';

    // Garante que o local não existe antes de cadastrar
    await deletarLocalSeExistir(nome);

    await abrirModalNovoLocal();
    const nomeInput = await driver.findElement(By.xpath("//label[contains(.,'Nome')]/ancestor::div[contains(@class,'ant-form-item')]//input"));
    await nomeInput.clear();
    await nomeInput.sendKeys(nome);

    // Preencher Código do Setor
    const setorInput = await driver.findElement(By.xpath("//label[contains(.,'Código do Setor')]/ancestor::div[contains(@class,'ant-form-item')]//input"));
    await setorInput.clear();
    await setorInput.sendKeys('1');

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
      toastText && normalizarTexto(toastText).includes('local criado'),
      `Mensagem de sucesso não exibida ou diferente: ${toastText}`
    );
    await delay(1200);

    // Ir para a última página para validar se o local aparece
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
        await aguardarLoadingSumir();
        await delay(800);
        await lastPageBtn.click();
        await aguardarLoadingSumir();
        await delay(800);
      }
    }

    // Verifica se o local aparece na tabela da última página
    const tabela = await driver.findElement(By.css('.ant-table'));
    const textoTabela = await tabela.getText();
    assert.ok(textoTabela.includes(nome), 'Novo local não encontrado na tabela');
  });

  it('não deve permitir cadastrar local com nome já existente', async () => {
    await login();
    await irParaLocais();
    await abrirModalNovoLocal();
    const nome = 'Selenium Local Teste 001';
    const nomeInput = await driver.findElement(By.xpath("//label[contains(.,'Nome')]/ancestor::div[contains(@class,'ant-form-item')]//input"));
    await nomeInput.clear();
    await nomeInput.sendKeys(nome);
    const descricaoInput = await driver.findElement(By.xpath("//label[contains(.,'Descrição')]/ancestor::div[contains(@class,'ant-form-item')]//textarea"));
    await descricaoInput.clear();
    await descricaoInput.sendKeys('Descrição duplicada');
    const salvarBtn = await driver.findElement(By.xpath("//div[contains(@class,'ant-modal')]//button[span[contains(text(),'OK') or contains(text(),'Salvar')]]"));
    await salvarBtn.click();
    await delay(1200);
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
      erroMsg && normalizarTexto(erroMsg).includes('ja existe um local com este nome'),
      `Mensagem de erro de duplicidade não exibida ou diferente: ${erroMsg}`
    );
  });

  it('deve editar um local cadastrado', async () => {
    const nome = 'Selenium Local Teste 001';
    const nomeEditado = 'Selenium Local Teste 001 Editado';
    await login();
    await irParaLocais();
    await delay(800);
    const linhaLocal = await driver.findElement(By.xpath(`//tr[td[contains(text(),'${nome}')]]`));
    const editarBtn = await linhaLocal.findElement(By.xpath(".//button[span[contains(text(),'Editar')]]"));
    await editarBtn.click();
    await delay(500);
    const modal = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'ant-modal') and .//div[contains(text(),'Editar Local')]]")),
      10000
    );
    await delay(500);
    const nomeInput = await modal.findElement(By.xpath(".//label[contains(.,'Nome')]/ancestor::div[contains(@class,'ant-form-item')]//input"));
    await nomeInput.clear();
    await nomeInput.sendKeys(nomeEditado);
    const salvarBtn = await driver.findElement(By.xpath("//div[contains(@class,'ant-modal')]//button[span[contains(text(),'OK') or contains(text(),'Salvar')]]"));
    await salvarBtn.click();
    await delay(1000);
    let toastText = '';
    try {
      const toast = await driver.wait(
        until.elementLocated(By.css('.ant-message-notice-content, .ant-message-success')),
        7000
      );
      toastText = await toast.getAttribute('textContent');
    } catch (e) {}
    assert.ok(
      toastText && normalizarTexto(toastText).includes('local atualizado'),
      `Mensagem de sucesso não exibida ou diferente: ${toastText}`
    );
    await delay(1200);
    const tabela = await driver.findElement(By.css('.ant-table'));
    const textoTabela = await tabela.getText();
    assert.ok(textoTabela.includes(nomeEditado), 'Nome editado não encontrado na tabela');
  });

  it('deve excluir um local cadastrado', async () => {
    const nome = 'Selenium Local Teste 001 Editado';
    await login();
    await irParaLocais();
    await delay(800);
    const linhaLocal = await driver.findElement(By.xpath(`//tr[td[contains(text(),'${nome}')]]`));
    const excluirBtn = await linhaLocal.findElement(By.xpath(".//button[span[contains(text(),'Excluir')]]"));
    await excluirBtn.click();
    await delay(500);
    const confirmarBtn = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'ant-popover')]//button[span[contains(text(),'Excluir')]]")),
      5000
    );
    await confirmarBtn.click();
    await delay(1000);
    let toastText = '';
    try {
      const toast = await driver.wait(
        until.elementLocated(By.css('.ant-message-notice-content, .ant-message-success')),
        7000
      );
      toastText = await toast.getAttribute('textContent');
    } catch (e) {}
    assert.ok(
      toastText && normalizarTexto(toastText).includes('local excluido'),
      `Mensagem de sucesso não exibida ou diferente: ${toastText}`
    );
    await delay(1200);
    const tabela = await driver.findElement(By.css('.ant-table'));
    const textoTabela = await tabela.getText();
    assert.ok(!textoTabela.includes(nome), 'Local ainda encontrado na tabela após exclusão');
  });

});