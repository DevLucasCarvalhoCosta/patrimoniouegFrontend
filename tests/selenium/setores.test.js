// Testes automatizados de Setores com Selenium WebDriver e Mocha
// Para rodar: npm run dev (para subir o frontend) e npx mocha tests/selenium/setores.test.js

const { Builder, By, until, Key } = require('selenium-webdriver');
require('chromedriver');
const assert = require('assert');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizarTexto(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

async function aguardarLoadingSumir(driver, timeout = 10000) {
  try {
    await driver.wait(async () => {
      const overlays = await driver.findElements(By.css('.app-loading-wrapper, .ant-spin-spinning'));
      for (const o of overlays) {
        const visible = await o.isDisplayed().catch(() => false);
        if (visible) return false;
      }
      return true;
    }, timeout);
  } catch (e) { }
}

describe('Cadastro de Setores', function () {
  this.timeout(40000);
  let driver;

  before(async () => {
    driver = await new Builder().forBrowser('chrome').build();
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

  async function irParaSetores() {
    await driver.wait(until.elementLocated(By.css('.ant-menu')), 8000);
    await delay(800);
    await aguardarLoadingSumir(driver);
    await delay(300);
    const adminMenu = await driver.findElement(By.xpath("//span[contains(text(),'Admin')]/parent::div | //span[contains(text(),'Admin')]/.."));
    await adminMenu.click();
    await delay(800);
    const setoresMenu = await driver.findElement(By.xpath("//span[contains(text(),'Setores')]/parent::div | //span[contains(text(),'Setores')]/.."));
    await setoresMenu.click();
    await delay(800);
    await driver.wait(until.urlContains('/admin/setores'), 8000);
    await delay(800);
  }

  async function abrirModalNovoSetor() {
    const novoSetorBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(.,'Novo Setor')]")), 5000);
    await novoSetorBtn.click();
    await delay(300);
    await driver.wait(until.elementLocated(By.xpath("//div[contains(@class,'ant-modal') and .//div[contains(text(),'Novo Setor') or contains(text(),'Editar Setor')]]")), 5000);
    await delay(300);
  }

  async function limparCamposSetor() {
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

  it('deve acessar o cadastro de setores e abrir o modal de novo setor', async () => {
    await login();
    await irParaSetores();
    await abrirModalNovoSetor();
    const modal = await driver.findElement(By.xpath("//div[contains(@class,'ant-modal') and .//div[contains(text(),'Novo Setor') or contains(text(),'Editar Setor')]]"));
    assert.ok(await modal.isDisplayed());
  });

  it('deve validar obrigatoriedade dos campos principais', async () => {
    await login();
    await irParaSetores();
    await abrirModalNovoSetor();
    await limparCamposSetor();
    const salvarBtn = await driver.findElement(By.xpath("//div[contains(@class,'ant-modal')]//button[span[contains(text(),'OK') or contains(text(),'Salvar')]]"));
    await salvarBtn.click();
    await delay(700);
    const erroNome = await driver.findElement(By.xpath("//label[contains(.,'Nome')]/ancestor::div[contains(@class,'ant-form-item')]//div[contains(@class,'ant-form-item-explain-error')]"));
    assert.ok(await erroNome.isDisplayed(), 'Erro de obrigatoriedade não exibido para Nome');
  });

  it('deve validar limites e tipos dos campos', async () => {
    await login();
    await irParaSetores();
    await abrirModalNovoSetor();
    await limparCamposSetor();

    // Nome muito longo
    const nomeInput = await driver.findElement(By.xpath("//label[contains(.,'Nome')]/ancestor::div[contains(@class,'ant-form-item')]//input"));
    await nomeInput.sendKeys('A'.repeat(200));

    // Sigla muito longa
    const siglaInput = await driver.findElement(By.xpath("//label[contains(.,'Sigla')]/ancestor::div[contains(@class,'ant-form-item')]//input"));
    await siglaInput.sendKeys('B'.repeat(50));

    // Descrição muito longa
    const descricaoInput = await driver.findElement(By.xpath("//label[contains(.,'Descrição')]/ancestor::div[contains(@class,'ant-form-item')]//textarea"));
    await descricaoInput.sendKeys('C'.repeat(1000));

    const salvarBtn = await driver.findElement(By.xpath("//div[contains(@class,'ant-modal')]//button[span[contains(text(),'OK') or contains(text(),'Salvar')]]"));
    await salvarBtn.click();
    await delay(700);
    // Adapte aqui caso o frontend mostre mensagem de erro para tamanho máximo
  });

  it('deve cadastrar um setor com sucesso', async () => {
    await login();
    await irParaSetores();
    await abrirModalNovoSetor();
    const nome = 'Selenium Setor Teste 001';
    const nomeInput = await driver.findElement(By.xpath("//label[contains(.,'Nome')]/ancestor::div[contains(@class,'ant-form-item')]//input"));
    await nomeInput.clear();
    await nomeInput.sendKeys(nome);

    const siglaInput = await driver.findElement(By.xpath("//label[contains(.,'Sigla')]/ancestor::div[contains(@class,'ant-form-item')]//input"));
    await siglaInput.clear();
    await siglaInput.sendKeys('SEL');

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
      toastText && normalizarTexto(toastText).includes('setor criado'),
      `Mensagem de sucesso não exibida ou diferente: ${toastText}`
    );
    await delay(1200);
    const tabela = await driver.findElement(By.css('.ant-table'));
    const textoTabela = await tabela.getText();
    assert.ok(textoTabela.includes(nome), 'Novo setor não encontrado na tabela');
  });

  it('não deve permitir cadastrar setor com nome já existente', async () => {
    await login();
    await irParaSetores();
    await abrirModalNovoSetor();
    const nome = 'Selenium Setor Teste 001';
    const nomeInput = await driver.findElement(By.xpath("//label[contains(.,'Nome')]/ancestor::div[contains(@class,'ant-form-item')]//input"));
    await nomeInput.clear();
    await nomeInput.sendKeys(nome);
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
      await delay(1000); // Apenas aguarde um pouco, não precisa do stalenessOf
    } catch (e) {
      try {
        const erroNome = await driver.findElement(By.xpath("//label[contains(.,'Nome')]/ancestor::div[contains(@class,'ant-form-item')]//div[contains(@class,'ant-form-item-explain-error')]"));
        erroMsg = await erroNome.getText();
      } catch (e2) {}
    }
    assert.ok(
      erroMsg && normalizarTexto(erroMsg).includes('ja existe um setor com este nome'),
      `Mensagem de erro de duplicidade não exibida ou diferente: ${erroMsg}`
    );
    await delay(1000); // Pequeno delay antes de seguir
  });

  it('deve editar um setor cadastrado', async () => {
    const nome = 'Selenium Setor Teste 001';
    const nomeEditado = 'Selenium Setor Teste 001 Editado';
    await login();
    await irParaSetores();
    await delay(800);
    const linhaSetor = await driver.findElement(By.xpath(`//tr[td[contains(text(),'${nome}')]]`));
    const editarBtn = await linhaSetor.findElement(By.xpath(".//button[span[contains(text(),'Editar')]]"));
    await editarBtn.click();
    await delay(500);
    const modal = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'ant-modal') and .//div[contains(text(),'Editar Setor')]]")),
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
      toastText && normalizarTexto(toastText).includes('setor atualizado'),
      `Mensagem de sucesso não exibida ou diferente: ${toastText}`
    );
    await delay(1200);
    const tabela = await driver.findElement(By.css('.ant-table'));
    const textoTabela = await tabela.getText();
    assert.ok(textoTabela.includes(nomeEditado), 'Nome editado não encontrado na tabela');
  });

  it('deve excluir um setor cadastrado', async () => {
    const nome = 'Selenium Setor Teste 001 Editado';
    await login();
    await irParaSetores();
    await delay(800);
    const linhaSetor = await driver.findElement(By.xpath(`//tr[td[contains(text(),'${nome}')]]`));
    const excluirBtn = await linhaSetor.findElement(By.xpath(".//button[span[contains(text(),'Excluir')]]"));
    await excluirBtn.click();
    await delay(500); // Pequeno delay para o popover abrir

    // Aguarda o popover aparecer
    const confirmarBtn = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'ant-popover')]//button[span[contains(text(),'Excluir')]]")),
      8000
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
      await driver.wait(until.stalenessOf(toast), 7000);
    } catch (e) {}
    assert.ok(
      toastText && normalizarTexto(toastText).includes('setor excluido'),
      `Mensagem de sucesso não exibida ou diferente: ${toastText}`
    );
    await delay(1200);
    const tabela = await driver.findElement(By.css('.ant-table'));
    const textoTabela = await tabela.getText();
    assert.ok(!textoTabela.includes(nome), 'Setor ainda encontrado na tabela após exclusão');
  });

});