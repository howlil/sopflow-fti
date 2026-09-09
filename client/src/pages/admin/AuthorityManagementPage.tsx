import { useMemo, useState } from 'react'
import { usePejabatBerwenangConfiguration } from '@/api/pejabat-berwenang'
import { useProsesBisnisAdministration } from '@/api/administrasi-proses-bisnis'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FormDialog } from '@/components/ui/form-dialog'
import { Table } from '@/components/ui/data-table'

type AuthorityTarget =
  | { kind: 'DEAN'; label: string }
  | { kind: 'HEAD_OF_DEPARTMENT'; departemenId: string; label: string }

export function AuthorityManagementPage() {
  const { departemen, users, isLoading: isProsesBisnisAdminLoading } = useProsesBisnisAdministration()
  const {
    configuration,
    isLoading: isAuthorityLoading,
    assignDean,
    assignDepartemenHead,
    isSaving,
  } = usePejabatBerwenangConfiguration()
  const [target, setTarget] = useState<AuthorityTarget | null>(null)
  const [selectedUserId, setSelectedUserId] = useState('')

  const dean = configuration.find((item) => item.authority === 'DEAN') ?? null
  const headByDepartemenId = useMemo(
    () => new Map(
      configuration
        .filter((item) => item.authority === 'HEAD_OF_DEPARTMENT' && item.departemenId !== null)
        .map((item) => [item.departemenId as string, item]),
    ),
    [configuration],
  )
  const eligibleUsers = useMemo(
    () => users.filter((user) => user.platformRole === 'USER' && !user.deletedAt),
    [users],
  )
  const isLoading = isProsesBisnisAdminLoading || isAuthorityLoading

  const openTarget = (next: AuthorityTarget, currentHolderId?: string | null) => {
    setTarget(next)
    setSelectedUserId(currentHolderId ?? '')
  }

  const submit = async () => {
    if (!target || !selectedUserId) return
    if (target.kind === 'DEAN') {
      await assignDean(selectedUserId)
    } else {
      await assignDepartemenHead({ departemenId: target.departemenId, penggunaId: selectedUserId })
    }
    setTarget(null)
    setSelectedUserId('')
  }

  return (
    <ListPageLayout
      breadcrumb={[{ label: 'Administrasi Sistem' }, { label: 'Pejabat Berwenang' }]}
      title="Pejabat Berwenang"
      description="Tetapkan pejabat yang berwenang melakukan pengesahan akhir dan TTE sesuai lingkup organisasi."
    >
      <Table.Card>
        <Table.Root aria-label="Daftar Pejabat Berwenang FTI">
          <Table.Table>
            <thead>
              <Table.HeadRow>
                <Table.Th>Jabatan</Table.Th>
                <Table.Th>Lingkup</Table.Th>
                <Table.Th>Pejabat Aktif</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.ActionTh>Aksi</Table.ActionTh>
              </Table.HeadRow>
            </thead>
            <tbody>
              {isLoading ? (
                <Table.BodyRow><Table.Td colSpan={6}>Memuat Pejabat Berwenang...</Table.Td></Table.BodyRow>
              ) : (
                <>
                  <Table.BodyRow>
                    <Table.Td className="font-medium">Dekan</Table.Td>
                    <Table.Td>Fakultas Teknologi Informasi</Table.Td>
                    <Table.Td>{dean?.holder?.nama ?? 'Belum ditetapkan'}</Table.Td>
                    <Table.Td>{dean?.holder?.email ?? '—'}</Table.Td>
                    <Table.Td>
                      <Badge variant={dean?.holder ? 'success' : 'warning'}>
                        {dean?.holder ? 'Aktif' : 'Belum ditetapkan'}
                      </Badge>
                    </Table.Td>
                    <Table.ActionTd>
                      <Button size="sm" variant="outline" onClick={() => openTarget({ kind: 'DEAN', label: 'Dekan' }, dean?.holderId)}>
                        {dean?.holder ? 'Ubah' : 'Tetapkan'}
                      </Button>
                    </Table.ActionTd>
                  </Table.BodyRow>

                  {departemen.map((department) => {
                    const assignment = headByDepartemenId.get(department.departemenId) ?? null
                    return (
                      <Table.BodyRow key={department.departemenId}>
                        <Table.Td className="font-medium">Kepala Departemen</Table.Td>
                        <Table.Td>{department.nama}</Table.Td>
                        <Table.Td>{assignment?.holder?.nama ?? 'Belum ditetapkan'}</Table.Td>
                        <Table.Td>{assignment?.holder?.email ?? '—'}</Table.Td>
                        <Table.Td>
                          <Badge variant={assignment?.holder ? 'success' : 'warning'}>
                            {assignment?.holder ? 'Aktif' : 'Belum ditetapkan'}
                          </Badge>
                        </Table.Td>
                        <Table.ActionTd>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openTarget(
                              { kind: 'HEAD_OF_DEPARTMENT', departemenId: department.departemenId, label: `Kepala Departemen ${department.nama}` },
                              assignment?.holderId,
                            )}
                          >
                            {assignment?.holder ? 'Ubah' : 'Tetapkan'}
                          </Button>
                        </Table.ActionTd>
                      </Table.BodyRow>
                    )
                  })}
                </>
              )}
            </tbody>
          </Table.Table>
        </Table.Root>
      </Table.Card>

      <FormDialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open) {
            setTarget(null)
            setSelectedUserId('')
          }
        }}
        title={target ? `Tetapkan ${target.label}` : 'Tetapkan Pejabat Berwenang'}
        description="Pejabat ini menjadi pemegang kewenangan pengesahan akhir dan TTE untuk lingkup terkait."
        confirmLabel="Simpan Penetapan"
        confirmDisabled={!selectedUserId || isSaving}
        onConfirm={() => void submit()}
      >
        <label className="space-y-1.5 text-sm font-medium text-foreground">
          <span>Pengguna</span>
          <select
            className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            value={selectedUserId}
            disabled={isSaving}
            onChange={(event) => setSelectedUserId(event.target.value)}
          >
            <option value="">Pilih pengguna</option>
            {eligibleUsers.map((user) => (
              <option key={user.penggunaId} value={user.penggunaId}>
                {user.nama} · {user.email}
              </option>
            ))}
          </select>
        </label>
      </FormDialog>
    </ListPageLayout>
  )
}
