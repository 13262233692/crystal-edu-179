import React, { useState, useEffect, useRef } from 'react'
import { crystalAPI } from '../services/api.js'

export default function Library() {
  const [crystals, setCrystals] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadCrystals()
  }, [searchTerm])

  const loadCrystals = async () => {
    try {
      const data = await crystalAPI.listCrystals(searchTerm)
      setCrystals(data)
    } catch (error) {
      console.error('Failed to load crystals:', error)
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      await crystalAPI.uploadCrystal(file)
      await loadCrystals()
    } catch (error) {
      console.error('Failed to upload crystal:', error)
      alert('上传失败，请检查CIF文件格式')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="main-content" style={{ padding: 32, overflow: 'auto' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>📚 晶体结构库</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              type="text"
              className="input"
              placeholder="搜索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 200 }}
            />
          </div>
        </div>

        <div
          className="panel"
          onClick={() => fileInputRef.current?.click()}
          style={{ cursor: 'pointer' }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".cif"
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
          <div className="upload-area">
            {uploading ? (
              <div>⏳ 上传中...</div>
            ) : (
              <>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📤</div>
                <div>点击上传 CIF 文件</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  支持标准 CIF 格式文件
                </div>
              </>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">已添加的晶体</div>
          {crystals.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
              {crystals.map(crystal => (
                <div
                  key={crystal.id}
                  className="crystal-item"
                  style={{ margin: 0 }}
                >
                  <div className="crystal-name">{crystal.name}</div>
                  <div className="crystal-formula">{crystal.formula}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
                    {crystal.space_group} · {crystal.atom_count} 个原子
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
              暂无晶体数据
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-title">使用说明</div>
          <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            <p><strong>CIF文件格式说明：</strong></p>
            <ul style={{ marginLeft: 20, marginTop: 8 }}>
              <li>CIF (Crystallographic Information File) 是国际晶体学联合会推荐的标准格式</li>
              <li>文件应包含晶胞参数 (_cell_length_*、_cell_angle_*)</li>
              <li>文件应包含原子位置数据 (_atom_site_*)</li>
              <li>支持分数坐标 (fract) 格式</li>
            </ul>
            <p style={{ marginTop: 16 }}><strong>内置示例晶体：</strong></p>
            <ul style={{ marginLeft: 20, marginTop: 8 }}>
              <li>NaCl - 氯化钠（面心立方）</li>
              <li>CsCl - 氯化铯（体心立方）</li>
              <li>Diamond - 金刚石结构</li>
              <li>Graphite - 石墨结构</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
