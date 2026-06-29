import React from 'react';
import { useStore } from './store/useStore';
import SchoolList from './components/SchoolList';
import GroupList from './components/GroupList';
import OfficeView3D from './components/OfficeView3D';

export default function App() {
  const { selectedSchoolId, viewMode, setSelectedSchoolId, setViewMode, setSelectedGroupId } = useStore();

  const handleView3D = (group) => {
    setSelectedGroupId(group.id);
    setViewMode('3d');
  };

  if (selectedSchoolId && viewMode === '3d') {
    return <OfficeView3D />;
  }

  if (selectedSchoolId) {
    return <GroupList schoolId={selectedSchoolId} onView3D={handleView3D} />;
  }

  return <SchoolList onSelectSchool={setSelectedSchoolId} />;
}
