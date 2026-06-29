import { create } from 'zustand';
import { initialSchools } from '../data/initialData';

// 将旧数据（seatRow/seatCol）转换为新格式（seatX/seatZ）
function migrateData(schools) {
  return schools.map(s => ({
    ...s,
    groups: s.groups.map(g => {
      const migrated = { ...g };
      // 迁移旧 row/col → x/z
      if (migrated.seatX === undefined && migrated.seatZ === undefined) {
        const row = migrated.seatRow || 1;
        const col = migrated.seatCol || 1;
        migrated.seatX = (col - 2) * 3.5;
        migrated.seatZ = (row - 1.5) * 3.0;
      }
      // 确保 seatRotation 存在
      if (migrated.seatRotation === undefined) migrated.seatRotation = 0;
      // 清理旧字段
      delete migrated.seatRow;
      delete migrated.seatCol;
      return migrated;
    }),
  }));
}

const loadData = () => {
  try {
    const saved = localStorage.getItem('school-mgr-mobile');
    return saved ? migrateData(JSON.parse(saved)) : migrateData(initialSchools);
  } catch { return migrateData(initialSchools); }
};

const saveData = (data) => {
  // 清理旧字段
  const clean = data.map(s => ({
    ...s,
    groups: s.groups.map(g => {
      const { seatRow, seatCol, ...rest } = g;
      return rest;
    }),
  }));
  localStorage.setItem('school-mgr-mobile', JSON.stringify(clean));
};

export const useStore = create((set, get) => ({
  schools: loadData(),
  activeTab: 'schools',
  selectedSchoolId: null,
  selectedGroupId: null,
  viewMode: 'list',

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedSchoolId: (id) => set({ selectedSchoolId: id, selectedGroupId: null, viewMode: 'list' }),
  setSelectedGroupId: (id) => set({ selectedGroupId: id }),
  setViewMode: (mode) => set({ viewMode: mode }),

  addSchool: (name) => set(s => {
    const updated = [...s.schools, { id: 's' + Date.now(), name, groups: [] }];
    saveData(updated);
    return { schools: updated };
  }),
  updateSchool: (id, name) => set(s => {
    const updated = s.schools.map(sc => sc.id === id ? { ...sc, name } : sc);
    saveData(updated);
    return { schools: updated };
  }),
  deleteSchool: (id) => set(s => {
    const updated = s.schools.filter(sc => sc.id !== id);
    saveData(updated);
    return { schools: updated, selectedSchoolId: s.selectedSchoolId === id ? (updated[0]?.id || null) : s.selectedSchoolId };
  }),

  addGroup: (schoolId, group) => set(s => {
    const newGroup = { ...group, id: 'g' + Date.now(), schoolId };
    const updated = s.schools.map(sc => sc.id === schoolId ? { ...sc, groups: [...sc.groups, newGroup] } : sc);
    saveData(updated);
    return { schools: updated };
  }),
  updateGroup: (schoolId, groupId, updates) => set(s => {
    const updated = s.schools.map(sc => sc.id === schoolId
      ? { ...sc, groups: sc.groups.map(g => g.id === groupId ? { ...g, ...updates } : g) }
      : sc);
    saveData(updated);
    return { schools: updated };
  }),
  deleteGroup: (schoolId, groupId) => set(s => {
    const updated = s.schools.map(sc => sc.id === schoolId
      ? { ...sc, groups: sc.groups.filter(g => g.id !== groupId) }
      : sc);
    saveData(updated);
    return { schools: updated };
  }),
}));
