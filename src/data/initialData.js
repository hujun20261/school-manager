export const GRADES = ['初一', '初二', '初三'];
export const SUBJECTS = [
  { name: '语文', color: '#e74c3c', icon: '📖' },
  { name: '数学', color: '#3498db', icon: '🔢' },
  { name: '英语', color: '#2ecc71', icon: '🌍' },
  { name: '科学', color: '#f39c12', icon: '🔬' },
  { name: '社会', color: '#9b59b6', icon: '🏛️' },
];

export const SUBJECT_COLOR_MAP = Object.fromEntries(SUBJECTS.map(s => [s.name, s.color]));
export const SUBJECT_ICON_MAP = Object.fromEntries(SUBJECTS.map(s => [s.name, s.icon]));

// 坐标系统：x 左右（-7~7），z 前后（-5~5），中心为原点
export const initialSchools = [
  {
    id: 's1',
    name: '育才初级中学',
    groups: [
      { id: 'g1', schoolId: 's1', grade: '初一', subject: '语文', leaderName: '张晓梅', role: '备课组长', office: '101', seatX: -4, seatZ: -2, seatRotation: 0, phone: '13800001111', note: '' },
      { id: 'g2', schoolId: 's1', grade: '初一', subject: '数学', leaderName: '李国强', role: '备课组长', office: '101', seatX: 0, seatZ: -2, seatRotation: 0, phone: '13800002222', note: '' },
      { id: 'g3', schoolId: 's1', grade: '初二', subject: '英语', leaderName: '王芳', role: '备课组长', office: '101', seatX: 4, seatZ: -2, seatRotation: 0, phone: '13800003333', note: '' },
      { id: 'g3b', schoolId: 's1', grade: '初二', subject: '科学', leaderName: '赵建国', role: '普通老师', office: '101', seatX: -4, seatZ: 2, seatRotation: 0, phone: '13800006666', note: '' },
      { id: 'g3c', schoolId: 's1', grade: '初三', subject: '社会', leaderName: '孙丽华', role: '备课组长', office: '101', seatX: 0, seatZ: 2, seatRotation: 0, phone: '13800007777', note: '' },
    ]
  },
  {
    id: 's2',
    name: '实验初级中学',
    groups: [
      { id: 'g4', schoolId: 's2', grade: '初一', subject: '语文', leaderName: '陈志远', role: '备课组长', office: '301', seatX: -3, seatZ: -1, seatRotation: 0, phone: '13800004444', note: '' },
      { id: 'g5', schoolId: 's2', grade: '初三', subject: '科学', leaderName: '刘思敏', role: '备课组长', office: '301', seatX: 3, seatZ: -1, seatRotation: 0, phone: '13800005555', note: '' },
    ]
  }
];
