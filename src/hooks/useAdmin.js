import { useAsync } from './useAsync'
import { adminApi } from '../api/admin'

export const useAdminStats = () => useAsync(() => adminApi.getStats(), [])
export const useAdminUsers = (params = {}) => useAsync(() => adminApi.listUsers(params), [JSON.stringify(params)])
export const useAdminUser = (id) => useAsync(() => adminApi.getUser(id), [id])
export const useAdminReports = (status) => useAsync(() => adminApi.listReports(status), [status])
export const useAdminContent = (params = {}) => useAsync(() => adminApi.listContent(params), [JSON.stringify(params)])
export const useAuditLog = (params = {}) => useAsync(() => adminApi.listAuditLog(params), [JSON.stringify(params)])
