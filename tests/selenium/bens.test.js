// Testes automatizados de Bens com Selenium WebDriver e Mocha
// Para rodar: npm run dev (para subir o frontend) e npx mocha tests/selenium/bens.test.js

const { Builder, By, until, Key } = require('selenium-webdriver'); // Importa Selenium WebDriver
require('chromedriver'); // Garante que o chromedriver está disponível
const assert = require('assert'); // Importa o módulo de asserção do Node.js

// Função utilitária para normalizar textos (remove acentos e deixa minúsculo)
function normalizarTexto(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// Função utilitária para aguardar overlay de loading sumir
async function aguardarLoadingSumir(timeout = 10000) {
  try {
    await driver.wait(async () => {
      const overlays = await driver.findElements(By.css('.app-loading-wrapper, .ant-spin-spinning'));
      for (const o of overlays) {
        const visible = await o.isDisplayed().catch(() => false);
        if (visible) return false;
      }
      return true;
    }, timeout);
  } catch (e) { /* ignora timeout */ }
}

// Função utilitária para delay (pausa em ms)
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Cadastro de Bens', function () { // Bloco principal de testes
  this.timeout(40000); // Timeout padrão para cada teste
  let driver; // Variável para armazenar o driver do navegador

  // Antes de todos os testes, inicia o navegador Chrome
  before(async () => {
    driver = await new Builder().forBrowser('chrome').build();
    await driver.manage().window().maximize(); // <-- Adicione esta linha
  });

  // Após todos os testes, fecha o navegador
  after(async () => {
    await driver.quit(); // Fecha o navegador
  });

  // Função para login no sistema
  async function login() {
    await driver.get('http://localhost:8889/login'); // Abre a página de login
    const emailInput = await driver.wait(until.elementLocated(By.css('input[placeholder="Email"]')), 10000); // Espera o campo de email aparecer
    await emailInput.clear(); // Limpa o campo de email
    await emailInput.sendKeys('admin@patrimonioueg.com.br'); // Digita o email
    const senhaInput = await driver.findElement(By.css('input[placeholder="Senha"]'));
    await senhaInput.clear(); // Limpa o campo de senha
    await senhaInput.sendKeys('admin123'); // Digita a senha
    const loginButton = await driver.findElement(By.css('button[type="submit"]'));
    await loginButton.click(); // Clica no botão de login
    await driver.wait(until.urlContains('/dashboard'), 20000); // Aguarda redirecionamento

    // Fecha tutorial se aparecer
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

  // Função para navegar até a tela de bens
  async function irParaBens() {
    await driver.wait(until.elementLocated(By.css('.ant-menu')), 8000); // Aguarda menu lateral
    await aguardarLoadingSumir();
    await delay(800);

    // Expande menu Admin
    await aguardarLoadingSumir();
    await delay(800);
    const adminMenu = await driver.findElement(By.xpath("//span[contains(text(),'Admin')]/parent::div | //span[contains(text(),'Admin')]/.."));
    await adminMenu.click(); // Expande o menu Admin
    await aguardarLoadingSumir();
    await delay(800);

    // Clica no menu Bens
    await aguardarLoadingSumir();
    await delay(800);
    const bensMenu = await driver.findElement(By.xpath("//span[contains(text(),'Bens')]/parent::div | //span[contains(text(),'Bens')]/.."));
    await bensMenu.click(); // Acessa a tela de bens
    await aguardarLoadingSumir();
    await delay(800);

    // Aguarda a url mudar para a tela de bens
    await driver.wait(until.urlContains('/admin/bens'), 8000);
    await aguardarLoadingSumir();
    await delay(800);
  }

  // Função para abrir o modal de novo bem
  async function abrirModalNovoBem() {
    await aguardarLoadingSumir();
    const novoBemBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(.,'Novo Bem')]")), 5000); // Espera o botão "Novo Bem"
    await aguardarLoadingSumir();
    await delay(200);
    await novoBemBtn.click(); // Clica no botão para abrir o modal
    await aguardarLoadingSumir();
    await delay(200);
    // Aguarda o modal abrir
    await driver.wait(until.elementLocated(By.xpath("//div[contains(@class,'ant-modal') and .//div[contains(text(),'Novo Bem') or contains(text(),'Editar Bem')]]")), 5000);
    await aguardarLoadingSumir();
    await delay(200);
  }

  // Utilitário para abrir o modal já autenticado e na tela correta
  async function abrirModalCadastroBem() {
    await login();
    await irParaBens();
    await abrirModalNovoBem();
  }

  // Utilitário para limpar todos os campos do formulário
  async function limparCamposBem() {
    // Limpa inputs editáveis
    const inputs = await driver.findElements(By.css('.ant-modal input'));
    for (const input of inputs) {
      const disabled = await input.getAttribute('disabled');
      const readonly = await input.getAttribute('readonly');
      const type = await input.getAttribute('type');
      if (!disabled && !readonly && type !== 'checkbox' && type !== 'radio') {
        try { await input.clear(); } catch (e) { }
      }
    }
    // Limpa textareas editáveis
    const textareas = await driver.findElements(By.css('.ant-modal textarea'));
    for (const ta of textareas) {
      const disabled = await ta.getAttribute('disabled');
      const readonly = await ta.getAttribute('readonly');
      if (!disabled && !readonly) {
        try { await ta.clear(); } catch (e) { }
      }
    }
  }

  // Testa se consegue acessar o cadastro e abrir o modal
  it('deve acessar o cadastro de bens e abrir o modal de novo bem', async () => {
    await login();
    await irParaBens();
    await abrirModalNovoBem();
    const modal = await driver.findElement(By.xpath("//div[contains(@class,'ant-modal') and .//div[contains(text(),'Novo Bem') or contains(text(),'Editar Bem')]]"));
    assert.ok(await modal.isDisplayed());
  });

  // Testa obrigatoriedade dos campos principais
  it('deve validar obrigatoriedade dos campos principais', async () => {
    await abrirModalCadastroBem();
    const modal = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'ant-modal') and not(contains(@class,'ant-modal-hidden')) and .//div[contains(text(),'Novo Bem') or contains(text(),'Editar Bem')]]")),
      10000
    );
    await driver.wait(until.elementIsVisible(modal), 10000);
    await delay(500);
    await limparCamposBem();

    // Tenta submeter sem preencher nada
    const salvarBtn = await driver.findElement(By.xpath("//div[contains(@class,'ant-modal')]//button[span[contains(text(),'OK') or contains(text(),'Salvar')]]"));
    await aguardarLoadingSumir();
    await salvarBtn.click();
    await aguardarLoadingSumir();
    await delay(700);

    // Valida mensagens de erro dos campos obrigatórios
    const erroNumero = await driver.findElement(By.xpath("//label[contains(.,'Número do Patrimônio')]/ancestor::div[contains(@class,'ant-form-item')]//div[contains(@class,'ant-form-item-explain-error')]"));
    assert.ok(await erroNumero.isDisplayed(), 'Erro de obrigatoriedade não exibido para Número do Patrimônio');
    const erroNome = await driver.findElement(By.xpath("//label[contains(.,'Nome do Bem')]/ancestor::div[contains(@class,'ant-form-item')]//div[contains(@class,'ant-form-item-explain-error')]"));
    assert.ok(await erroNome.isDisplayed(), 'Erro de obrigatoriedade não exibido para Nome do Bem');
    const erroLocal = await driver.findElement(By.xpath("//label[contains(.,'Local')]/ancestor::div[contains(@class,'ant-form-item')]//div[contains(@class,'ant-form-item-explain-error')]"));
    assert.ok(await erroLocal.isDisplayed(), 'Erro de obrigatoriedade não exibido para Local');
    const erroCategoria = await driver.findElement(By.xpath("//label[contains(.,'Categoria')]/ancestor::div[contains(@class,'ant-form-item')]//div[contains(@class,'ant-form-item-explain-error')]"));
    assert.ok(await erroCategoria.isDisplayed(), 'Erro de obrigatoriedade não exibido para Categoria');
  });

  // Testa limites de tamanho e valores inválidos nos campos
  it('deve validar limites e tipos dos campos do bem', async () => {
    await abrirModalCadastroBem();
    await limparCamposBem();

    // Preenche campos com valores inválidos
    const numeroInput = await driver.findElement(By.xpath("//label[contains(.,'Número do Patrimônio')]/ancestor::div[contains(@class,'ant-form-item')]//input"));
    await numeroInput.click();
    await numeroInput.sendKeys(Key.chord(Key.CONTROL, 'a'), '1'.repeat(100));
    const nomeInput = await driver.findElement(By.xpath("//label[contains(.,'Nome do Bem')]/ancestor::div[contains(@class,'ant-form-item')]//input"));
    await nomeInput.click();
    await nomeInput.sendKeys(Key.chord(Key.CONTROL, 'a'), 'A'.repeat(200));
    const valorInput = await driver.findElement(By.xpath("//label[contains(.,'Valor de Aquisição')]/ancestor::div[contains(@class,'ant-form-item')]//input"));
    await valorInput.click();
    await valorInput.sendKeys(Key.chord(Key.CONTROL, 'a'), '-1000');
    const pesoInput = await driver.findElement(By.xpath("//label[contains(.,'Peso (kg)')]/ancestor::div[contains(@class,'ant-form-item')]//input"));
    await pesoInput.click();
    await pesoInput.sendKeys(Key.chord(Key.CONTROL, 'a'), '-5');
    const dataInput = await driver.findElement(By.xpath("//label[contains(.,'Data de Aquisição')]/ancestor::div[contains(@class,'ant-form-item')]//input"));
    await dataInput.click();
    await dataInput.sendKeys(Key.chord(Key.CONTROL, 'a'), '2025-99-99');
    await aguardarLoadingSumir();

    // Tenta submeter
    const salvarBtn = await driver.findElement(By.xpath("//div[contains(@class,'ant-modal')]//button[span[contains(text(),'OK') or contains(text(),'Salvar')]]"));
    await salvarBtn.click();
    await delay(700);

    // Aqui você pode validar as mensagens de erro específicas conforme sua regra de frontend
  });

  // Testa cadastro de bem com sucesso
  it('deve cadastrar um bem com sucesso', async function () {
  this.timeout(70000); // 70 segundos
  const numero = 'Selenium Teste - 001';
  const nome = 'Selenium Teste - Nome do Bem';

  // Garante que o bem não existe antes de cadastrar
  await deletarBemSeExistir(numero);

  await abrirModalCadastroBem();
  const modal = await driver.wait(
    until.elementLocated(By.xpath("//div[contains(@class,'ant-modal') and not(contains(@class,'ant-modal-hidden')) and .//div[contains(text(),'Novo Bem') or contains(text(),'Editar Bem')]]")),
    10000
  );
  await driver.wait(until.elementIsVisible(modal), 10000);
  await delay(500);

  // Preenche campos obrigatórios
  await aguardarLoadingSumir();
  const numeroInput = await modal.findElement(By.xpath(".//label[contains(.,'Número do Patrimônio')]/ancestor::div[contains(@class,'ant-form-item')]//input"));
  await driver.wait(until.elementIsVisible(numeroInput), 7000);
  await driver.wait(until.elementIsEnabled(numeroInput), 7000);
  await driver.executeScript('arguments[0].scrollIntoView(true);', numeroInput);
  await numeroInput.click();
  await numeroInput.sendKeys(Key.chord(Key.CONTROL, 'a'), numero);

  await aguardarLoadingSumir();
  const nomeInput = await modal.findElement(By.xpath(".//label[contains(.,'Nome do Bem')]/ancestor::div[contains(@class,'ant-form-item')]//input"));
  await driver.wait(until.elementIsVisible(nomeInput), 7000);
  await driver.wait(until.elementIsEnabled(nomeInput), 7000);
  await driver.executeScript('arguments[0].scrollIntoView(true);', nomeInput);
  await nomeInput.click();
  await nomeInput.sendKeys(Key.chord(Key.CONTROL, 'a'), nome);

  // Seleciona Local
  await aguardarLoadingSumir();
  const localSelect = await modal.findElement(By.xpath(".//label[contains(.,'Local')]/ancestor::div[contains(@class,'ant-form-item')]//div[contains(@class,'ant-select')]"));
  await driver.wait(until.elementIsVisible(localSelect), 12000);
  await driver.executeScript('arguments[0].scrollIntoView(true);', localSelect);
  await localSelect.click();
  await delay(1200);
  await aguardarLoadingSumir();
  const localOption = await driver.wait(until.elementLocated(By.xpath("//div[contains(@class,'ant-select-dropdown') and not(contains(@style,'display: none'))]//div[contains(@class,'ant-select-item-option')][1]")), 12000);
  await driver.wait(until.elementIsVisible(localOption), 12000);
  await localOption.click();
  await delay(4000);
  await aguardarLoadingSumir();

  // Seleciona Categoria
  await aguardarLoadingSumir();
  const categoriaSelect = await modal.findElement(By.xpath(".//label[contains(.,'Categoria')]/ancestor::div[contains(@class,'ant-form-item')]//div[contains(@class,'ant-select')]"));
  await driver.wait(until.elementIsVisible(categoriaSelect), 12000);
  await driver.executeScript('arguments[0].scrollIntoView(true);', categoriaSelect);
  await categoriaSelect.click();
  await delay(1200);
  await aguardarLoadingSumir();
  const dropdowns = await driver.findElements(By.css('.ant-select-dropdown'));
  let categoriaDropdown = null;
  for (const dd of dropdowns) {
    if (await dd.isDisplayed()) {
      categoriaDropdown = dd;
      break;
    }
  }
  if (!categoriaDropdown) throw new Error('Dropdown de Categoria não visível');
  const categoriaOption = await categoriaDropdown.findElement(By.css('.ant-select-item-option'));
  await driver.wait(until.elementIsVisible(categoriaOption), 12000);
  await categoriaOption.click();
  await delay(900);
  await aguardarLoadingSumir();

  // Submete o formulário
  await aguardarLoadingSumir();
  const salvarBtn = await driver.findElement(By.xpath("//div[contains(@class,'ant-modal')]//button[span[contains(text(),'OK') or contains(text(),'Salvar')]]"));
  await driver.wait(until.elementIsVisible(salvarBtn), 7000);
  await driver.wait(until.elementIsEnabled(salvarBtn), 7000);
  await aguardarLoadingSumir();
  await delay(500);
  await salvarBtn.click();
  await aguardarLoadingSumir();

  // Valida mensagem de sucesso (toast)
  let toastText = '';
  await delay(500);
  try {
    const toast = await driver.wait(
      until.elementLocated(By.css('.ant-message-notice-content, .ant-message-success')),
      7000
    );
    toastText = await toast.getAttribute('textContent');
  } catch (e) {}

  assert.ok(
    toastText && normalizarTexto(toastText).includes('bem criado'),
    `Mensagem de sucesso não exibida ou diferente: ${toastText}`
  );

  await delay(1200);

  // Após o cadastro e validação do toast:
  await aguardarLoadingSumir();
  await delay(800);

  // Ir para a última página
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

  // Agora verifica se o novo bem aparece na última página
  const tabela = await driver.findElement(By.css('.ant-table'));
  const textoTabela = await tabela.getText();
  assert.ok(textoTabela.includes(numero), 'Novo bem não encontrado na tabela');
  assert.ok(textoTabela.includes(nome), 'Nome do novo bem não encontrado na tabela');
});

