# ✅ Último Passo: Compartilhar o Google Sheet

## 📊 Compartilhar com a Service Account

1. **Abra o Google Sheet:**
   ```
   https://docs.google.com/spreadsheets/d/1BSFyHaMlWJNWa0aHqAbY5r_3MbzcmkWcK6h4_WrZcQY/edit
   ```

2. **Clique em "Compartilhar"** (botão verde no topo direito)

3. **Cole este email:**
   ```
   crm-sheets-reader@alyekseyenko.iam.gserviceaccount.com
   ```

4. **Permissão:** Selecione **Viewer** (Visualizador)

5. **DESMARQUE** "Notificar pessoas"

6. **Clique em "Compartilhar"**

---

## 🧪 Testar Conexão

```bash
cd backend
npm run test:sheets
```

**Resultado esperado:**
```
✅ Conexão bem-sucedida!
📊 Total de leads encontrados: X

📋 Primeiros 3 leads:
1. Nome do Lead
   Website: https://...
```

---

## 🚀 Iniciar Aplicação

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

### Terminal 2 - Frontend
```bash
cd frontend
npm install
npm run dev
```

### Acessar
```
http://localhost:3000
```

---

## ⚠️ Se der erro "The caller does not have permission"

- Aguarde 1-2 minutos após compartilhar
- Verifique se compartilhou com o email CORRETO
- Confirme que a permissão é "Viewer"

---

**Tudo pronto! 🎯**
