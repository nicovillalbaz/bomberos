import { useEffect, useMemo, useState } from 'react'
import type { Perfil, TipoGuardia } from '../../types'
import { getGuardias, createMultipleGuardias } from '../../api/guardias'
import { getActiveProfiles } from '../../api/usuarios'
import { exportRowsToCSV, exportTableToPrintablePDF } from '../../lib/export'
import { useAuth } from '../../hooks/useAuth'

export default function Guardias() {
  const { isOfficialOrAdmin } = useAuth()
  const [guardias, setGuardias] = useState<any[]>([])
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [showForm, setShowForm] = useState(false)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    fechas: [''],
    tipo: 'voluntaria' as TipoGuardia,
    a_cargo_id: '',
    conductor_id: '',
    miembros: [] as string[],
  })

  const isEspecial = form.tipo === 'especial'

  const getShiftTimes = (tipo: TipoGuardia, date: string) => {
    if (tipo === 'especial') return { hora_inicio: '00:00', hora_fin: '23:59' }
    const day = new Date(date).getDay()
    if (tipo === 'rentada') return day === 6 ? { hora_inicio: '07:00', hora_fin: '15:00' } : { hora_inicio: '07:00', hora_fin: '18:00' }
    if (day === 0) return { hora_inicio: '14:00', hora_fin: '06:00' }
    if (day === 6) return { hora_inicio: '20:00', hora_fin: '14:00' }
    return { hora_inicio: '22:00', hora_fin: '06:00' }
  }

  const load = async () => {
    const data = await getGuardias(undefined, fechaDesde || undefined, fechaHasta || undefined)
    setGuardias(data)
  }

  const loadProfiles = async () => {
    const data = await getActiveProfiles()
    setPerfiles(data)
  }

  useEffect(() => {
    load()
    loadProfiles()
  }, [])

  const parsedGuardias = useMemo(() => guardias.map((g) => ({
    ...g,
    miembrosTexto: (g.miembros || []).map((m: any) => `${m.miembro?.nombre ?? ''} ${m.miembro?.apellido ?? ''}`.trim()).filter(Boolean).join(', '),
  })), [guardias])

  const setFechaAt = (index: number, value: string) => {
    setForm((prev) => ({ ...prev, fechas: prev.fechas.map((f, i) => (i === index ? value : f)) }))
  }

  const addFecha = () => setForm((prev) => ({ ...prev, fechas: [...prev.fechas, ''] }))
  const removeFecha = (index: number) => setForm((prev) => ({ ...prev, fechas: prev.fechas.filter((_, i) => i !== index) }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fechasValidas = form.fechas.filter(Boolean)
    if (fechasValidas.length === 0) {
      setError('Debes seleccionar al menos una fecha.')
      return
    }
    if (!isEspecial && (!form.a_cargo_id || !form.conductor_id)) {
      setError('En guardia normal, a cargo y conductor son obligatorios.')
      return
    }

    const payload = fechasValidas.map((fecha) => {
      const times = getShiftTimes(form.tipo, fecha)
      return {
        fecha,
        tipo: form.tipo,
        ...times,
        a_cargo_id: form.a_cargo_id || null,
        conductor_id: form.conductor_id || null,
        miembros: form.miembros,
      }
    })

    await createMultipleGuardias(payload as any)
    setShowForm(false)
    setError('')
    setForm({ fechas: [''], tipo: 'voluntaria', a_cargo_id: '', conductor_id: '', miembros: [] })
    load()
  }

  const exportCSV = () => {
    exportRowsToCSV(parsedGuardias.map((g) => ({
      fecha: new Date(g.fecha).toLocaleDateString(),
      tipo: g.tipo,
      a_cargo: `${g.a_cargo?.nombre ?? ''} ${g.a_cargo?.apellido ?? ''}`.trim(),
      conductor: `${g.conductor?.nombre ?? ''} ${g.conductor?.apellido ?? ''}`.trim(),
      miembros: g.miembrosTexto,
    })), `guardias_${new Date().toISOString().split('T')[0]}.csv`)
  }

  const exportPDF = () => {
    exportTableToPrintablePDF(
      'Reporte de Guardias',
      ['Fecha', 'Tipo', 'A cargo', 'Conductor', 'Miembros'],
      parsedGuardias.map((g) => [
        new Date(g.fecha).toLocaleDateString(),
        g.tipo,
        `${g.a_cargo?.nombre ?? ''} ${g.a_cargo?.apellido ?? ''}`.trim(),
        `${g.conductor?.nombre ?? ''} ${g.conductor?.apellido ?? ''}`.trim(),
        g.miembrosTexto,
      ])
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Guardias</h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={load} className="px-3 py-2 bg-gray-200 rounded-lg">Filtrar</button>
          <button onClick={exportCSV} className="px-3 py-2 bg-green-600 text-white rounded-lg">Exportar CSV</button>
          <button onClick={exportPDF} className="px-3 py-2 bg-indigo-600 text-white rounded-lg">Exportar PDF</button>
          {isOfficialOrAdmin && (
            <button onClick={() => { setShowForm(true); loadProfiles() }} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Nueva guardia</button>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="px-3 py-2 border rounded-lg" />
        <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="px-3 py-2 border rounded-lg" />
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded-lg shadow">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoGuardia })} className="px-3 py-2 border rounded-lg">
              <option value="voluntaria">Voluntaria</option>
              <option value="rentada">Rentada</option>
              <option value="especial">Especial</option>
            </select>
            <div />

            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-medium">Fechas</label>
              {form.fechas.map((fecha, index) => (
                <div key={index} className="flex gap-2">
                  <input type="date" required value={fecha} onChange={(e) => setFechaAt(index, e.target.value)} className="px-3 py-2 border rounded-lg w-full sm:w-auto" />
                  {form.fechas.length > 1 && (
                    <button type="button" onClick={() => removeFecha(index)} className="px-3 py-2 bg-gray-200 rounded-lg">Quitar</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addFecha} className="px-3 py-2 bg-gray-200 rounded-lg text-sm">Agregar fecha</button>
            </div>

            <select value={form.a_cargo_id} onChange={(e) => setForm({ ...form, a_cargo_id: e.target.value })} className="px-3 py-2 border rounded-lg">
              <option value="">{isEspecial ? 'A cargo (opcional)' : 'A cargo'}</option>
              {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>

            <select value={form.conductor_id} onChange={(e) => setForm({ ...form, conductor_id: e.target.value })} className="px-3 py-2 border rounded-lg">
              <option value="">{isEspecial ? 'Conductor (opcional)' : 'Conductor'}</option>
              {perfiles.filter((p) => p.es_conductor_habilitado).map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>

            <div className="sm:col-span-2">
              <label className="text-sm">Miembros</label>
              <select multiple value={form.miembros} onChange={(e) => setForm({ ...form, miembros: Array.from(e.target.selectedOptions, (o) => o.value) })} className="w-full px-3 py-2 border rounded-lg h-36">
                {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
              </select>
            </div>

            {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}

            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">Crear</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-300 rounded-lg">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-gray-50">
            <tr><th className="p-2 text-left">Fecha</th><th>Tipo</th><th>A cargo</th><th>Conductor</th><th>Miembros</th></tr>
          </thead>
          <tbody>
            {parsedGuardias.map((g) => (
              <tr key={g.id} className="border-t">
                <td className="p-2">{new Date(g.fecha).toLocaleDateString()}</td>
                <td className="p-2 capitalize">{g.tipo}</td>
                <td className="p-2">{`${g.a_cargo?.nombre ?? ''} ${g.a_cargo?.apellido ?? ''}`.trim() || '-'}</td>
                <td className="p-2">{`${g.conductor?.nombre ?? ''} ${g.conductor?.apellido ?? ''}`.trim() || '-'}</td>
                <td className="p-2">{g.miembrosTexto || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
