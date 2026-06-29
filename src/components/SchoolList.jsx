import React from 'react';
import { useStore } from '../store/useStore';
import { SUBJECTS, GRADES, SUBJECT_COLOR_MAP, SUBJECT_ICON_MAP } from '../data/initialData';

export default function SchoolList({ onSelectSchool }) {
  const { schools, addSchool, deleteSchool, updateSchool } = useStore();

  const handleAdd = () => {
    const name = prompt('请输入学校名称：');
    if (name && name.trim()) addSchool(name.trim());
  };

  const handleRename = (e, school) => {
    e.stopPropagation();
    const name = prompt('修改学校名称：', school.name);
    if (name && name.trim()) updateSchool(school.id, name.trim());
  };

  const handleDelete = (e, school) => {
    e.stopPropagation();
    if (confirm(`确认删除"${school.name}"及所有数据？`)) deleteSchool(school.id);
  };

  return (
    <div className="page">
      <div className="header">
        <h1>🏫 备课组长管理</h1>
        <span className="subtitle">书店业务员专用</span>
      </div>

      <div className="content">
        {schools.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏫</div>
            <p>还没有添加学校</p>
            <button className="btn btn-primary" onClick={handleAdd}>+ 添加第一所学校</button>
          </div>
        ) : (
          schools.map(school => {
            const groupCount = school.groups.length;
            // 统计各科目人数
            const subjectCount = {};
            school.groups.forEach(g => {
              subjectCount[g.subject] = (subjectCount[g.subject] || 0) + 1;
            });
            return (
              <div key={school.id} className="school-card" onClick={() => onSelectSchool(school.id)}>
                <div className="school-card-top">
                  <div className="school-avatar">{school.name[0]}</div>
                  <div className="school-info">
                    <div className="school-name">{school.name}</div>
                    <div className="school-meta">
                      {GRADES.map(g => {
                        const cnt = school.groups.filter(gr => gr.grade === g).length;
                        return cnt > 0 ? <span key={g} className="grade-badge">{g}×{cnt}</span> : null;
                      })}
                    </div>
                  </div>
                  <div className="school-count">{groupCount}</div>
                </div>
                {Object.keys(subjectCount).length > 0 && (
                  <div className="school-subjects">
                    {Object.entries(subjectCount).map(([subj, cnt]) => (
                      <span key={subj} className="subject-dot" style={{ background: SUBJECT_COLOR_MAP[subj] }}>
                        {SUBJECT_ICON_MAP[subj]} {cnt}
                      </span>
                    ))}
                  </div>
                )}
                <div className="school-actions">
                  <button className="btn-text" onClick={(e) => handleRename(e, school)}>✏️ 改名</button>
                  <button className="btn-text danger" onClick={(e) => handleDelete(e, school)}>🗑 删除</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <button className="fab" onClick={handleAdd}>+</button>
    </div>
  );
}
