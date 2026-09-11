import { useState, useEffect } from 'react'
import { X, Settings2, Trash2, Copy, Plus, RefreshCw } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { ScrollArea } from '../ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { api } from '../../utils/api'

export default function SettingsPanel({ node, onClose, onUpdate, onDelete, onDuplicate }) {
  const [templates, setTemplates] = useState([])

  useEffect(() => {
    if (node?.data?.actionType === 'send_email') {
      api.get('/templates').then(res => setTemplates(res.data?.data || []))
    }
  }, [node])

  if (!node) return null

  const handleChange = (e) => {
    onUpdate({
      ...node,
      data: {
        ...node.data,
        [e.target.name]: e.target.value
      }
    })
  }

  const handleConfigChange = (e) => {
    onUpdate({
      ...node,
      data: {
        ...node.data,
        config: {
          ...node.data.config,
          [e.target.name]: e.target.value
        }
      }
    })
  }

  const handleSelectChange = (name, value) => {
    onUpdate({
      ...node,
      data: {
        ...node.data,
        config: {
          ...node.data.config,
          [name]: value
        }
      }
    })
  }

  return (
    <div className="w-80 bg-black/90 backdrop-blur-xl border-l border-white/10 flex flex-col h-full z-10 absolute right-0 top-0 shadow-[-20px_0_40px_rgba(0,0,0,0.5)]">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-accent" />
          Settings
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white/60 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/60 text-xs uppercase tracking-wider">Node Name</Label>
            <Input 
              name="label" 
              value={node.data?.label || ''} 
              onChange={handleChange}
              className="glass-input"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/60 text-xs uppercase tracking-wider">Description</Label>
            <Input 
              name="description" 
              value={node.data?.description || ''} 
              onChange={handleChange}
              className="glass-input"
            />
          </div>

          <div className="pt-4 border-t border-white/10 space-y-4">
            
            {/* Condition Config */}
            {node.type === 'condition' && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-white/60 text-xs uppercase tracking-wider">Logic Property</Label>
                    <span className="text-[10px] text-orange-400 font-mono">qScore.score, hasPixel, seo.score</span>
                  </div>
                  <Select 
                    value={
                      ['qScore.score', 'hasPixel', 'performanceMobile', 'seo.score', 'security.score', 'accessibility.score', 'category', 'isSocialMediaOnly', 'alreadyEmailed', 'alreadyWhatsApped', 'hasEmail', 'hasPhone', 'isWhatsApp'].includes(node.data?.config?.property) 
                      ? node.data?.config?.property 
                      : 'custom'
                    } 
                    onValueChange={(val) => handleSelectChange('property', val === 'custom' ? '' : val)}
                  >
                    <SelectTrigger className="glass-input h-8 text-sm">
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-white/10 text-white">
                      <SelectItem value="qScore.score">Q Score (0-100)</SelectItem>
                      <SelectItem value="benchmark_status">Market Benchmark (Gap/Leader)</SelectItem>
                      <SelectItem value="urgency_level">Urgency Level (Python AI)</SelectItem>
                      <SelectItem value="tone">Tone of Voice (Python AI)</SelectItem>
                      <SelectItem value="hasPixel">Has Tracking Pixel</SelectItem>
                      <SelectItem value="performanceMobile">Performance Score</SelectItem>
                      <SelectItem value="seo.score">SEO Score</SelectItem>
                      <SelectItem value="security.score">Security Score</SelectItem>
                      <SelectItem value="accessibility.score">Accessibility Score</SelectItem>
                      <SelectItem value="category">Business Category</SelectItem>
                      <SelectItem value="isSocialMediaOnly">No Website / Social Only</SelectItem>
                      <SelectItem value="alreadyEmailed">Email Already Sent?</SelectItem>
                      <SelectItem value="alreadyWhatsApped">WhatsApp Already Sent?</SelectItem>
                      <SelectItem value="hasEmail">Has Email Address?</SelectItem>
                      <SelectItem value="hasPhone">Has Phone Number?</SelectItem>
                      <SelectItem value="isWhatsApp">Number is on WhatsApp?</SelectItem>
                      <SelectItem value="openedEmail">Email Aberto? (Visto)</SelectItem>
                      <SelectItem value="custom">-- Custom Property --</SelectItem>
                    </SelectContent>
                  </Select>

                  {(!['qScore.score', 'hasPixel', 'performanceMobile', 'seo.score', 'security.score', 'accessibility.score', 'category', 'isSocialMediaOnly', 'alreadyEmailed', 'alreadyWhatsApped', 'hasEmail', 'hasPhone', 'isWhatsApp', 'openedEmail'].includes(node.data?.config?.property)) && (
                    <Input 
                      name="property" 
                      placeholder="Enter custom path (ex: qScore.label)"
                      value={node.data?.config?.property || ''} 
                      onChange={handleConfigChange}
                      className="glass-input h-8 text-sm mt-2"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs uppercase tracking-wider">Operator</Label>
                  <Select value={node.data?.config?.operator || 'eq'} onValueChange={(val) => handleSelectChange('operator', val)}>
                    <SelectTrigger className="glass-input h-8 text-sm">
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-white/10 text-white">
                      <SelectItem value="eq">Equals (=)</SelectItem>
                      <SelectItem value="neq">Not Equals (!=)</SelectItem>
                      <SelectItem value="lt">Less Than (&lt;)</SelectItem>
                      <SelectItem value="gt">Greater Than (&gt;)</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="exists">Exists / Is Valid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs uppercase tracking-wider">Target Value</Label>
                  <Input 
                    name="value" 
                    placeholder="e.g 50, true, 'foo'"
                    value={node.data?.config?.value || ''} 
                    onChange={handleConfigChange}
                    className="glass-input h-8 text-sm"
                  />
                </div>
              </>
            )}

            {/* Delay Config */}
            {node.data?.backendType === 'wait' && (
              <div className="space-y-2">
                <Label className="text-white/60 text-xs uppercase tracking-wider">Delay in Seconds</Label>
                <Input 
                  name="delay" 
                  type="number"
                  placeholder="e.g 86400 (24h)"
                  value={node.data?.config?.delay || ''} 
                  onChange={handleConfigChange}
                  className="glass-input h-8 text-sm"
                />
              </div>
            )}

            {/* Webhook Config */}
            {node.data?.actionType === 'webhook' && (
              <>
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs uppercase tracking-wider">Method</Label>
                  <Select value={node.data?.config?.method || 'POST'} onValueChange={(val) => handleSelectChange('method', val)}>
                    <SelectTrigger className="glass-input h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-white/10 text-white">
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="GET">GET</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs uppercase tracking-wider">URL</Label>
                  <Input 
                    name="url" 
                    placeholder="https://..."
                    value={node.data?.config?.url || ''} 
                    onChange={handleConfigChange}
                    className="glass-input"
                  />
                </div>
              </>
            )}

            {/* Autopilot Config */}
            {node.data?.actionType === 'trigger_next_lead' && (
              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 space-y-3">
                <div className="flex items-center gap-2 text-orange-400">
                  <RefreshCw className="w-5 h-5 animate-spin-slow" />
                  <span className="font-bold text-sm">Modo Autopilot</span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Este nó irá procurar automaticamente o <b>próximo lead pendente</b> na sua Google Sheet e adicioná-lo à fila de análise.
                </p>
                <div className="space-y-1">
                  <p className="text-[10px] text-white/40 uppercase font-black">Dica de Fluxo:</p>
                  <p className="text-[10px] text-white/50 italic">
                    Coloca um nó de <b>Wait (Delay)</b> antes deste para controlar a velocidade do ciclo.
                  </p>
                </div>
              </div>
            )}

            {/* Send Email Specific Logic Component */}
            {node.data?.actionType === 'send_email' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs uppercase tracking-wider">Email Template</Label>
                  <Select value={node.data?.config?.template_id || ''} onValueChange={(val) => handleSelectChange('template_id', val)}>
                    <SelectTrigger className="glass-input h-8 text-sm">
                      <SelectValue placeholder="Select Template" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-white/10 text-white">
                      <SelectItem value="alygen_standard" className="text-accent font-bold">✨ Standard Alygen Template (AI)</SelectItem>
                      <SelectItem value="alygen_followup_1" className="text-blue-400">📬 Follow-up (Dia 3)</SelectItem>
                      <SelectItem value="alygen_followup_2" className="text-blue-400">📬 Último Toque (Dia 7)</SelectItem>
                      {templates.map(tmpl => (
                        <SelectItem key={tmpl.id} value={tmpl.id}>{tmpl.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs uppercase tracking-wider">Cc (Opcional)</Label>
                  <Input 
                    name="cc" 
                    placeholder="ex@exemplo.com"
                    value={node.data?.config?.cc || ''} 
                    onChange={handleConfigChange}
                    className="glass-input h-8 text-sm"
                  />
                </div>

                {/* Human-in-the-Loop Toggle */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex flex-col">
                    <Label className="text-blue-400 text-[10px] uppercase font-bold tracking-tighter">🚦 Aprovação Humana (Telegram)</Label>
                    <span className="text-[10px] text-white/50 italic">Pausa e pede aprovação no Telegram antes de enviar</span>
                  </div>
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-blue-500"
                    checked={node.data?.config?.require_approval || false}
                    onChange={(e) => handleSelectChange('require_approval', e.target.checked)}
                  />
                </div>

              {/* Attachment Options */}
                <div className="space-y-2 pt-1 border-t border-white/10">
                  <Label className="text-white/60 text-xs uppercase tracking-wider">📎 Anexos Automáticos</Label>
                  
                  <div className="flex items-center justify-between p-2 rounded-lg bg-orange-500/5 border border-orange-500/20">
                    <div className="flex flex-col">
                      <Label className="text-orange-300 text-[10px] uppercase font-bold tracking-tighter">📄 Relatório PDF</Label>
                      <span className="text-[10px] text-white/50 italic">Gerar e anexar PDF do cliente</span>
                    </div>
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-orange-500"
                      checked={node.data?.config?.attach_pdf || false}
                      onChange={(e) => handleSelectChange('attach_pdf', e.target.checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-purple-500/5 border border-purple-500/20">
                    <div className="flex flex-col">
                      <Label className="text-purple-300 text-[10px] uppercase font-bold tracking-tighter">🖼️ Imagem Arte do Lead</Label>
                      <span className="text-[10px] text-white/50 italic">Anexar card visual gerado</span>
                    </div>
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-purple-500"
                      checked={node.data?.config?.attach_image !== false}
                      onChange={(e) => handleSelectChange('attach_image', e.target.checked)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Send WhatsApp Specific Logic Component */}
            {node.data?.actionType === 'whatsapp' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-2 rounded-lg bg-accent/5 border border-accent/10">
                  <div className="flex flex-col">
                    <Label className="text-accent text-[10px] uppercase font-bold tracking-tighter">Smart Message</Label>
                    <span className="text-[10px] text-white/50 italic">AI-crafted message</span>
                  </div>
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-accent"
                    checked={node.data?.config?.use_standard || false}
                    onChange={(e) => handleSelectChange('use_standard', e.target.checked)}
                  />
                </div>

                {!node.data?.config?.use_standard && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-white/60 text-xs uppercase tracking-wider">Custom Message</Label>
                      <span className="text-[10px] text-accent font-mono">
                        {'{{lead.name}}, {{analysis.reportUrl}}'}
                      </span>
                    </div>
                    <textarea
                      name="message"
                      rows={4}
                      placeholder="Olá {{lead.name}}, analisámos o seu site e aqui está o relatório: {{analysis.reportUrl}}"
                      value={node.data?.config?.message || ''}
                      onChange={handleConfigChange}
                      className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-sm text-white focus:outline-none focus:border-accent/50 transition-colors"
                    />
                  </div>
                )}
              </div>
            )}

            {node.data?.actionType === 'notify_admin' && (
              <div className="space-y-2">
                <Label className="text-white/60 text-xs uppercase tracking-wider">Recipient Email</Label>
                <Input 
                  name="email" 
                  placeholder="admin@empresa.com"
                  value={node.data?.config?.email || ''} 
                  onChange={handleConfigChange}
                  className="glass-input"
                />
                <p className="text-[10px] text-white/40 italic">Onde receberás o resumo desta automação.</p>
              </div>
            )}

            {node.data?.actionType === 'google_sheets' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs uppercase tracking-wider">Spreadsheet ID</Label>
                  <Input 
                    name="spreadsheetId" 
                    placeholder="ID da Planilha (vazio = padrão)"
                    value={node.data?.config?.spreadsheetId || ''} 
                    onChange={handleConfigChange}
                    className="glass-input h-8 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs uppercase tracking-wider">Sheet Name (Aba)</Label>
                  <Input 
                    name="sheetName" 
                    placeholder="Results"
                    value={node.data?.config?.sheetName || ''} 
                    onChange={handleConfigChange}
                    className="glass-input h-8 text-xs"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-1">
                    <Label className="text-white/60 text-xs uppercase tracking-wider">Column Mapping</Label>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-accent"
                      onClick={() => {
                        const newMapping = { ...(node.data?.config?.mapping || {}) };
                        newMapping['New Column'] = '';
                        handleSelectChange('mapping', newMapping);
                      }}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {Object.entries(node.data?.config?.mapping || {}).map(([col, val], idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input 
                          placeholder="Column"
                          value={col}
                          onChange={(e) => {
                            const newMapping = { ...(node.data?.config?.mapping || {}) };
                            delete newMapping[col];
                            newMapping[e.target.value] = val;
                            handleSelectChange('mapping', newMapping);
                          }}
                          className="glass-input h-7 text-[10px] w-1/3"
                        />
                        <Input 
                          placeholder="Value (ex: {{lead.name}})"
                          value={val}
                          onChange={(e) => {
                            const newMapping = { ...(node.data?.config?.mapping || {}) };
                            newMapping[col] = e.target.value;
                            handleSelectChange('mapping', newMapping);
                          }}
                          className="glass-input h-7 text-[10px] flex-1"
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-red-500/50 hover:text-red-500"
                          onClick={() => {
                            const newMapping = { ...(node.data?.config?.mapping || {}) };
                            delete newMapping[col];
                            handleSelectChange('mapping', newMapping);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {node.data?.actionType === 'ai_personalizer' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs uppercase tracking-wider">Instruções para a IA (Prompt)</Label>
                  <textarea
                    name="prompt"
                    rows={5}
                    placeholder="Ex: Escreve um convite amigável focando no QScore de {{analysis.qScore}}..."
                    value={node.data?.config?.prompt || ''}
                    onChange={handleConfigChange}
                    className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-sm text-white focus:outline-none focus:border-accent/50 transition-colors"
                  />
                  <p className="text-[10px] text-white/40 italic">O pitch gerado ficará disponível em {'{{ai_pitch}}'}.</p>
                </div>
              </div>
            )}
            <div className="pt-4 border-t border-white/5 space-y-3">
              <Label className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold block">
                Etiquetas Disponíveis
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { tag: '{{lead.name}}', desc: 'Nome do Cliente' },
                  { tag: '{{analysis.reportUrl}}', desc: 'Link do Relatório' },
                  { tag: '{{analysis.qScore}}', desc: 'Pontuação (0-100)' },
                  { tag: '{{analysis.performanceMobile}}', desc: 'Perf. Mobile' },
                  { tag: '{{analysis.seo.score}}', desc: 'Score de SEO' },
                  { tag: '{{analysis.category}}', desc: 'Tipo (COM/SEM SITE)' },
                  { tag: '{{analysis.urgency}}', desc: 'Urgência (Crítica/Alta)' },
                  { tag: '{{analysis.tone}}', desc: 'Tom de Voz (Luxury/Pop)' },
                  { tag: '{{ai_pitch}}', desc: 'Pitch Gerado por IA' },
                ].map((v) => (
                  <div key={v.tag} className="bg-white/[0.02] border border-white/5 rounded p-1.5 flex flex-col gap-0.5">
                    <span className="text-[10px] font-mono text-accent">{v.tag}</span>
                    <span className="text-[9px] text-white/40">{v.desc}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-white/30 italic">
                Nota: O Smart Message usa estas etiquetas automaticamente.
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-white/10 flex gap-2">
        <Button variant="outline" className="flex-1 glass-button border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white" onClick={() => onDelete(node.id)}>
          <Trash2 className="w-4 h-4 mr-2" /> Delete
        </Button>
        <Button variant="outline" className="flex-1 glass-button" onClick={() => onDuplicate(node)}>
          <Copy className="w-4 h-4 mr-2" /> Duplicate
        </Button>
      </div>
    </div>
  )
}
