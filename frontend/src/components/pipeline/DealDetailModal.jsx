import React from 'react'
import {
  X, Globe, User, CreditCard, AlignLeft, ShieldAlert,
  RefreshCw, FileText, Save
} from 'lucide-react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import BudgetCalculator from './BudgetCalculator'

export default function DealDetailModal({
  selectedDeal,
  setSelectedDeal,
  projectTypes,
  clientTypes,
  addBudgetItem,
  updateBudgetItem,
  removeBudgetItem,
  addThirdPartyService,
  updateThirdPartyService,
  removeThirdPartyService,
  calculateBudget,
  handleGenerateProposal,
  saveDealUpdate,
  isGeneratingPdf
}) {
  if (!selectedDeal) return null

  return (
    <div
      className="fixed inset-0 bg-black/95 backdrop-blur-3xl flex items-center justify-center z-[100] p-4"
      onClick={() => setSelectedDeal(null)}
    >
      <Card
        className="w-full bg-[#060606] border-white/5 shadow-2xl flex flex-col max-h-[95vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-10 border-b border-white/5 flex justify-between items-start bg-black/50 backdrop-blur-md">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="text-[9px] bg-accent/20 text-accent border-accent/30 font-black tracking-widest uppercase py-1">
                Corporate Deal Manager
              </Badge>
              <span className="text-white/10 text-[10px] font-mono tracking-tighter">ALYGEN v2.6.PRO</span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">
              {selectedDeal.name || 'Company Under Analysis'}
            </h2>
            <div className="flex items-center gap-4 text-muted-foreground text-[11px] font-medium tracking-wide">
              <Globe className="w-4 h-4 text-accent/50" />
              {selectedDeal.website}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedDeal(null)}
            className="h-12 w-12 hover:bg-white/5 rounded-2xl"
          >
            <X className="w-8 h-8 text-white/20" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 space-y-16 custom-scrollbar">
          {/* Profile Sections Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            {/* Left Side: Business Essentials */}
            <div className="space-y-12">
              <div className="space-y-8">
                <h3 className="text-[10px] font-black uppercase text-accent tracking-[.4em] flex items-center gap-3">
                  <User className="w-4 h-4" /> Contact Core
                </h3>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Decision Maker</label>
                    <Input
                      value={selectedDeal.contact_person}
                      onChange={e => setSelectedDeal({ ...selectedDeal, contact_person: e.target.value })}
                      className="glass-input h-14 text-sm"
                      placeholder="Ex: CEO Name / Decision Maker"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Corporate Email</label>
                      <Input
                        value={selectedDeal.client_email}
                        onChange={e => setSelectedDeal({ ...selectedDeal, client_email: e.target.value })}
                        className="glass-input h-14"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Direct Contact</label>
                      <Input
                        value={selectedDeal.client_phone}
                        onChange={e => setSelectedDeal({ ...selectedDeal, client_phone: e.target.value })}
                        className="glass-input h-14"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <h3 className="text-[10px] font-black uppercase text-accent tracking-[.4em] flex items-center gap-3 pt-6">
                  <CreditCard className="w-4 h-4" /> Billing Data & Headquarters
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">NIF / Tax ID</label>
                    <Input
                      placeholder="Tax Number"
                      value={selectedDeal.client_nif}
                      onChange={e => setSelectedDeal({ ...selectedDeal, client_nif: e.target.value })}
                      className="glass-input h-14"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Project Ecosystem</label>
                    <select
                      className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl px-6 h-14 text-xs font-black outline-none focus:border-accent transition-all uppercase tracking-widest"
                      value={selectedDeal.project_type}
                      onChange={e => setSelectedDeal({ ...selectedDeal, project_type: e.target.value })}
                    >
                      {projectTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Entity Type</label>
                    <select
                      className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl px-6 h-14 text-xs font-black outline-none focus:border-accent transition-all uppercase tracking-widest"
                      value={selectedDeal.client_type}
                      onChange={e => setSelectedDeal({ ...selectedDeal, client_type: e.target.value })}
                    >
                      {clientTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Headquarters / Main Address</label>
                  <Input
                    value={selectedDeal.client_address}
                    onChange={e => setSelectedDeal({ ...selectedDeal, client_address: e.target.value })}
                    className="glass-input h-14"
                  />
                </div>
              </div>
            </div>

            {/* Right Side: DYNAMIC BUDGET + PROPOSAL GEN */}
            <div>
              <BudgetCalculator
                selectedDeal={selectedDeal}
                setSelectedDeal={setSelectedDeal}
                addBudgetItem={addBudgetItem}
                updateBudgetItem={updateBudgetItem}
                removeBudgetItem={removeBudgetItem}
                addThirdPartyService={addThirdPartyService}
                updateThirdPartyService={updateThirdPartyService}
                removeThirdPartyService={removeThirdPartyService}
                calculateBudget={calculateBudget}
              />
            </div>
          </div>

          {/* General Strategy Memo */}
          <div className="space-y-4 pt-10 border-t border-white/5">
            <label className="text-[10px] font-black uppercase text-accent tracking-[.5em] flex items-center gap-3">
              <AlignLeft className="w-4 h-4" /> Strategy Notes & Follow-up
            </label>
            <Textarea
              value={selectedDeal.notes}
              onChange={e => setSelectedDeal({ ...selectedDeal, notes: e.target.value })}
              className="glass-input min-h-[160px] text-sm leading-relaxed p-8 rounded-[2rem]"
              placeholder="Record next steps agreed upon here..."
            />
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-10 border-t border-white/5 bg-black flex items-center justify-between gap-8">
          <div
            onClick={() => setSelectedDeal({ ...selectedDeal, is_immune: !selectedDeal.is_immune })}
            className={`flex items-center gap-4 px-10 py-6 rounded-[2rem] border cursor-pointer transition-all ${
              selectedDeal.is_immune
                ? 'border-accent bg-accent/10 text-accent shadow-[0_0_20px_rgba(255,79,0,0.1)]'
                : 'border-white/5 bg-zinc-900/50 text-white/20'
            }`}
          >
            <ShieldAlert className="w-6 h-6" />
            <span className="text-[11px] font-black uppercase tracking-[.3em]">
              {selectedDeal.is_immune ? 'Shield Protector ON' : 'Analytic Standard'}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              className="text-[12px] uppercase font-black tracking-widest text-zinc-600 hover:text-white"
              onClick={() => setSelectedDeal(null)}
            >
              Back
            </Button>

            <Button
              onClick={handleGenerateProposal}
              disabled={isGeneratingPdf || !selectedDeal.budget_items?.length}
              className="bg-accent text-white hover:bg-accent/90 font-black py-8 px-14 rounded-[2rem] uppercase text-[12px] tracking-[.25em] flex items-center gap-4 shadow-xl shadow-accent/10 transition-all active:scale-95"
            >
              {isGeneratingPdf ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
              {isGeneratingPdf ? 'Generating...' : 'GENERATE ALYGEN PROPOSAL (PDF)'}
            </Button>

            <Button
              onClick={saveDealUpdate}
              className="bg-white text-black hover:bg-zinc-200 font-black py-8 px-14 rounded-[2rem] uppercase text-[12px] tracking-[.25em] flex items-center gap-4 transition-all active:scale-95"
            >
              <Save className="w-5 h-5 opacity-40" /> Save CRM
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
