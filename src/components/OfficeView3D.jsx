import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { SUBJECT_COLOR_MAP, SUBJECT_ICON_MAP, GRADES, SUBJECTS } from '../data/initialData';

const SUBJECT_3D_COLORS = {
  '语文': 0xe74c3c, '数学': 0x3498db, '英语': 0x2ecc71, '科学': 0xf39c12, '社会': 0x9b59b6,
};
const SUBJECT_LIGHT_COLORS = {
  '语文': '#fce4e4', '数学': '#e3f0fc', '英语': '#e4fce8', '科学': '#fcf3e4', '社会': '#f0e4fc',
};

const ROOM_W = 18;
const ROOM_D = 14;

// 默认尺寸
const DEFAULT_ROOM_W = 18;
const DEFAULT_ROOM_D = 14;

// ============ 办公桌（含旋转） ============
function createOfficeDesk(x, z, rotation, group, isHighlighted, isDragging) {
  const grp = new THREE.Group();
  const subjectColor = SUBJECT_3D_COLORS[group.subject] || 0x607d8b;
  const lightColor = SUBJECT_LIGHT_COLORS[group.subject] || '#f0f0f0';

  let deskColor = subjectColor;
  if (isDragging) deskColor = 0x66bb6a;
  if (isHighlighted && !isDragging) deskColor = 0xffc107;

  // 桌面 2.7×1.5（已放大 50%）
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(2.7, 0.09, 1.5),
    new THREE.MeshStandardMaterial({
      color: deskColor, roughness: 0.5, metalness: 0.1,
      emissive: isHighlighted ? 0xff8f00 : (isDragging ? 0x2e7d32 : 0),
      emissiveIntensity: isHighlighted ? 0.25 : (isDragging ? 0.2 : 0),
    })
  );
  top.position.y = 1.12;
  top.castShadow = true;
  top.receiveShadow = true;
  top.name = 'desktop';
  grp.add(top);

  // 边缘
  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(2.76, 0.045, 1.56),
    new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.3, metalness: 0.5 })
  );
  edge.position.y = 1.17;
  grp.add(edge);

  // 桌腿
  const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.12);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.2, metalness: 0.8 });
  [[-1.23, 0.56, -0.63], [1.23, 0.56, -0.63], [-1.23, 0.56, 0.63], [1.23, 0.56, 0.63]].forEach(([lx, ly, lz]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(lx, ly, lz);
    leg.castShadow = true;
    grp.add(leg);
  });

  // 横梁
  const beamGeo = new THREE.BoxGeometry(2.4, 0.045, 0.045);
  [0.63, -0.63].forEach(zOff => {
    grp.add(new THREE.Mesh(beamGeo, legMat)).position.set(0, 0.38, zOff);
  });

  // 办公椅
  const chairGroup = new THREE.Group();
  const chairMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4, metalness: 0.3 });
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 16), chairMat);
  seat.position.y = 0.82;
  chairGroup.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.75, 0.09), chairMat);
  back.position.set(0, 1.27, -0.3);
  chairGroup.add(back);
  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.075, 0.82),
    new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.1, metalness: 0.9 })
  );
  pillar.position.y = 0.41;
  chairGroup.add(pillar);
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.33, 0.375, 0.06, 5),
    new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.1, metalness: 0.9 })
  );
  base.position.y = 0.03;
  chairGroup.add(base);
  chairGroup.position.set(0, 0, 1.02);
  grp.add(chairGroup);

  // 桌面标签 — 超大鲜艳
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 1600;
  labelCanvas.height = 800;
  const ctx = labelCanvas.getContext('2d');
  // 科目色背景（加白色底衬）
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  try { ctx.roundRect(20, 20, 1560, 760, 60); } catch { ctx.fillRect(20, 20, 1560, 760); }
  ctx.fill();
  // 科目色内框
  ctx.fillStyle = lightColor;
  ctx.beginPath();
  try { ctx.roundRect(30, 30, 1540, 740, 55); } catch { ctx.fillRect(30, 30, 1540, 740); }
  ctx.fill();
  // 科目名 — 鲜艳大字
  const subjColor = SUBJECT_COLOR_MAP[group.subject] || '#607d8b';
  ctx.fillStyle = subjColor;
  ctx.font = 'bold 220px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(group.subject, 800, 280);
  // 姓名 — 深色加粗
  ctx.fillStyle = '#111';
  ctx.font = 'bold 140px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText(group.leaderName, 800, 460);
  // 身份标签
  const roleText = group.role || '备课组长';
  ctx.fillStyle = subjColor;
  ctx.font = 'bold 85px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText(roleText + ' · ' + group.grade, 800, 580);

  const labelTex = new THREE.CanvasTexture(labelCanvas);
  labelTex.minFilter = THREE.LinearFilter;
  labelTex.magFilter = THREE.LinearFilter;
  const labelPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(2.7, 1.5),
    new THREE.MeshBasicMaterial({ map: labelTex, transparent: true, side: THREE.DoubleSide, depthTest: false, depthWrite: false })
  );
  labelPlane.rotation.x = -Math.PI / 2;
  labelPlane.position.y = 1.19;
  labelPlane.renderOrder = 1;
  grp.add(labelPlane);

  // 桌面小物
  const holder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.22, 12),
    new THREE.MeshStandardMaterial({ color: 0x795548, roughness: 0.6 })
  );
  holder.position.set(0.75, 1.27, -0.3);
  grp.add(holder);

  const paperGeo = new THREE.BoxGeometry(0.375, 0.045, 0.27);
  for (let i = 0; i < 3; i++) {
    const paper = new THREE.Mesh(paperGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }));
    paper.position.set(-0.6, 1.18 + i * 0.022, -0.15 + i * 0.015);
    paper.rotation.y = i * 0.2;
    grp.add(paper);
  }

  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.06, 0.15, 12),
    new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3 })
  );
  cup.position.set(-0.82, 1.24, 0.3);
  grp.add(cup);

  grp.position.set(x, 0, z);
  grp.rotation.y = rotation;
  grp.userData.groupId = group.id;
  grp.userData.seatX = x;
  grp.userData.seatZ = z;
  grp.userData.seatRotation = rotation;
  return grp;
}

