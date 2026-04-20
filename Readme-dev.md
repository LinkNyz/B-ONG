# 🌿 Develop Branch

> ⚠️ Ambiente de desenvolvimento — pode conter erros e mudanças frequentes.

---

## 🎯 Objetivo

A branch `develop` é usada para:

* Testar novas funcionalidades
* Integrar mudanças das `feature/*`
* Preparar o projeto antes de ir para `master`

---

## 🔄 Fluxo básico

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nome-da-feature
```

Depois:

```bash
git add .
git commit -m "feat: descrição"
git push origin feature/nome-da-feature
```

➡️ Abrir Pull Request → `develop`

---

## ⚠️ Regras

* ❌ Não commitar direto na `master`
* ❌ Não trabalhar direto na `develop`
* ✔ Sempre usar `feature/*`
* ✔ Sempre usar Pull Request

---

## 🧪 Status

🚧 Em desenvolvimento
Pode conter bugs ou mudanças constantes.

---

## 📌 Resumo

* `develop` = testes
* `feature/*` = desenvolvimento
* `master` = versão final

---
