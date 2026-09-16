/**
 * useDaftarSOPFilters Hook - SOP list filter state
 */

import { useState, useCallback, useMemo } from "react";

export interface DaftarSOPAdvancedFilters {
  statusFilter: string | null;
  filterTanggalDari: string | null;
  filterTanggalSampai: string | null;
}

export function useDaftarSopFilters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<DaftarSOPAdvancedFilters>({
    statusFilter: null,
    filterTanggalDari: null,
    filterTanggalSampai: null,
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const setStatusFilter = useCallback((status: string | null) => {
    setFilters((prev) => ({ ...prev, statusFilter: status }));
  }, []);

  const setFilterTanggalDari = useCallback((tanggal: string | null) => {
    setFilters((prev) => ({ ...prev, filterTanggalDari: tanggal }));
  }, []);

  const setFilterTanggalSampai = useCallback((tanggal: string | null) => {
    setFilters((prev) => ({ ...prev, filterTanggalSampai: tanggal }));
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      statusFilter: null,
      filterTanggalDari: null,
      filterTanggalSampai: null,
    });
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.statusFilter && filters.statusFilter !== "all") count++;
    if (filters.filterTanggalDari) count++;
    if (filters.filterTanggalSampai) count++;
    return count;
  }, [filters]);

  return {
    filters,
    searchQuery,
    filterStatus: filters.statusFilter,
    filterTanggalDari: filters.filterTanggalDari,
    filterTanggalSampai: filters.filterTanggalSampai,
    isFilterOpen,
    setIsFilterOpen,
    activeFilterCount,
    setSearchQuery,
    setStatusFilter,
    setFilterTanggalDari,
    setFilterTanggalSampai,
    clearSearch,
    clearFilters,
  };
}
