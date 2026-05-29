# ✉️ Notification Delivery System — Monorrepósitório com RabbitMQ & Docker

[![Continuous Integration](https://github.com/danielsantosbr255/demo-rabbitmq/actions/workflows/ci.yaml/badge.svg)](https://github.com/danielsantosbr255/demo-rabbitmq/actions/workflows/ci.yaml)

Este repositório consiste em um sistema distribuído de notificações desenvolvido como um projeto de estudos práticos e avançados sobre arquitetura orientada a eventos e mensageria robusta utilizando o **RabbitMQ**.

O sistema está estruturado em formato de **Monorepo** com microsserviços empacotados em containers Docker. A aplicação permite enviar notificações nos canais de **E-mail** (integrado ao Mailpit com envio real) e **SMS** (simulado via mock logs).

---

## 📌 Sumário

1. [🚀 Como Executar o Projeto](#como-executar-o-projeto)
2. [🔗 Portas e Endpoints Úteis](#portas-e-endpoints-úteis)
3. [🏗️ Arquitetura do Sistema e Fluxo de Mensagens](#arquitetura-do-sistema-e-fluxo-de-mensagens)
4. [🛡️ Resiliência e Mensageria no RabbitMQ](#resiliência-e-mensageria-no-rabbitmq)
5. [📡 Monitoramento em Tempo Real com SSE (Server-Sent Events)](#monitoramento-em-tempo-real-com-sse-server-sent-events)
6. [🛠️ Tecnologias Utilizadas](#tecnologias-utilizadas)
7. [🧪 Como Testar Toda a Aplicação (Passo a Passo)](#como-testar-toda-a-aplicação-passo-a-passo)
8. [🧪 Testes Automatizados (Vitest)](#testes-automatizados-vitest)
9. [📁 Estrutura do Monorepo](#estrutura-do-monorepo)
10. [🛠️ Ferramental de Desenvolvimento e Git Hooks](#ferramental-de-desenvolvimento-e-git-hooks)
11. [🚀 Integração Contínua (GitHub Actions)](#integração-contínua-github-actions)

---

## 🚀 Como Executar o Projeto

Siga o passo a passo abaixo para configurar e rodar o projeto do zero na sua máquina local.

### 📋 Pré-requisitos
Antes de começar, certifique-se de ter instalado em seu ambiente:
- **Docker** & **Docker Compose** (Obrigatório)
- **Node.js (v24+)** & **PNPM** (Opcional, apenas se for executar ou desenvolver localmente fora do Docker)

---

### 🛠️ Passo a Passo para Execução

#### Passo 1: Clonar o Repositório
Abra o seu terminal e clone este repositório executando:
```bash
git clone https://github.com/danielsantosbr255/demo-rabbitmq.git
cd demo-rabbitmq
```

#### Passo 2: Configurar as Variáveis de Ambiente
Como este é um monorrepósitório com múltiplos microsserviços, cada aplicação (`api-gateway`, `monitor-api`, `email-worker` e `sms-worker`) possui seu próprio arquivo `.env` para manter o isolamento de configurações. 

Para facilitar o processo e evitar cópias manuais em cada diretório, você pode automatizar a criação rodando o atalho abaixo na raiz do projeto:

```bash
pnpm env:setup
```

> [!TIP]
> Caso você não possua o `pnpm` instalado na sua máquina host local, você pode executar a instrução nativa do bash na raiz para obter o mesmo resultado:
> ```bash
> [ -f .env ] || cp .env.example .env; [ -f apps/api-gateway/.env ] || cp apps/api-gateway/.env.example apps/api-gateway/.env; [ -f apps/monitor-api/.env ] || cp apps/monitor-api/.env.example apps/monitor-api/.env; [ -f apps/email-worker/.env ] || cp apps/email-worker/.env.example apps/email-worker/.env; [ -f apps/sms-worker/.env ] || cp apps/sms-worker/.env.example apps/sms-worker/.env
> ```
> *(Essa estrutura de teste condicional `[ -f arquivo ] || cp ...` garante que se você já tiver algum arquivo `.env` configurado, ele **não** será sobrescrito, protegendo suas variáveis customizadas sem gerar avisos de compatibilidade).*



#### Passo 3: Iniciar o Sistema
Escolha uma das opções abaixo para iniciar a aplicação:

<details>
<summary><b>Opção A: Executar em Modo Desenvolvimento com Hot-Reload (Recomendado)</b></summary>

Se você deseja alterar o código e ver as modificações refletidas em tempo real, execute:
```bash
docker compose watch
```
* **O que acontece por trás?** O Docker inicia todas as aplicações em modo de desenvolvimento (Dashboard em `:5173`, Gateway em `:3000`, Monitor em `:3001`, RabbitMQ e Mailpit). O utilitário *Docker Compose Watch* monitora a pasta `src/` das APIs e sincroniza as alterações com o container de forma instantânea, reiniciando o processo automaticamente (hot-reload).
</details>

<details>
<summary><b>Opção B: Executar em Modo Produção (Imagens Leves e Seguras)</b></summary>

Para rodar o ecossistema exatamente como estaria em produção:
```bash
docker compose -f compose.yaml up --build -d
```
* **O que acontece por trás?** O Docker realiza compilações otimizadas utilizando builds de múltiplos estágios (*multi-stage building*):
  - **Imagens Distroless**: O runtime dos microsserviços Node usa imagens Distroless da Google (`gcr.io/distroless/nodejs24`). Elas não possuem shell, gerenciadores de pacotes ou ferramentas extras de SO, reduzindo a superfície de ataque para segurança.
  - **Nginx Unprivileged**: O dashboard é compilado e servido por um Nginx Alpine rodando sob usuário sem privilégios de root.
</details>

<details>
<summary><b>Opção C: Executar Localmente sem Docker (Apenas a infra no Docker)</b></summary>

Se quiser rodar os processos Node diretamente no seu sistema operacional local:
1. Inicie o RabbitMQ e o Mailpit em background:
   ```bash
   pnpm infra
   ```
2. Instale as dependências de todo o monorepo:
   ```bash
   pnpm install
   ```
3. Inicie todos os serviços do monorepo em modo de desenvolvimento simultâneo:
   ```bash
   pnpm dev
   ```
</details>

---

## 🔗 Portas e Endpoints Úteis

Com a aplicação rodando, você poderá acessar os seguintes serviços no seu navegador:

| Serviço | Endereço / URL | Finalidade |
| :--- | :--- | :--- |
| **Dashboard Frontend** | [http://localhost:5173](http://localhost:5173) | Interface gráfica para enviar notificações e gerenciar filas/DLQ |
| **API Gateway (Scalar Docs)** | [http://localhost:3000/docs](http://localhost:3000/docs) | Documentação interativa Scalar das rotas do Gateway de envio |
| **Monitor API (Scalar Docs)** | [http://localhost:3001/docs](http://localhost:3001/docs) | Documentação interativa Scalar das rotas de estatísticas e DLQ |
| **RabbitMQ Management** | [http://localhost:15672](http://localhost:15672) | Console nativo de administração (Padrão: `admin` / `admin`) |
| **Mailpit Web UI (Caixa de Entrada)**| [http://localhost:8025](http://localhost:8025) | Webmail para visualizar as notificações de e-mail mockadas |

---

## 🏗️ Arquitetura do Sistema e Fluxo de Mensagens

O fluxo geral consiste em uma API de entrada (Gateway) que recebe as solicitações, valida as regras de negócio de maneira síncrona e enfileira no RabbitMQ para processamento assíncrono pelos workers dedicados. Abaixo está o pipeline completo detalhando a resiliência (Retentativas e Fila de Mensagens Mortas/DLQ):

```mermaid
graph TD
    Client[Cliente / Dashboard] -->|POST /notifications| Gateway[API Gateway :3000]
    Gateway -->|Validação de Schema Zod| Gateway
    Gateway -->|Publish com Confirm=true| Exchange[notifications.exchange <br/> type: direct]
    
    Exchange -->|routingKey: email| QueueEmail[q.email]
    Exchange -->|routingKey: sms| QueueSms[q.sms]
    
    QueueEmail -->|Consome| EmailWorker[email-worker]
    QueueSms -->|Consome| SmsWorker[sms-worker]
    
    EmailWorker -->|Sucesso| Mailpit[Mailpit SMTP :1025]
    SmsWorker -->|Sucesso| SmsMock[SMS Log / Mock]
    
    %% Fluxo de Retentativas
    EmailWorker -.->|Falha temporária <br/> Tentativas 1, 2 e 3| RetryQueueEmail[q.email.retry.x <br/> TTL: 10s, 30s, 120s]
    RetryQueueEmail -.->|Expiração do TTL| RetryDLX[notifications.retry.dlx <br/> type: direct]
    RetryDLX -.->|routingKey: email| QueueEmail
    
    SmsWorker -.->|Falha temporária <br/> Tentativas 1, 2 e 3| RetryQueueSms[q.sms.retry.x <br/> TTL: 10s, 30s, 120s]
    RetryQueueSms -.->|Expiração do TTL| RetryDLX
    RetryDLX -.->|routingKey: sms| QueueSms
    
    %% Fluxo da DLQ
    EmailWorker -->|Falha fatal ou esgotou retentativas| DLX[notifications.dlx <br/> type: fanout]
    SmsWorker -->|Falha fatal ou esgotou retentativas| DLX
    DLX --> QueueDLQ[q.notifications.dlq]
    
    %% Sistema de Monitoramento e Dashboard
    QueueDLQ -->|Inspeção / Exclusão| MonitorAPI[Monitor API :3001]
    QueueEmail -->|Estatísticas da Fila| MonitorAPI
    QueueSms -->|Estatísticas da Fila| MonitorAPI
    MonitorAPI -->|SSE stream| Dashboard[React Dashboard :5173]
```

---

## 🛡️ Resiliência e Mensageria no RabbitMQ

A topologia do RabbitMQ foi projetada seguindo padrões corporativos de resiliência e prevenção contra perda de dados:

1. **Mensagens e Filas Duráveis (`durable: true`)**:
   - Todas as exchanges, filas principais e filas de retry são declaradas como duráveis.
   - As mensagens são publicadas com a propriedade `durable: true` (modo de entrega persistente), fazendo com que persistam em disco e sobrevivam a eventuais reinicializações do broker.

2. **Publisher Confirms (`confirm: true`)**:
   - O `api-gateway` só responde `202 Accepted` ao cliente após receber a confirmação de recebimento (ACK) emitida pelo RabbitMQ. Isso garante que a mensagem de fato entrou na fila e não foi descartada na rede.

3. **Estratégia de Retry Baseada em TTL (Delay Queues)**:
   - Quando um processamento de worker falha devido a erros transitórios (ex: falhas de rede ou queda de integradores), o sistema não faz o re-enfileiramento na própria fila de trabalho imediatamente para evitar o efeito *Head-of-Line Blocking* (um item defeituoso bloqueando os demais).
   - O worker publica a mensagem em uma fila temporária de retry (`q.email.retry.0`, `1`, `2`...) configurada com um tempo de vida (TTL) progressivo:
     - **Tentativa 1**: Atraso de **10 segundos**
     - **Tentativa 2**: Atraso de **30 segundos**
     - **Tentativa 3**: Atraso de **120 segundos (2 minutos)**
   - Ao expirar o TTL nessas filas de retry, as mensagens são automaticamente redirecionadas (via `x-dead-letter-exchange`) de volta para a fila principal (`q.email` ou `q.sms`) para serem processadas novamente.

4. **Dead Letter Queue (DLQ) para Erros Fatais**:
   - Mensagens que falham permanentemente após 3 tentativas ou que possuem erros de esquema irreparáveis (ex: tipo de dados inválido que passou na validação inicial) são descartadas com `requeue: false`.
   - Graças à configuração do argumento `x-dead-letter-exchange: notifications.dlx` na fila principal, o RabbitMQ redireciona a mensagem descartada para a exchange da DLQ, caindo na fila `q.notifications.dlq`.
   - As mensagens ficam salvas lá para auditoria manual e depuração, podendo ser inspecionadas e limpas no dashboard.

---

## 📡 Monitoramento em Tempo Real com SSE (Server-Sent Events)

A API de monitoramento (`monitor-api`) expõe um endpoint (`/queues/stream`) que utiliza a tecnologia **SSE (Server-Sent Events)** para empurrar as estatísticas de volumetria de filas e DLQ em tempo real para o dashboard.

A escolha de SSE em detrimento de uma solução como **WebSockets** foi tomada de forma consciente, considerando os seguintes trade-offs arquiteturais:

* **Unidirecionalidade Adequada**: O fluxo de dados de monitoramento é exclusivamente do servidor para o cliente (*Server-to-Client*). O dashboard apenas renderiza os dados recebidos e não precisa responder através do mesmo canal. WebSockets fornece comunicação bidirecional completa, o que seria desnecessário (*overkill*) para este cenário.
* **Simplicidade de Protocolo (HTTP Tradicional)**: O SSE opera sob o protocolo HTTP padrão, utilizando a conexão persistente com o cabeçalho `Content-Type: text/event-stream`. Isso significa que ele passa nativamente por proxies reversos, firewalls e balanceadores de carga sem a necessidade de configurações especiais ou handshakes complexos de atualização de protocolo (como o `Upgrade` requerido pelo WebSocket).
* **Resiliência e Reconexão Nativa**: O cliente no navegador (utilizando a API nativa `EventSource`) lida de forma automática com reconexões caso o servidor caia ou sofra alguma instabilidade temporária. No WebSocket, essa lógica de reconexão precisaria ser desenvolvida manualmente no frontend.
* **Menor Overhead de Implementação**: SSE consome menos recursos de rede e de processamento no servidor para gerenciar as conexões persistentes abertas, mantendo a simplicidade da aplicação Fastify.

---

## 🛠️ Tecnologias Utilizadas

- **Runtime & Linguagem**: Node.js (v24) & TypeScript.
- **Frameworks HTTP (Fastify)**: Utilizado no `api-gateway` e no `monitor-api` por ser leve, performático e compatível com schemas modernos.
- **Validação de Schemas**: Zod & `@fastify/type-provider-zod` para validação em tempo de execução dos dados de entrada.
- **Documentação de API**: Swagger + `@scalar/fastify-api-reference` para renderizar interfaces modernas de documentação no endpoint `/docs`.
- **Frontend**: React, Vite, Tailwind CSS / Vanilla CSS e ícones do Lucide.
- **Mensageria**: RabbitMQ 4.3 (Alpine) com o plugin Management ativado.
- **Integração de E-mail**: Nodemailer para comunicação SMTP + **Mailpit** atuando como servidor de e-mail mock de alta fidelidade para testes em ambiente local.
- **Containers**: Docker e Docker Compose, utilizando recursos de Multi-stage builds e desenvolvimento assistido por `docker compose watch`.

---

## 🧪 Como Testar Toda a Aplicação (Passo a Passo)

### 1. Enviar Notificação com Sucesso (Fluxo Feliz)
1. Acesse o **Dashboard** ([http://localhost:5173](http://localhost:5173)).
2. Preencha o formulário selecionando o canal **E-mail**, preenchendo o destinatário (ex: `dev@example.com`), o assunto e a mensagem.
3. Clique em **Enviar Notificação**.
4. O console lateral (Stream de Eventos) exibirá `202 Aceito`.
5. Acesse o **Mailpit** ([http://localhost:8025](http://localhost:8025)) e confira se o e-mail foi recebido com o assunto e conteúdo corretos.

### 2. Testar o Pipeline de Retries (Falha Temporária)
O Worker de SMS possui um gatilho de simulação configurado no código. Ele lança um erro temporário se o corpo da mensagem contiver a palavra `"fail"`.
1. No formulário do Dashboard, escolha o canal **SMS**.
2. No campo do número de telefone, insira um número no formato E.164 (ex: `+5511999999999`).
3. No campo da mensagem, escreva obrigatoriamente a palavra **`fail`** (exemplo: `"Minha notificação fail de teste"`).
4. Clique em **Enviar Notificação**.
5. **Acompanhe o Pipeline**:
   - A mensagem entrará na fila principal `q.sms`.
   - O worker processará e falhará. Ele enviará a mensagem para a fila de atraso `q.sms.retry.0`. Você verá visualmente no dashboard o contador de mensagens subir nessa fila amarela.
   - Após **10 segundos**, a mensagem sai do retry e volta para a fila `q.sms`. Ela falha novamente e entra na fila `q.sms.retry.1` (onde aguardará por **30 segundos**).
   - Ela retorna e falha pela terceira vez, aguardando **120 segundos (2 minutos)** na fila `q.sms.retry.2`.
   - Você pode acompanhar essas passagens de tempo em tempo real pelas métricas de estatísticas ou pelos logs no terminal (`docker compose logs -f sms-worker`).

> [!NOTE]
> **Atraso na Atualização Visual (Limitação Técnica)**: 
> É normal que o dashboard leve até **5 segundos** para atualizar os números de mensagens nas filas. Isso é uma limitação da própria API nativa de gerenciamento do RabbitMQ, que coleta e disponibiliza estatísticas e métricas de tráfego do broker em intervalos definidos de 5 segundos.

### 3. Testar a Dead Letter Queue (DLQ)
Depois de passar pelas 3 retentativas na fila de SMS descritas acima, a mensagem excederá a quantidade máxima de tentativas. O worker desistirá dela, fazendo com que o RabbitMQ a transfira automaticamente para a fila morta (`q.notifications.dlq`).
1. Ao final dos 2 minutos da última retentativa, verifique a seção **Dead Letter Queue (DLQ)** no rodapé do dashboard.
2. A mensagem inválida aparecerá na lista da DLQ detalhando o motivo do erro.
3. Você poderá realizar uma auditoria do payload que falhou ou simplesmente limpar a DLQ clicando no botão **Limpar Fila Morta (Purge)**.

---

## 🧪 Testes Automatizados (Vitest)

O monorepo utiliza o **Vitest** como framework de testes automatizados, fornecendo velocidade e integração perfeita com o ecossistema TypeScript e Vite.

### Executar Testes Locais
Se você instalou as dependências locais via `pnpm install`, pode executar os seguintes comandos a partir do diretório raiz:

- **Executar todos os testes do monorepo de forma recursiva**:
  ```bash
  pnpm test
  ```

- **Executar testes em modo de observação (watch/interativo)**:
  ```bash
  pnpm test -- --watch
  ```

- **Executar testes de um microsserviço específico**:
  Você pode filtrar a execução utilizando a flag `--filter` apontando para o nome do pacote correspondente:
  ```bash
  # Apenas testes do API Gateway
  pnpm --filter api-gateway test
  
  # Apenas testes do Email Worker
  pnpm --filter email-worker test
  ```

---

## 📁 Estrutura do Monorepo

O monorepo utiliza o gerenciador de pacotes **pnpm** estruturado da seguinte forma:

```bash
demo-rabbitmq/
├── apps/
│   ├── api-gateway/       # API Fastify executando na porta 3000 (Recebe notificações)
│   ├── monitor-api/       # API Fastify executando na porta 3001 (Consome estatísticas do RabbitMQ e gerencia DLQ)
│   ├── dashboard/         # Single Page Application React servida via Nginx na porta 5173
│   ├── email-worker/      # Worker que escuta a fila q.email e envia e-mails reais via SMTP
│   └── sms-worker/        # Worker que escuta a fila q.sms e simula envio de mensagens de texto
├── rabbitmq/
│   └── definitions.json   # Configuração estática de usuários, vhosts e permissões do RabbitMQ
├── compose.yaml           # Arquivo de orquestração do Docker para Produção
├── compose.override.yaml  # Configuração de desenvolvimento e watch mode do Docker Compose
├── package.json           # Configuração de workspaces e scripts globais do projeto
└── lefthook.yml           # Gerenciamento automatizado de Git Hooks
```

---

## 🛠️ Ferramental de Desenvolvimento e Git Hooks

Para garantir um padrão profissional de código no monorepo, o repositório conta com validação automática antes da persistência de commits e pushs de código.

<details>
<summary><b>Como funciona o <code>prepare</code> script na instalação?</b></summary>

No arquivo `package.json` raiz, você encontrará o script `"prepare": "lefthook install"`. 
- **O ciclo de vida prepare**: O script de ciclo de vida `prepare` é disparado automaticamente pelo gerenciador de pacotes logo após a execução de um `pnpm install` ou `npm install` local.
- **Por que é executado na instalação?** Ele garante que as configurações locais de hooks do Git sejam injetadas de forma automática na pasta `.git/hooks/` do desenvolvedor assim que ele clona e instala o projeto. Isso remove a dependência de processos de onboarding manuais, blindando o repositório contra commits que quebrem os padrões estabelecidos.
</details>

<details>
<summary><b>Lefthook (Gerenciador de Hooks Git)</b></summary>

O [Lefthook](https://github.com/evilmartians/lefthook) é um gerenciador de hooks git moderno, rápido e escrito em Go. Ele gerencia as seguintes ações configuradas em `lefthook.yml`:

- **Pre-commit**: 
  Durante o commit de arquivos, ele executa o comando `npx @biomejs/biome check --write` de forma paralela apenas nos arquivos modificados (*staged files*).
  - O **Biome** é uma ferramenta de cadeia rápida para web, responsável por formatar e analisar estaticamente (linter) códigos JS/TS de forma centenas de vezes mais rápida que ESLint e Prettier combinados.
  - Com a flag `--write` e a configuração `stage_fixed: true`, quaisquer correções de formatação ou erros simples de lint são ajustados e salvos de volta no commit de forma automática.

- **Commit-msg**:
  Inicia a ferramenta **Commitlint** para garantir a consistência das mensagens escritas de acordo com a especificação das **Conventional Commits**.
  - O commit sempre deve seguir o padrão: `tipo(escopo): descrição` (exemplo: `feat(api-gateway): add request logging`).
  - Commits com descrições informais como `ajustes` ou `corrigindo erro` serão rejeitados na hora, assegurando que o histórico de commits do Git permaneça limpo e rastreável.
</details>

---

## 🚀 Integração Contínua (GitHub Actions)

O repositório possui uma pipeline automatizada configurada no arquivo [.github/workflows/ci.yaml](file:///.github/workflows/ci.yaml).

O fluxo do **GitHub Actions** é disparado em todo **push** para qualquer branch do repositório, bem como em **pull requests** que tenham como alvo a branch `main`.

### Pipeline de Validação Executada:
1. **Checkout do Código**: Clona o repositório na máquina virtual do GitHub.
2. **Setup do PNPM**: Inicializa a versão 11 do gerenciador de pacotes com cache configurado.
3. **Setup do Node.js**: Inicializa a versão 24 do Node.js.
4. **Instalação das Dependências**: Executa `pnpm install --frozen-lockfile` para garantir que as dependências sejam idênticas às descritas no arquivo de lock.
5. **Linting e Formatação (Biome)**: Roda o `pnpm biome:check` para verificar se as regras de estilo de código estão sendo seguidas e se não há problemas de formatação.
6. **Execução de Testes Automatizados**: Dispara o script `pnpm test` que roda todos os testes com o **Vitest**.
7. **Linting de Mensagens de Commit (Commitlint)**: Verifica de forma retroativa se todas as mensagens de commit incluídas na branch/pull request respeitam o formato de Conventional Commits.
