# Configuração Nginx para Produção

Este diretório contém as configurações do Nginx Gateway usadas em produção.

## Arquivo: `app-patrimonio.conf`

Este arquivo deve ser copiado para o servidor no caminho:
```
/home/usuario/docker-ueg-projects/docker/nginx/includes/app-patrimonio.conf
```

### Como aplicar mudanças:

1. **Copiar arquivo para o servidor:**
```bash
scp -P 8740 nginx/app-patrimonio.conf usuario@200.137.241.42:/home/usuario/docker-ueg-projects/docker/nginx/includes/app-patrimonio.conf
```

2. **Testar a configuração:**
```bash
ssh -p 8740 usuario@200.137.241.42 "docker exec nginx-gateway nginx -t"
```

3. **Recarregar o Nginx:**
```bash
ssh -p 8740 usuario@200.137.241.42 "docker exec nginx-gateway nginx -s reload"
```

## Configurações Incluídas

### 1. Proxy para API Backend
- **Rota:** `/api/*`
- **Destino:** `http://patrimonio-backend:3000/api/`
- **CORS:** Habilitado para todos os origins
- **Timeout:** 60s para leitura

### 2. Proxy para Uploads
- **Rota:** `/uploads/*`
- **Destino:** `http://patrimonio-backend:3000/uploads/`
- **Cache:** 1 ano (imagens)
- **CORS:** Habilitado

### 3. Proxy para Portal de Dados Abertos (CKAN)
- **Rota:** `/ckan/*`
- **Destino:** `https://dadosabertos.go.gov.br/`
- **Função:** Permite acesso ao portal de Dados Abertos do Governo de Goiás
- **CORS:** Habilitado
- **Rewrite:** Remove o prefixo `/ckan/` da URL antes de fazer o proxy

## Importante

⚠️ Após qualquer alteração neste arquivo, é necessário:
1. Copiar para o servidor
2. Testar a configuração
3. Recarregar o Nginx

O pipeline do Bitbucket **não atualiza automaticamente** este arquivo. Ele só atualiza os arquivos do frontend (pasta `dist/`).