// ============ 编辑弹窗 ============
function EditModal({ group, schoolId, onClose }) {
  const { updateGroup, deleteGroup, addGroup } = useStore();
  const schools = useStore(s => s.schools);
  const school = schools.find(s => s.id === schoolId);
  const isNew = !group;

  const [form, setForm] = useState(group || {
    grade: '初一', subject: '语文', leaderName: '', role: '备课组长', office: '',
    seatX: 0, seatZ: 0, seatRotation: 0, phone: '', note: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.leaderName.trim()) { alert('请输入组长姓名'); return; }
    if (!form.office.trim()) { alert('请输入办公室号'); return; }
    const data = { ...form, seatX: Number(form.seatX), seatZ: Number(form.seatZ), seatRotation: Number(form.seatRotation) };
    if (isNew) addGroup(schoolId, data);
    else updateGroup(schoolId, group.id, data);
    onClose();
  };

  const handleDelete = () => {
    if (!isNew && confirm(`确定删除 ${group.leaderName} 的信息？`)) {
      deleteGroup(schoolId, group.id);
      onClose();
    }
  };

  const officeOptions = [...new Set(school?.groups.map(g => g.office) || [])].sort();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isNew ? '➕ 添加座位' : '✏️ 编辑座位'}</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group half">
              <label>年级</label>
              <select value={form.grade} onChange={e => set('grade', e.target.value)}>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group half">
              <label>科目</label>
              <select value={form.subject} onChange={e => set('subject', e.target.value)}>
                {SUBJECTS.map(s => <option key={s.name} value={s.name}>{s.icon} {s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>身份 *</label>
            <select value={form.role || '备课组长'} onChange={e => set('role', e.target.value)}>
              <option value="备课组长">备课组长</option>
              <option value="普通老师">普通老师</option>
            </select>
          </div>
          <div className="form-group">
            <label>姓名 *</label>
            <input value={form.leaderName} onChange={e => set('leaderName', e.target.value)} placeholder="请输入姓名" required />
          </div>
          <div className="form-row">
            <div className="form-group half">
              <label>办公室号 *</label>
              <select value={form.office} onChange={e => set('office', e.target.value)}>
                <option value="">选择</option>
                {officeOptions.map(o => <option key={o} value={o}>{o}号室</option>)}
              </select>
              <input value={form.office} onChange={e => set('office', e.target.value)} placeholder="或输入新号" style={{ marginTop: 4, fontSize: '0.85rem', padding: '8px 10px' }} />
            </div>
            <div className="form-group half">
              <label>电话</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="手机号" />
            </div>
          </div>
          <div className="form-section-title">📍 座位位置（进入3D编辑模式可拖拽摆放）</div>
          <div className="form-group">
            <label>备注</label>
            <textarea value={form.note} onChange={e => set('note', e.target.value)} placeholder="可选备注" rows="2" />
          </div>
          <div className="form-actions">
            {!isNew && (
              <button type="button" className="btn btn-outline" onClick={handleDelete} style={{ color: '#e74c3c', borderColor: '#e74c3c' }}>
                🗑 删除
              </button>
            )}
            <button type="button" className="btn btn-outline" onClick={onClose}>取消</button>
            <button type="submit" className="btn btn-primary">💾 保存</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============ 主组件 ============
export default function OfficeView3D() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const animRef = useRef(null);
  const deskGroupsRef = useRef([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const orbitRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 2.4, radius: 10 });
  const touchRef = useRef({ active: false, prevX: 0, prevY: 0, dist: 0, prevAngle: 0 });
  const dragDataRef = useRef({ target: null, offsetX: 0, offsetZ: 0, mode: 'move' }); // 'move' | 'rotate'

  const schools = useStore(s => s.schools);
  const selectedSchoolId = useStore(s => s.selectedSchoolId);
  const selectedGroupId = useStore(s => s.selectedGroupId);
  const setSelectedGroupId = useStore(s => s.setSelectedGroupId);
  const updateGroup = useStore(s => s.updateGroup);

  const [editMode, setEditMode] = useState(false);
  const [roomSize, setRoomSize] = useState({ w: DEFAULT_ROOM_W, d: DEFAULT_ROOM_D });
  const ROOM_W = roomSize.w;
  const ROOM_D = roomSize.d;
  const [editTarget, setEditTarget] = useState(null);
  const [dragTargetId, setDragTargetId] = useState(null);
  const [dragPreview, setDragPreview] = useState(null); // { x, z, rotation }
  const [toastMsg, setToastMsg] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(null);
  const [rotateTargetId, setRotateTargetId] = useState(null);

  const school = schools.find(s => s.id === selectedSchoolId);
  const selectedGroup = school?.groups.find(g => g.id === selectedGroupId);
  const officeGroups = selectedGroup
    ? school.groups.filter(g => g.office === selectedGroup.office)
    : school?.groups || [];

  const updateCamera = useCallback(() => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = orbitRef.current;
    cameraRef.current.position.set(
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.cos(theta)
    );
    cameraRef.current.lookAt(0, 0.6, 0);
  }, []);

  const clampPos = useCallback((wx, wz) => ({
    x: Math.max(-ROOM_W / 2 + 1.8, Math.min(ROOM_W / 2 - 1.8, wx)),
    z: Math.max(-ROOM_D / 2 + 1.8, Math.min(ROOM_D / 2 - 1.8, wz)),
  }), [ROOM_W, ROOM_D]);

  // ========== 场景初始化 ==========
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const w = mount.clientWidth, h = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfafaf7);
    scene.fog = new THREE.Fog(0xfafaf7, 20, 50);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0xfff8f0, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(10, 20, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 60;
    sun.shadow.camera.left = -15; sun.shadow.camera.right = 15;
    sun.shadow.camera.top = 15; sun.shadow.camera.bottom = -15;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xffe8d0, 0.4);
    fill.position.set(-6, 4, -4);
    scene.add(fill);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_W, ROOM_D),
      new THREE.MeshStandardMaterial({ color: 0xc4a882, roughness: 0.6, metalness: 0.05 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = 'floor';
    scene.add(floor);

    const grid = new THREE.GridHelper(Math.max(ROOM_W, ROOM_D), 20, 0xddccbb, 0xddccbb);
    grid.material.opacity = 0.1;
    grid.material.transparent = true;
    grid.position.y = 0.005;
    scene.add(grid);

    // 踢脚线
    const bbMat = new THREE.MeshStandardMaterial({ color: 0xd5c5b0, roughness: 0.7 });
    const halfW = ROOM_W / 2, halfD = ROOM_D / 2;
    [[0, 0, -halfD, ROOM_W, 0.12, 0.08],
     [0, 0, halfD, ROOM_W, 0.12, 0.08],
     [-halfW, 0, 0, 0.08, 0.12, ROOM_D],
     [halfW, 0, 0, 0.08, 0.12, ROOM_D]].forEach(([x, y, z, sx, sy, sz]) => {
      const bb = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), bbMat);
      bb.position.set(x, 0.06, z);
      scene.add(bb);
    });

    // 半透明窗框
    const winMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3, metalness: 0.4, transparent: true, opacity: 0.35 });
    [-6, -2, 2, 6].forEach(x => {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.0, 0.04), winMat);
      frame.position.set(x, 2.2, -halfD + 0.05);
      scene.add(frame);
    });

    // ===== 门标志（后墙上方，醒目实体） =====
    const doorGroup = new THREE.Group();
    // 门框
    const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.3, metalness: 0.2 });
    // 左边框
    const dl = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.2, 0.15), doorFrameMat);
    dl.position.set(-0.7, 1.6, 0);
    doorGroup.add(dl);
    // 右边框
    const dr = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.2, 0.15), doorFrameMat);
    dr.position.set(0.7, 1.6, 0);
    doorGroup.add(dr);
    // 上边框
    const dt = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.12, 0.15), doorFrameMat);
    dt.position.set(0, 3.2, 0);
    doorGroup.add(dt);
    // 门板（略深色）
    const doorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 3.0, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.4, metalness: 0.1 })
    );
    doorPanel.position.set(0, 1.55, 0);
    doorGroup.add(doorPanel);
    // 门把手
    const handleGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.2, metalness: 0.9 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0.4, 1.55, 0.06);
    doorGroup.add(handle);
    // "出口"文字标签
    const doorLabelCanvas = document.createElement('canvas');
    doorLabelCanvas.width = 256;
    doorLabelCanvas.height = 64;
    const dlctx = doorLabelCanvas.getContext('2d');
    dlctx.fillStyle = '#6d4c41';
    dlctx.font = 'bold 28px "PingFang SC","Microsoft YaHei",sans-serif';
    dlctx.textAlign = 'center';
    dlctx.fillText('🚪 入口', 128, 42);
    const doorLabelTex = new THREE.CanvasTexture(doorLabelCanvas);
    doorLabelTex.minFilter = THREE.LinearFilter;
    const doorLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.3),
      new THREE.MeshBasicMaterial({ map: doorLabelTex, transparent: true, side: THREE.DoubleSide, depthTest: false, depthWrite: false })
    );
    doorLabel.position.set(0, 3.5, 0);
    doorLabel.renderOrder = 2;
    doorGroup.add(doorLabel);

    doorGroup.position.set(0, 0, -halfD + 0.1);
    scene.add(doorGroup);

    function addPlant(x, z) {
      const pg = new THREE.Group();
      pg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.18, 0.5, 12), new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.6 }))).position.y = 0.25;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.7 }));
      leaf.position.y = 0.7; leaf.scale.set(1, 0.7, 1);
      pg.add(leaf);
      pg.position.set(x, 0, z);
      scene.add(pg);
    }
    addPlant(-halfW + 1, -halfD + 1); addPlant(halfW - 1, -halfD + 1);
    addPlant(-halfW + 1, halfD - 1); addPlant(halfW - 1, halfD - 1);

    const wg = new THREE.Group();
    wg.add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 0.4), new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3 }))).position.y = 0.6;
    wg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.5, 12), new THREE.MeshStandardMaterial({ color: 0xbbdefb, roughness: 0.2, transparent: true, opacity: 0.7 }))).position.y = 1.2;
    wg.position.set(halfW - 1.5, 0, halfD - 1.5);
    scene.add(wg);

    const cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.8, 0.5), new THREE.MeshStandardMaterial({ color: 0x9e9e9e, roughness: 0.3, metalness: 0.4 }));
    cabinet.position.set(-halfW + 1.5, 0.9, halfD - 1.5);
    cabinet.castShadow = true;
    scene.add(cabinet);

    updateCamera();

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w2 = mount.clientWidth, h2 = mount.clientHeight;
      camera.aspect = w2 / h2; camera.updateProjectionMatrix();
      renderer.setSize(w2, h2);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [updateCamera, roomSize.w, roomSize.d]);

  // ========== 渲染办公桌 ==========
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    deskGroupsRef.current.forEach(d => {
      scene.remove(d);
      d.traverse(c => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) {
          if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
          else c.material.dispose();
        }
      });
    });
    deskGroupsRef.current = [];

    officeGroups.forEach(group => {
      const isHighlighted = group.id === selectedGroupId;
      const isDragging = dragTargetId === group.id;
      const sx = isDragging && dragPreview ? dragPreview.x : (group.seatX || 0);
      const sz = isDragging && dragPreview ? dragPreview.z : (group.seatZ || 0);
      const sr = isDragging && dragPreview ? dragPreview.rotation : (group.seatRotation || 0);
      const desk = createOfficeDesk(sx, sz, sr, group, isHighlighted, isDragging);
      deskGroupsRef.current.push(desk);
      scene.add(desk);
    });
  }, [officeGroups, selectedGroupId, dragTargetId, dragPreview]);

  // ========== 拾取 & 坐标转换 ==========
  const pickDesk = useCallback((clientX, clientY) => {
    const mount = mountRef.current;
    const camera = cameraRef.current;
    if (!mount || !camera) return null;
    const rect = mount.getBoundingClientRect();
    mouseRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycasterRef.current.setFromCamera(mouseRef.current, camera);
    const intersects = raycasterRef.current.intersectObjects(deskGroupsRef.current, true);
    if (intersects.length > 0) {
      let obj = intersects[0].object;
      while (obj && !(obj.userData && obj.userData.groupId)) obj = obj.parent;
      return obj;
    }
    return null;
  }, []);

  const screenToFloor = useCallback((clientX, clientY) => {
    const mount = mountRef.current;
    const camera = cameraRef.current;
    if (!mount || !camera) return null;
    const rect = mount.getBoundingClientRect();
    mouseRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycasterRef.current.setFromCamera(mouseRef.current, camera);
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const pt = new THREE.Vector3();
    if (raycasterRef.current.ray.intersectPlane(floorPlane, pt)) {
      return clampPos(pt.x, pt.z);
    }
    return null;
  }, [clampPos]);

  // ========== 触屏事件 ==========
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let touchStartTime = 0, touchStartPos = { x: 0, y: 0 };
    let hasMoved = false, longPressTimer = null;
    let twoFingerStartAngle = 0;

    const onTouchStart = (e) => {
      touchStartTime = Date.now();
      hasMoved = false;

      if (e.touches.length === 1) {
        touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        touchRef.current = { active: true, prevX: e.touches[0].clientX, prevY: e.touches[0].clientY, dist: 0, prevAngle: 0 };

        if (editMode) {
          longPressTimer = setTimeout(() => {
            const desk = pickDesk(touchStartPos.x, touchStartPos.y);
            if (desk?.userData.groupId) {
              const g = school?.groups.find(gr => gr.id === desk.userData.groupId);
              if (g) {
                const floor = screenToFloor(touchStartPos.x, touchStartPos.y);
                dragDataRef.current = {
                  target: g,
                  offsetX: g.seatX - (floor ? floor.x : g.seatX),
                  offsetZ: g.seatZ - (floor ? floor.z : g.seatZ),
                  mode: 'move',
                };
                setDragTargetId(g.id);
                setDragPreview({ x: g.seatX, z: g.seatZ, rotation: g.seatRotation || 0 });
                setToastMsg('拖动移动位置 · 双指旋转桌面朝向');
              }
            }
          }, 500);
        }
      } else if (e.touches.length === 2) {
        clearTimeout(longPressTimer);
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        twoFingerStartAngle = Math.atan2(dy, dx);
        touchRef.current = { active: true, prevX: 0, prevY: 0, dist, prevAngle: twoFingerStartAngle };
      }
    };

    const onTouchMove = (e) => {
      e.preventDefault();
      const mx = e.touches[0].clientX - touchStartPos.x;
      const my = e.touches[0].clientY - touchStartPos.y;
      if (Math.abs(mx) > 5 || Math.abs(my) > 5) { hasMoved = true; clearTimeout(longPressTimer); }
      if (!touchRef.current.active) return;

      if (e.touches.length === 1) {
        if (dragTargetId && dragDataRef.current.mode === 'move') {
          // 单指拖动移动
          const floor = screenToFloor(e.touches[0].clientX, e.touches[0].clientY);
          if (floor) {
            setDragPreview(prev => ({
              ...prev,
              x: floor.x + dragDataRef.current.offsetX,
              z: floor.z + dragDataRef.current.offsetZ,
            }));
          }
        } else {
          // 旋转视角
          const dx2 = e.touches[0].clientX - touchRef.current.prevX;
          const dy2 = e.touches[0].clientY - touchRef.current.prevY;
          orbitRef.current.theta += dx2 * 0.008;
          orbitRef.current.phi = Math.max(0.4, Math.min(Math.PI / 2.4, orbitRef.current.phi + dy2 * 0.008));
          touchRef.current.prevX = e.touches[0].clientX;
          touchRef.current.prevY = e.touches[0].clientY;
          updateCamera();
        }
      } else if (e.touches.length === 2) {
        const dx2 = e.touches[0].clientX - e.touches[1].clientX;
        const dy2 = e.touches[0].clientY - e.touches[1].clientY;
        const nd = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        const newAngle = Math.atan2(dy2, dx2);

        if (dragTargetId && editMode) {
          // 双指旋转桌面
          const angleDelta = newAngle - touchRef.current.prevAngle;
          if (Math.abs(angleDelta) > 0.005) {
            dragDataRef.current.mode = 'rotate';
            setDragPreview(prev => ({
              ...prev,
              rotation: prev.rotation + angleDelta,
            }));
          }
        } else if (touchRef.current.dist > 0) {
          // 双指缩放
          orbitRef.current.radius = Math.max(5, Math.min(30, orbitRef.current.radius + (touchRef.current.dist - nd) * 0.04));
          updateCamera();
        }
        touchRef.current.dist = nd;
        touchRef.current.prevAngle = newAngle;
      }
    };

    const onTouchEnd = (e) => {
      clearTimeout(longPressTimer);
      touchRef.current.active = false;

      if (dragTargetId && dragPreview) {
        const target = dragDataRef.current.target;
        updateGroup(selectedSchoolId, target.id, {
          seatX: Math.round(dragPreview.x * 10) / 10,
          seatZ: Math.round(dragPreview.z * 10) / 10,
          seatRotation: Math.round(dragPreview.rotation * 100) / 100,
        });
        const modeText = dragDataRef.current.mode === 'rotate' ? '已旋转' : '已移动';
        setToastMsg(`${target.leaderName} ${modeText}`);
        setDragTargetId(null);
        setDragPreview(null);
        dragDataRef.current = { target: null, offsetX: 0, offsetZ: 0, mode: 'move' };
        return;
      }

      if (!hasMoved && e.changedTouches.length === 1) {
        const desk = pickDesk(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        if (desk?.userData.groupId) {
          if (editMode) {
            const g = school?.groups.find(gr => gr.id === desk.userData.groupId);
            if (g) setEditTarget(g);
          } else {
            setSelectedGroupId(desk.userData.groupId === selectedGroupId ? null : desk.userData.groupId);
          }
        } else if (editMode) {
          const floor = screenToFloor(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
          if (floor) setCreatingGroup({ seatX: Math.round(floor.x * 10) / 10, seatZ: Math.round(floor.z * 10) / 10, seatRotation: 0, office: selectedGroup?.office || '' });
        }
      }
    };

    mount.addEventListener('touchstart', onTouchStart, { passive: false });
    mount.addEventListener('touchmove', onTouchMove, { passive: false });
    mount.addEventListener('touchend', onTouchEnd);
    return () => {
      mount.removeEventListener('touchstart', onTouchStart);
      mount.removeEventListener('touchmove', onTouchMove);
      mount.removeEventListener('touchend', onTouchEnd);
      clearTimeout(longPressTimer);
    };
  }, [editMode, dragTargetId, dragPreview, selectedGroupId, school, officeGroups, pickDesk, screenToFloor, updateCamera, selectedSchoolId, updateGroup, setSelectedGroupId, selectedGroup]);

  // ========== 鼠标事件 ==========
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let isDragging = false, lastX = 0, lastY = 0, mouseMoved = false;

    const down = (e) => {
      isDragging = true; lastX = e.clientX; lastY = e.clientY; mouseMoved = false;
      // 编辑模式：shift+点击开始旋转
      if (editMode && e.shiftKey) {
        const desk = pickDesk(e.clientX, e.clientY);
        if (desk?.userData.groupId) {
          const g = school?.groups.find(gr => gr.id === desk.userData.groupId);
          if (g) {
            dragDataRef.current = { target: g, offsetX: 0, offsetZ: 0, mode: 'rotate' };
            setDragTargetId(g.id);
            setDragPreview({ x: g.seatX, z: g.seatZ, rotation: g.seatRotation || 0 });
          }
        }
      }
    };

    const move = (e) => {
      if (!isDragging) return;
      if (Math.abs(e.clientX - lastX) > 3 || Math.abs(e.clientY - lastY) > 3) mouseMoved = true;

      if (dragTargetId) {
        if (dragDataRef.current.mode === 'rotate') {
          // shift+拖动 = 旋转
          const angleDelta = (e.clientX - lastX) * 0.01;
          setDragPreview(prev => ({ ...prev, rotation: prev.rotation + angleDelta }));
          lastX = e.clientX; lastY = e.clientY;
        } else {
          // 普通拖动 = 移动
          const floor = screenToFloor(e.clientX, e.clientY);
          if (floor) {
            setDragPreview(prev => ({
              ...prev,
              x: floor.x + dragDataRef.current.offsetX,
              z: floor.z + dragDataRef.current.offsetZ,
            }));
          }
        }
      } else {
        orbitRef.current.theta += (e.clientX - lastX) * 0.008;
        orbitRef.current.phi = Math.max(0.4, Math.min(Math.PI / 2.4, orbitRef.current.phi + (e.clientY - lastY) * 0.008));
        lastX = e.clientX; lastY = e.clientY;
        updateCamera();
      }
    };

    const up = (e) => {
      isDragging = false;
      if (dragTargetId && dragPreview) {
        const target = dragDataRef.current.target;
        updateGroup(selectedSchoolId, target.id, {
          seatX: Math.round(dragPreview.x * 10) / 10,
          seatZ: Math.round(dragPreview.z * 10) / 10,
          seatRotation: Math.round(dragPreview.rotation * 100) / 100,
        });
        const modeText = dragDataRef.current.mode === 'rotate' ? '已旋转' : '已移动';
        setToastMsg(`${target.leaderName} ${modeText}`);
        setDragTargetId(null); setDragPreview(null);
        dragDataRef.current = { target: null, offsetX: 0, offsetZ: 0, mode: 'move' };
        return;
      }

      if (!mouseMoved) {
        const desk = pickDesk(e.clientX, e.clientY);
        if (desk?.userData.groupId) {
          if (editMode) {
            // 编辑模式下普通点击 = 开始拖动移动
            const g = school?.groups.find(gr => gr.id === desk.userData.groupId);
            if (g) {
              const floor = screenToFloor(e.clientX, e.clientY);
              dragDataRef.current = {
                target: g,
                offsetX: g.seatX - (floor ? floor.x : g.seatX),
                offsetZ: g.seatZ - (floor ? floor.z : g.seatZ),
                mode: 'move',
              };
              setDragTargetId(g.id);
              setDragPreview({ x: g.seatX, z: g.seatZ, rotation: g.seatRotation || 0 });
              setToastMsg('拖动移动 · 按住Shift拖动旋转');
            }
          } else {
            setSelectedGroupId(desk.userData.groupId === selectedGroupId ? null : desk.userData.groupId);
          }
        } else if (editMode) {
          const floor = screenToFloor(e.clientX, e.clientY);
          if (floor) setCreatingGroup({ seatX: Math.round(floor.x * 10) / 10, seatZ: Math.round(floor.z * 10) / 10, seatRotation: 0, office: selectedGroup?.office || '' });
        }
      }
    };

    const wheel = (e) => {
      orbitRef.current.radius = Math.max(5, Math.min(30, orbitRef.current.radius + e.deltaY * 0.015));
      updateCamera();
    };

    const dblClick = (e) => {
      const desk = pickDesk(e.clientX, e.clientY);
      if (desk?.userData.groupId) {
        const g = school?.groups.find(gr => gr.id === desk.userData.groupId);
        if (g) { setEditTarget(g); if (!editMode) setEditMode(true); }
      }
    };

    mount.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    mount.addEventListener('wheel', wheel, { passive: true });
    mount.addEventListener('dblclick', dblClick);
    return () => {
      mount.removeEventListener('mousedown', down);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      mount.removeEventListener('wheel', wheel);
      mount.removeEventListener('dblclick', dblClick);
    };
  }, [editMode, dragTargetId, dragPreview, selectedGroupId, school, officeGroups, pickDesk, screenToFloor, updateCamera, selectedSchoolId, updateGroup, setSelectedGroupId, selectedGroup]);

  useEffect(() => {
    if (toastMsg) { const t = setTimeout(() => setToastMsg(''), 2000); return () => clearTimeout(t); }
  }, [toastMsg]);

  const officeNo = selectedGroup?.office || '全部';
  const officeOptions = [...new Set((school?.groups || []).map(g => g.office))].sort();
  const [showSizePanel, setShowSizePanel] = useState(false);
  const [showMenu, setShowMenu] = useState(true);

  return (
    <div className="page-3d">
      {/* 3D 全屏画布 */}
      <div className="view3d-fullscreen" ref={mountRef} />

      {/* 左上：返回 + 办公室名 */}
      {showMenu && (
        <div className="float-top-left">
          <button className="float-btn back-btn" onClick={() => useStore.getState().setViewMode('list')}>←</button>
          <span className="float-title">🏢 {officeNo}号办公室</span>
        </div>
      )}

      {/* 右上：编辑 + 尺寸 + 菜单隐藏 */}
      <div className="float-top-right">
        {showMenu && (
          <>
            <button className={`float-btn edit-btn ${editMode ? 'active' : ''}`}
              onClick={() => {
                setEditMode(!editMode);
                setDragTargetId(null); setDragPreview(null);
                dragDataRef.current = { target: null, offsetX: 0, offsetZ: 0, mode: 'move' };
                setToastMsg(!editMode ? '🔧 长按拖动移动 · 双指旋转朝向' : '👁️ 查看');
              }}>
              {editMode ? '✓' : '✏️'}
            </button>
            <button className="float-btn size-btn-float" onClick={() => setShowSizePanel(!showSizePanel)}>📐</button>
          </>
        )}
        <button className="float-btn toggle-btn" onClick={() => setShowMenu(!showMenu)}>
          {showMenu ? '—' : '☰'}
        </button>
      </div>

      {/* 选中信息浮层 */}
      {showMenu && selectedGroup && !editMode && (
        <div className="float-selected-info">
          <span className="subject-badge" style={{ background: SUBJECT_COLOR_MAP[selectedGroup.subject] }}>
            {SUBJECT_ICON_MAP[selectedGroup.subject]}
          </span>
          <span className="selected-name">{selectedGroup.leaderName}</span>
          {selectedGroup.phone && <span className="selected-pos">📞 {selectedGroup.phone}</span>}
        </div>
      )}

      {/* 编辑提示浮层 */}
      {showMenu && editMode && (
        <div className="float-edit-hint">
          💡 长按拖动 · 双指旋转 · 点击编辑 · 点空地添加
        </div>
      )}

      {/* Toast */}
      {toastMsg && <div className="toast">{toastMsg}</div>}

      {/* 底部图例 */}
      {showMenu && (
        <div className="float-legend">
          {Object.entries(SUBJECT_COLOR_MAP).map(([name, color]) => (
            <span key={name} className="legend-item" style={{ background: color }}>{name}</span>
          ))}
        </div>
      )}

      {/* 底部办公室切换 */}
      {showMenu && officeOptions.length > 0 && (
        <div className="float-office-tabs">
          {officeOptions.map(off => {
            const cnt = (school?.groups || []).filter(g => g.office === off).length;
            return (
              <button key={off} className={`office-tab ${off === (selectedGroup?.office || '') ? 'active' : ''}`}
                onClick={() => { const first = school.groups.find(g => g.office === off); if (first) setSelectedGroupId(first.id); }}>
                {off}号室({cnt})
              </button>
            );
          })}
        </div>
      )}

      {/* 尺寸面板 */}
      {showSizePanel && (
        <div className="float-size-panel">
          <div className="size-row">
            <span className="size-label">📐 {roomSize.w}m × {roomSize.d}m</span>
            <button className="size-btn" onClick={() => setRoomSize({ w: DEFAULT_ROOM_W, d: DEFAULT_ROOM_D })}>重置</button>
          </div>
          <div className="size-row">
            <span>宽</span>
            <input type="range" min="10" max="24" step="1" value={roomSize.w}
              onChange={e => setRoomSize(prev => ({ ...prev, w: Number(e.target.value) }))} />
            <span className="size-num">{roomSize.w}</span>
          </div>
          <div className="size-row">
            <span>长</span>
            <input type="range" min="8" max="20" step="1" value={roomSize.d}
              onChange={e => setRoomSize(prev => ({ ...prev, d: Number(e.target.value) }))} />
            <span className="size-num">{roomSize.d}</span>
          </div>
        </div>
      )}

      {editTarget && <EditModal group={editTarget} schoolId={selectedSchoolId} onClose={() => setEditTarget(null)} />}
      {creatingGroup && <EditModal group={null} schoolId={selectedSchoolId} onClose={() => setCreatingGroup(null)} />}
    </div>
  );
}
