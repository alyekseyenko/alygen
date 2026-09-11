import React from 'react'
import { X, Settings, Download } from 'lucide-react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

export default function FiscalSettingsModal({
  show,
  onClose,
  userSettings,
  setUserSettings,
  onSave
}) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-950 border-white/5 shadow-2xl overflow-hidden rounded-[2.5rem]">
        <div className="p-10 space-y-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/10 rounded-2xl">
                <Settings className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tighter uppercase">Alygen Central</h2>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Master Fiscal Configuration</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/5 rounded-xl">
              <X className="w-6 h-6 text-white/20" />
            </Button>
          </div>

          <form onSubmit={onSave} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-accent uppercase tracking-[.3em]">Your NIF (Personal/Company)</label>
              <Input
                value={userSettings.nif}
                onChange={(e) => setUserSettings({ ...userSettings, nif: e.target.value })}
                className="glass-input h-14"
                placeholder="Ex: 123 456 789"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-accent uppercase tracking-[.3em]">Alygen Fiscal Address</label>
              <Input
                value={userSettings.address}
                onChange={(e) => setUserSettings({ ...userSettings, address: e.target.value })}
                className="glass-input h-14 text-xs"
                placeholder="Rua, Nº, CP, Cidade"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-accent uppercase tracking-[.3em]">Your IBAN (For Receipt)</label>
                <Input
                  value={userSettings.iban}
                  onChange={(e) => setUserSettings({ ...userSettings, iban: e.target.value })}
                  className="glass-input h-14 font-mono text-[13px]"
                  placeholder="PT50 0000 0000 ..."
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-accent uppercase tracking-[.3em]">BIC/SWIFT</label>
                <input
                  type="text"
                  value={userSettings.swift}
                  onChange={(e) => setUserSettings({ ...userSettings, swift: e.target.value })}
                  className="glass-input h-14 font-mono text-[13px]"
                  placeholder="CCBB PT PL"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-accent uppercase tracking-[.3em]">VAT Rate (%)</label>
              <input
                type="number"
                value={userSettings.iva_percentage}
                onChange={(e) => setUserSettings({ ...userSettings, iva_percentage: Number(e.target.value) })}
                className="glass-input h-14 font-black"
                placeholder="Ex: 23"
              />
              <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-tight">Set 0 if exempt (Art. 53º CIVA). Activate for +23% next year.</p>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-accent uppercase tracking-[.3em]">IRS Withholding Rate (%)</label>
              <input
                type="number"
                step="0.5"
                value={userSettings.irs_percentage}
                onChange={(e) => setUserSettings({ ...userSettings, irs_percentage: Number(e.target.value) })}
                className="glass-input h-14 font-black"
                placeholder="Ex: 25 ou 11.5"
              />
              <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-tight">Usually 25%, 11.5% (start of activity) or 0% (if {'<'} 12.5k€/year).</p>
            </div>

            {/* ASSINATURA DIGITAL */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-accent uppercase tracking-[.3em]">Digital Signature (PNG/SVG)</label>
              <div className="relative">
                {userSettings.signature_base64 ? (
                  <div className="bg-white rounded-2xl p-4 flex flex-col items-center gap-3">
                    <img src={userSettings.signature_base64} alt="Assinatura" className="max-h-[60px] object-contain" />
                    <button
                      type="button"
                      onClick={() => setUserSettings({ ...userSettings, signature_base64: '' })}
                      className="text-[9px] text-red-500 font-black uppercase tracking-widest hover:text-red-400 transition-colors"
                    >
                      Remove Signature
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-accent/30 transition-all bg-white/[0.02]">
                    <Download className="w-5 h-5 text-white/20 mb-2" />
                    <span className="text-[9px] text-white/30 font-black uppercase tracking-widest">Upload Signature</span>
                    <input
                      type="file"
                      accept=".png,.svg,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (ev) => {
                            setUserSettings({ ...userSettings, signature_base64: ev.target.result })
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-8 bg-white text-black hover:bg-zinc-200 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-white/5"
            >
              Save Generation Data
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
