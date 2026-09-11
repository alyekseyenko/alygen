import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { api } from '../utils/api'
import { Plus, Trash2, Edit, Mail, Save, X, Eye } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

export default function Templates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState(null)
  
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    setLoading(true)
    try {
      const res = await api.get('/templates')
      setTemplates(res.data?.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function handleCreate() {
    setEditingTemplate('new')
    setName('')
    setSubject('')
    setBodyHtml('')
  }

  function handleEdit(tmpl) {
    setEditingTemplate(tmpl.id)
    setName(tmpl.name)
    setSubject(tmpl.subject)
    setBodyHtml(tmpl.body_html)
  }

  async function handleSave() {
    if (!name || !subject || !bodyHtml) {
      toast.error('Please fill in all fields!')
      return
    }
    
    const payload = {
      id: editingTemplate === 'new' ? undefined : editingTemplate,
      name,
      subject,
      body_html: bodyHtml
    }

    try {
      await api.post('/templates', payload)
      toast.success('Template saved successfully!')
      setEditingTemplate(null)
      loadTemplates()
    } catch (e) {
      toast.error('Error saving template')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this template?')) return
    try {
      await api.delete(`/templates/${id}`)
      toast.success('Template deleted')
      loadTemplates()
    } catch (e) {
      toast.error('Error deleting template')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Mail className="w-8 h-8 text-orange-500" />
            Email Templates
          </h1>
          <p className="text-white/60 mt-1">Generate your email templates to use in automations.</p>
        </div>
        {!editingTemplate && (
          <Button onClick={handleCreate} className="bg-orange-600 hover:bg-orange-700 text-white border-none">
            <Plus className="w-4 h-4 mr-2" /> New Template
          </Button>
        )}
      </div>

      {editingTemplate ? (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle>{editingTemplate === 'new' ? 'Create New Template' : 'Edit Template'}</CardTitle>
            <CardDescription>You can use variables like {"{{lead.name}}"}, {"{{lead.website}}"}, {"{{analysis.qScore}}"} in subject and body.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Internal Name</Label>
                <Input 
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ex: Follow-up 1 - Cold" 
                  className="bg-black border-white/20"
                />
              </div>
              <div className="space-y-2">
                <Label>Email Subject</Label>
                <Input 
                  value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="Interest regarding {{lead.website}}" 
                  className="bg-black border-white/20"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Email HTML Body</Label>
              <textarea 
                value={bodyHtml} onChange={e => setBodyHtml(e.target.value)}
                placeholder="<h1>Hello {{lead.name}}</h1>..."
                className="w-full h-80 bg-black border border-white/20 rounded-md p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-y"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-white/10 pt-4">
            <Button variant="outline" className="text-white border-white/20 hover:bg-white/10" onClick={() => setEditingTemplate(null)}>
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700 text-white">
              <Save className="w-4 h-4 mr-2" /> Save Template
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <div className="text-white/60">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="col-span-full py-12 text-center border border-dashed border-white/20 rounded-xl bg-white/5">
              <Mail className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">No templates</h3>
              <p className="text-white/60 mb-4">You haven't created any email templates yet.</p>
              <Button onClick={handleCreate} className="bg-orange-600 hover:bg-orange-700 text-white">
                <Plus className="w-4 h-4 mr-2" /> Create first one
              </Button>
            </div>
          ) : (
            templates.map(tmpl => (
              <Card key={tmpl.id} className="border-white/10 bg-white/5 flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center justify-between">
                    <span className="truncate">{tmpl.name}</span>
                  </CardTitle>
                  <CardDescription className="truncate" title={tmpl.subject}>{tmpl.subject}</CardDescription>
                </CardHeader>
                <CardFooter className="mt-auto border-t border-white/10 pt-4 gap-2">
                  <Button variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10" onClick={() => handleEdit(tmpl)}>
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </Button>
                  <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={() => handleDelete(tmpl.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
