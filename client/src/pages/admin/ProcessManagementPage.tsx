import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataSurface } from '@/components/data/data-surface'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { useProcessAdministration } from '@/api/process-admin'
import type { OrganizationalScope, ProcessDto, ProcessPayload } from '@/types/dto/process.dto'

const EMPTY_FORM: ProcessPayload = {
  nama: '',
  scope: 'FACULTY',
  departmentId: null,
  ownerId: '',
  memberIds: [],
}

export function ProcessManagementPage() {
  const {
    departments,
    users,
    processes,
    isLoading,
    createDepartment,
    createProcess,
    updateProcess,
    isSaving,
  } = useProcessAdministration()
  const [departmentName, setDepartmentName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProcessPayload>(EMPTY_FORM)

  const availableMembers = useMemo(
    () => users.filter((user) => user.penggunaId !== form.ownerId),
    [form.ownerId, users],
  )

  const resetForm = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const startEdit = (process: ProcessDto) => {
    setEditingId(process.processId)
    setForm({
      nama: process.nama,
      scope: process.scope,
      departmentId: process.departmentId,
      ownerId: process.ownerId,
      memberIds: process.members.map((member) => member.penggunaId),
    })
  }

  const changeScope = (scope: OrganizationalScope) => {
    setForm((current) => ({
      ...current,
      scope,
      departmentId: scope === 'FACULTY' ? null : current.departmentId,
    }))
  }

  const toggleMember = (penggunaId: string) => {
    setForm((current) => ({
      ...current,
      memberIds: current.memberIds.includes(penggunaId)
        ? current.memberIds.filter((id) => id !== penggunaId)
        : [...current.memberIds, penggunaId],
    }))
  }

  const canSubmit =
    form.nama.trim().length >= 2 &&
    form.ownerId !== '' &&
    form.memberIds.length >= 1 &&
    (form.scope === 'FACULTY' || form.departmentId !== null)

  const submitProcess = async () => {
    if (!canSubmit) return
    const payload: ProcessPayload = {
      ...form,
      nama: form.nama.trim(),
      departmentId: form.scope === 'FACULTY' ? null : form.departmentId,
      memberIds: form.memberIds.filter((id) => id !== form.ownerId),
    }
    try {
      if (editingId) {
        await updateProcess({ processId: editingId, payload })
      } else {
        await createProcess(payload)
      }
      resetForm()
    } catch {
      // useMutationWithToast owns the user-facing error message; preserve form state for correction.
    }
  }

  return (
    <ListPageLayout
      breadcrumb={[{ label: 'Administrasi' }, { label: 'Process FTI' }]}
      title="Process FTI"
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.8fr)]">
        <DataSurface.Root>
          <DataSurface.Header>
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold text-foreground">Process dan Process Team</h2>
              <p className="text-sm text-secondary-foreground">
                Scope menentukan approval boundary; owner dan member adalah assignment kontekstual per Process.
              </p>
            </div>
          </DataSurface.Header>
          <div className="divide-y divide-border">
            {isLoading ? (
              <p className="p-4 text-sm text-secondary-foreground">Memuat Process...</p>
            ) : processes.length === 0 ? (
              <p className="p-4 text-sm text-secondary-foreground">Belum ada Process.</p>
            ) : (
              processes.map((process) => (
                <div key={process.processId} className="flex items-start justify-between gap-4 p-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-foreground">{process.nama}</h3>
                      <span className="rounded-full border border-border px-2 py-0.5 text-xs text-secondary-foreground">
                        {process.scope === 'FACULTY' ? 'Faculty' : process.department?.nama ?? 'Department'}
                      </span>
                    </div>
                    <p className="text-sm text-secondary-foreground">
                      Owner: {process.owner.nama} · {process.members.length} member
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => startEdit(process)}>
                    Edit
                  </Button>
                </div>
              ))
            )}
          </div>
        </DataSurface.Root>

        <div className="space-y-5">
          <DataSurface.Root>
            <DataSurface.Header>
              <div className="space-y-0.5">
                <h2 className="text-sm font-semibold text-foreground">
                  {editingId ? 'Edit Process' : 'Tambah Process'}
                </h2>
                <p className="text-sm text-secondary-foreground">
                  Satu owner wajib dan minimal satu member selain owner.
                </p>
              </div>
            </DataSurface.Header>
            <div className="space-y-4 p-4">
              <label className="block space-y-1.5 text-sm font-medium text-foreground">
                Nama Process
                <Input
                  value={form.nama}
                  onChange={(event) => setForm((current) => ({ ...current, nama: event.target.value }))}
                  placeholder="Contoh: Tugas Akhir"
                />
              </label>

              <label className="block space-y-1.5 text-sm font-medium text-foreground">
                Scope
                <select
                  className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.scope}
                  onChange={(event) => changeScope(event.target.value as OrganizationalScope)}
                >
                  <option value="FACULTY">Faculty</option>
                  <option value="DEPARTMENT">Department</option>
                </select>
              </label>

              {form.scope === 'DEPARTMENT' ? (
                <label className="block space-y-1.5 text-sm font-medium text-foreground">
                  Departemen
                  <select
                    className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.departmentId ?? ''}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, departmentId: event.target.value || null }))
                    }
                  >
                    <option value="">Pilih departemen</option>
                    {departments.map((department) => (
                      <option key={department.departmentId} value={department.departmentId}>
                        {department.nama}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="block space-y-1.5 text-sm font-medium text-foreground">
                Process Owner
                <select
                  className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.ownerId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      ownerId: event.target.value,
                      memberIds: current.memberIds.filter((id) => id !== event.target.value),
                    }))
                  }
                >
                  <option value="">Pilih Process Owner</option>
                  {users.map((user) => (
                    <option key={user.penggunaId} value={user.penggunaId}>
                      {user.nama} · {user.email}
                    </option>
                  ))}
                </select>
              </label>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-foreground">Members</legend>
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-control border border-border p-2">
                  {availableMembers.length === 0 ? (
                    <p className="px-2 py-1 text-sm text-secondary-foreground">Tidak ada pengguna tersedia.</p>
                  ) : (
                    availableMembers.map((user) => (
                      <label
                        key={user.penggunaId}
                        className="flex cursor-pointer items-center gap-2 rounded-control px-2 py-1.5 text-sm hover:bg-surface-muted"
                      >
                        <input
                          type="checkbox"
                          checked={form.memberIds.includes(user.penggunaId)}
                          onChange={() => toggleMember(user.penggunaId)}
                        />
                        <span className="min-w-0 truncate">{user.nama} · {user.email}</span>
                      </label>
                    ))
                  )}
                </div>
              </fieldset>

              <div className="flex justify-end gap-2">
                {editingId ? (
                  <Button variant="outline" onClick={resetForm} disabled={isSaving}>
                    Batal
                  </Button>
                ) : null}
                <Button onClick={submitProcess} disabled={!canSubmit || isSaving}>
                  {editingId ? 'Simpan perubahan' : 'Buat Process'}
                </Button>
              </div>
            </div>
          </DataSurface.Root>

          <DataSurface.Root>
            <DataSurface.Header>
              <div className="space-y-0.5">
                <h2 className="text-sm font-semibold text-foreground">Departemen</h2>
                <p className="text-sm text-secondary-foreground">Dipakai hanya oleh Process scope Department.</p>
              </div>
            </DataSurface.Header>
            <div className="space-y-3 p-4">
              <div className="flex gap-2">
                <Input
                  value={departmentName}
                  onChange={(event) => setDepartmentName(event.target.value)}
                  placeholder="Nama departemen"
                />
                <Button
                  variant="outline"
                  disabled={departmentName.trim().length < 2 || isSaving}
                  onClick={async () => {
                    try {
                      await createDepartment(departmentName.trim())
                      setDepartmentName('')
                    } catch {
                      // Toast already reports the error; keep the input for correction.
                    }
                  }}
                >
                  Tambah
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {departments.map((department) => (
                  <span
                    key={department.departmentId}
                    className="rounded-full border border-border px-2.5 py-1 text-xs text-secondary-foreground"
                  >
                    {department.nama}
                  </span>
                ))}
              </div>
            </div>
          </DataSurface.Root>
        </div>
      </div>
    </ListPageLayout>
  )
}