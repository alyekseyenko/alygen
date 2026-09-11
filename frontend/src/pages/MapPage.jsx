import { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { api } from '../utils/api'
import { 
  Search, SlidersHorizontal, Globe, Star, MapPin, 
  ExternalLink, Phone, Shield, Cpu, RefreshCw, Zap
} from 'lucide-react'
import { toast } from 'sonner'

export default function MapPage() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')
  const [minRating, setMinRating] = useState('0')
  const [selectedStage, setSelectedStage] = useState('ALL')
  
  // Active Lead inside sidebar/popup
  const [selectedLead, setSelectedLead] = useState(null)
  
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markersLayerRef = useRef(null)

  // Fetch Leads on Mount
  const fetchLeadsData = async (force = false) => {
    try {
      setLoading(true)
      const res = await api.get(`/fetch-leads${force ? '?force=true' : ''}`)
      if (res.data && res.data.leads) {
        setLeads(res.data.leads)
      }
    } catch (err) {
      console.error(err)
      toast.error('Error loading leads from local database.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeadsData()
  }, [])

  // Google Sheets Force Sync
  const handleSyncSheets = async () => {
    try {
      setSyncing(true)
      toast.loading('Syncing coordinates and data with Google Sheets...')
      await fetchLeadsData(true)
      toast.success('Sync completed successfully!')
    } catch (err) {
      toast.error('Failed to sync with Google Sheets.')
    } finally {
      setSyncing(false)
      toast.dismiss()
    }
  }

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return

    // Center of Portugal
    const startCenter = [39.5, -8.0]
    const startZoom = 7

    // Initialize Leaflet Map Instance
    const map = L.map(mapRef.current, {
      center: startCenter,
      zoom: startZoom,
      zoomControl: false, // Customized position later
      attributionControl: true
    })

    // Custom Zoom Control at Bottom-Right
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // 100% Open-Source standard OpenStreetMap tiles with official attribution
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)

    mapInstance.current = map
    markersLayerRef.current = L.layerGroup().addTo(map)

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [])

  // Unique types / categories
  const leadTypes = ['ALL', ...new Set(leads.map(l => l.type).filter(Boolean))]

  // Filtered Leads
  const filteredLeads = leads.filter(lead => {
    // Search
    const matchesSearch = 
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.website?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.address?.toLowerCase().includes(searchTerm.toLowerCase())

    // Sector / Type
    const matchesType = selectedType === 'ALL' || lead.type === selectedType

    // Rating
    const leadRating = parseFloat(lead.rating) || 0
    const matchesRating = minRating === '0' || leadRating >= parseFloat(minRating)

    // Stage
    const leadStage = lead.analysis?.crm_stage || 'LEAD'
    const matchesStage = selectedStage === 'ALL' || leadStage === selectedStage

    return matchesSearch && matchesType && matchesRating && matchesStage
  })

  // Update Markers on filter / data change
  useEffect(() => {
    if (!mapInstance.current || !markersLayerRef.current) return

    // Clear previous markers
    markersLayerRef.current.clearLayers()

    // Keep track of valid bounds to fit map nicely
    const bounds = []

    filteredLeads.forEach(lead => {
      const lat = parseFloat(lead.latitude)
      const lng = parseFloat(lead.longitude)

      // Skip invalid coordinates
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return

      bounds.push([lat, lng])

      // Determine Color based on CRM Stage
      const stage = lead.analysis?.crm_stage || 'LEAD'
      let markerColor = 'hsl(18, 100%, 52%)' // Neon Orange for Lead
      if (stage === 'CONTACTED') markerColor = '#9333ea' // Purple
      if (stage === 'CLIENT') markerColor = '#10b981' // Emerald
      if (stage === 'IN_PROGRESS') markerColor = '#3b82f6' // Blue

      // Create Bug-Free custom HTML DivIcon matching Alygen Design System
      const customIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-6 h-6 rounded-full animate-ping opacity-25" style="background-color: ${markerColor}"></div>
            <div class="relative w-3.5 h-3.5 rounded-full border border-white/40 shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-125" style="background-color: ${markerColor}"></div>
          </div>
        `,
        className: 'custom-map-pin-icon',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })

      // Add Marker
      const marker = L.marker([lat, lng], { icon: customIcon })
      
      // Bind Rich Popup with Alygen Design Styles
      marker.on('click', () => {
        setSelectedLead(lead)
        mapInstance.current.setView([lat, lng], 14)
      })

      marker.addTo(markersLayerRef.current)
    })

    // Fit map bounds if filters narrow down to specific coordinates
    if (bounds.length > 0 && filteredLeads.length < leads.length) {
      mapInstance.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
    }
  }, [filteredLeads, leads.length])

  // Center Map on a specific lead
  const flyToLead = (lead) => {
    const lat = parseFloat(lead.latitude)
    const lng = parseFloat(lead.longitude)
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      setSelectedLead(lead)
      mapInstance.current.setView([lat, lng], 15)
    } else {
      toast.error('This client does not have valid GPS coordinates.')
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col xl:flex-row relative overflow-hidden bg-[#0c0c0e]">
      
      {/* SIDEBAR - FILTERS & CLIENT LIST */}
      <aside className="w-full xl:w-96 border-b xl:border-b-0 xl:border-r border-white/[0.06] bg-[#0d0d10] flex flex-col z-10 shrink-0">
        {/* Search & Header */}
        <div className="p-6 border-b border-white/[0.04]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                <Globe className="w-5 h-5 text-[hsl(18,100%,52%)]" />
                PROSPECTION MAP
              </h2>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider mt-0.5">Intelligent Geo Prospection</p>
            </div>
            <button 
              onClick={handleSyncSheets}
              disabled={syncing}
              title="Sync Coordinates with Google Sheets"
              className="p-2 bg-white/5 border border-white/[0.08] hover:border-white/20 rounded-lg text-white/60 hover:text-white transition-all disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/30" />
            <input 
              type="text"
              placeholder="Search by name or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.05] border border-white/[0.06] focus:border-[hsl(18,100%,52%)] rounded-lg text-xs placeholder:text-white/20 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Filters Selects */}
        <div className="p-6 border-b border-white/[0.04] bg-[#09090b]/40 space-y-3.5">
          <div className="flex items-center gap-2 text-[10px] text-white/40 font-black uppercase tracking-wider mb-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Map Filters ({filteredLeads.length})
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] text-white/30 font-bold uppercase tracking-wider block mb-1">Sector</label>
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[11px] text-white/70 focus:outline-none focus:border-[hsl(18,100%,52%)]">
                {leadTypes.map(t => (
                  <option key={t} value={t} className="bg-[#0d0d10]">{t === 'ALL' ? 'All' : t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[9px] text-white/30 font-bold uppercase tracking-wider block mb-1">CRM Stage</label>
              <select 
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[11px] text-white/70 focus:outline-none focus:border-[hsl(18,100%,52%)]">
                <option value="ALL" className="bg-[#0d0d10]">All</option>
                <option value="LEAD" className="bg-[#0d0d10]">Lead</option>
                <option value="CONTACTED" className="bg-[#0d0d10]">Contacted</option>
                <option value="CLIENT" className="bg-[#0d0d10]">Client</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[9px] text-white/30 font-bold uppercase tracking-wider block mb-1">Minimum Rating (Google Maps)</label>
            <div className="flex items-center gap-2">
              <input 
                type="range" 
                min="0" 
                max="5" 
                step="0.5"
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="flex-1 accent-[hsl(18,100%,52%)]" 
              />
              <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1 min-w-[2.5rem]">
                <Star className="w-3 h-3 fill-current" />
                {minRating === '0' ? 'All' : minRating}
              </span>
            </div>
          </div>
        </div>

        {/* Lead List Viewport */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="h-48 flex flex-col items-center justify-center text-white/40 gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[hsl(18,100%,52%)]" />
              <span className="text-xs font-medium uppercase tracking-wider">Loading geolocations...</span>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-white/30 text-xs">
              No clients found with the filters.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {filteredLeads.map((lead) => {
                const hasGPS = lead.latitude && lead.longitude;
                const leadStage = lead.analysis?.crm_stage || 'LEAD';
                return (
                  <div 
                    key={lead.id}
                    onClick={() => hasGPS && flyToLead(lead)}
                    className={`p-4 hover:bg-white/[0.02] cursor-pointer transition-all flex flex-col gap-1.5 ${!hasGPS ? 'opacity-40' : ''} ${selectedLead?.id === lead.id ? 'bg-[hsl(18,100%,52%)]/5 border-l-2 border-[hsl(18,100%,52%)]' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-black leading-tight text-white/90 truncate max-w-[200px]">{lead.name}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider shrink-0 ${
                        leadStage === 'CLIENT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                        leadStage === 'CONTACTED' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/25' :
                        'bg-orange-500/10 text-orange-400 border border-orange-500/25'
                      }`}>{leadStage}</span>
                    </div>

                    <p className="text-[10px] text-white/40 truncate">{lead.address || 'Sem endereço'}</p>

                    <div className="flex items-center justify-between text-[10px] mt-1">
                      <div className="flex items-center gap-1.5 text-white/50">
                        {lead.type && <span className="px-1.5 py-0.5 bg-white/5 rounded-full text-[8px] font-bold uppercase">{lead.type}</span>}
                        {lead.rating && (
                          <span className="flex items-center gap-0.5 font-bold font-mono text-amber-400">
                            <Star className="w-2.5 h-2.5 fill-current shrink-0" />
                            {lead.rating}
                          </span>
                        )}
                      </div>

                      {hasGPS ? (
                        <span className="text-[8px] text-emerald-500/80 font-bold tracking-wider flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" /> GPS OK
                        </span>
                      ) : (
                        <span className="text-[8px] text-white/20 font-bold">SEM COORDENADAS</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </aside>

      {/* MAP CONTROLLER VIEWPORT */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full z-0" />

        {/* FLOATING ACTIVE PIN DETAIL DRAWER (SLIDES IN FROM RIGHT) */}
        {selectedLead && (
          <div className="absolute top-6 right-6 w-96 max-w-[calc(100vw-3rem)] bg-[#0d0d10]/95 backdrop-blur-md border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.8)] rounded-xl p-6 z-[1000] animate-in slide-in-from-right-8 duration-300">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[9px] px-2 py-0.5 bg-white/5 border border-white/[0.06] rounded-full text-white/40 font-bold uppercase tracking-wider">{selectedLead.type || 'Sector Geral'}</span>
                <h3 className="text-base font-black text-white tracking-tight mt-2 leading-snug">{selectedLead.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedLead(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all">
                ×
              </button>
            </div>

            {/* Address & Contact Info */}
            <div className="space-y-3 mb-5 text-xs text-white/70">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[hsl(18,100%,52%)] shrink-0 mt-0.5" />
                <span>{selectedLead.address || 'Não especificado'}</span>
              </div>
              {selectedLead.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <a href={`tel:${selectedLead.phone}`} className="hover:underline font-mono text-emerald-400 font-bold">{selectedLead.phone}</a>
                </div>
              )}
              {selectedLead.rating && (
                <div className="flex items-center gap-2.5">
                  <Star className="w-4 h-4 text-amber-400 fill-current shrink-0" />
                  <span className="font-bold">Avaliação: <span className="font-mono text-amber-400">{selectedLead.rating}</span> ({selectedLead.reviews || '0'} reviews)</span>
                </div>
              )}
            </div>

            {/* Geo details */}
            <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg flex items-center justify-between text-[10px] font-mono text-white/40 mb-5">
              <span>LAT: {parseFloat(selectedLead.latitude).toFixed(6)}</span>
              <span>LNG: {parseFloat(selectedLead.longitude).toFixed(6)}</span>
            </div>

            {/* ACTION FOOTER */}
            <div className="flex flex-col gap-2">
              <a 
                href={selectedLead.website}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all">
                <ExternalLink className="w-3.5 h-3.5" />
                Visit Official Website
              </a>
              
              <button 
                onClick={() => {
                  toast.success(`Market Intelligence sequence started for ${selectedLead.name}!`);
                }}
                className="w-full py-2.5 bg-[hsl(18,100%,52%)] hover:bg-[hsl(18,100%,52%)]/90 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(255,107,43,0.25)] transition-all">
                <Zap className="w-3.5 h-3.5" />
                Start Technical Analysis (AI Engine)
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
