import React, { useState, useEffect } from 'react'
import CrystalScene from '../components/CrystalScene.jsx'
import { crystalAPI, symmetryAPI } from '../services/api.js'

export default function SymmetryDemo() {
  const [crystals, setCrystals] = useState([])
  const [selectedCrystal, setSelectedCrystal] = useState(null)
  const [crystalData, setCrystalData] = useState(null)
  const [operations, setOperations] = useState([])
  const [selectedOperation, setSelectedOperation] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    loadCrystals()
    loadOperations()
  }, [])

  useEffect(() => {
    if (crystals.length > 0 && !selectedCrystal) {
      selectCrystal(crystals[0])
    }
  }, [crystals])

  const loadCrystals = async () => {
    try {
      const data = await crystalAPI.listCrystals()
      setCrystals(data)
    } catch (error) {
      console.error('Failed to load crystals:', error)
    }
  }

  const loadOperations = async () => {
    try {
      const data = await symmetryAPI.getOperations()
      setOperations(data)
    } catch (error) {
      console.error('Failed to load operations:', error)
    }
  }

  const selectCrystal = async (crystal) => {
    setSelectedCrystal(crystal.id)
    try {
      const data = await crystalAPI.getCrystal(crystal.id)
      setCrystalData(data)
    } catch (error) {
      console.error('Failed to load crystal data:', error)
    }
  }

  const selectOperation = (operation) => {
    setSelectedOperation(operation)
    setIsPlaying(true)
  }

  return (
    <div className="main-content">
      <div className="sidebar">
        <div className="panel">
          <div className="panel-title">选择晶体</div>
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
          <div className="panel-title">对称操作</div>
          <div className="symmetry-grid">
            {operations.map(op => (
              <button
                key={op.id}
                className={`symmetry-btn ${selectedOperation?.id === op.id ? 'active' : ''}`}
                onClick={() => selectOperation(op)}
              >
                <div className="name">{op.name}</div>
                <div className="desc">{op.description}</div>
              </button>
            ))}
          </div>
        </div>

        {selectedOperation && (
          <div className="panel">
            <div className="panel-title">操作控制</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-primary"
                onClick={() => setIsPlaying(!isPlaying)}
                style={{ flex: 1 }}
              >
                {isPlaying ? '⏸ 暂停' : '▶ 播放'}
              </button>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setSelectedOperation(null)
                  setIsPlaying(false)
                }}
              >
                重置
              </button>
            </div>
          </div>
        )}

        {selectedOperation && (
          <div className="panel">
            <div className="panel-title">变换矩阵</div>
            <div style={{ fontFamily: 'monospace', fontSize: 12, background: 'var(--bg-dark)', padding: 12, borderRadius: 6 }}>
              {selectedOperation.matrix.map((row, i) => (
                <div key={i} style={{ display: 'flex', gap: 8 }}>
                  {row.map((val, j) => (
                    <span key={j} style={{ width: 50 }}>
                      {typeof val === 'number' ? val.toFixed(3) : val}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="content-area">
        <div className="viewer-container">
          <CrystalScene
            crystalData={crystalData}
            showCell={true}
            showLattice={false}
            showBonds={true}
            symmetryOperation={selectedOperation}
            isSymmetryPlaying={isPlaying}
          />

          <div className="help-text">
            <strong>对称操作演示：</strong><br />
            • 选择左侧对称操作<br />
            • 观看动画效果<br />
            • 理解对称性原理
          </div>
        </div>
      </div>
    </div>
  )
}
