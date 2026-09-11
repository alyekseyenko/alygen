# 📧 Por que Emails Vão para SPAM? (E Como Evitar)

## 🚨 Principais Motivos

### 1. **Falta de Autenticação (SPF, DKIM, DMARC)**
❌ **Problema:** Seu domínio não está autenticado  
✅ **Solução:** Configurar registros DNS

#### Como Configurar (OVH):

**SPF Record:**
```
Tipo: TXT
Nome: @
Valor: v=spf1 include:mx.ovh.com ~all
```

**DKIM Record:**
1. Acesse OVH → Email → Seu domínio → DKIM
2. Ative DKIM
3. Copie o registro TXT gerado
4. Adicione ao DNS

**DMARC Record:**
```
Tipo: TXT
Nome: _dmarc
Valor: v=DMARC1; p=quarantine; rua=mailto:dmarc@alygen.com
```

### 2. **Email Frio (Cold Email)**
❌ **Problema:** Enviar para quem nunca interagiu com você  
✅ **Solução:** Warm-up do domínio

#### Warm-up Process:
- **Dia 1-3:** 5 emails/dia
- **Dia 4-7:** 10 emails/dia
- **Dia 8-14:** 20 emails/dia
- **Dia 15+:** 50 emails/dia

### 3. **Conteúdo Spam**
❌ **Palavras que acionam filtros:**
- GRÁTIS, FREE, URGENTE
- $$$ ou €€€
- CLIQUE AQUI
- 100% GARANTIDO
- Excesso de MAIÚSCULAS
- Muitos emojis (>5)
- Links encurtados (bit.ly)

✅ **Boas Práticas:**
- Texto natural e personalizado
- Máximo 2-3 emojis
- Links completos
- Sem anexos pesados

### 4. **Ratio Texto/HTML Ruim**
❌ **Problema:** Muito HTML, pouco texto  
✅ **Solução:** 60% texto, 40% HTML

### 5. **Sem Link de Unsubscribe**
❌ **Problema:** Obrigatório por lei (RGPD)  
✅ **Solução:** Adicionar no rodapé

```
Para parar de receber, responda com "REMOVER"
ou clique aqui: [link]
```

### 6. **IP/Domínio Novo**
❌ **Problema:** Sem reputação  
✅ **Solução:** Usar serviço com IP aquecido (SendGrid, Mailgun)

### 7. **Taxa de Bounce Alta**
❌ **Problema:** Emails inválidos (>5%)  
✅ **Solução:** Validar emails antes de enviar

### 8. **Taxa de Abertura Baixa**
❌ **Problema:** <15% de abertura  
✅ **Solução:** Melhorar assunto

**Assuntos que funcionam:**
- ✅ "Análise do site [Nome Empresa]"
- ✅ "Oportunidade para [Nome Empresa]"
- ✅ "[Nome], identifiquei 3 melhorias"
- ❌ "URGENTE: Seu site tem problemas!"
- ❌ "Oferta imperdível!!!"

---

## 🛠️ Soluções Práticas

### Opção 1: Usar SendGrid (Recomendado)

**Vantagens:**
- ✅ IP aquecido
- ✅ SPF/DKIM automático
- ✅ 100 emails/dia grátis
- ✅ Reputação estabelecida

