// Testes automatizados de Execução de Transferência de Bem com Selenium WebDriver e Mocha
// Para rodar: npm run dev (para subir o frontend) e npx mocha tests/selenium/transferencia-executar.test.js

const { Builder, By, until, Key } = require('selenium-webdriver');
require('chromedriver');
const assert = require('assert');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizarTexto(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

describe('Execução de Transferência de Bem', function () {
  this.timeout(90000);
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

  async function cadastrarSetor(nome, sigla, descricao) {
    await driver.get('http://localhost:8889/admin/setores');
    await driver.wait(until.elementLocated(By.xpath("//button[contains(.,'Novo Setor')]")), 10000);
    await driver.findElement(By.xpath("//button[contains(.,'Novo Setor')]")).click();
    await delay(500);
    await driver.findElement(By.xpath("//label[contains(.,'Nome')]/ancestor::div[contains(@class,'ant-form-item')]//input")).sendKeys(nome);
    await driver.findElement(By.xpath("//label[contains(.,'Sigla')]/ancestor::div[contains(@class,'ant-form-item')]//input")).sendKeys(sigla);
    await driver.findElement(By.xpath("//label[contains(.,'Descrição')]/ancestor::div[contains(@class,'ant-form-item')]//textarea")).sendKeys(descricao);
    await driver.findElement(By.xpath("//div[contains(@class,'ant-modal')]//button[span[contains(text(),'OK') or contains(text(),'Salvar')]]")).click();
    await delay(1200);
    // Pega o código do setor recém cadastrado na tabela
    let codigoSetor = null;
    try {
      await delay(1000);
      const linhaSetor = await driver.findElement(By.xpath(`//tr[td[contains(text(),'${nome}')]]`));
      const codigoTd = await linhaSetor.findElement(By.xpath('./td[1]'));
      codigoSetor = await codigoTd.getText();
    } catch (e) {}
    assert.ok(codigoSetor, 'Não foi possível obter o código do setor cadastrado');
    return codigoSetor;
  }

  async function excluirSetor(nome) {
    await driver.get('http://localhost:8889/admin/setores');
    await delay(1000);
    try {
      const linhaSetor = await driver.findElement(By.xpath(`//tr[td[contains(text(),'${nome}')]]`));
      const excluirBtn = await linhaSetor.findElement(By.xpath(".//button[span[contains(text(),'Excluir')]]"));
      await excluirBtn.click();
      await delay(500);
      const confirmarBtn = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(@class,'ant-popover')]//button[span[contains(text(),'Excluir')]]")),
        5000
      );
      await confirmarBtn.click();
      await delay(1000);
    } catch (e) {
      // Se não encontrar, já foi excluído
    }
  }

  async function cadastrarLocal(nome, codigoSetor, descricao = 'Local para teste de transferência') {
    await driver.get('http://localhost:8889/admin/locais');
    await driver.wait(until.elementLocated(By.xpath("//button[contains(.,'Novo Local')]")), 10000);
    await driver.findElement(By.xpath("//button[contains(.,'Novo Local')]")).click();
    await delay(500);
    await driver.findElement(By.xpath("//label[contains(.,'Nome')]/ancestor::div[contains(@class,'ant-form-item')]//input")).sendKeys(nome);
    await driver.findElement(By.xpath("//label[contains(.,'Código do Setor')]/ancestor::div[contains(@class,'ant-form-item')]//input")).sendKeys(codigoSetor);
    await driver.findElement(By.xpath("//label[contains(.,'Descrição')]/ancestor::div[contains(@class,'ant-form-item')]//textarea")).sendKeys(descricao);
    await driver.findElement(By.xpath("//div[contains(@class,'ant-modal')]//button[span[contains(text(),'OK') or contains(text(),'Salvar')]]")).click();
    await delay(1200);
    // Valida mensagem de sucesso
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
      `Local não cadastrado corretamente: ${toastText}`
    );
    await delay(1000);
  }

  async function excluirLocal(nome) {
    await driver.get('http://localhost:8889/admin/locais');
    await delay(1000);
    try {
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
    } catch (e) {
      // Se não encontrar, já foi excluído
    }
  }

  async function cadastrarCategoria(nome) {
    await driver.get('http://localhost:8889/admin/categorias');
    await driver.wait(until.elementLocated(By.xpath("//button[contains(.,'Nova Categoria')]")), 10000);
    await driver.findElement(By.xpath("//button[contains(.,'Nova Categoria')]")).click();
    await delay(500);
    await driver.findElement(By.xpath("//label[contains(.,'Nome')]/ancestor::div[contains(@class,'ant-form-item')]//input")).sendKeys(nome);
    await driver.findElement(By.xpath("//label[contains(.,'Descrição')]/ancestor::div[contains(@class,'ant-form-item')]//textarea")).sendKeys('Categoria para teste de transferência');
    await driver.findElement(By.xpath("//div[contains(@class,'ant-modal')]//button[span[contains(text(),'OK') or contains(text(),'Salvar')]]")).click();
    await delay(1200);
    // Valida mensagem de sucesso
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
      `Categoria não cadastrada corretamente: ${toastText}`
    );
    await delay(1000);
  }

  async function excluirCategoria(nome) {
    await driver.get('http://localhost:8889/admin/categorias');
    await delay(1000);
    try {
      const linhaCategoria = await driver.findElement(By.xpath(`//tr[td[contains(text(),'${nome}')]]`));
      const excluirBtn = await linhaCategoria.findElement(By.xpath(".//button[span[contains(text(),'Excluir')]]"));
      await excluirBtn.click();
      await delay(500);
      const confirmarBtn = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(@class,'ant-popover')]//button[span[contains(text(),'Excluir')]]")),
        5000
      );
      await confirmarBtn.click();
      await delay(1000);
    } catch (e) {
      // Se não encontrar, já foi excluída
    }
  }

  async function cadastrarBem(numero, nome, localNome, categoriaNome) {
    await driver.get('http://localhost:8889/admin/bens');
    await driver.wait(until.elementLocated(By.xpath("//button[contains(.,'Novo Bem')]")), 10000);
    await delay(800);
    await driver.findElement(By.xpath("//button[contains(.,'Novo Bem')]")).click();
    await delay(800);

    await driver.findElement(By.xpath("//label[contains(.,'Número do Patrimônio')]/ancestor::div[contains(@class,'ant-form-item')]//input")).sendKeys(numero);
    await driver.findElement(By.xpath("//label[contains(.,'Nome do Bem')]/ancestor::div[contains(@class,'ant-form-item')]//input")).sendKeys(nome);

    // Seleciona Local
    const localSelect = await driver.findElement(By.xpath("//label[contains(.,'Local')]/ancestor::div[contains(@class,'ant-form-item')]//div[contains(@class,'ant-select')]"));
    await localSelect.click();
    await delay(1500);
    const localOption = await driver.wait(until.elementLocated(By.xpath(`//div[contains(@class,'ant-select-dropdown') and not(contains(@style,'display: none'))]//div[contains(@class,'ant-select-item-option') and contains(.,'${localNome}')]`)), 8000);
    await localOption.click();
    await delay(800);

    // Seleciona Categoria
    const categoriaSelect = await driver.findElement(By.xpath("//label[contains(.,'Categoria')]/ancestor::div[contains(@class,'ant-form-item')]//div[contains(@class,'ant-select')]"));
    await categoriaSelect.click();
    await delay(1500);
    const categoriaOption = await driver.wait(until.elementLocated(By.xpath(`//div[contains(@class,'ant-select-dropdown') and not(contains(@style,'display: none'))]//div[contains(@class,'ant-select-item-option') and contains(.,'${categoriaNome}')]`)), 8000);
    await categoriaOption.click();
    await delay(800);

    await driver.findElement(By.xpath("//div[contains(@class,'ant-modal')]//button[span[contains(text(),'OK') or contains(text(),'Salvar')]]")).click();
    await delay(1200);

    let toastText = '';
    try {
      const toast = await driver.wait(
        until.elementLocated(By.css('.ant-message-notice-content, .ant-message-success')),
        7000
      );
      toastText = await toast.getAttribute('textContent');
    } catch (e) {}
    assert.ok(
      toastText && normalizarTexto(toastText).includes('bem criado'),
      `Bem não cadastrado corretamente: ${toastText}`
    );
    await delay(1000);
  }

  async function excluirBem(nomeBem) {
    await driver.get('http://localhost:8889/admin/bens');
    await delay(1000);
    try {
      const linhaBem = await driver.findElement(By.xpath(`//tr[td[contains(text(),'${nomeBem}')]]`));
      const excluirBtn = await linhaBem.findElement(By.xpath(".//button[span[contains(text(),'Excluir')]]"));
      await excluirBtn.click();
      await delay(500);
      const confirmarBtn = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(@class,'ant-popover')]//button[span[contains(text(),'Excluir')]]")),
        5000
      );
      await confirmarBtn.click();
      await delay(1000);
    } catch (e) {
      // Se não encontrar, já foi excluído
    }
  }

  it('deve executar transferência de bem com sucesso', async () => {
    await login();

    // Dados do teste
    const setorNome = 'Selenium Setor Transferência';
    const setorSigla = 'SELTR';
    const setorDescricao = 'Setor para teste de transferência';
    const localOrigem = 'Selenium Local Teste Origem';
    const localDestino = 'Selenium Local Teste Destino';
    const categoria = 'Selenium Categoria Teste';
    const numeroBem = 'Selenium Transferência 001';
    const nomeBem = 'Bem Transferível Selenium';

    // 1. Cadastrar setor e obter código
    const codigoSetor = await cadastrarSetor(setorNome, setorSigla, setorDescricao);

    // 2. Cadastrar locais vinculados ao setor
    await cadastrarLocal(localOrigem, codigoSetor);
    await cadastrarLocal(localDestino, codigoSetor);

    // 3. Cadastrar categoria
    await cadastrarCategoria(categoria);

    // 4. Cadastrar bem no local de origem
    await cadastrarBem(numeroBem, nomeBem, localOrigem, categoria);

    // 5. Executar transferência do bem para localDestino
    await driver.get('http://localhost:8889/transferencias/executar');
    await driver.wait(until.elementLocated(By.xpath("//span[contains(.,'Executar Transferência')]")), 10000);
    await delay(1000);

    // Testa filtro de busca
    const searchInput = await driver.findElement(By.css('input[placeholder*="Buscar bem"]'));
    await searchInput.clear();
    await searchInput.sendKeys(nomeBem);
    await delay(1000);

    // Verifica se o bem aparece na lista
    const bemNaLista = await driver.findElement(By.xpath(`//div[contains(@class,'ant-list-item-meta-title')]//span[contains(.,'${nomeBem}')]`));
    assert.ok(await bemNaLista.isDisplayed(), 'Bem não aparece na lista após filtro');

    // Clica no botão Transferir do bem
    const transferirBtn = await driver.findElement(By.xpath(`//div[contains(@class,'ant-list-item')]//button[span[contains(text(),'Transferir')]]`));
    await transferirBtn.click();
    await delay(800);

    // Modal aberto: testa obrigatoriedade dos campos
    const salvarBtn = await driver.findElement(By.xpath("//div[contains(@class,'ant-modal')]//button[span[contains(text(),'OK') or contains(text(),'Salvar')]]"));
    await salvarBtn.click();
    await delay(700);

    // Deve exibir erro de obrigatoriedade para Local de Destino
    const erroLocalDestino = await driver.findElement(By.xpath("//label[contains(.,'Local de Destino')]/ancestor::div[contains(@class,'ant-form-item')]//div[contains(@class,'ant-form-item-explain-error')]"));
    assert.ok(await erroLocalDestino.isDisplayed(), 'Erro de obrigatoriedade não exibido para Local de Destino');

    // Preenche Local de Destino
    const localDestinoSelect = await driver.findElement(By.xpath("//label[contains(.,'Local de Destino')]/ancestor::div[contains(@class,'ant-form-item')]//div[contains(@class,'ant-select')]"));
    await localDestinoSelect.click();
    await delay(1000);
    const localDestinoOption = await driver.wait(until.elementLocated(By.xpath(`//div[contains(@class,'ant-select-dropdown') and not(contains(@style,'display: none'))]//div[contains(@class,'ant-select-item-option') and contains(.,'${localDestino}')]`)), 8000);
    await localDestinoOption.click();
    await delay(800);

    // Preenche motivo com texto longo para testar limite
    const motivoInput = await driver.findElement(By.xpath("//label[contains(.,'Motivo')]/ancestor::div[contains(@class,'ant-form-item')]//textarea"));
    await motivoInput.clear();
    await motivoInput.sendKeys('A'.repeat(1000)); // Adapte o limite conforme o frontend

    // Salva transferência
    await salvarBtn.click();
    await delay(1500);

    // Valida toast de sucesso
    let toastText = '';
    try {
      const toast = await driver.wait(
        until.elementLocated(By.css('.ant-message-notice-content, .ant-message-success')),
        7000
      );
      toastText = await toast.getAttribute('textContent');
    } catch (e) {}
    assert.ok(
      toastText && normalizarTexto(toastText).includes('transferencia realizada'),
      `Transferência não realizada corretamente: ${toastText}`
    );

    // Filtra novamente pelo bem e verifica se está no novo local
    await driver.get('http://localhost:8889/transferencias/executar');
    await driver.wait(until.elementLocated(By.css('input[placeholder*="Buscar bem"]')), 10000);
    const searchInput2 = await driver.findElement(By.css('input[placeholder*="Buscar bem"]'));
    await searchInput2.clear();
    await searchInput2.sendKeys(nomeBem);
    await delay(1500);

    // O bem não deve mais aparecer na lista de transferíveis (caso o sistema oculte bens já transferidos)
    const listaVazia = await driver.findElements(By.xpath("//div[contains(@class,'ant-empty-description')]"));
    assert.ok(listaVazia.length > 0, 'Bem ainda aparece na lista de transferíveis após transferência');

    // Opcional: acessar tela de bens e conferir local atualizado
    await driver.get('http://localhost:8889/admin/bens');
    await driver.wait(until.elementLocated(By.css('input[placeholder*="Buscar"]')), 10000);
    const searchBens = await driver.findElement(By.css('input[placeholder*="Buscar"]'));
    await searchBens.clear();
    await searchBens.sendKeys(nomeBem);
    await delay(1200);
    const linhaBem = await driver.findElement(By.xpath(`//tr[td[contains(text(),'${nomeBem}')]]`));
    const localNaTabela = await linhaBem.findElement(By.xpath(`.//td[contains(.,'${localDestino}')]`));
    assert.ok(await localNaTabela.isDisplayed(), 'Local do bem não foi atualizado após transferência');

    // Limpeza: Exclui o bem, os locais, o setor e a categoria criados
    await excluirBem(nomeBem);
    await excluirLocal(localOrigem);
    await excluirLocal(localDestino);
    await excluirSetor(setorNome);
    await excluirCategoria(categoria);
  });

});