export interface AdministrasiFtiOverviewDto {
  accounts: {
    total: number
    active: number
    inactive: number
    workflowUsers: number
  }
  organization: {
    departemen: number
    prosesBisnis: number
    facultyProcesses: number
    departmentProcesses: number
  }
  ownerGovernance: {
    activeAssignments: number
    facultyScopes: number
    departmentScopes: number
  }
  finalApproval: {
    deanConfigured: boolean
    departmentHeadsConfigured: number
    departmentsWithoutHead: Array<{
      departemenId: string
      nama: string
    }>
  }
}
