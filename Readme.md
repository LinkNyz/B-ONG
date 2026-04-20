# 📘 Project Guidelines – Web Platform

Este documento define as **regras de desenvolvimento**, organização e fluxo de trabalho do projeto.

---

# 🧠 Estrutura do Projeto

O projeto é dividido em três áreas principais:

* **HTML (estrutura)**
* **CSS (estilo)**
* **Git (controle de versão)**

---

# 🌐 HTML – Regras de Desenvolvimento

## 📌 Boas práticas obrigatórias

* ✔ Utilizar **sintaxe correta e semântica**
* ✔ Indentar corretamente (usar TAB ou padrão definido)
* ✔ Comentar funcionalidades importantes no código
* ✔ Manter o código limpo e organizado

---

## 📄 Estrutura das páginas

Cada página deve conter **apenas o conteúdo do `<main>`**.

Elementos como:

* Header
* Footer
* Navbar

devem ser padronizados futuramente (componentização).

---

## 🖼️ Imagens

* Todas as imagens devem ser:

  * Baixadas localmente
  * Armazenadas na pasta:

```bash
Img/
```

* ❌ Não usar links externos diretos

---

## 📚 Páginas do sistema

### 🔹 Home

* Notícias
* Recomendações
* ONGs parceiras

---

### 🔹 Buscador

* Sistema de busca
* Filtros

---

### 🔹 ONGs

* Lista de ONGs
* Link para site oficial

---

### 🔹 Login

* Criar conta
* Entrar na conta

---

### 🔹 Perfil

* Foto
* Nome
* Email
* Descrição

---

### 🔹 Login ONG

* Formulário específico para ONGs

---

### 🔹 Sobre Nós

* Informações sobre o projeto

---

### 🔹 Dúvidas Gerais

* FAQ / suporte

---

# 🎨 CSS – Regras de Estilo

## 🎯 Organização

Utilizar `:root` para variáveis globais:

```css
:root {
  --cor-primaria: ;
  --cor-secundaria: ;
  --fonte-principal: ;
  --espacamento: ;
}
```

---

## 📌 Padronização

Definir variáveis para:

* 🎨 Cores
* 🔤 Tipografia
* 📏 Tamanhos
* 🔲 Formas (bordas, radius)
* 📐 Espaçamento

---

## ✔ Boas práticas

* Código organizado e legível
* Evitar repetição de estilos
* Usar nomes claros nas classes

---

# 🔄 Fluxo de Navegação (UX)

## Caminho principal:

```text
Login → Home → Buscador → ONGs → Página da ONG
```

---

## Caminho alternativo:

```text
Buscador → Filtro → ONGs → Página da ONG
```

---

## 🔍 Filtro

O filtro deve utilizar **cards**, contendo:

* Descrição
* Subtítulo
* Informações relevantes

---

# 🌿 Git – Regras de Versionamento

## 🌳 Estrutura de Branches

* `master` → versão estável (produção)
* `develop` → ambiente de testes
* `feature/*` → desenvolvimento de funcionalidades

---

## 🚫 Regras importantes

* ❌ Não fazer commit direto na `master`
* ❌ Não trabalhar diretamente na `develop`
* ❌ Não usar `push -f` sem necessidade

---

## ✅ Fluxo obrigatório

### 1. Atualizar develop

```bash
git checkout develop
git pull origin develop
```

---

### 2. Criar feature

```bash
git checkout -b feature/nome-da-feature
```

---

### 3. Trabalhar

```bash
git add .
git commit -m "feat: descrição da funcionalidade"
```

---

### 4. Enviar

```bash
git push origin feature/nome-da-feature
```

---

### 5. Pull Request

* Base: `develop`
* Revisar antes de aprovar

---

### 6. Merge

* Feature → Develop

---

### 7. Publicação

```bash
git checkout master
git merge develop
git push origin master
```

---

# 🧾 Padrão de Commits

Formato:

```bash
tipo: descrição
```

## Tipos:

* `feat:` nova funcionalidade
* `fix:` correção de erro
* `docs:` documentação
* `style:` CSS / visual
* `refactor:` melhoria interna
* `chore:` manutenção

---

# 🎯 Objetivo do Projeto

Criar uma plataforma organizada e acessível para:

* Busca de ONGs
* Divulgação de causas
* Conexão entre usuários e instituições

---

# ⚠️ Regras gerais

* Código limpo sempre
* Organização é prioridade
* Nomeação clara de arquivos e classes
* Pensar na experiência do usuário (UX)

---

# 🚀 Filosofia do Projeto

Este projeto segue três princípios:

* Simplicidade
* Organização
* Escalabilidade

---

# 📌 Resumo

* HTML limpo e semântico
* CSS padronizado com variáveis
* Git organizado com branches
* Fluxo claro de desenvolvimento

---

Este documento deve ser seguido por todos os colaboradores do projeto.
