import React, { useState, useEffect } from 'react'
import {
  Search, RefreshCw, Eye, Settings
} from 'lucide-react'
import { api } from '../utils/api'
import { Button } from '../components/ui/button'
import { toast } from 'sonner'
import PipelineBoard from '../components/pipeline/PipelineBoard'
import DealDetailModal from '../components/pipeline/DealDetailModal'
import FiscalSettingsModal from '../components/pipeline/FiscalSettingsModal'

export const STAGES = [
  { id: 'LEAD', title: 'Leads', accent: 'border-white/10' },
  { id: 'CONTACTADO', title: 'In Conversation', accent: 'border-white/10' },
  { id: 'REUNIAO', title: 'Meeting Scheduled', accent: 'border-accent/40' },
  { id: 'PROPOSTA', title: 'Proposal Sent', accent: 'border-white/10' },
  { id: 'GANHO', title: 'Won (Client)', accent: 'border-emerald-500/40' },
  { id: 'PERDIDO', title: 'Lost', accent: 'border-red-500/40' }
]

export const PROJECT_TYPES = [
  { id: 'WEBSITE', label: 'Website / Landing Page' },
  { id: 'SEO', label: 'SEO & Performance' },
  { id: 'AUTOMATION', label: 'Automation / AI' },
  { id: 'MARKETING', label: 'Digital Marketing' },
  { id: 'MAINTENANCE', label: 'Maintenance / Support' }
]

export const CLIENT_TYPES = [
  { id: 'EMPRESA', label: 'Company Client (with IRS withholding)' },
  { id: 'SINGULAR', label: 'Individual Client (no withholding)' }
]

