import React, { useState, useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { crystalAPI, xrdAPI } from '../services/api.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function XRDAnalysis() {
  const [crystals, setCrystals] = useState([])
  const [selectedCrystal, setSelectedCrystal] = useState(null)
  const [wavelengths, setWavelengths] = useState([])
  const [selectedWavelength, setSelectedWavelength] = useState('CuKa')
  const [xrdData, setXrdData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [twoThetaRange, setTwoThetaRange] = useState({ min: 10, max: 80 })
  const [showPeaks, setShowPeaks] = useState(true)
  const [experimentalData, setExperimentalData] = useState(null)
  const [showExperimental, setShowExperimental] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadCrystals()
    loadWavelengths()
  }, [])

  useEffect(() => {
    if (selectedCrystal) {
      calculateXRD()
    }
  }, [selectedCrystal, selectedWavelength, twoThetaRange])

  const loadCrystals = async () => {
    try {
      const data = await crystalAPI.listCrystals()
      setCrystals(data)
      if (data.length > 0) {
        setSelectedCrystal(data[0].id)
      }
    } catch (error) {
      console.error('Failed to load crystals:', error)
    }
  }

  const loadWavelengths = async () => {
    try {
      const data = await xrdAPI.getWavelengths()
      setWavelengths(data)
    } catch (error) {
      console.error('Failed to load wavelengths:', error)
    }
  }

  const calculateXRD = async () => {
    if (!selectedCrystal) return
    
    setLoading(true)
    try {
      const data = await xrdAPI.calculateXRD(selectedCrystal, {
        wavelength: selectedWavelength,
        min: twoThetaRange.min,
        max: twoThetaRange.max,
        steps: 1000
      })
      setXrdData(data)
    } catch (error) {
      console.error('Failed to calculate XRD:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target.result
      const parsedData = parseExperimentalData(content)
      setExperimentalData(parsedData)
      setShowExperimental(true)
    }
    reader.readAsText(file)
  }

  const parseExperimentalData = (content) => {
    const lines = content.split('\n')
    const data = { two_theta: [], intensity: [] }
    
    for (const line of lines) {
      const parts = line.trim().split(/[,\s\t]+/)
      if (parts.length >= 2) {
        const x = parseFloat(parts[0])
        const y = parseFloat(parts[1])
        if (!isNaN(x) && !isNaN(y)) {
          data.two_theta.push(x)
          data.intensity.push(y)
        }
      }
    }
    
    if (data.intensity.length > 0) {
      const maxIntensity = Math.max(...data.intensity)
      data.intensity = data.intensity.map(i => (i / maxIntensity) * 100)
    }
    
    return data
  }

  const chartData = {
    labels: xrdData?.pattern?.two_theta?.map(x => x.toFixed(2)) || [],
    datasets: [
      {
        label: '模拟图谱',
        data: xrdData?.pattern?.intensity || [],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.1,
        borderWidth: 2,
        pointRadius: 0
      },
      ...(showExperimental && experimentalData ? [{
        label: '实验图谱',
        data: experimentalData.intensity,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: false,
        tension: 0.1,
        borderWidth: 2,
        pointRadius: 0
      }] : [])
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#f8fafc'
        }
      },
      title: {
        display: true,
        text: 'X射线粉末衍射图谱',
        color: '#f8fafc',
        font: { size: 16 }
      },
      tooltip: {
        callbacks: {
          title: (context) => `2θ = ${context[0].label}°`,
          label: (context) => {
            let label = context.dataset.label || ''
            if (label) label += ': '
            label += context.parsed.y.toFixed(2) + '%'
            return label
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: '2θ (°)',
          color: '#94a3b8'
        },
        ticks: { color: '#94a3b8', maxTicksLimit: 10 },
        grid: { color: '#334155' }
      },
      y: {
        title: {
          display: true,
          text: '相对强度 (%)',
          color: '#94a3b8'
        },
        ticks: { color: '#94a3b8' },
        grid: { color: '#334155' },
        min: 0,
        max: 110
      }
    }
  }

  return (
    <div className="main-content">
      <div className="sidebar">
        <div className="panel">
          <div className="panel-title">选择晶体</div>
          <select
            className="input"
            value={selectedCrystal || ''}
            onChange={(e) => setSelectedCrystal(e.target.value)}
            style={{ marginBottom: 12 }}
          >
            {crystals.map(crystal => (
              <option key={crystal.id} value={crystal.id}>
                {crystal.name} ({crystal.formula})
              </option>
            ))}
          </select>
        </div>

        <div className="panel">
          <div className="panel-title">X射线波长</div>
          <select
            className="input"
            value={selectedWavelength}
            onChange={(e) => setSelectedWavelength(e.target.value)}
          >
            {wavelengths.map(wl => (
              <option key={wl.id} value={wl.id}>
                {wl.name} ({wl.value} {wl.unit})
              </option>
            ))}
          </select>
        </div>

        <div className="panel">
          <div className="panel-title">2θ 范围</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>最小</label>
              <input
                type="number"
                className="input"
                value={twoThetaRange.min}
                onChange={(e) => setTwoThetaRange({ ...twoThetaRange, min: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>最大</label>
              <input
                type="number"
                className="input"
                value={twoThetaRange.max}
                onChange={(e) => setTwoThetaRange({ ...twoThetaRange, max: parseFloat(e.target.value) || 90 })}
              />
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">显示选项</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={showPeaks}
              onChange={(e) => setShowPeaks(e.target.checked)}
            />
            <span>显示峰位标注</span>
          </label>
          {experimentalData && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showExperimental}
                onChange={(e) => setShowExperimental(e.target.checked)}
              />
              <span>显示实验数据</span>
            </label>
          )}
        </div>

        <div className="panel">
          <div className="panel-title">上传实验数据</div>
          <div
            className="upload-area"
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: 16 }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv,.xy,.dat"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <div style={{ fontSize: 24, marginBottom: 4 }}>📄</div>
            <div style={{ fontSize: 12 }}>上传实验数据</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
              支持 TXT, CSV 格式
            </div>
          </div>
          {experimentalData && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--success)' }}>
              ✓ 已加载 {experimentalData.two_theta.length} 个数据点
            </div>
          )}
        </div>
      </div>

      <div className="content-area" style={{ flexDirection: 'column', padding: 16 }}>
        <div style={{ flex: 1, minHeight: 400, background: 'var(--bg-card)', borderRadius: 12, padding: 16 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div>计算中...</div>
            </div>
          ) : xrdData ? (
            <>
              <div style={{ height: 'calc(100% - 60px)', position: 'relative' }}>
                <Line data={chartData} options={chartOptions} />
              </div>
              
              {showPeaks && (
                <div style={{ 
                  marginTop: 16, 
                  maxHeight: 120, 
                  overflowY: 'auto',
                  background: 'var(--bg-dark)',
                  borderRadius: 8,
                  padding: 12
                }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    布拉格峰位列表:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {xrdData.peaks?.slice(0, 20).map((peak, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '4px 8px',
                          background: 'var(--bg-card)',
                          borderRadius: 4,
                          fontSize: 11,
                          borderLeft: '3px solid var(--primary)'
                        }}
                        title={`d = ${peak.d.toFixed(3)} Å`}
                      >
                        <strong>({peak.h} {peak.k} {peak.l})</strong>
                        <span style={{ marginLeft: 6, color: 'var(--text-secondary)' }}>
                          {peak.two_theta.toFixed(2)}°
                        </span>
                      </div>
                    ))}
                    {xrdData.peaks?.length > 20 && (
                      <div style={{ padding: '4px 8px', fontSize: 11, color: 'var(--text-secondary)' }}>
                        +{xrdData.peaks.length - 20} 更多...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div>请选择晶体进行XRD模拟</div>
            </div>
          )}
        </div>

        {xrdData && (
          <div className="panel" style={{ marginTop: 16, marginBottom: 0 }}>
            <div className="panel-title">计算信息</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <div>
                <div className="info-label">波长</div>
                <div className="info-value">{xrdData.wavelength} Å</div>
              </div>
              <div>
                <div className="info-label">2θ 范围</div>
                <div className="info-value">{xrdData.two_theta_min}° - {xrdData.two_theta_max}°</div>
              </div>
              <div>
                <div className="info-label">衍射峰数</div>
                <div className="info-value">{xrdData.peaks?.length || 0}</div>
              </div>
              <div>
                <div className="info-label">数据点数</div>
                <div className="info-value">{xrdData.pattern?.two_theta?.length || 0}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
