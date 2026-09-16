import { useMemo, useState } from 'react'
import { ChevronDown, Edit } from 'lucide-react'
import { usePejabatBerwenangConfiguration } from '@/api/pejabat-berwenang'
import { useProsesBisnisAdministration } from '@/api/administrasi-proses-bisnis'
import { DataSurface } from '@/components/data/data-surface'
import { FormDialog } from '@/components/ui/form-dialog'
import { FormField } from '@/components/ui/form-field'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { IconActionButton } from '@/components/ui/icon-action-button'
import { Table } from '@/components/ui/data-table'

const selectClassName =
  'h-9 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary'

type AuthorityDialogState =
  | { authority: 'DEAN'; departemenId: null; title: string }
  | { authority: 'HEAD_OF_DEPARTMENT'; departemenId: string; title: string }
  | null

export function AuthorityManagementPage() {
  const { departemen, users, isLoading: isProsesBisnisAdminLoading } = useProsesBisnisAdministration()
  const {
    configuration,
    isLoading: isAuthorityLoading,
    assignDean,
    assignDepartemenHead,
    isSaving,
  } = usePejabatBerwenangConfiguration()
  const [dialog, setDialog] = useState<AuthorityDialogState>(null)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [expandedSections, setExpandedSections] = useState({
    dekan: true,
    kepalaDepartemen: true,
  })

  const dean = configuration.find((item) => item.authority === 'DEAN') ?? null
  const headByDepartemenId = useMemo(
    () =>
      new Map(
        configuration
          .filter(
            (item) =>
              item.authority === 'HEAD_OF_DEPARTMENT' && item.departemenId !== null,
          )
          .map((item) => [item.departemenId as string, item]),
      ),
    [configuration],
  )
  const eligibleUsers = useMemo(
    () => users.filter((user) => user.platformRole === 'USER'),
    [users],
  )
  const isLoading = isProsesBisnisAdminLoading || isAuthorityLoading

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((current) => ({
      ...current,
      [section]: !current[section],
    }))
  }

  const openDeanDialog = () => {
    setSelectedUserId(dean?.holderId ?? '')
    setDialog({
      authority: 'DEAN',
      departemenId: null,
      title: 'Tetapkan Dekan',
    })
  }

  const openHeadDialog = (departemenId: string, namaDepartemen: string) => {
    setSelectedUserId(headByDepartemenId.get(departemenId)?.holderId ?? '')
    setDialog({
      authority: 'HEAD_OF_DEPARTMENT',
      departemenId,
      title: `Tetapkan Kepala Departemen ${namaDepartemen}`,
    })
  }

  const submit = async () => {
    if (!dialog || !selectedUserId) return
    try {
      if (dialog.authority === 'DEAN') {
        await assignDean(selectedUserId)
      } else {
        await assignDepartemenHead({
          departemenId: dialog.departemenId,
          penggunaId: selectedUserId,
        })
      }
      setDialog(null)
    } catch {
      // Toast mutation owns error presentation; preserve selection for correction.
    }
  }

  return (
    <ListPageLayout
      breadcrumb={[{ label: 'Administrasi' }, { label: 'Kewenangan Organisasi' }]}
      title="Kewenangan Organisasi"
    >
      <DataSurface.Root>
        <section>
          <DataSurface.Header>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-expanded={expandedSections.dekan}
              aria-controls="kewenangan-dekan-content"
              onClick={() => toggleSection('dekan')}
            >
              <h2 className="text-sm font-semibold text-foreground">Dekan</h2>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-secondary-foreground transition-transform motion-reduce:transition-none ${expandedSections.dekan ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
          </DataSurface.Header>
          {expandedSections.dekan ? (
            <div id="kewenangan-dekan-content">
              <Table.Root>
                <Table.Table>
                  <thead>
                    <Table.HeadRow>
                      <Table.Th>Lingkup</Table.Th>
                      <Table.Th>Pemegang Kewenangan</Table.Th>
                      <Table.ActionTh>Aksi</Table.ActionTh>
                    </Table.HeadRow>
                  </thead>
                  <tbody>
                    <Table.BodyRow>
                      <Table.Td className="font-medium text-foreground">Fakultas</Table.Td>
                      <Table.Td>{isLoading ? 'Memuat kewenangan...' : dean?.holder?.nama ?? 'Belum dikonfigurasi'}</Table.Td>
                      <Table.ActionTd>
                        <IconActionButton
                          icon={Edit}
                          title="Ubah kewenangan Dekan"
                          onClick={openDeanDialog}
                          disabled={isLoading}
                        />
                      </Table.ActionTd>
                    </Table.BodyRow>
                  </tbody>
                </Table.Table>
              </Table.Root>
            </div>
          ) : null}
        </section>

        <section className="border-t border-border">
          <DataSurface.Header>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-expanded={expandedSections.kepalaDepartemen}
              aria-controls="kewenangan-kepala-departemen-content"
              onClick={() => toggleSection('kepalaDepartemen')}
            >
              <h2 className="text-sm font-semibold text-foreground">Kepala Departemen</h2>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-secondary-foreground transition-transform motion-reduce:transition-none ${expandedSections.kepalaDepartemen ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
          </DataSurface.Header>
          {expandedSections.kepalaDepartemen ? (
            <div id="kewenangan-kepala-departemen-content">
              <Table.Root>
                <Table.Table>
                  <thead>
                    <Table.HeadRow>
                      <Table.Th>Departemen</Table.Th>
                      <Table.Th>Kepala Departemen</Table.Th>
                      <Table.ActionTh>Aksi</Table.ActionTh>
                    </Table.HeadRow>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <Table.BodyRow><Table.Td colSpan={3}>Memuat departemen...</Table.Td></Table.BodyRow>
                    ) : departemen.length === 0 ? (
                      <Table.BodyRow><Table.Td colSpan={3}>Belum ada Departemen.</Table.Td></Table.BodyRow>
                    ) : (
                      departemen.map((department) => {
                        const assignment = headByDepartemenId.get(department.departemenId) ?? null
                        return (
                          <Table.BodyRow key={department.departemenId}>
                            <Table.Td className="font-medium text-foreground">{department.nama}</Table.Td>
                            <Table.Td>{assignment?.holder?.nama ?? 'Belum dikonfigurasi'}</Table.Td>
                            <Table.ActionTd>
                              <IconActionButton
                                icon={Edit}
                                title={`Ubah Kepala Departemen ${department.nama}`}
                                disabled={isSaving}
                                onClick={() => openHeadDialog(department.departemenId, department.nama)}
                              />
                            </Table.ActionTd>
                          </Table.BodyRow>
                        )
                      })
                    )}
                  </tbody>
                </Table.Table>
              </Table.Root>
            </div>
          ) : null}
        </section>
      </DataSurface.Root>

      <FormDialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
        title={dialog?.title ?? 'Tetapkan Kewenangan'}
        confirmLabel="Simpan"
        onConfirm={submit}
        confirmDisabled={!selectedUserId || isSaving}
      >
        <FormField label="Pemegang Kewenangan" required>
          <select
            className={selectClassName}
            value={selectedUserId}
            onChange={(event) => setSelectedUserId(event.target.value)}
          >
            <option value="">Pilih pengguna</option>
            {eligibleUsers.map((user) => (
              <option key={user.penggunaId} value={user.penggunaId}>
                {user.nama}
              </option>
            ))}
          </select>
        </FormField>
      </FormDialog>
    </ListPageLayout>
  )
}
