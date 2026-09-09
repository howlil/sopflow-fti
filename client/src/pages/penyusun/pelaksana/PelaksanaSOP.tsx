import { useMemo, useState } from 'react'
import { Edit, Plus, Trash2, Users } from 'lucide-react'
import { type GlobalPelaksana, useCreateGlobalPelaksana, useDeleteGlobalPelaksana, useGlobalPelaksana, useUpdateGlobalPelaksana } from '@/api/pelaksana'
import { DataSurface } from '@/components/data/data-surface'
import { RowActions } from '@/components/data/row-actions'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Table } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { SingleTextFieldDialog } from '@/components/forms/single-text-field-dialog'
import { SearchInput } from '@/components/ui/search-input'

export function PelaksanaSOP() {
  const { list, isLoading } = useGlobalPelaksana()
  const create = useCreateGlobalPelaksana()
  const update = useUpdateGlobalPelaksana()
  const remove = useDeleteGlobalPelaksana()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<GlobalPelaksana | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<GlobalPelaksana | null>(null)
  const [name, setName] = useState('')
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return normalized ? list.filter((item) => item.namaPelaksana.toLowerCase().includes(normalized)) : list
  }, [list, query])

  const openForm = (item: GlobalPelaksana | null) => {
    setEditing(item)
    setName(item?.namaPelaksana ?? '')
  }

  return (
    <ListPageLayout title="Katalog Pelaksana" description="Aktor global yang dapat digunakan pada langkah SOP." breadcrumb={[{ label: 'Katalog Pelaksana' }]}>
      <DataSurface.Root>
        <DataSurface.Header><DataSurface.Toolbar>
          <SearchInput aria-label="Cari pelaksana" placeholder="Cari pelaksana…" value={query} onChange={(event) => setQuery(event.target.value)} />
          <DataSurface.Actions><Button size="sm" className="gap-1.5" onClick={() => openForm(null)}><Plus className="h-4 w-4" aria-hidden /> Tambah</Button></DataSurface.Actions>
        </DataSurface.Toolbar></DataSurface.Header>
        {isLoading ? <p role="status" className="p-4 text-sm text-secondary-foreground">Memuat pelaksana…</p> : (
          <Table.Paginated data={filtered} label="pelaksana" surfaceMode="embedded">{(pageData) => (
            <Table.Root><Table.Table>
              <thead><Table.HeadRow><Table.Th>Nama pelaksana</Table.Th><Table.Th>Terakhir diperbarui oleh</Table.Th><Table.ActionTh>Aksi</Table.ActionTh></Table.HeadRow></thead>
              <tbody>{pageData.length === 0 ? (
                <EmptyState asTableRow colSpan={3} icon={<Users />} title={query.trim() ? 'Pelaksana tidak ditemukan' : 'Belum ada pelaksana'} description={query.trim() ? 'Ubah kata kunci pencarian.' : 'Tambahkan aktor global yang dapat dipilih dalam prosedur SOP.'} />
              ) : pageData.map((item) => (
                <Table.BodyRow key={item.id}><Table.Td className="font-medium text-foreground">{item.namaPelaksana}</Table.Td><Table.Td>{item.updatedBy?.nama ?? 'Belum tercatat'}</Table.Td><Table.ActionTd><RowActions actions={[
                  { icon: Edit, title: 'Edit', onClick: () => openForm(item) },
                  { icon: Trash2, title: 'Hapus', destructive: true, onClick: () => setDeleting(item) },
                ]} /></Table.ActionTd></Table.BodyRow>
              ))}</tbody>
            </Table.Table></Table.Root>
          )}</Table.Paginated>
        )}
      </DataSurface.Root>
      <SingleTextFieldDialog open={editing !== undefined} onOpenChange={(open) => { if (!open) setEditing(undefined) }} title={editing ? 'Edit pelaksana' : 'Tambah pelaksana'} description="Nama ini tersedia untuk seluruh Proses Bisnis." confirmLabel="Simpan" label="Nama pelaksana" value={name} onValueChange={setName} confirmDisabled={name.trim().length < 2 || create.isPending || update.isPending} onConfirm={async () => { if (editing) await update.mutateAsync({ id: editing.id, namaPelaksana: name.trim() }); else await create.mutateAsync(name.trim()); setEditing(undefined) }} />
      <ConfirmDialog open={deleting !== null} onOpenChange={(open) => { if (!open) setDeleting(null) }} title="Hapus pelaksana?" description="Pelaksana yang masih dipakai oleh SOP akan ditolak oleh server." confirmLabel="Hapus" destructive onConfirm={async () => { if (deleting) await remove.mutateAsync(deleting.id); setDeleting(null) }} />
    </ListPageLayout>
  )
}
