import { useMemo, useState } from 'react'
import { Edit, FileText, Plus, Trash2 } from 'lucide-react'
import { usePeraturan } from '@/api/peraturan'
import { DataSurface } from '@/components/data/data-surface'
import { RowActions } from '@/components/data/row-actions'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Table } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { FormDialog } from '@/components/ui/form-dialog'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { SearchInput } from '@/components/ui/search-input'
import type { Peraturan } from '@/types/dto/peraturan.dto'

const EMPTY_FORM = { namaPeraturan: '', nomor: '', tahun: '', tentang: '' }

export function ManajemenPeraturan() {
  const catalog = usePeraturan()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Peraturan | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Peraturan | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return catalog.list
    return catalog.list.filter((item) =>
      `${item.namaPeraturan} ${item.nomor} ${item.tahun} ${item.tentang}`.toLowerCase().includes(normalized),
    )
  }, [catalog.list, query])
  const year = Number(form.tahun)
  const canSave =
    form.namaPeraturan.trim().length > 0 &&
    form.nomor.trim().length > 0 &&
    form.tentang.trim().length > 0 &&
    Number.isInteger(year) && year >= 1900 && year <= new Date().getFullYear() + 1

  const openForm = (item: Peraturan | null) => {
    setEditing(item)
    setForm(
      item
        ? { namaPeraturan: item.namaPeraturan, nomor: item.nomor, tahun: String(item.tahun), tentang: item.tentang }
        : EMPTY_FORM,
    )
  }

  return (
    <ListPageLayout
      title="Katalog Peraturan"
      description="Sumber dasar hukum global yang dapat dipakai lintas Proses Bisnis."
      breadcrumb={[{ label: 'Katalog Peraturan' }]}
    >
      <DataSurface.Root>
        <DataSurface.Header>
          <DataSurface.Toolbar>
            <SearchInput aria-label="Cari peraturan" placeholder="Cari peraturan…" value={query} onChange={(event) => setQuery(event.target.value)} />
            <DataSurface.Actions>
              <Button size="sm" className="gap-1.5" onClick={() => openForm(null)}>
                <Plus className="h-4 w-4" aria-hidden /> Tambah
              </Button>
            </DataSurface.Actions>
          </DataSurface.Toolbar>
        </DataSurface.Header>
        <Table.Paginated data={filtered} label="peraturan" surfaceMode="embedded">
          {(pageData) => (
            <Table.Root>
              <Table.Table>
                <thead><Table.HeadRow><Table.Th>Peraturan</Table.Th><Table.Th>Nomor</Table.Th><Table.Th>Tentang</Table.Th><Table.ActionTh>Aksi</Table.ActionTh></Table.HeadRow></thead>
                <tbody>
                  {pageData.length === 0 ? (
                    <EmptyState asTableRow colSpan={4} icon={<FileText />} title={query.trim() ? 'Peraturan tidak ditemukan' : 'Belum ada peraturan'} description={query.trim() ? 'Ubah kata kunci pencarian.' : 'Tambahkan dasar hukum global untuk digunakan dalam SOP.'} />
                  ) : pageData.map((item) => (
                    <Table.BodyRow key={item.id}>
                      <Table.Td className="font-medium text-foreground">{item.namaPeraturan}</Table.Td>
                      <Table.Td>{item.nomor}/{item.tahun}</Table.Td>
                      <Table.Td>{item.tentang}</Table.Td>
                      <Table.ActionTd><RowActions actions={[
                        { icon: Edit, title: 'Edit', onClick: () => openForm(item) },
                        { icon: Trash2, title: item.digunakan ? 'Masih digunakan oleh SOP' : 'Hapus', destructive: true, disabled: Boolean(item.digunakan), onClick: () => setDeleting(item) },
                      ]} /></Table.ActionTd>
                    </Table.BodyRow>
                  ))}
                </tbody>
              </Table.Table>
            </Table.Root>
          )}
        </Table.Paginated>
      </DataSurface.Root>
      <FormDialog
        open={editing !== undefined}
        onOpenChange={(open) => { if (!open) setEditing(undefined) }}
        title={editing ? 'Edit peraturan' : 'Tambah peraturan'}
        description="Data ini tersedia sebagai dasar hukum untuk seluruh SOP FTI."
        confirmLabel="Simpan"
        confirmDisabled={!canSave || catalog.isCreating || catalog.isUpdating}
        onConfirm={async () => {
          const payload = { namaPeraturan: form.namaPeraturan.trim(), nomor: form.nomor.trim(), tahun: year, tentang: form.tentang.trim() }
          if (editing) await catalog.update({ id: editing.id, payload })
          else await catalog.create(payload)
          setEditing(undefined)
        }}
      >
        <FormField label="Jenis peraturan" required><Input value={form.namaPeraturan} onChange={(event) => setForm((value) => ({ ...value, namaPeraturan: event.target.value }))} /></FormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Nomor" required><Input value={form.nomor} onChange={(event) => setForm((value) => ({ ...value, nomor: event.target.value }))} /></FormField>
          <FormField label="Tahun" required><Input inputMode="numeric" maxLength={4} value={form.tahun} onChange={(event) => setForm((value) => ({ ...value, tahun: event.target.value }))} /></FormField>
        </div>
        <FormField label="Tentang" required><Input value={form.tentang} onChange={(event) => setForm((value) => ({ ...value, tentang: event.target.value }))} /></FormField>
      </FormDialog>
      <ConfirmDialog open={deleting !== null} onOpenChange={(open) => { if (!open) setDeleting(null) }} title="Hapus peraturan?" description="Peraturan yang belum dipakai akan dihapus dari katalog global." confirmLabel="Hapus" destructive onConfirm={async () => { if (deleting) await catalog.delete(deleting.id); setDeleting(null) }} />
    </ListPageLayout>
  )
}