// Testa cadastro de bem com número já existente
it('não deve permitir cadastrar bem com número já existente', async () => {
  const numero = 'Selenium Teste - 001';
  const nome = 'Selenium Teste - Nome do Bem Duplicado';

  // Garante que o bem existe (cadastrado no teste anterior)
  await abrirModalCadastroBem();
  const modal = await driver.wait(
    until.elementLocated(By.xpath("//div[contains(@class,'ant-modal') and not(contains(@class,'ant-modal-hidden')) and .//div[contains(text(),'Novo Bem') or contains(text(),'Editar Bem')]]")),
    10000
  );
  await driver.wait(until.elementIsVisible(modal), 10000);
  await delay(500);

  // Preenche campos obrigatórios com o mesmo número
  await aguardarLoadingSumir();
  const numeroInput = await modal.findElement(By.xpath(".//label[contains(.,'Número do Patrimônio')]/ancestor::div[contains(@class,'ant-form-item')]//input"));
  await numeroInput.click();
  await numeroInput.sendKeys(Key.chord(Key.CONTROL, 'a'), numero);

  await aguardarLoadingSumir();
  const nomeInput = await modal.findElement(By.xpath(".//label[contains(.,'Nome do Bem')]/ancestor::div[contains(@class,'ant-form-item')]//input"));
  await nomeInput.click();
  await nomeInput.sendKeys(Key.chord(Key.CONTROL, 'a'), nome);

  // Seleciona Local
  await aguardarLoadingSumir();
  const localSelect = await modal.findElement(By.xpath(".//label[contains(.,'Local')]/ancestor::div[contains(@class,'ant-form-item')]//div[contains(@class,'ant-select')]"));
  await driver.wait(until.elementIsVisible(localSelect), 12000);
  await driver.executeScript('arguments[0].scrollIntoView(true);', localSelect);
  await localSelect.click();
  await delay(1200);
  await aguardarLoadingSumir();
  const localOption = await driver.wait(until.elementLocated(By.xpath("//div[contains(@class,'ant-select-dropdown') and not(contains(@style,'display: none'))]//div[contains(@class,'ant-select-item-option')][1]")), 12000);
  await driver.wait(until.elementIsVisible(localOption), 12000);
  await localOption.click();
  await delay(4000);
  await aguardarLoadingSumir();

  // Seleciona Categoria
  await aguardarLoadingSumir();
  const categoriaSelect = await modal.findElement(By.xpath(".//label[contains(.,'Categoria')]/ancestor::div[contains(@class,'ant-form-item')]//div[contains(@class,'ant-select')]"));
  await driver.wait(until.elementIsVisible(categoriaSelect), 12000);
  await driver.executeScript('arguments[0].scrollIntoView(true);', categoriaSelect);
  await categoriaSelect.click();
  await delay(1200);
  await aguardarLoadingSumir();
  const dropdowns = await driver.findElements(By.css('.ant-select-dropdown'));
  let categoriaDropdown = null;
  for (const dd of dropdowns) {
    if (await dd.isDisplayed()) {
      categoriaDropdown = dd;
      break;
    }
  }
  if (!categoriaDropdown) throw new Error('Dropdown de Categoria não visível');
  const categoriaOption = await categoriaDropdown.findElement(By.css('.ant-select-item-option'));
  await driver.wait(until.elementIsVisible(categoriaOption), 12000);
  await categoriaOption.click();
  await delay(900);
  await aguardarLoadingSumir();

  // Submete o formulário
  await aguardarLoadingSumir();
  const salvarBtn = await driver.findElement(By.xpath("//div[contains(@class,'ant-modal')]//button[span[contains(text(),'OK') or contains(text(),'Salvar')]]"));
  await salvarBtn.click();
  await aguardarLoadingSumir();

  // Valida mensagem de erro de duplicidade
  let toastText = '';
  await delay(500);
  try {
    const toast = await driver.wait(
      until.elementLocated(By.css('.ant-message-notice-content, .ant-message-error')),
      7000
    );
    toastText = await toast.getAttribute('textContent');
  } catch (e) {}

  assert.ok(
    toastText && normalizarTexto(toastText).includes(normalizarTexto('Já existe um bem com este número de patrimônio')),
    `Mensagem de erro de duplicidade não exibida ou diferente: ${toastText}`
  );
});

