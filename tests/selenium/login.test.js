// Testes automatizados de Login com Selenium WebDriver e Mocha
// Para rodar: npm run dev (para subir o frontend) e npx mocha tests/selenium/login.test.js

const { Builder, By, until } = require('selenium-webdriver'); // Importa Selenium WebDriver
require('chromedriver'); // Garante que o chromedriver está disponível
const assert = require('assert'); // Importa o módulo de asserção do Node.js



describe('Tela de Login', function () { // Bloco principal de testes
  this.timeout(30000); // Define timeout global para cada teste
  let driver; // Variável para armazenar o driver do navegador

  // Antes de todos os testes, inicia o navegador Chrome
  before(async () => {
    driver = await new Builder().forBrowser('chrome').build(); // Cria o driver do Chrome
  });
  // Após todos os testes, fecha o navegador
  after(async () => {
    await driver.quit(); // Fecha o navegador
  });

  // Função auxiliar para delay (usada para garantir renderização de mensagens)
  async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms)); // Retorna uma Promise que resolve após ms milissegundos
  }

  // Testa se a tela de login carrega
  it('deve exibir a tela de login', async () => {
    await driver.get('http://localhost:8889/login'); // Abre a página de login
    await delay(1000); // Espera 1 segundo para visualização
    const title = await driver.getTitle(); // Obtém o título da página
    assert.ok(title); // Verifica se o título existe
  });

  // Função auxiliar para preencher e submeter o formulário de login
  async function preencherLogin(email, senha) {
    await driver.get('http://localhost:8889/login'); // Abre a página de login
    const emailInput = await driver.wait(
      until.elementLocated(By.css('input[placeholder="Email"]')),
      5000
    ); // Espera o campo de email aparecer
    await emailInput.clear(); // Limpa o campo de email
    if (email) await emailInput.sendKeys(email); // Digita o email, se fornecido
    const senhaInput = await driver.findElement(By.css('input[placeholder="Senha"]'));
    await senhaInput.clear(); // Limpa o campo de senha
    if (senha) await senhaInput.sendKeys(senha); // Digita a senha, se fornecida
    const loginButton = await driver.findElement(By.css('button[type="submit"]'));
    await loginButton.click(); // Clica no botão de login
  }



  // Testa login válido
  it('deve fazer login com usuário e senha válidos', async () => {
    await preencherLogin('admin@patrimonioueg.com.br', 'admin123'); // Preenche login válido
    await driver.wait(until.urlContains('/dashboard'), 10000); // Aguarda redirecionamento para dashboard
  });



  // Testa login com usuário inválido
  it('deve exibir erro com usuário inválido', async () => {
    await preencherLogin('usuarioinvalido@teste.com', 'admin123'); // Preenche usuário inválido
    // Aguarda toast de erro
    let erro, erroText;
    try {
      erro = await driver.wait(
        until.elementLocated(By.css('.ant-message-notice-content')),
        8000
      ); // Espera toast padrão do Ant Design
      erroText = await erro.getAttribute('textContent'); // Captura texto do toast
    } catch (e) {
      erro = await driver.wait(
        until.elementLocated(By.css('.ant-message-error')),
        2000
      ); // Alternativa para versões antigas
      erroText = await erro.getText();
    }
    // Verifica se a mensagem exibida é a esperada
    assert.ok(
      erroText && (
        erroText.toLowerCase().includes('credenciais inválidas') ||
        erroText.toLowerCase().includes('email ou senha incorretos')
      ),
      `Mensagem inesperada: ${erroText}`
    );
  });



  // Testa login com senha inválida
  it('deve exibir erro com senha inválida', async () => {
    await preencherLogin('admin@patrimonioueg.com.br', 'senhaerrada'); // Preenche senha inválida
    let erro, erroText;
    try {
      erro = await driver.wait(
        until.elementLocated(By.css('.ant-message-notice-content')),
        8000
      ); // Espera toast padrão do Ant Design
      erroText = await erro.getAttribute('textContent'); // Captura texto do toast
    } catch (e) {
      erro = await driver.wait(
        until.elementLocated(By.css('.ant-message-error')),
        2000
      ); // Alternativa para versões antigas
      erroText = await erro.getText();
    }
    // Verifica se a mensagem exibida é a esperada
    assert.ok(
      erroText && (
        erroText.toLowerCase().includes('credenciais inválidas') ||
        erroText.toLowerCase().includes('email ou senha incorretos')
      ),
      `Mensagem inesperada: ${erroText}`
    );
  });



  // Testa ambos campos vazios
  it('deve exibir erro com ambos vazios', async () => {
    await preencherLogin('', ''); // Não preenche nada
    // Força blur nos campos para disparar validação
    const emailInput = await driver.findElement(By.css('input[placeholder="Email"]'));
    const senhaInput = await driver.findElement(By.css('input[placeholder="Senha"]'));
    await emailInput.click();
    await senhaInput.click();
    await emailInput.click();
    const loginButton = await driver.findElement(By.css('button[type="submit"]'));
    await loginButton.click(); // Clica no botão de login
    await delay(400); // Aguarda renderização da mensagem
    await driver.wait(until.elementsLocated(By.css('.ant-form-item-explain-error')), 5000); // Aguarda mensagens de erro
    const erros = await driver.findElements(By.css('.ant-form-item-explain-error'));
    let encontrouMsg = false;
    for (const erro of erros) {
      const erroText = await erro.getText();
      if (erroText && erroText.length > 0) {
        encontrouMsg = true;
        break;
      }
    }
    assert.ok(encontrouMsg, 'Nenhuma mensagem de erro exibida para ambos vazios');
  });



  // Testa campo email vazio
  it('deve exibir erro com email vazio', async () => {
    await driver.get('http://localhost:8889/login'); // Abre a página de login
    const senhaInput = await driver.wait(
      until.elementLocated(By.css('input[placeholder="Senha"]')),
      5000
    ); // Espera o campo senha
    await senhaInput.sendKeys('admin123'); // Preenche apenas a senha
    const emailInput = await driver.findElement(By.css('input[placeholder="Email"]'));
    await emailInput.click(); // Foca no campo email
    await senhaInput.click(); // Troca o foco para senha (dispara blur)
    const loginButton = await driver.findElement(By.css('button[type="submit"]'));
    await loginButton.click(); // Clica no botão de login
    await delay(400); // Aguarda renderização da mensagem
    await driver.wait(until.elementsLocated(By.css('.ant-form-item-explain-error')), 5000); // Aguarda mensagens de erro
    const erros = await driver.findElements(By.css('.ant-form-item-explain-error'));
    let encontrouMsg = false;
    for (const erro of erros) {
      const erroText = await erro.getText(); // Captura texto de cada erro
      if (erroText && erroText.includes('Por favor, insira o email')) {
        encontrouMsg = true;
        break;
      }
    }
    assert.ok(encontrouMsg, 'Mensagem "Por favor, insira o email" não exibida');
  });

  // Testa campo senha vazio
  it('deve exibir erro com senha vazia', async () => {
    await driver.get('http://localhost:8889/login'); // Abre a página de login
    const emailInput = await driver.wait(
      until.elementLocated(By.css('input[placeholder="Email"]')),
      5000
    ); // Espera o campo email
    await emailInput.sendKeys('admin@patrimonioueg.com.br'); // Preenche apenas o email
    const senhaInput = await driver.findElement(By.css('input[placeholder="Senha"]'));
    await senhaInput.click(); // Foca no campo senha
    await emailInput.click(); // Troca o foco para email (dispara blur)
    const loginButton = await driver.findElement(By.css('button[type="submit"]'));
    await loginButton.click(); // Clica no botão de login
    await delay(400); // Aguarda renderização da mensagem
    await driver.wait(until.elementsLocated(By.css('.ant-form-item-explain-error')), 5000); // Aguarda mensagens de erro
    const erros = await driver.findElements(By.css('.ant-form-item-explain-error'));
    let encontrouMsg = false;
    for (const erro of erros) {
      const erroText = await erro.getText(); // Captura texto de cada erro
      if (erroText && erroText.includes('Por favor, insira a senha')) {
        encontrouMsg = true;
        break;
      }
    }
    assert.ok(encontrouMsg, 'Mensagem "Por favor, insira a senha" não exibida');
  });
}); // Fim do bloco describe
