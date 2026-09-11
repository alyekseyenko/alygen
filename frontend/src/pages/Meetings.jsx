import { useState, useEffect } from 'react'
import { Calendar, Video, Clock, CheckCircle2, XCircle, RefreshCw, MessageCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { api } from '../utils/api'

export default function Meetings() {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchMeetings() {
    setLoading(true)
    try {
      const { data } = await api.get('/contacts-log')
      const calendlyLogs = (data.data || [])
        .filter(log => log.type === 'calendly_approval' || log.type === 'calendly_confirmed')
        .map(log => ({
          id: log.id,
          name: log.details?.name || 'Client',
          email: log.details?.email || '-',
          time: log.details?.time || log.created_at,
          status: log.type === 'calendly_confirmed' ? 'approved' : 'pending',
          location: log.details?.location || 'Google Meet',
          created_at: log.created_at
        }))
        .sort((a, b) => new Date(b.time) - new Date(a.time))

      setMeetings(calendlyLogs)
    } catch (err) {
      console.error('Meetings fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMeetings()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="w-full mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
              <Calendar className="w-8 h-8 text-accent" />
              Intelligence <span className="text-accent">Agenda</span>
            </h1>
            <p className="text-white/60 mt-2">Management of meetings and strategic sessions via Calendly.</p>
          </div>
          <Button onClick={fetchMeetings} variant="outline" className="glass-button text-white" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardDescription>Total Meetings</CardDescription>
              <CardTitle className="text-3xl font-bold">{meetings.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardDescription>Upcoming (Approved)</CardDescription>
              <CardTitle className="text-3xl font-bold text-green-500">
                {meetings.filter(m => m.status === 'approved').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardDescription>Awaiting approval</CardDescription>
              <CardTitle className="text-3xl font-bold text-yellow-500">
                {meetings.filter(m => m.status === 'pending').length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className="glass-card border-white/5">
          <CardHeader>
            <CardTitle>Meeting List</CardTitle>
            <CardDescription>History and follow-up of meetings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/5">
                  <TableHead>Client</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location / Link</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-white/40">Loading agenda...</TableCell></TableRow>
                ) : meetings.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-white/40">No meetings found.</TableCell></TableRow>
                ) : meetings.map(meeting => (
                  <TableRow key={meeting.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell>
                      <div className="font-bold text-white">{meeting.name}</div>
                      <div className="text-xs text-white/40">{meeting.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-accent" />
                        <span className="text-sm">{meeting.time}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        meeting.status === 'approved'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }>
                        {meeting.status === 'approved' ? 'CONFIRMED' : 'PENDING'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {meeting.location.startsWith('http') ? (
                        <a href={meeting.location} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-400 hover:underline">
                          <Video className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">Meeting Link</span>
                        </a>
                      ) : (
                        <span className="text-xs text-white/40">{meeting.location}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {meeting.status === 'approved' && (
                          <Button size="sm" variant="outline" className="glass-button h-8" onClick={() => window.open(`https://wa.me/?text=Hello ${meeting.name}, I am ready for our meeting!`)}>
                            <MessageCircle className="w-3.5 h-3.5 mr-1" /> WhatsApp
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-8 text-white/40 hover:text-white">
                          Logs
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
