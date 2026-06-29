import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { GRADES, SUBJECTS, SUBJECT_COLOR_MAP, SUBJECT_ICON_MAP } from '../data/initialData';

export default function GroupList({ schoolId, onView3D }) {
  const { schools, addGroup, updateGroup, deleteGroup, setSelectedGroupId, selectedGroupId } = useStore();
  const school = schools.find(s => s.id === schoolId);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [filterGrade, setFilterGrade] = useState('全部');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!school) return [];
    return school.groups.filter(g => {
      const m = !search || g.leaderName.includes(search) || g.office.includes(search) || g.phone.includes(search);
      const gd = filterGrade === '全部' || g.grade === filterGrade;
      return m && gd;
    });
  }, [school, search, filterGrade]);

  // 按年级分组
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(g => {
      if (!map[g.grade]) map[g.grade] = [];
      map[g.grade].push(g);
    });
    // 按科目排序
    const subjOrder = SUBJECTS.map(s => s.name);
    Object.values(map).forEach(arr => {
      arr.sort((a, b) => subjOrder.indexOf(a.subject) - subjOrder.indexOf(b.subject));
    });
    return map;
  }, [filtered]);

  if (!school) return <div className="empty-state">学校不存在</div>;

  const gradeOrder = filterGrade === '全部' ? GRADES : [filterGrade];

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      grade: fd.get('grade'),
      subject: fd.get('subject'),
      leaderName: fd.get('leaderName'),
      office: fd.get('office'),
      seatRow: parseInt(fd.get('seatRow')) || 1,
      seatCol: parseInt(fd.get('seatCol')) || 1,
      phone: fd.get('phone'),
      note: fd.get('note'),
    };
    if (editTarget) {
      updateGroup(schoolId, editTarget.id, data);
      setEditTarget(null);
    } else {
      addGroup(schoolId, data);
    }
    setShowForm(false);
  };

  const openEdit = (group) => {
    setEditTarget(group);
    setShowForm(true);
  };

  return (
    <div className="page">
      <div className="header">
        <button className="btn-back" onClick={() => { useStore.getState().setSelectedSchoolId(null); }}>←</button>
        <div className="header-title">
          <h1>{school.name}</h1>
          <span className="subtitle">{school.groups.length} 位备课组长</span>
        </div>
        <button className="btn-icon" onClick={() => { setEditTarget(null); setShowForm(true); }}>+</button>
      </div>

      {/* 搜索和筛选 */}
      <div className="filter-bar">
        <input
          className="search-input"
          type="text"
          placeholder="🔍 搜索姓名/办公室/电话"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="filter-tabs">
          <button className={`tab ${filterGrade === '全部' ? 'active' : ''}`} onClick={() => setFilterGrade('全部')}>全部</button>
          {GRADES.map(g => (
            <button key={g} className={`tab ${filterGrade === g ? 'active' : ''}`} onClick={() => setFilterGrade(g)}>{g}</button>
          ))}
        </div>
      </div>

      <div className="content">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>{search || filterGrade !== '全部' ? '没有匹配的结果' : '还没有添加备课组长'}</p>
            <button className="btn btn-primary" onClick={() => { setEditTarget(null); setShowForm(true); }}>+ 添加备课组长</button>
          </div>
        ) : (
          gradeOrder.map(grade => {
            const items = grouped[grade];
            if (!items || items.length === 0) return null;
            return (
              <div key={grade} className="grade-section">
                <div className="grade-header">{grade}</div>
                {items.map(group => {
                  const subj = SUBJECTS.find(s => s.name === group.subject);
                  const isSelected = selectedGroupId === group.id;
                  return (
                    <div
                      key={group.id}
                      className={`group-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedGroupId(isSelected ? null : group.id)}
                    >
                      <div className="group-card-left">
                        <div className="subject-badge" style={{ background: subj?.color || '#999' }}>
                          {subj?.icon || '📚'}
                        </div>
                      </div>
                      <div className="group-card-body">
                        <div className="group-name">
                          {group.leaderName}
                          <span className="role-tag">{group.role || '备课组长'}</span>
                        </div>
                        <div className="group-detail">
                          🏢 {group.office}号室
                        </div>
                        {group.phone && <div className="group-detail">📞 {group.phone}</div>}
                        {group.note && <div className="group-note">💬 {group.note}</div>}
                      </div>
                      <div className="group-card-actions">
                        <button className="btn-icon-small" onClick={(e) => { e.stopPropagation(); onView3D(group); }} title="3D视图">🎲</button>
                        <button className="btn-icon-small" onClick={(e) => { e.stopPropagation(); openEdit(group); }}>✏️</button>
                        <button className="btn-icon-small danger" onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`删除${group.leaderName}的信息？`)) deleteGroup(schoolId, group.id);
                        }}>🗑</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {/* 浮动添加按钮 */}
      {/* 顶部 + 号已存在，去掉底部 fab */}

      {/* 表单弹窗 */}
      {showForm && (
        <FormModal
          initialData={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

function FormModal({ initialData, onClose, onSubmit }) {
  const def = initialData || { grade: '初一', subject: '语文', leaderName: '', role: '备课组长', office: '', seatX: 0, seatZ: 0, phone: '', note: '' };
  const [form, setForm] = useState(def);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.leaderName.trim()) { alert('请输入组长姓名'); return; }
    if (!form.office.trim()) { alert('请输入办公室号'); return; }
    onSubmit(e);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initialData ? '编辑备课组长' : '添加备课组长'}</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group half">
              <label>年级</label>
              <select name="grade" value={form.grade} onChange={e => set('grade', e.target.value)}>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group half">
              <label>科目</label>
              <select name="subject" value={form.subject} onChange={e => set('subject', e.target.value)}>
                {SUBJECTS.map(s => <option key={s.name} value={s.name}>{s.icon} {s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>身份 *</label>
            <select name="role" value={form.role || '备课组长'} onChange={e => set('role', e.target.value)}>
              <option value="备课组长">备课组长</option>
              <option value="普通老师">普通老师</option>
            </select>
          </div>
          <div className="form-group">
            <label>姓名 *</label>
            <input name="leaderName" value={form.leaderName} onChange={e => set('leaderName', e.target.value)} placeholder="请输入姓名" required />
          </div>
          <div className="form-row">
            <div className="form-group half">
              <label>办公室号 *</label>
              <input name="office" value={form.office} onChange={e => set('office', e.target.value)} placeholder="如 101" required />
            </div>
            <div className="form-group half">
              <label>联系电话</label>
              <input name="phone" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="手机号" />
            </div>
          </div>
          <div className="form-section-title">📍 座位位置（进入3D编辑模式可拖拽摆放）</div>
          <div className="form-group">
            <label>备注</label>
            <textarea name="note" value={form.note} onChange={e => set('note', e.target.value)} placeholder="可选备注信息" rows="2" />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>取消</button>
            <button type="submit" className="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>
  );
}