export default function Pipeline() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [userSettings, setUserSettings] = useState(() => {
    const saved = sessionStorage.getItem('alygen_fiscal_settings') || localStorage.getItem('alygen_fiscal_settings')
    const defaults = { nif: '', address: '', iban: '', swift: '', signature_base64: '', iva_percentage: 0, irs_percentage: 25 }
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults
  })
  const [privacyMode, setPrivacyMode] = useState(false)

  useEffect(() => {
    loadDeals()
    loadAlygenConfig()
  }, [])

  async function loadAlygenConfig() {
    try {
      const { data } = await api.get('/alygen-config')
      if (data.success && data.data) {
        setUserSettings({
          nif: data.data.nif || '',
          address: data.data.address || '',
          iban: data.data.iban || '',
          swift: data.data.swift || '',
          signature_base64: data.data.signature_base64 || '',
          iva_percentage: data.data.iva_percentage || 0,
          irs_percentage: data.data.irs_percentage || 25
        })
      }
    } catch {
      console.warn('Could not load master config from cloud. Using temporary data.')
    }
  }

  async function loadDeals() {
    setLoading(true)
    try {
      const { data } = await api.get('/supabase/analyses?is_immune=true')
      if (data.success) {
        setLeads(data.data.map(lead => ({
          ...lead,
          crm_stage: lead.crm_stage || 'LEAD',
          budget: lead.budget || 0,
          is_immune: lead.is_immune || false,
          notes: lead.private_notes || '',
          private_notes: lead.private_notes || '',
          client_email: lead.client_email || '',
          client_phone: lead.client_phone || '',
          client_address: lead.client_address || '',
          client_nif: lead.client_nif || '',
          contact_person: lead.contact_person || '',
          project_type: lead.project_type || 'WEBSITE',
          budget_items: (lead.budget_items || []).map(item => ({
            ...item,
            original_price: item.original_price || item.price || 0
          })),
          third_party_services: lead.third_party_services || [],
          discount_percentage: lead.discount_percentage || 0,
          client_type: lead.client_type || 'EMPRESA'
        })))
      }
    } catch {
      toast.error('Error syncing CRM')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (e) => {
    e.preventDefault()
    const loadingToast = toast.loading('Saving data to Cloud...')
    try {
      const { data } = await api.post('/alygen-config', userSettings)
      if (data.success) {
        sessionStorage.setItem('alygen_fiscal_settings', JSON.stringify(userSettings))
        localStorage.removeItem('alygen_fiscal_settings')
        setShowSettings(false)
        toast.success('Settings saved to Cloud!', { id: loadingToast })
      } else {
        throw new Error(data.error)
      }
    } catch {
      toast.error('Error syncing with cloud.', { id: loadingToast })
    }
  }

  const handleDragStart = (e, website) => {
    e.dataTransfer.setData('text/plain', website)
  }

  const handleDrop = async (e, targetStage) => {
    e.preventDefault()
    e.stopPropagation()

    let website = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('website')
    if (!website) return

    const lead = leads.find(l => l.website === website)
    if (!lead || lead.crm_stage === targetStage) return

    const isImmune = targetStage === 'GANHO' ? true : lead.is_immune
    setLeads(prev => prev.map(l => l.website === website ? { ...l, crm_stage: targetStage, is_immune: isImmune } : l))

    api.post('/crm/update', { website, payload: { crm_stage: targetStage, is_immune: isImmune } })
      .catch(() => {
        toast.error('Error moving lead. Reverting...')
        loadDeals()
      })
  }

  const addBudgetItem = () => {
    if (!selectedDeal) return
    const newItems = [...(selectedDeal.budget_items || []), { name: '', price: 0, original_price: 0, description: '' }]
    calculateBudget(newItems, selectedDeal.discount_percentage)
  }

  const updateBudgetItem = (index, field, value) => {
    const newItems = [...selectedDeal.budget_items]
    newItems[index][field] = (field === 'price' || field === 'original_price') ? Number(value) : value
    calculateBudget(newItems, selectedDeal.discount_percentage)
  }

  const removeBudgetItem = (index) => {
    const newItems = selectedDeal.budget_items.filter((_, i) => i !== index)
    calculateBudget(newItems, selectedDeal.discount_percentage)
  }

  const addThirdPartyService = () => {
    if (!selectedDeal) return
    const newItems = [...(selectedDeal.third_party_services || []), { name: '', price: 0, description: '' }]
    setSelectedDeal({ ...selectedDeal, third_party_services: newItems })
  }

  const updateThirdPartyService = (index, field, value) => {
    const newItems = [...(selectedDeal.third_party_services || [])]
    newItems[index][field] = field === 'price' ? Number(value) : value
    setSelectedDeal({ ...selectedDeal, third_party_services: newItems })
  }

  const removeThirdPartyService = (index) => {
    const newItems = (selectedDeal.third_party_services || []).filter((_, i) => i !== index)
    setSelectedDeal({ ...selectedDeal, third_party_services: newItems })
  }

  const calculateBudget = (items, discount) => {
    const subtotal = items.reduce((acc, item) => acc + (Number(item.price) || 0), 0)
    const discountAmount = subtotal * (discount / 100)
    const totalFinal = subtotal - discountAmount
    setSelectedDeal({
      ...selectedDeal,
      budget_items: items,
      discount_percentage: discount,
      budget: totalFinal
    })
  }

  const saveDealUpdate = async () => {
    if (!selectedDeal) return
    try {
      const payload = {
        budget: Number(selectedDeal.budget),
        private_notes: selectedDeal.notes,
        is_immune: selectedDeal.is_immune,
        crm_stage: selectedDeal.crm_stage,
        client_email: selectedDeal.client_email,
        client_phone: selectedDeal.client_phone,
        client_address: selectedDeal.client_address,
        client_nif: selectedDeal.client_nif,
        contact_person: selectedDeal.contact_person,
        project_type: selectedDeal.project_type,
        budget_items: selectedDeal.budget_items,
        third_party_services: selectedDeal.third_party_services,
        discount_percentage: selectedDeal.discount_percentage,
        client_type: selectedDeal.client_type || 'EMPRESA'
      }
      const { data } = await api.post('/crm/update', { website: selectedDeal.website, payload })
      if (data.success) {
        setLeads(prev => prev.map(l => l.website === selectedDeal.website ? { ...l, ...payload } : l))
        toast.success('CRM Synced!')
      }
    } catch {
      toast.error('Error saving changes')
    }
  }

  const handleGenerateProposal = async () => {
    if (!selectedDeal) return
    await saveDealUpdate()

    setIsGeneratingPdf(true)
    toast.loading('Preparing Alygen professional proposal...', { id: 'pdf-gen' })

    try {
      const response = await api.post('/generate-proposal', {
        ...selectedDeal,
        userSettings
      }, {
        responseType: 'blob'
      })

      const blob = response.data
      if (blob.type !== 'application/pdf') {
        const text = await blob.text()
        const errorData = JSON.parse(text)
        throw new Error(errorData.error || 'Erro inesperado no servidor')
      }

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Proposta_Alygen_${selectedDeal.name?.replace(/\s+/g, '_') || 'Deal'}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()

      toast.success('Proposal generated!', { id: 'pdf-gen' })
    } catch (error) {
      console.error('Erro PDF:', error)
      let errorMsg = error.message

      if (error.response && error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text()
          const data = JSON.parse(text)
          errorMsg = data.error || errorMsg
        } catch {
          // ignore parsing error
        }
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error
      }

      toast.error(`PDF failed: ${errorMsg}`, { id: 'pdf-gen' })
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const filteredLeads = leads.filter(l =>
    !search ||
    (l.name && l.name.toLowerCase().includes(search.toLowerCase())) ||
    (l.website && l.website.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="w-full space-y-5">
        {/* Header Toolbar */}
        <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4" data-animate="fade-in">
          <div className="flex gap-2 flex-wrap items-center w-full md:w-auto justify-end">
            <div className="relative flex items-center w-44">
              <Search className="absolute left-3 w-3.5 h-3.5 text-white/30 pointer-events-none" />
              <input
                type="text"
                placeholder="Search leads..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-7 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all"
              />
            </div>

            <button
              onClick={() => setPrivacyMode(!privacyMode)}
              className={`p-1.5 rounded-lg border transition-all ${
                privacyMode
                  ? 'bg-[hsl(18,100%,52%)/0.15] border-[hsl(18,100%,52%)/0.35] text-[hsl(18,100%,62%)]'
                  : 'bg-white/[0.04] border-white/[0.08] text-white/30 hover:text-white/60'
              }`}
              title={privacyMode ? 'Disable privacy' : 'Enable privacy'}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            <Button
              onClick={() => setShowSettings(true)}
              variant="outline"
              size="sm"
              className="h-8 text-xs border-white/20 text-white hover:bg-white/10"
            >
              <Settings className="w-3.5 h-3.5 mr-1.5" />
              Settings
            </Button>

            <Button onClick={loadDeals} variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10" disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Pipeline Board Component */}
        <PipelineBoard
          stages={STAGES}
          filteredLeads={filteredLeads}
          handleDrop={handleDrop}
          handleDragStart={handleDragStart}
          setSelectedDeal={setSelectedDeal}
        />

        {/* Fiscal Settings Modal */}
        <FiscalSettingsModal
          show={showSettings}
          onClose={() => setShowSettings(false)}
          userSettings={userSettings}
          setUserSettings={setUserSettings}
          onSave={saveSettings}
        />

        {/* Deal Detail Modal */}
        <DealDetailModal
          selectedDeal={selectedDeal}
          setSelectedDeal={setSelectedDeal}
          projectTypes={PROJECT_TYPES}
          clientTypes={CLIENT_TYPES}
          addBudgetItem={addBudgetItem}
          updateBudgetItem={updateBudgetItem}
          removeBudgetItem={removeBudgetItem}
          addThirdPartyService={addThirdPartyService}
          updateThirdPartyService={updateThirdPartyService}
          removeThirdPartyService={removeThirdPartyService}
          calculateBudget={calculateBudget}
          handleGenerateProposal={handleGenerateProposal}
          saveDealUpdate={saveDealUpdate}
          isGeneratingPdf={isGeneratingPdf}
        />
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { @apply bg-white/5 rounded-full hover:bg-white/10; }
        
        .glass-input {
          @apply bg-[#0a0a0a] border-white/5 rounded-2xl px-6 font-bold text-white transition-all focus:border-accent/40 focus:bg-black/80;
        }

        select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='C19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1.5rem center;
          background-size: 1rem;
        }
      `
      }} />
    </div>
  )
}
