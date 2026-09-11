import React from 'react'
import { Mail, Copy, Check, Eye, MessageCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Separator } from '../ui/separator'

export default function DrawerEmailPitch({
  privacyMode,
  editingHTML,
  setEditingHTML,
  emailTemplate,
  setEditedHTML,
  editedHTML,
  copyToClipboard,
  copied,
  availableEmails,
  availablePhones,
  selectedEmail,
  setSelectedEmail,
  customEmail,
  setCustomEmail,
  showCustomInput,
  setShowCustomInput,
  handleSendEmail,
  emailSent,
  editingWhatsApp,
  setEditingWhatsApp,
  whatsappMessage,
  setWhatsappMessage,
  handleSendWhatsApp,
  whatsappSent,
  lead
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">Personalized Email</h3>
      </div>
      
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm text-muted-foreground">
            {privacyMode ? <span className="blur-md select-none">Preview:</span> : 'Preview:'}
          </Label>
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                setEditingHTML(!editingHTML)
                if (!editingHTML) {
                  setEditedHTML(emailTemplate)
                }
              }} 
              variant="outline" 
              size="sm"
              className="text-xs"
            >
              {editingHTML ? 'View Preview' : 'Edit HTML'}
            </Button>
            <Button 
              onClick={copyToClipboard} 
              variant="ghost" 
              size="sm"
              className="text-xs"
            >
              {copied ? (
                <><Check className="w-3 h-3 mr-1" /> Copied!</>
              ) : (
                <><Copy className="w-3 h-3 mr-1" /> Copy HTML</>
              )}
            </Button>
          </div>
        </div>
        {editingHTML ? (
          <textarea
            value={editedHTML}
            onChange={(e) => setEditedHTML(e.target.value)}
            className="w-full h-96 p-4 bg-muted/50 border border-border rounded-lg font-mono text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Paste or edit HTML here..."
          />
        ) : (
          <div className="bg-white rounded-lg border border-border overflow-hidden shadow-lg">
            <iframe 
              srcDoc={emailTemplate}
              className="w-full h-96 border-0"
              title="Email Preview"
            />
          </div>
        )}
      </div>
      
      <Separator className="my-6" />
      
      <div className="space-y-4">
        <Label className="text-sm text-white">Send to:</Label>
        
        {availableEmails.length === 0 && (
          <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
            <p className="text-sm text-white font-medium mb-1">No email found</p>
            <p className="text-xs text-muted-foreground">Enter the client's email address manually</p>
          </div>
        )}
        
        {availablePhones.length > 0 && (
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <p className="text-sm text-white font-medium mb-2 flex items-center gap-2">
              Discovered Phone(s)
            </p>
            {availablePhones.map((phone, i) => (
              <a 
                key={i}
                href={`tel:${phone.replace(/\s/g, '')}`}
                className="block p-2 bg-white/5 hover:bg-white/10 rounded transition-colors"
              >
                {privacyMode ? <span className="blur-md select-none">{phone}</span> : phone}
              </a>
            ))}
          </div>
        )}
        
        <div className="space-y-2">
          {availableEmails.map((email, i) => (
            <label key={i} className="flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-lg border border-border cursor-pointer hover:bg-muted transition-colors group">
              <div className="flex items-center gap-3 flex-1">
                <input 
                  type="radio" 
                  name="email" 
                  value={email} 
                  checked={selectedEmail === email && !customEmail}
                  onChange={(e) => { setSelectedEmail(e.target.value); setCustomEmail(''); setShowCustomInput(false); }}
                  className="accent-accent"
                />
                <span className="font-medium text-white">{privacyMode ? <span className="blur-md select-none">{email}</span> : email}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  navigator.clipboard.writeText(email);
                  const btn = e.currentTarget;
                  const originalText = btn.innerHTML;
                  btn.innerHTML = '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>';
                  setTimeout(() => btn.innerHTML = originalText, 1000);
                }}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </label>
          ))}
          <label className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-accent/20 cursor-pointer hover:bg-accent/5 transition-colors">
            <input 
              type="radio" 
              name="email" 
              checked={showCustomInput || availableEmails.length === 0}
              onChange={() => { setShowCustomInput(true); setSelectedEmail(''); }}
              className="accent-accent"
            />
            <span className="text-white font-medium">Custom Email</span>
          </label>
          {(showCustomInput || availableEmails.length === 0) && (
            <Input 
              type="email" 
              value={customEmail} 
              onChange={(e) => setCustomEmail(e.target.value)}
              placeholder="contact@company.com" 
              className="mt-2"
              autoFocus 
            />
          )}
        </div>
      </div>
      
      <Button 
        onClick={handleSendEmail} 
        disabled={emailSent || (!customEmail && !selectedEmail)}
        className="w-full mt-6"
        size="lg"
      >
        <Mail className="w-5 h-5 mr-2" />
        {emailSent ? 'Email Sent!' : 'Send Email'}
      </Button>
      
      {emailSent && (
        <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 mt-4">
          <p className="text-sm text-accent font-medium text-center">
            Email successfully sent to {customEmail || selectedEmail}
          </p>
        </div>
      )}

      {/* WHATSAPP */}
      {availablePhones.length > 0 && (
        <div className="mt-6 bg-green-500/5 border border-green-500/20 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-400" />
              <h4 className="text-sm font-bold text-white">WhatsApp</h4>
              <span className="text-xs text-green-400/70">{privacyMode ? <span className="blur-md select-none">{availablePhones[0]}</span> : availablePhones[0]}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-green-400 hover:text-green-300"
              onClick={() => setEditingWhatsApp(!editingWhatsApp)}
            >
              {editingWhatsApp ? 'Close' : 'Edit message'}
            </Button>
          </div>

          {editingWhatsApp ? (
            <textarea
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              className="w-full h-48 p-3 bg-black/30 border border-green-500/20 rounded-lg text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-green-500/40 font-mono"
            />
          ) : (
            <pre className="text-xs text-white/70 whitespace-pre-wrap bg-black/20 rounded-lg p-3 font-sans">
              {privacyMode ? <span className="blur-md select-none">{whatsappMessage}</span> : whatsappMessage}
            </pre>
          )}

          <Button
            onClick={handleSendWhatsApp}
            disabled={whatsappSent}
            className="w-full mt-3 bg-green-600 hover:bg-green-500 text-white"
            size="lg"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            {whatsappSent ? 'WhatsApp Sent!' : 'Send WhatsApp'}
          </Button>
        </div>
      )}

      {/* TRACKING INFO */}
      {lead.sequenceStatus && (
        <div className="mt-8 bg-blue-500/5 border border-blue-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Mail className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Email Tracking</h4>
              <p className="text-[10px] text-blue-400/60 uppercase font-black">Status: {lead.sequenceStatus.status}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
              <p className="text-[10px] font-bold text-white/20 uppercase mb-1">Opens</p>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-green-400" />
                <span className="text-xl font-black text-white">{lead.sequenceStatus.open_count || 0}</span>
              </div>
            </div>
            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
              <p className="text-[10px] font-bold text-white/20 uppercase mb-1">Sequence</p>
              <span className="text-sm font-black text-blue-400">
                {lead.sequenceStatus.status === 'sent' ? 'Day 1' : 
                 lead.sequenceStatus.status === 'followup1' ? 'Day 3' : 
                 lead.sequenceStatus.status === 'followup2' ? 'Day 7' : 'Completed'}
              </span>
            </div>
            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
              <p className="text-[10px] font-bold text-white/20 uppercase mb-1">Last Opened</p>
              <span className="text-[10px] font-bold text-white/60">
                {lead.sequenceStatus.last_opened_at ? new Date(lead.sequenceStatus.last_opened_at).toLocaleDateString() : 'Never'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