// Função robusta para deletar o bem em qualquer página
async function deletarBemSeExistir(numero) {
  await login();
  await irParaBens();
  await aguardarLoadingSumir();
  await delay(800);

  // Encontra todos os botões de página visíveis
  const pageButtons = await driver.findElements(By.css('.ant-pagination-item'));
  let lastPageBtn = null;
  let lastPageNum = 1;

  // Descobre o maior número de página e pega o botão correspondente
  for (const btn of pageButtons) {
    if (!(await btn.isDisplayed())) continue;
    const text = await btn.getText();
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > lastPageNum) {
      lastPageNum = num;
      lastPageBtn = btn;
    }
  }

  // Se encontrou, clica na última página
  if (lastPageBtn) {
    await aguardarLoadingSumir();
    await delay(300);
    await lastPageBtn.click();
    await aguardarLoadingSumir();
    await delay(800);
  }

  // Agora procura o bem apenas na última página
  await aguardarLoadingSumir();
  await delay(500);

  const linhas = await driver.findElements(By.xpath(`//tr[td[contains(text(),'${numero}')]]`));
  if (linhas.length > 0) {
    const linhaBem = linhas[0];
    const excluirBtn = await linhaBem.findElement(By.xpath(".//button[span[contains(text(),'Excluir')]]"));
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

// Testa exclusão de bem cadastrado
it('deve excluir o bem cadastrado de teste', async () => {
  const numero = 'Selenium Teste - 001';
  await deletarBemSeExistir(numero);

  // Confirma que o bem não existe mais na última página
  // (pode adaptar para buscar em todas as páginas se quiser)
  await aguardarLoadingSumir();
  await delay(1000); // Delay extra para garantir atualização da tabela

  const tabela = await driver.findElement(By.css('.ant-table'));
  const textoTabela = await tabela.getText();
  assert.ok(!textoTabela.includes(numero), 'Bem de teste ainda está na tabela após exclusão');
});
}); // Fecha o describe('Cadastro de Bens', function ()

