# ⚡ GUIA RÁPIDO - TESTAR MELHORIAS

## 🎯 O QUE FOI IMPLEMENTADO?

✅ **Q Score Avançado** com 7 melhorias
✅ **Sistema de Email** funcional (SMTP direto)

---

## 🧪 TESTE 1: EMAIL (5 minutos)

### **Passo 1: Verificar Configuração**
```bash
cd backend
cat .env
```

**Deve ter:**
```env
SMTP_HOST=smtp.exemplo.com
SMTP_PORT=587
SMTP_USER=contacto@alygen.com
SMTP_PASS=sua_senha_aqui
SMTP_FROM_NAME=Alygen - Marketing Digital
```

### **Passo 2: Testar Envio**
```bash
npm run test:email
```

**Resultado Esperado:**
```
✅ EMAIL ENVIADO COM SUCESSO!
   Método: smtp
   Message ID: <...>

📬 Verifique sua caixa de entrada: contacto@alygen.com
```

**Se der erro:**
1. Verifique se a senha está correta
2. Verifique se a porta é 587
3. Verifique se não há firewall bloqueando

---

## 🎯 TESTE 2: Q SCORE AVANÇADO (10 minutos)

### **Passo 1: Iniciar Sistema**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### **Passo 2: Abrir Dashboard**
```
http://localhost:3000
```

### **Passo 3: Analisar um Lead**
1. Clicar em "Analisar" em qualquer lead
2. Aguardar análise (10-30 segundos)
3. Clicar em "Ver Relatório"

### **Passo 4: Verificar Melhorias**

**✅ Deve aparecer:**

1. **Setor e Região**
   ```
   Setor: E-commerce
   Região: Lisboa (Alta Competitividade)
   ```

2. **Penalizações** (se houver problemas)
   ```
   ⚠️ Penalizações (-20 pontos)
   🚨 CRÍTICO: Sem certificado SSL
   ```

3. **Bônus** (se houver excelência)
   ```
   🏆 Bônus (+5 pontos)
   ✨ EXCELÊNCIA: Performance 95+
   ```

4. **Urgências** (ordenadas por ROI)
   ```
   ⚡ Prioridades de Ação
   
   🚨 CRÍTICA: Segurança (SSL)
   Gap: 35pts | Custo: €50 | Tempo: 1 semana
   Impacto: 10/10 | Esforço: 2h
   ```

5. **Competitividade** (vs concorrentes)
   ```
   👥 Análise Competitiva
   
   Posição: #3 de 9
   Seu Score: 65 | Média: 58 | Líder: 82
   🥈 Top 33% - Acima da média (+7 pontos)
   ```

6. **ROI Potencial**
   ```
   💰 ROI Potencial
   
   Investimento: €350
   Retorno Anual: €1.750
   Payback: 2 meses | Multiplicador: 5x
   ```

---

## 🔍 TESTE 3: COMPARAR ANTES vs DEPOIS

### **Lead de Teste Ideal:**
- **Tipo:** Restaurante ou Loja
- **Localização:** Lisboa ou Porto (código postal 1000-4999)
- **Website:** Com alguns problemas (sem SSL, performance baixa)

### **O que observar:**

**ANTES (Q Score Básico):**
```
Score: 65/100
Grade: C
Recomendação: "Site funcional, mas há espaço para melhorias"
```

**DEPOIS (Q Score Avançado):**
```
Score: 58/100 (com penalizações)
Grade: C
Setor: Restaurante
Região: Lisboa (Alta Competitividade)

Penalizações:
🚨 CRÍTICO: Sem SSL (-20)
⚠️ ALTO: Zero tracking (-10)

Urgências:
1. 🚨 SSL (€50, 1 semana) - Urgency: 140
2. ⚠️ Tracking (€100, 1 semana) - Urgency: 112

Competitividade:
#6 de 12 - Abaixo da média (-7 pontos)

ROI: €350 → €1.750/ano (5x)

Recomendação:
"🚨 URGENTE! 2 problemas críticos.
 Investimento de €350 retorna €1.750/ano."
```

---

## 📊 TESTE 4: DIFERENTES SETORES

### **Testar com 3 tipos diferentes:**

1. **E-commerce** (Loja online)
   - Deve priorizar: Performance + Conversion
   - Peso performance: 30%

