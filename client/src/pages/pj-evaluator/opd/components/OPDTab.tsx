import { forwardRef, useImperativeHandle, useState } from 'react'
import { Building2, MoreVertical, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui/data-table'
import { SingleTextFieldDialog } from '@/components/forms/single-text-field-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { OPDUI as OPD } from '@/types/ui/organisasi'

interface OpdDialogState {
  isCreateOpen: boolean
  isEditOpen: boolean
}

export interface OPDTabHandle {
  openCreateDialog: () => void
}

export interface OPDTabProps {
  filteredOPD: OPD[]
  hasRelasiData: (opd: OPD) => boolean
  onDelete: (id: string) => void
  onCreate: (name: string) => void | Promise<void>
  onUpdate: (payload: { id: string; name: string }) => void | Promise<void>
}

export const OPDTab = forwardRef<OPDTabHandle, OPDTabProps>(function OPDTab({
  filteredOPD,
  hasRelasiData,
  onDelete,
  onCreate,
  onUpdate,
}: OPDTabProps, ref) {
  const [selectedOPD, setSelectedOPD] = useState<OPD | null>(null)
  const [formData, setFormData] = useState({ name: '' })
  const [dialogState, setDialogState] = useState<OpdDialogState>({
    isCreateOpen: false,
    isEditOpen: false,
  })

  const openCreateDialog = () => {
    setFormData({ name: '' })
    setDialogState((prev) => ({ ...prev, isCreateOpen: true }))
  }

  useImperativeHandle(ref, () => ({ openCreateDialog }), [])

  const openEditDialog = (opd: OPD) => {
    setSelectedOPD(opd)
    setFormData({ name: opd.name })
    setDialogState((prev) => ({ ...prev, isEditOpen: true }))
  }
  const handleConfirmCreate = () => onCreate(formData.name)
  const handleConfirmEdit = () => {
    if (!selectedOPD) return
    onUpdate({ id: selectedOPD.id, name: formData.name })
  }

  return (
    <>
      <Table.Paginated
        data={filteredOPD}
        label="OPD"
        className="w-full"
        surfaceMode="embedded"
      >
        {(pageData) => (
          <Table.Root>
            <Table.Table>
              <thead>
                <Table.HeadRow>
                  <Table.Th className="w-full">Nama OPD</Table.Th>
                  <Table.ActionTh>Aksi</Table.ActionTh>
                </Table.HeadRow>
              </thead>
              <tbody>
                {pageData.map((opd) => (
                  <Table.BodyRow key={opd.id}>
                    <Table.Td>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-subtle text-primary">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{opd.name}</p>
                          <p className="text-xs text-muted-foreground">Organisasi perangkat daerah</p>
                        </div>
                      </div>
                    </Table.Td>
                    <Table.ActionTd>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => openEditDialog(opd)}
                        >
                          Ubah
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Aksi lainnya untuk ${opd.name}`}>
                              <MoreVertical className="h-4 w-4 text-secondary-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              disabled={hasRelasiData(opd)}
                              onClick={() => onDelete(opd.id)}
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {hasRelasiData(opd) ? 'Tidak dapat dihapus' : 'Hapus OPD'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </Table.ActionTd>
                  </Table.BodyRow>
                ))}
              </tbody>
            </Table.Table>
          </Table.Root>
        )}
      </Table.Paginated>

      <SingleTextFieldDialog
        open={dialogState.isCreateOpen}
        onOpenChange={(open) =>
          setDialogState((prev) => ({ ...prev, isCreateOpen: open }))
        }
        title="Tambah OPD Baru"
        description="Lengkapi form berikut untuk menambah OPD baru"
        confirmLabel="Simpan"
        cancelLabel="Batal"
        onConfirm={handleConfirmCreate}
        confirmDisabled={!formData.name}
        size="md"
        label="Nama OPD"
        placeholder="Contoh: Dinas Pendidikan"
        value={formData.name}
        onValueChange={(name) => setFormData((prev) => ({ ...prev, name }))}
      />

      <SingleTextFieldDialog
        open={dialogState.isEditOpen}
        onOpenChange={(open) =>
          setDialogState((prev) => ({ ...prev, isEditOpen: open }))
        }
        title="Edit OPD"
        description="Perbarui informasi OPD"
        confirmLabel="Simpan Perubahan"
        cancelLabel="Batal"
        onConfirm={handleConfirmEdit}
        confirmDisabled={!formData.name}
        size="md"
        label="Nama OPD"
        value={formData.name}
        onValueChange={(name) => setFormData((prev) => ({ ...prev, name }))}
      />
    </>
  )
})
