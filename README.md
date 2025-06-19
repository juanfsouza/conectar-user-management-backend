### Conéctar User Management

Sistema full-stack para o desafio técnico da Conéctar, com backend em NestJS e frontend em Next.js. Oferece gerenciamento de usuários com autenticação segura (local e Google OAuth), permissões, cache, notificações, e interface responsiva.
Tecnologias
Backend

- NestJS: Framework Node.js escalável.
- TypeORM: ORM para PostgreSQL.
- Redis: Cache para listagens.
- JWT & bcrypt: Autenticação local.
- passport-google-oauth20: Login com Google.
- winston: Logs estruturados.
- helmet: Headers de segurança HTTP.
- @nestjs/throttle: Rate limiting.
- sanitize-html: Proteção contra XSS.
- @nestjs/event-emitter: Notificações assíncronas.
- Jest: Testes unitários e de integração.
- Swagger: Documentação da API.

Frontend

- Next.js: Framework React para SSR e SSG.
- TypeScript: Tipagem estática.
- TailwindCSS: Estilização utilitária.
- Axios: Chamadas HTTP.

### Pré-requisitos

Node.js (v18+)
PostgreSQL (v15+)
Redis (v7+)
Conta Google Cloud com credenciais OAuth 2.0
Windows Subsystem for Linux (WSL) com Ubuntu (para Redis no Windows)

### Configuração
WSL e Redis (Windows)

Verifique o WSL:wsl --list --all


Inicie o Ubuntu:wsl -d Ubuntu


Instale o Redis:sudo apt install redis-server -y
sudo service redis-server start


Teste o Redis:redis-cli ping



### Backend

Clone o repositório:git clone <repository-url>
cd backend


Instale as dependências:npm install


Crie um arquivo .env baseado em .env.example:cp .env.example .env

Adicione:DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=user_management
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1h
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback


Configure o banco de dados:npm run typeorm:migration:run


Inicie o servidor:npm run start:dev


### Frontend

Navegue para a pasta do frontend:cd frontend


Instale as dependências:npm install


Inicie o servidor:npm run dev

Acesse http://localhost:3001.

Admin Inicial

Email: admin@example.com
Senha: admin123
Role: admin

Use em /login para acessar o dashboard.
Endpoints (Backend)

POST /auth/register: Cria usuário (role: user).
POST /auth/login: Autentica e retorna JWT.
GET /auth/google: Inicia login com Google.
GET /auth/google/callback: Callback do Google OAuth.
POST /users: Cria usuário com qualquer role (admin).
GET /users: Lista usuários (admin).
GET /users/me: Obtém usuário logado.
GET /users/:id: Obtém usuário por ID.
PATCH /users/:id: Atualiza usuário.
DELETE /users/:id: Exclui usuário (admin).
GET /users/inactive: Lista usuários inativos (admin).

Páginas (Frontend)

/login: Formulário de login.
/register: Formulário de cadastro.
/dashboard: Lista de usuários com filtros (admin).
/profile: Exibe e edita perfil do usuário logado.

Testes
Backend
cd backend
npm run test
npm run test:watch

Testes unitários cobrem AuthService (registro, login, Google OAuth).
Frontend
(Adicione testes com Jest se necessário)

### Segurança

SQL Injection: Protegido por TypeORM com consultas parametrizadas.
XSS: Mitigado com sanitize-html.
CSRF: Pendente (recomenda-se adicionar tokens).
Rate Limiting: Configurável com @nestjs/throttle.
Headers: Adicionados via helmet.

Decisões de Design

Backend:
- Autenticação híbrida (JWT + Google OAuth).
- Cache com Redis (TTL: 5 minutos).
- Notificações assíncronas com mock.
- Logs estruturados (winston).
- Segurança: bcrypt, helmet, sanitize-html, TypeORM.


Frontend:
- Next.js para SEO e desempenho.
- TailwindCSS para estilização rápida.
- com JWT no localStorage.
- Rotas protegidas com verificação de role.