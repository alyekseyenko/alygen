import React from 'react'
import { Plus, Trash2, Calculator, Wallet, Globe, Monitor, Euro, Percent, Layout, Briefcase } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

export default function BudgetCalculator({
  selectedDeal,
  setSelectedDeal,
  addBudgetItem,
  updateBudgetItem,
  removeBudgetItem,
  addThirdPartyService,
  updateThirdPartyService,
  removeThirdPartyService,
  calculateBudget
}) {
  const grossSubtotal = selectedDeal.budget_items?.reduce((acc, i) => acc + (Number(i.price) || 0), 0) || 0
  const savings = Math.round(grossSubtotal * (selectedDeal.discount_percentage / 100))

  return (
    <>
      {/* Dynamic Budget Module */}
      <div className="space-y-10 bg-[#0a0a0a] p-10 rounded-[3rem] border border-white/5 relative shadow-inner overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Wallet className="w-32 h-32" />
        </div>

        <div className="flex justify-between items-center mb-8 relative z-10">
          <h3 className="text-[10px] font-black uppercase text-accent tracking-[.4em] flex items-center gap-2">
            <Calculator className="w-4 h-4" /> Detailed Budgeting
          </h3>
          <Button
            onClick={addBudgetItem}
            variant="outline"
            size="sm"
            className="h-10 text-[9px] font-black uppercase tracking-widest border-accent/30 hover:bg-accent hover:text-black text-accent transition-all"
          >
            <Plus className="w-4 h-4 mr-2" /> New Module
          </Button>
        </div>

        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar px-1 relative z-10">
          {(selectedDeal.budget_items || []).map((item, idx) => (
            <div key={idx} className="group p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-accent/20 transition-all duration-500 relative">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeBudgetItem(idx)}
                  className="h-8 w-8 text-red-500/30 hover:text-red-500 hover:bg-red-500/10 transition-all rounded-full"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-5">
                {/* TITLE */}
                <div>
                  <label className="text-[8px] font-black text-white/25 uppercase tracking-[.3em] mb-1 block">Service Title</label>
                  <Input
                    value={item.name}
                    onChange={e => updateBudgetItem(idx, 'name', e.target.value)}
                    className="bg-transparent border-none text-lg p-0 font-black uppercase tracking-tight focus:ring-0 text-white placeholder:text-white/10"
                    placeholder="EX: WEBSITE + SEO PREMIUM"
                  />
                </div>

                {/* PRICES: BEFORE / AFTER */}
                <div className="flex gap-4">
                  <div className="flex-1 space-y-1">
                    <label className="text-[8px] font-black text-white/25 uppercase tracking-[.3em] block">Price Before (Strikethrough in PDF)</label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-2.5 w-3.5 h-3.5 text-white/15" />
                      <Input
                        type="number"
                        value={item.original_price}
                        onChange={e => updateBudgetItem(idx, 'original_price', e.target.value)}
                        className="bg-white/5 border border-white/5 text-sm h-10 pl-9 rounded-xl font-mono text-white/40 w-full"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-[8px] font-black text-accent uppercase tracking-[.3em] block">Final Price (Counts in Total)</label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-2.5 w-3.5 h-3.5 text-accent/40" />
                      <Input
                        type="number"
                        value={item.price}
                        onChange={e => updateBudgetItem(idx, 'price', e.target.value)}
                        className="bg-accent/5 border border-accent/20 text-sm h-10 pl-9 rounded-xl font-black text-accent w-full"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label className="text-[8px] font-black text-white/25 uppercase tracking-[.3em] mb-2 block">Technical Description (Appears in PDF)</label>
                  <textarea
                    value={item.description || ''}
                    onChange={e => updateBudgetItem(idx, 'description', e.target.value)}
                    className="w-full bg-black/30 border border-white/5 rounded-xl p-4 text-xs text-white/50 focus:border-accent/30 outline-none transition-all resize-none leading-relaxed min-h-[80px]"
                    placeholder="Describe the scope of this module..."
                  />
                </div>
              </div>
            </div>
          ))}

          {(!selectedDeal.budget_items || selectedDeal.budget_items.length === 0) && (
            <div className="py-20 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-[2.5rem] text-white/5">
              <Briefcase className="w-12 h-12 mb-4" />
              <span className="text-[10px] font-black uppercase tracking-[.4em]">Empty Service List</span>
            </div>
          )}
        </div>

        {/* --- FINANCIAL TOTALS --- */}
        <div className="pt-10 border-t border-white/10 space-y-8 bg-transparent relative z-10">
          <div className="flex justify-between items-center text-[10px] font-black uppercase text-white/20 tracking-[.3em] px-4">
            <span>Gross Subtotal</span>
            <span className="font-mono">€{grossSubtotal.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between items-center bg-white/[0.03] p-6 rounded-[2rem] border border-white/5 mx-2">
            <div className="flex items-center gap-3">
              <Percent className="w-4 h-4 text-accent" />
              <span className="text-[10px] font-black uppercase text-white/60 tracking-tighter">Applied Discount (%)</span>
            </div>
            <Input
              type="number"
              value={selectedDeal.discount_percentage}
              onChange={(e) => calculateBudget(selectedDeal.budget_items, Number(e.target.value))}
              className="w-24 bg-black border-white/10 text-accent font-black text-center h-12 text-xl rounded-2xl focus:border-accent"
            />
          </div>

          <div className="pt-8 flex flex-col items-start border-t border-white/10 mt-6 px-4">
            <span className="text-[10px] font-black uppercase text-white/20 tracking-[.5em] mb-4 leading-none">Final Investment Total</span>
            <div className="flex items-end justify-between w-full gap-4">
              <div className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none flex items-start gap-1">
                <span className="text-xl mt-1.5 opacity-20 text-white font-medium">€</span>
                {Math.round(selectedDeal.budget).toLocaleString('pt-PT')}
              </div>
              <div className="flex flex-col items-end text-emerald-500/80 font-black mb-1">
                <span className="text-[8px] uppercase tracking-widest opacity-40 mb-1">Savings Created</span>
                <span className="text-sm tracking-tighter">- €{savings.toLocaleString('pt-PT')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- THIRD PARTY SERVICES SECTION --- */}
      <div className="space-y-10 bg-[#0a0a0a] p-10 rounded-[3rem] border border-white/5 relative shadow-inner overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Globe className="w-32 h-32" />
        </div>

        <div className="flex justify-between items-center mb-8 relative z-10">
          <h3 className="text-[10px] font-black uppercase text-accent tracking-[.4em] flex items-center gap-2">
            <Monitor className="w-4 h-4" /> Third Party Services (TCO)
          </h3>
          <Button
            onClick={addThirdPartyService}
            variant="outline"
            size="sm"
            className="h-10 text-[9px] font-black uppercase tracking-widest border-accent/30 hover:bg-accent hover:text-black text-accent transition-all"
          >
            <Plus className="w-4 h-4 mr-2" /> New Service
          </Button>
        </div>

        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar px-1 relative z-10">
          {(selectedDeal.third_party_services || []).map((item, idx) => (
            <div key={idx} className="group p-6 rounded-[2rem] bg-white/[0.01] border border-white/5 hover:border-accent/20 transition-all duration-500 relative">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeThirdPartyService(idx)}
                  className="h-8 w-8 text-red-500/30 hover:text-red-500 hover:bg-red-500/10 transition-all rounded-full"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[8px] font-black text-white/25 uppercase tracking-[.3em] mb-1 block">Provider / Service</label>
                  <Input
                    value={item.name}
                    onChange={e => updateThirdPartyService(idx, 'name', e.target.value)}
                    className="bg-transparent border-none text-md p-0 font-black uppercase tracking-tight focus:ring-0 text-white placeholder:text-white/10"
                    placeholder="EX: AWS CLOUD / GOOGLE WORKSPACE"
                  />
                </div>

                <div className="flex gap-4 items-end">
                  <div className="flex-1 space-y-1">
                    <label className="text-[8px] font-black text-white/25 uppercase tracking-[.3em] block">Estimated Cost</label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-2.5 w-3.5 h-3.5 text-white/15" />
                      <Input
                        type="number"
                        value={item.price}
                        onChange={e => updateThirdPartyService(idx, 'price', e.target.value)}
                        className="bg-white/5 border border-white/5 text-sm h-10 pl-9 rounded-xl font-mono text-white/60 w-full"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="pb-0.5">
                    <button
                      type="button"
                      onClick={() => updateThirdPartyService(idx, 'is_optional', !item.is_optional)}
                      className={`h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                        item.is_optional
                          ? 'bg-orange-500/20 border-orange-500/50 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]'
                          : 'bg-white/5 border-white/5 text-white/20 hover:text-white/40'
                      }`}
                    >
                      {item.is_optional ? 'Optional' : 'Mandatory'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[8px] font-black text-white/25 uppercase tracking-[.3em] mb-2 block">Extension / Periodicity</label>
                  <Input
                    value={item.description}
                    onChange={e => updateThirdPartyService(idx, 'description', e.target.value)}
                    className="bg-transparent border border-white/5 rounded-xl px-4 h-10 text-[10px] text-white/50 focus:border-accent/30 outline-none transition-all"
                    placeholder="EX: Monthly / Annual / Per user"
                  />
                </div>
              </div>
            </div>
          ))}

          {(!selectedDeal.third_party_services || selectedDeal.third_party_services.length === 0) && (
            <div className="py-16 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-[2.5rem] text-white/5">
              <Layout className="w-10 h-10 mb-4" />
              <span className="text-[10px] font-black uppercase tracking-[.4em]">No External Services</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
