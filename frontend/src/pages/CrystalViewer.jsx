import React, { useState, useEffect, useCallback } from 'react'
import CrystalScene from '../components/CrystalScene.jsx'
import { crystalAPI } from '../services/api.js'

export default function CrystalViewer() {
  const [crystals, setCrystals] = useState([])
  const [selectedCrystal, setSelectedCrystal] = useState(null)
  const [crystalData, setCrystalData] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCell, setShowCell] = useState(true)
  const [showLattice, setShowLattice] = useState(false)
  const [showBonds, setShowBonds] = useState(true)
  const [measureMode, setMeasureMode] = useState(null)
  const [selectedAtoms, setSelectedAtoms] = useState([])
  const [measurement, setMeasurement] = useState(null)

  useEffect(() => {
    loadCrystals()
  }, [])

  useEffect(() => {
    if (crystals.length > 0 && !selectedCrystal) {
      selectCrystal(crystals[0])
    }
  }, [crystals])

  const loadCrystals = async () => {
    try {
      const data = await crystalAPI.listCrystals(searchTerm)
      setCrystals(data)
    } catch (error) {
      console.error('Failed to load crystals:', error)
    }
  }

  const selectCrystal = async (crystal) => {
    setSelectedCrystal(crystal.id)
    setSelectedAtoms([])
    setMeasurement(null)
    try {
      const data = await crystalAPI.getCrystal(crystal.id)
      setCrystalData(data)
    } catch (error) {
      console.error('Failed to load crystal data:', error)
    }
  }

  const handleAtomClick = useCallback((index, atom) => {
    if (!measureMode) return

    setSelectedAtoms(prev => {
      let newSelected
      if (prev.includes(index)) {
        newSelected = prev.filter(i => i !== index)
      } else if (measureMode === 'bond' && prev.length < 2) {
        newSelected = [...prev, index]
      } else if (measureMode === 'angle' && prev.length < 3) {
        newSelected = [...prev, index]
      } else if (measureMode === 'bond') {
        newSelected = [index]
      } else {
        newSelected = [prev[1], index]
      }

      if (measureMode === 'bond' && newSelected.length === 2) {
        calculateBondLength(newSelected)
      } else if (measureMode === 'angle' && newSelected.length === 3) {
        calculateAngle(newSelected)
      }

      return newSelected
    })
  }, [measureMode, crystalData])

  const calculateBondLength = (atomIndices) => {
    if (!crystalData) return
    
    const atoms = crystalData.atoms
    const cell = crystalData.cell
    
    const getPosition = (atom) => {
      const alphaRad = (cell.alpha * Math.PI) / 180
      const betaRad = (cell.beta * Math.PI) / 180
      const gammaRad = (cell.gamma * Math.PI) / 180
      
      const ax = cell.a, ay = 0, az = 0
      const bx = cell.b * Math.cos(gammaRad)
      const by = cell.b * Math.sin(gammaRad)
      const bz = 0
      const cx = cell.c * Math.cos(betaRad)
      const cy = cell.c * (Math.cos(alphaRad) - Math.cos(betaRad) * Math.cos(gammaRad)) / Math.sin(gammaRad)
      const cz = Math.sqrt(cell.c * cell.c - cx * cx - cy * cy)
      
      return {
        x: atom.fract_x * ax + atom.fract_y * bx + atom.fract_z * cx,
        y: atom.fract_x * ay + atom.fract_y * by + atom.fract_z * cy,
        z: atom.fract_x * az + atom.fract_y * bz + atom.fract_z * cz
      }
    }

    const pos1 = getPosition(atoms[atomIndices[0]])
    const pos2 = getPosition(atoms[atomIndices[1]])
    
    const dx = pos2.x - pos1.x
    const dy = pos2.y - pos1.y
    const dz = pos2.z - pos1.z
    
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz)
    
    setMeasurement({
      type: 'bond',
      value: length.toFixed(3),
      unit: 'Å',
      atoms: [atoms[atomIndices[0]].label, atoms[atomIndices[1]].label]
    })
  }

  const calculateAngle = (atomIndices) => {
    if (!crystalData) return
    
    const atoms = crystalData.atoms
    const cell = crystalData.cell
    
    const getPosition = (atom) => {
      const alphaRad = (cell.alpha * Math.PI) / 180
      const betaRad = (cell.beta * Math.PI) / 180
      const gammaRad = (cell.gamma * Math.PI) / 180
      
      const ax = cell.a, ay = 0, az = 0
      const bx = cell.b * Math.cos(gammaRad)
      const by = cell.b * Math.sin(gammaRad)
      const bz = 0
      const cx = cell.c * Math.cos(betaRad)
      const cy = cell.c * (Math.cos(alphaRad) - Math.cos(betaRad) * Math.cos(gammaRad)) / Math.sin(gammaRad)
      const cz = Math.sqrt(cell.c * cell.c - cx * cx - cy * cy)
      
      return {
        x: atom.fract_x * ax + atom.fract_y * bx + atom.fract_z * cx,
        y: atom.fract_x * ay + atom.fract_y * by + atom.fract_z * cy,
        z: atom.fract_x * az + atom.fract_y * bz + atom.fract_z * cz
      }
    }

    const pos1 = getPosition(atoms[atomIndices[0]])
    const pos2 = getPosition(atoms[atomIndices[1]])
    const pos3 = getPosition(atoms[atomIndices[2]])
    
    const v1 = { x: pos1.x - pos2.x, y: pos1.y - pos2.y, z: pos1.z - pos2.z }
    const v2 = { x: pos3.x - pos2.x, y: pos3.y - pos2.y, z: pos3.z - pos2.z }
    
    const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z)
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z)
    
    const angle = Math.acos(dot / (mag1 * mag2)) * 180 / Math.PI
    
    setMeasurement({
      type: 'angle',
      value: angle.toFixed(1),
      unit: '°',
      atoms: [atoms[atomIndices[0]].label, atoms[atomIndices[1]].label, atoms[atomIndices[2]].label]
    })
  }

  const toggleMeasureMode = (mode) => {
    if (measureMode === mode) {
      setMeasureMode(null)
      setSelectedAtoms([])
      setMeasurement(null)
    } else {
      setMeasureMode(mode)
      setSelectedAtoms([])
      setMeasurement(null)
    }
  }

  return (
    <div className="main-content">
      <div className="sidebar">
        <div className="panel">
          <div className="panel-title">晶体库</div>
          <input
            type="text"
            className="input"
            placeholder="搜索晶体..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadCrystals()}
            style={{ marginBottom: 12 }}
          />
          <div className="crystal-list">
            {crystals.map(crystal => (
              <div
                key={crystal.id}
                className={`crystal-item ${selectedCrystal === crystal.id ? 'active' : ''}`}
                onClick={() => selectCrystal(crystal)}
              >
                <div className="crystal-name">{crystal.name}</div>
                <div className="crystal-formula">{crystal.formula}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">显示选项</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showCell}
                onChange={(e) => setShowCell(e.target.checked)}
              />
              <span>显示晶胞</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showBonds}
                onChange={(e) => setShowBonds(e.target.checked)}
              />
              <span>显示化学键</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showLattice}
                onChange={(e) => setShowLattice(e.target.checked)}
              />
              <span>显示晶格点</span>
            </label>
          </div>
        </div>

        {crystalData && (
          <div className="panel">
            <div className="panel-title">晶体信息</div>
            <div className="info-row">
              <span className="info-label">名称</span>
              <span className="info-value">{crystalData.name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">分子式</span>
              <span className="info-value">{crystalData.formula}</span>
            </div>
            <div className="info-row">
              <span className="info-label">空间群</span>
              <span className="info-value">{crystalData.space_group}</span>
            </div>
            <div className="info-row">
              <span className="info-label">a</span>
              <span className="info-value">{crystalData.cell.a} Å</span>
            </div>
            <div className="info-row">
              <span className="info-label">b</span>
              <span className="info-value">{crystalData.cell.b} Å</span>
            </div>
            <div className="info-row">
              <span className="info-label">c</span>
              <span className="info-value">{crystalData.cell.c} Å</span>
            </div>
            <div className="info-row">
              <span className="info-label">原子数</span>
              <span className="info-value">{crystalData.atoms.length}</span>
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">原子详情</div>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {crystalData.atoms.map((atom, index) => (
                <div 
                  key={index} 
                  style={{ 
                    padding: '8px', 
                    marginBottom: '4px', 
                    borderRadius: '4px', 
                    background: 'var(--bg-dark)',
                    fontSize: '12px',
                    borderLeft: `3px solid ${atom.color}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '500' }}>{atom.label}</span>
                    <span style={{ 
                      color: atom.is_disordered ? 'var(--warning)' : (atom.occupancy < 1 ? 'var(--warning)' : 'var(--text-secondary)'),
                      fontSize: '11px'
                    }}>
                      {atom.is_disordered ? '无序' : (atom.occupancy < 1 ? `${(atom.occupancy * 100).toFixed(0)}%` : '100%')}
                    </span>
                  </div>
                  {atom.is_disordered && atom.disordered_elements && (
                    <div style={{ marginTop: '4px', color: 'var(--text-secondary)', fontSize: '11px' }}>
                      {atom.disordered_elements.map((el, i) => (
                        <span key={i}>
                          {el}: {(atom.disordered_occupancies[i] * 100).toFixed(0)}%
                          {i < atom.disordered_elements.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="content-area">
        <div className="viewer-container">
          <div className="toolbar">
            <button
              className={`tool-btn ${measureMode === 'bond' ? 'active' : ''}`}
              onClick={() => toggleMeasureMode('bond')}
              title="测量键长"
            >
              📏
            </button>
            <button
              className={`tool-btn ${measureMode === 'angle' ? 'active' : ''}`}
              onClick={() => toggleMeasureMode('angle')}
              title="测量键角"
            >
              📐
            </button>
            <button
              className="tool-btn"
              onClick={() => {
                setSelectedAtoms([])
                setMeasurement(null)
              }}
              title="清除选择"
            >
              ✕
            </button>
          </div>

          <CrystalScene
            crystalData={crystalData}
            showCell={showCell}
            showLattice={showLattice}
            showBonds={showBonds}
            onAtomClick={handleAtomClick}
            selectedAtoms={selectedAtoms}
          />

          {measurement && (
            <div className="measurement-display">
              <div className="measurement-label">
                {measurement.type === 'bond' ? '键长' : '键角'}
                {measurement.atoms && ` (${measurement.atoms.join(' - ')})`}
              </div>
              <div className="measurement-value">
                {measurement.value} {measurement.unit}
              </div>
            </div>
          )}

          <div className="help-text">
            <strong>操作提示：</strong><br />
            • 左键拖拽旋转视角<br />
            • 滚轮缩放<br />
            • 右键平移<br />
            • 点击原子进行测量
          </div>
        </div>
      </div>
    </div>
  )
}