**Setup:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.sua-api-key
```

### Opção 2: Usar Mailgun

**Vantagens:**
- ✅ 5.000 emails/mês grátis
- ✅ Validação de email incluída
- ✅ Analytics detalhado

### Opção 3: Warm-up Manual (OVH)

**Semana 1:**
1. Envie 5 emails para amigos/colegas
2. Peça para responderem
3. Peça para marcarem como "Não spam"
4. Adicione ao contatos

**Semana 2:**
1. Aumente para 10 emails/dia
2. Continue pedindo respostas
3. Monitore taxa de bounce

**Semana 3+:**
1. Aumente gradualmente
2. Mantenha taxa de resposta >10%
3. Monitore spam score

---

## 📊 Testar Spam Score

### Mail-Tester.com
1. Acesse: https://www.mail-tester.com/
2. Copie o email de teste
3. Envie seu email para lá
4. Veja o score (objetivo: 8+/10)

### GlockApps
1. Acesse: https://glockapps.com/
2. Teste inbox placement
3. Veja em quais provedores vai para spam

---

## ✅ Checklist Anti-Spam

### DNS (Obrigatório)
- [ ] SPF configurado
- [ ] DKIM ativado
- [ ] DMARC configurado
- [ ] Reverse DNS (PTR)

### Conteúdo
- [ ] Assunto personalizado
- [ ] Sem palavras spam
- [ ] Máximo 3 emojis
- [ ] Link de unsubscribe
- [ ] Ratio texto/HTML correto

### Técnico
- [ ] Email validado
- [ ] Warm-up feito
- [ ] Taxa de envio controlada
- [ ] Monitoramento de bounces

### Legal (RGPD)
- [ ] Consentimento (ou interesse legítimo)
- [ ] Identificação clara do remetente
- [ ] Opção de opt-out
- [ ] Política de privacidade

---

## 🎯 Melhorias no Sistema

### 1. Adicionar Validação de Email

```javascript
// Usar API de validação
const validateEmail = async (email) => {
  const response = await axios.get(
    `https://api.hunter.io/v2/email-verifier?email=${email}&api_key=YOUR_KEY`
  );
  return response.data.data.status === 'valid';
};
```

### 2. Adicionar Unsubscribe Link

```javascript
const unsubscribeLink = `https://seu-site.com/unsubscribe?email=${encodeURIComponent(recipientEmail)}`;

// Adicionar no rodapé do email
Para parar de receber, clique aqui: ${unsubscribeLink}
```

### 3. Personalizar Mais

```javascript
// Usar nome da empresa no assunto
subject: `Análise técnica - ${lead.name}`

// Mencionar algo específico do site
Reparei que usam ${analysis.technologies.cms.name}...
```

### 4. Adicionar Tracking (Opcional)

```javascript
// Pixel de abertura
<img src="https://seu-site.com/track/open/${emailId}" width="1" height="1" />

// Link com tracking
https://seu-site.com/track/click/${emailId}?url=${encodeURIComponent(originalUrl)}
```

---

## 📈 Métricas Ideais

| Métrica | Objetivo | Crítico |
|---------|----------|---------|
| Bounce Rate | <2% | >5% |
| Spam Rate | <0.1% | >0.5% |
| Open Rate | >20% | <10% |
| Click Rate | >2% | <0.5% |
| Unsubscribe | <0.5% | >2% |

---

## 🚀 Plano de Ação Imediato

### Hoje:
1. ✅ Configurar SPF no DNS OVH
2. ✅ Ativar DKIM no painel OVH
3. ✅ Adicionar DMARC
4. ✅ Testar em mail-tester.com

### Esta Semana:
1. ✅ Fazer warm-up (5 emails/dia)
2. ✅ Melhorar assunto do email
3. ✅ Adicionar link de unsubscribe
4. ✅ Remover palavras spam

### Próximo Mês:
1. ✅ Migrar para SendGrid
2. ✅ Implementar validação de email
3. ✅ Adicionar tracking
4. ✅ A/B test de assuntos

---

## 🔗 Links Úteis

- **SPF Checker:** https://mxtoolbox.com/spf.aspx
- **DKIM Checker:** https://mxtoolbox.com/dkim.aspx
- **DMARC Checker:** https://mxtoolbox.com/dmarc.aspx
- **Mail Tester:** https://www.mail-tester.com/
- **SendGrid:** https://sendgrid.com/
- **Mailgun:** https://www.mailgun.com/

---

## ⚠️ Avisos Legais

### RGPD (Europa)
- Precisa de consentimento OU interesse legítimo
- Deve permitir opt-out fácil
- Deve ter política de privacidade
- Multa: até €20 milhões

### CAN-SPAM (EUA)
- Identificação clara do remetente
- Assunto não enganoso
- Link de unsubscribe funcional
- Multa: até $43,792 por email

---

**✅ Seguindo este guia, sua taxa de inbox deve subir de ~30% para ~80%+**