2. **Restaurante**
   - Deve priorizar: Conversion + Performance
   - Peso conversion: 30%

3. **B2B** (Consultoria, Agência)
   - Deve priorizar: SEO + Security
   - Peso SEO: 30%

**Como verificar:**
- Abrir "Ver Relatório"
- Procurar "Setor: [nome]"
- Ver se urgências batem com prioridades do setor

---

## 🌍 TESTE 5: DIFERENTES REGIÕES

### **Testar com 3 regiões:**

1. **Lisboa** (1000-1990)
   - Benchmark alto (performance: 55, SEO: 65)
   - Mensagem: "Lisboa (Alta Competitividade)"

2. **Porto** (4000-4990)
   - Benchmark alto (performance: 52, SEO: 62)
   - Mensagem: "Porto (Alta Competitividade)"

3. **Interior** (outros códigos)
   - Benchmark baixo (performance: 42, SEO: 52)
   - Mensagem: "Interior (Baixa Competitividade)"

**Como verificar:**
- Ver campo "Região" no relatório
- Comparar "Benchmark Regional"
- Ver se mensagem contextualiza corretamente

---

## 📧 TESTE 6: ENVIO DE EMAIL COMPLETO

### **Passo 1: Analisar Lead**
1. Analisar um lead
2. Abrir "Ver Relatório"

### **Passo 2: Enviar Email**
1. Rolar até "Email Personalizado"
2. Selecionar email (ou digitar customizado)
3. Clicar "Enviar"

### **Passo 3: Verificar Recebimento**
1. Abrir caixa de entrada: contacto@alygen.com
2. Verificar se email chegou
3. Verificar se formatação está correta

**Email deve conter:**
- ✅ Q Score com grade
- ✅ Análise detalhada (Performance, SEO, Security, etc.)
- ✅ Penalizações (se houver)
- ✅ Análise competitiva (se houver concorrentes)
- ✅ Recomendações estratégicas
- ✅ Próximos passos

---

## ✅ CHECKLIST DE TESTES

### **Email:**
- [ ] Configuração SMTP verificada
- [ ] Script de teste executado com sucesso
- [ ] Email recebido na caixa de entrada
- [ ] Formatação correta

### **Q Score Avançado:**
- [ ] Setor detectado corretamente
- [ ] Região detectada corretamente
- [ ] Penalizações aparecem (se houver)
- [ ] Bônus aparecem (se houver)
- [ ] Urgências ordenadas por ROI
- [ ] Competitividade calculada
- [ ] ROI potencial exibido

### **Interface:**
- [ ] Cards de penalizações visíveis
- [ ] Cards de bônus visíveis
- [ ] Cards de urgências visíveis
- [ ] Cards de competitividade visíveis
- [ ] Cards de ROI visíveis
- [ ] Cores e ícones corretos

---

## 🐛 TROUBLESHOOTING

### **Problema: Email não envia**
```bash
# Verificar logs
cd backend
npm run dev

# Procurar por:
❌ Erro ao enviar via SMTP: [mensagem]
```

**Soluções:**
1. Verificar senha no .env
2. Verificar porta (deve ser 587)
3. Verificar se OVH permite SMTP
4. Testar com outro email

### **Problema: Q Score não aparece**
```bash
# Verificar console do navegador (F12)
# Procurar por erros
```

**Soluções:**
1. Limpar cache do navegador
2. Recarregar página (Ctrl+Shift+R)
3. Verificar se análise foi concluída
4. Verificar logs do backend

### **Problema: Competitividade não aparece**
**Causa:** Precisa ter outros leads analisados do mesmo tipo e região

**Solução:**
1. Analisar 2-3 leads do mesmo tipo
2. Verificar se têm código postal
3. Re-analisar o lead original

---

## 🎉 SUCESSO!

Se todos os testes passaram:

✅ **Sistema de Email funcionando**
✅ **Q Score Avançado implementado**
✅ **Interface atualizada**
✅ **Pronto para usar em produção!**

---

## 📞 SUPORTE

**Problemas?**
1. Verificar logs do backend
2. Verificar console do navegador (F12)
3. Ler MELHORIAS_QSCORE_AVANCADO.md
4. Verificar .env está correto

**Dúvidas sobre funcionalidades?**
- Ler MELHORIAS_QSCORE_AVANCADO.md (documentação completa)
- Ver exemplos de uso no documento
