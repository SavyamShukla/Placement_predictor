import { useEffect, useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, BarChart2, BarChart3, BookOpen,
  BrainCircuit, Check, CheckCircle2, ChevronDown, ChevronRight, ChevronUp, CircleAlert, CircleCheck,
  ClipboardList, Cpu, GitCompare, GraduationCap, Info, Layers3, Menu, Printer, RotateCcw, ShieldAlert,
  ShieldCheck, Sliders, SlidersHorizontal, Sparkles, TrendingDown, TrendingUp, WandSparkles, X, XCircle
} from 'lucide-react'

const initial = {
  cgpa: 7.7, internships: 1, projects: 2, certifications: 1,
  aptitude: 80, soft_skills: 4.4, extracurricular: 'Yes',
  placement_training: 'Yes', ssc_marks: 70, hsc_marks: 74
}

const groups = [
  {
    title: 'Academic profile', caption: 'Your academic foundation', icon: GraduationCap,
    fields: [
      {key:'cgpa', label:'Current CGPA', min:0, max:10, step:0.1, suffix:'/ 10'},
      {key:'ssc_marks', label:'Class 10 marks', min:0, max:100, step:1, suffix:'%'},
      {key:'hsc_marks', label:'Class 12 marks', min:0, max:100, step:1, suffix:'%'}
    ]
  },
  {
    title: 'Experience & skills', caption: 'The work behind the numbers', icon: Layers3,
    fields: [
      {key:'internships', label:'Internships completed', min:0, max:30, step:1},
      {key:'projects', label:'Projects completed', min:0, max:100, step:1},
      {key:'certifications', label:'Workshops / certifications', min:0, max:100, step:1},
      {key:'aptitude', label:'Aptitude test score', min:0, max:100, step:1, suffix:'/ 100'},
      {key:'soft_skills', label:'Soft skills rating', min:0, max:5, step:0.1, suffix:'/ 5'}
    ]
  }
]

function Field({ field, value, onChange }) {
  const id = `field-${field.key}`
  return <label className="field" htmlFor={id}>
    <span className="field-label">{field.label}<span className="field-suffix">{field.suffix || ''}</span></span>
    <input id={id} type="number" min={field.min} max={field.max} step={field.step}
      value={value} onChange={e=>onChange(field.key, e.target.value)}
      aria-label={field.label} required />
  </label>
}

function Toggle({ label, value, onChange }) {
  return <div className="toggle-row">
    <span>{label}</span>
    <div className="toggle" role="group" aria-label={label}>
      {['Yes','No'].map(v=><button key={v} type="button"
        className={value===v ? 'selected' : ''} aria-pressed={value===v}
        onClick={()=>onChange(v)}>{v}</button>)}
    </div>
  </div>
}

function CircularProbabilityGauge({ placedPercent, notPlacedPercent }) {
  const p = Math.max(0, Math.min(100, Number(placedPercent) || 0))
  const np = Math.max(0, Math.min(100, Number(notPlacedPercent) || (100 - p)))
  const radius = 72
  const circumference = 2 * Math.PI * radius // ~452.39
  const placedStroke = (p / 100) * circumference
  const notPlacedStroke = (np / 100) * circumference

  return (
    <div className="dual-gauge-wrapper">
      <svg className="gauge-svg" viewBox="0 0 180 180" aria-label="Placement and non-placement probability gauge">
        <defs>
          <linearGradient id="placedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#5ee4d4" />
          </linearGradient>
          <linearGradient id="notPlacedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#f87171" />
          </linearGradient>
        </defs>
        {/* Background base track */}
        <circle cx="90" cy="90" r={radius} className="gauge-track" />
        {/* Placed arc */}
        {p > 0 && (
          <circle
            cx="90"
            cy="90"
            r={radius}
            className="gauge-placed-bar"
            style={{
              strokeDasharray: `${placedStroke} ${circumference}`,
              strokeDashoffset: 0,
            }}
          />
        )}
        {/* Not placed arc */}
        {np > 0 && (
          <circle
            cx="90"
            cy="90"
            r={radius}
            className="gauge-not-placed-bar"
            style={{
              strokeDasharray: `${notPlacedStroke} ${circumference}`,
              strokeDashoffset: `-${placedStroke}`,
            }}
          />
        )}
      </svg>
      <div className="gauge-content">
        <span className="gauge-content-tag">PLACEMENT PROBABILITY</span>
        <span className="gauge-number">
          {p.toFixed(1)}<small>%</small>
        </span>
        <span className="gauge-subtext">Not Placed: {np.toFixed(1)}%</span>
      </div>
    </div>
  )
}

function ExplainSection({ explanation, tab, onTabChange, expanded, onToggleExpand }) {
  if (!explanation) return null

  const topPos = explanation.top_positive || []
  const topNeg = explanation.top_negative || []
  const allFeatures = explanation.all_features || []

  const displayedFeatures = tab === 'positive'
    ? allFeatures.filter(f => f.direction === 'positive')
    : tab === 'negative'
      ? allFeatures.filter(f => f.direction === 'negative')
      : allFeatures

  const maxAbs = Math.max(0.01, ...allFeatures.map(f => Math.abs(f.contribution || 0)))

  return (
    <section className="explain-container" aria-labelledby="explain-heading">
      <div className="explain-header">
        <div className="explain-title-group">
          <span className="explain-icon"><BrainCircuit size={19} /></span>
          <div>
            <h4 id="explain-heading" className="explain-title">Explain My Prediction</h4>
            <p className="explain-sub">SHAP Feature Attribution Analysis</p>
          </div>
        </div>
        <button
          type="button"
          className="explain-toggle-btn"
          onClick={onToggleExpand}
          aria-expanded={expanded}
          aria-label="Toggle explanation section"
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          <span>{expanded ? 'Hide Details' : 'Show Details'}</span>
        </button>
      </div>

      {expanded && (
        <>
          {/* Top Positive & Negative Drivers Summary */}
          <div className="top-drivers-grid">
            {/* Top Positive Contributors */}
            <div className="driver-card positive">
              <div className="driver-card-header">
                <span className="driver-header-label">
                  <TrendingUp size={14} /> Positive Contributors
                </span>
                <span className="driver-count-tag">{topPos.length} features</span>
              </div>
              <div className="driver-items-list">
                {topPos.length > 0 ? (
                  topPos.slice(0, 3).map(feat => (
                    <div className="driver-item" key={feat.feature}>
                      <div className="driver-item-top">
                        <span className="driver-item-name">{feat.display_name}</span>
                        <span className="driver-item-val">{feat.formatted_value}</span>
                      </div>
                      <p className="driver-item-text">{feat.explanation}</p>
                    </div>
                  ))
                ) : (
                  <p className="driver-empty">No positive contributing features found.</p>
                )}
              </div>
            </div>

            {/* Top Negative Contributors */}
            <div className="driver-card negative">
              <div className="driver-card-header">
                <span className="driver-header-label">
                  <TrendingDown size={14} /> Negative Contributors
                </span>
                <span className="driver-count-tag">{topNeg.length} features</span>
              </div>
              <div className="driver-items-list">
                {topNeg.length > 0 ? (
                  topNeg.slice(0, 3).map(feat => (
                    <div className="driver-item" key={feat.feature}>
                      <div className="driver-item-top">
                        <span className="driver-item-name">{feat.display_name}</span>
                        <span className="driver-item-val">{feat.formatted_value}</span>
                      </div>
                      <p className="driver-item-text">{feat.explanation}</p>
                    </div>
                  ))
                ) : (
                  <p className="driver-empty">No negative contributing features found.</p>
                )}
              </div>
            </div>
          </div>

          {/* Horizontal Contribution Chart */}
          <div className="chart-section">
            <div className="chart-toolbar">
              <span className="chart-heading">
                <BarChart2 size={14} /> Horizontal Feature Impact Chart
              </span>
              <div className="chart-tabs" role="tablist">
                <button
                  type="button"
                  className={`chart-tab-btn ${tab === 'all' ? 'active' : ''}`}
                  onClick={() => onTabChange('all')}
                >
                  All ({allFeatures.length})
                </button>
                <button
                  type="button"
                  className={`chart-tab-btn ${tab === 'positive' ? 'active' : ''}`}
                  onClick={() => onTabChange('positive')}
                >
                  Positive ({topPos.length})
                </button>
                <button
                  type="button"
                  className={`chart-tab-btn ${tab === 'negative' ? 'active' : ''}`}
                  onClick={() => onTabChange('negative')}
                >
                  Negative ({topNeg.length})
                </button>
              </div>
            </div>

            <div className="shap-features-list">
              {displayedFeatures.map(feat => {
                const barWidth = Math.min(100, Math.max(8, (Math.abs(feat.contribution) / maxAbs) * 100))
                const isPos = feat.direction === 'positive'
                return (
                  <div className={`shap-feature-row ${feat.direction}`} key={feat.feature}>
                    <div className="shap-row-header">
                      <div className="shap-feat-info">
                        <span className="shap-feat-name">{feat.display_name}</span>
                        <span className="shap-feat-val">({feat.formatted_value})</span>
                      </div>
                      <span className={`shap-impact-tag ${feat.direction}`}>
                        {isPos ? `+${feat.contribution.toFixed(3)}` : feat.contribution.toFixed(3)} impact
                      </span>
                    </div>
                    <div className="shap-bar-track">
                      <div
                        className={`shap-bar-fill ${feat.direction}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <p className="shap-explanation-text">{feat.explanation}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Causation and Model Attribution Notice */}
          <div className="causation-notice">
            <ShieldAlert size={16} />
            <div>
              <strong>Model Attribution Notice</strong>
              <p>
                {explanation.causation_notice ||
                  'These explanations describe how the trained machine learning model arrived at its prediction based on patterns in historical data. SHAP feature attributions reflect statistical model behavior and do not establish real-world causation.'}
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

function SliderControl({ label, value, originalValue, min, max, step, suffix, onChange }) {
  const isChanged = Number(value) !== Number(originalValue)
  const diff = Number((Number(value) - Number(originalValue)).toFixed(2))
  return (
    <div className={`simulator-field-card ${isChanged ? 'is-modified' : ''}`}>
      <div className="sim-field-header">
        <label className="sim-field-label">{label}</label>
        <div className="sim-field-values">
          <span className="sim-current-val">{value} <small>{suffix}</small></span>
          {isChanged && (
            <span className={`sim-diff-badge ${diff > 0 ? 'pos' : 'neg'}`}>
              {diff > 0 ? `+${diff}` : diff}
            </span>
          )}
        </div>
      </div>
      <div className="slider-track-wrap">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="sim-range-slider"
          aria-label={label}
        />
        <div className="slider-bounds">
          <span>{min}{suffix}</span>
          <span className="slider-orig-marker">Original: {originalValue}{suffix}</span>
          <span>{max}{suffix}</span>
        </div>
      </div>
    </div>
  )
}

function NumberInputControl({ label, value, originalValue, min, max, step, onChange }) {
  const isChanged = Number(value) !== Number(originalValue)
  const diff = Number(value) - Number(originalValue)
  return (
    <div className={`simulator-field-card ${isChanged ? 'is-modified' : ''}`}>
      <div className="sim-field-header">
        <label className="sim-field-label">{label}</label>
        {isChanged && (
          <span className={`sim-diff-badge ${diff > 0 ? 'pos' : 'neg'}`}>
            Orig: {originalValue} ({diff > 0 ? `+${diff}` : diff})
          </span>
        )}
      </div>
      <div className="sim-number-input-wrap">
        <button
          type="button"
          className="sim-num-btn"
          onClick={() => onChange(Math.max(min, Number(value) - step))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >−</button>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => {
            const val = e.target.value === '' ? min : Number(e.target.value)
            onChange(Math.max(min, Math.min(max, val)))
          }}
          className="sim-number-input"
          aria-label={label}
        />
        <button
          type="button"
          className="sim-num-btn"
          onClick={() => onChange(Math.min(max, Number(value) + step))}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >+</button>
      </div>
    </div>
  )
}

function ToggleControl({ label, value, originalValue, onChange }) {
  const isChanged = value !== originalValue
  return (
    <div className={`simulator-field-card ${isChanged ? 'is-modified' : ''}`}>
      <div className="sim-field-header">
        <label className="sim-field-label">{label}</label>
        {isChanged && (
          <span className="sim-diff-badge info">
            Orig: {originalValue}
          </span>
        )}
      </div>
      <div className="toggle" role="group" aria-label={label}>
        {['Yes', 'No'].map(v => (
          <button
            key={v}
            type="button"
            className={value === v ? 'selected' : ''}
            onClick={() => onChange(v)}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}

function BeforeAfterComparisonChart({ originalPlaced, modifiedPlaced, originalNotPlaced, modifiedNotPlaced, diffPp }) {
  return (
    <div className="comparison-chart-card">
      <div className="comp-chart-header">
        <span className="comp-chart-title">
          <GitCompare size={15} /> Before vs After Probability Comparison
        </span>
        <div className="comp-legend">
          <span className="legend-item orig"><i /> Original</span>
          <span className="legend-item mod"><i /> Simulated</span>
        </div>
      </div>

      <div className="comp-bars-container">
        {/* Placement Probability Group */}
        <div className="comp-group">
          <div className="comp-group-header">
            <span className="comp-group-label">Placement Probability</span>
            <span className={`comp-delta-tag ${diffPp >= 0 ? 'pos' : 'neg'}`}>
              {diffPp >= 0 ? `+${diffPp.toFixed(1)} pp` : `${diffPp.toFixed(1)} pp`}
            </span>
          </div>

          <div className="comp-dual-bar">
            <div className="comp-bar-row">
              <span className="comp-bar-tag">Original</span>
              <div className="comp-bar-track">
                <div
                  className="comp-bar-fill orig-placed"
                  style={{ width: `${Math.min(100, Math.max(0, originalPlaced))}%` }}
                />
              </div>
              <span className="comp-bar-val">{originalPlaced.toFixed(1)}%</span>
            </div>

            <div className="comp-bar-row">
              <span className="comp-bar-tag highlight">Simulated</span>
              <div className="comp-bar-track">
                <div
                  className="comp-bar-fill mod-placed"
                  style={{ width: `${Math.min(100, Math.max(0, modifiedPlaced))}%` }}
                />
              </div>
              <span className="comp-bar-val highlight">{modifiedPlaced.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Non-Placement Probability Group */}
        <div className="comp-group">
          <div className="comp-group-header">
            <span className="comp-group-label">Non-Placement Probability</span>
            <span className={`comp-delta-tag ${diffPp <= 0 ? 'pos' : 'neg'}`}>
              {-diffPp >= 0 ? `+${(-diffPp).toFixed(1)} pp` : `${(-diffPp).toFixed(1)} pp`}
            </span>
          </div>

          <div className="comp-dual-bar">
            <div className="comp-bar-row">
              <span className="comp-bar-tag">Original</span>
              <div className="comp-bar-track">
                <div
                  className="comp-bar-fill orig-not-placed"
                  style={{ width: `${Math.min(100, Math.max(0, originalNotPlaced))}%` }}
                />
              </div>
              <span className="comp-bar-val">{originalNotPlaced.toFixed(1)}%</span>
            </div>

            <div className="comp-bar-row">
              <span className="comp-bar-tag highlight">Simulated</span>
              <div className="comp-bar-track">
                <div
                  className="comp-bar-fill mod-not-placed"
                  style={{ width: `${Math.min(100, Math.max(0, modifiedNotPlaced))}%` }}
                />
              </div>
              <span className="comp-bar-val highlight">{modifiedNotPlaced.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChangedInputsList({ changedInputs, onRevertField }) {
  if (!changedInputs || changedInputs.length === 0) {
    return (
      <div className="changed-inputs-box empty">
        <SlidersHorizontal size={15} />
        <span>No inputs modified yet. Adjust any slider or number input to simulate changes.</span>
      </div>
    )
  }

  return (
    <div className="changed-inputs-box">
      <div className="changed-inputs-header">
        <span>Modified Inputs ({changedInputs.length})</span>
      </div>
      <div className="changed-inputs-list">
        {changedInputs.map(item => (
          <div className="changed-item-row" key={item.field}>
            <div className="changed-item-info">
              <span className="changed-item-label">{item.label}</span>
              <span className="changed-item-values">
                <span className="val-old">{item.original_value}{item.unit ? ` ${item.unit}` : ''}</span>
                <span className="val-arrow">→</span>
                <span className="val-new">{item.modified_value}{item.unit ? ` ${item.unit}` : ''}</span>
              </span>
            </div>
            {item.delta != null && (
              <span className={`changed-delta-pill ${item.delta > 0 ? 'pos' : 'neg'}`}>
                {item.delta > 0 ? `+${item.delta}` : item.delta}
              </span>
            )}
            {onRevertField && (
              <button
                type="button"
                className="revert-btn"
                title="Revert to original"
                onClick={() => onRevertField(item.field, item.original_value)}
              >
                Revert
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function WhatIfSimulator({ originalProfile, originalResult }) {
  const [simForm, setSimForm] = useState({ ...originalProfile })
  const [simResult, setSimResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setSimForm({ ...originalProfile })
    if (originalResult) {
      setSimResult({
        original: {
          prediction: originalResult.prediction,
          placement_status: originalResult.placement_status || originalResult.prediction,
          probability_placed: originalResult.probability_placed,
          probability_not_placed: originalResult.probability_not_placed,
          result_summary: originalResult.result_summary,
        },
        modified: {
          prediction: originalResult.prediction,
          placement_status: originalResult.placement_status || originalResult.prediction,
          probability_placed: originalResult.probability_placed,
          probability_not_placed: originalResult.probability_not_placed,
          result_summary: originalResult.result_summary,
        },
        probability_difference_pp: 0,
        non_placement_difference_pp: 0,
        status_changed: false,
        changed_inputs: [],
      })
    }
  }, [originalProfile, originalResult])

  const updateSim = (key, value) => {
    setSimForm(prev => ({ ...prev, [key]: value }))
  }

  const revertField = (field, origVal) => {
    setSimForm(prev => ({ ...prev, [field]: origVal }))
  }

  const handleReset = () => {
    setSimForm({ ...originalProfile })
    if (originalResult) {
      setSimResult({
        original: {
          prediction: originalResult.prediction,
          placement_status: originalResult.placement_status || originalResult.prediction,
          probability_placed: originalResult.probability_placed,
          probability_not_placed: originalResult.probability_not_placed,
          result_summary: originalResult.result_summary,
        },
        modified: {
          prediction: originalResult.prediction,
          placement_status: originalResult.placement_status || originalResult.prediction,
          probability_placed: originalResult.probability_placed,
          probability_not_placed: originalResult.probability_not_placed,
          result_summary: originalResult.result_summary,
        },
        probability_difference_pp: 0,
        non_placement_difference_pp: 0,
        status_changed: false,
        changed_inputs: [],
      })
    }
    setError('')
  }

  const handleSimulate = async () => {
    setLoading(true)
    setError('')
    try {
      const payload = {
        original: Object.fromEntries(
          Object.entries(originalProfile).map(([k, v]) =>
            ['extracurricular', 'placement_training'].includes(k) ? [k, v] : [k, Number(v)]
          )
        ),
        modified: Object.fromEntries(
          Object.entries(simForm).map(([k, v]) =>
            ['extracurricular', 'placement_training'].includes(k) ? [k, v] : [k, Number(v)]
          )
        ),
      }
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(typeof data.detail === 'string' ? data.detail : 'Simulation failed.')
      }
      setSimResult(data)
    } catch (err) {
      setError(err.message || 'Could not connect to simulation service.')
    } finally {
      setLoading(false)
    }
  }

  const changedCount = useMemo(() => {
    return Object.keys(originalProfile).filter(
      k => simForm[k] !== originalProfile[k]
    ).length
  }, [simForm, originalProfile])

  const origPlaced = (simResult?.original.probability_placed ?? (originalResult?.probability_placed || 0)) * 100
  const origNotPlaced = (simResult?.original.probability_not_placed ?? (originalResult?.probability_not_placed || (1 - origPlaced / 100))) * 100
  const modPlaced = (simResult?.modified.probability_placed ?? (originalResult?.probability_placed || 0)) * 100
  const modNotPlaced = (simResult?.modified.probability_not_placed ?? (originalResult?.probability_not_placed || (1 - modPlaced / 100))) * 100
  const diffPp = simResult?.probability_difference_pp ?? 0

  return (
    <div className="simulator-workbench">
      <div className="sim-workbench-grid">
        {/* Left Column: Parameter Adjustment Controls */}
        <div className="sim-controls-panel">
          <div className="sim-panel-title-wrap">
            <div className="sim-panel-heading">
              <Sliders size={20} style={{ color: '#5ee4d4' }} />
              <div>
                <h3>Simulation Parameter Controls</h3>
                <p>Adjust inputs to observe predicted probability changes</p>
              </div>
            </div>
            {changedCount > 0 && (
              <span className="sim-diff-badge pos">{changedCount} modified</span>
            )}
          </div>

          <div className="sim-controls-group">
            <div className="ranges-guide-title" style={{ margin: '10px 0 12px' }}>
              Academic Foundation (Sliders)
            </div>
            <SliderControl
              label="CGPA"
              value={simForm.cgpa}
              originalValue={originalProfile.cgpa}
              min={0}
              max={10}
              step={0.1}
              suffix="/ 10"
              onChange={v => updateSim('cgpa', v)}
            />
            <SliderControl
              label="Aptitude Test Score"
              value={simForm.aptitude}
              originalValue={originalProfile.aptitude}
              min={0}
              max={100}
              step={1}
              suffix="/ 100"
              onChange={v => updateSim('aptitude', v)}
            />
            <SliderControl
              label="Soft Skills Rating"
              value={simForm.soft_skills}
              originalValue={originalProfile.soft_skills}
              min={0}
              max={5}
              step={0.1}
              suffix="/ 5"
              onChange={v => updateSim('soft_skills', v)}
            />
            <SliderControl
              label="Class 10 (SSC) Marks"
              value={simForm.ssc_marks}
              originalValue={originalProfile.ssc_marks}
              min={0}
              max={100}
              step={1}
              suffix="%"
              onChange={v => updateSim('ssc_marks', v)}
            />
            <SliderControl
              label="Class 12 (HSC) Marks"
              value={simForm.hsc_marks}
              originalValue={originalProfile.hsc_marks}
              min={0}
              max={100}
              step={1}
              suffix="%"
              onChange={v => updateSim('hsc_marks', v)}
            />
          </div>

          <div className="sim-controls-group" style={{ marginTop: '16px' }}>
            <div className="ranges-guide-title" style={{ margin: '10px 0 12px' }}>
              Experience &amp; Certifications (Number Inputs)
            </div>
            <NumberInputControl
              label="Internships Completed"
              value={simForm.internships}
              originalValue={originalProfile.internships}
              min={0}
              max={30}
              step={1}
              onChange={v => updateSim('internships', v)}
            />
            <NumberInputControl
              label="Projects Completed"
              value={simForm.projects}
              originalValue={originalProfile.projects}
              min={0}
              max={100}
              step={1}
              onChange={v => updateSim('projects', v)}
            />
            <NumberInputControl
              label="Workshops / Certifications"
              value={simForm.certifications}
              originalValue={originalProfile.certifications}
              min={0}
              max={100}
              step={1}
              onChange={v => updateSim('certifications', v)}
            />
          </div>

          <div className="sim-controls-group" style={{ marginTop: '16px' }}>
            <div className="ranges-guide-title" style={{ margin: '10px 0 12px' }}>
              Activities &amp; Training (Toggles)
            </div>
            <ToggleControl
              label="Extracurricular Activities"
              value={simForm.extracurricular}
              originalValue={originalProfile.extracurricular}
              onChange={v => updateSim('extracurricular', v)}
            />
            <ToggleControl
              label="Completed Placement Training"
              value={simForm.placement_training}
              originalValue={originalProfile.placement_training}
              onChange={v => updateSim('placement_training', v)}
            />
          </div>

          {error && (
            <div className="error-box" role="alert" style={{ marginTop: '14px' }}>
              <CircleAlert size={16} /> {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="sim-actions-bar">
            <button
              type="button"
              className="sim-btn-simulate"
              disabled={loading}
              onClick={handleSimulate}
            >
              {loading ? 'Simulating ML Model...' : 'Simulate'}
              {loading ? <span className="spinner" /> : <Sparkles size={16} />}
            </button>
            <button
              type="button"
              className="sim-btn-reset"
              onClick={handleReset}
              disabled={loading || changedCount === 0}
            >
              <RotateCcw size={14} /> Reset Changes
            </button>
          </div>
        </div>

        {/* Right Column: Comparative Results Dashboard */}
        <div className="sim-results-panel">
          <div className="sim-panel-title-wrap">
            <div className="sim-panel-heading">
              <GitCompare size={20} style={{ color: '#5ee4d4' }} />
              <div>
                <h3>Simulation Comparison Dashboard</h3>
                <p>Original vs Modified Profile ML Prediction</p>
              </div>
            </div>
          </div>

          {/* Probability Difference Banner */}
          <div className={`sim-delta-banner ${diffPp > 0 ? 'positive' : diffPp < 0 ? 'negative' : 'neutral'}`}>
            <div className="delta-icon-wrap">
              {diffPp > 0 ? <TrendingUp size={24} /> : diffPp < 0 ? <TrendingDown size={24} /> : <GitCompare size={24} />}
            </div>
            <div>
              <span className="delta-banner-tag">PROBABILITY DIFFERENCE</span>
              <h3 className="delta-banner-num">
                {diffPp >= 0 ? `+${diffPp.toFixed(1)}` : diffPp.toFixed(1)} <small>percentage points</small>
              </h3>
              <p className="delta-banner-sub">
                {diffPp > 0
                  ? `Modifications increased predicted placement probability from ${origPlaced.toFixed(1)}% to ${modPlaced.toFixed(1)}%.`
                  : diffPp < 0
                    ? `Modifications decreased predicted placement probability from ${origPlaced.toFixed(1)}% to ${modPlaced.toFixed(1)}%.`
                    : 'Current parameters match the original profile. Adjust controls on the left and click Simulate.'}
              </p>
            </div>
          </div>

          {/* Side-by-side Original vs Modified Profile Cards */}
          <div className="sim-comparison-cards-grid">
            {/* Original Card */}
            <div className="sim-profile-card original">
              <div className="sim-card-badge">ORIGINAL PROFILE</div>
              <div className="sim-class-title">
                <span className={`sim-status-dot ${originalResult?.placement_status === 'Placed' || originalResult?.prediction === 'Placed' ? 'placed' : 'not-placed'}`} />
                <span>{originalResult?.placement_status || originalResult?.prediction}</span>
              </div>
              <div className="sim-metrics-split">
                <div>
                  <span className="metric-label">Placement</span>
                  <span className="metric-num">{origPlaced.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="metric-label">Non-Placement</span>
                  <span className="metric-num">{origNotPlaced.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Modified Card */}
            <div className="sim-profile-card modified">
              <div className="sim-card-badge highlight">MODIFIED PROFILE</div>
              <div className="sim-class-title">
                <span className={`sim-status-dot ${simResult?.modified.placement_status === 'Placed' || simResult?.modified.prediction === 'Placed' ? 'placed' : 'not-placed'}`} />
                <span>{simResult?.modified.placement_status || simResult?.modified.prediction}</span>
              </div>
              <div className="sim-metrics-split">
                <div>
                  <span className="metric-label">Placement</span>
                  <span className="metric-num highlight">{modPlaced.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="metric-label">Non-Placement</span>
                  <span className="metric-num">{modNotPlaced.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Before-and-After Comparison Chart */}
          <BeforeAfterComparisonChart
            originalPlaced={origPlaced}
            modifiedPlaced={modPlaced}
            originalNotPlaced={origNotPlaced}
            modifiedNotPlaced={modNotPlaced}
            diffPp={diffPp}
          />

          {/* Changed Inputs Tracker */}
          <ChangedInputsList
            changedInputs={simResult?.changed_inputs}
            onRevertField={revertField}
          />
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [form,setForm]=useState(initial)
  const [result,setResult]=useState(null)
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [model,setModel]=useState(null)
  const [health,setHealth]=useState(null)
  const [mobileOpen,setMobileOpen]=useState(false)
  const [view,setView]=useState('home')
  const [resultTab,setResultTab]=useState('overview')
  const [explainTab,setExplainTab]=useState('all')
  const [explainExpanded,setExplainExpanded]=useState(true)

  useEffect(()=>{
    fetch('/api/health').then(r=>r.json()).then(setHealth).catch(()=>setHealth({status:'offline'}))
    fetch('/api/model-info').then(r=>r.ok?r.json():null).then(setModel).catch(()=>{})
  },[])

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#results' && result) {
        setView('results')
      } else if (window.location.hash !== '#results') {
        setView('home')
      }
    }
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [result])

  const update=(key,value)=>{setForm(f=>({...f,[key]:value}));setError('')}
  const valid=useMemo(()=>groups.every(g=>g.fields.every(f=>{
    const n=Number(form[f.key]);return form[f.key]!==''&&Number.isFinite(n)&&n>=f.min&&n<=f.max&&(f.step!==1||Number.isInteger(n))
  })),[form])

  async function submit(e){
    e.preventDefault()
    if(!valid){setError('Please check the numeric values and their allowed ranges.');return}
    setLoading(true);setError('')
    try{
      const response=await fetch('/api/predict',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify(Object.fromEntries(Object.entries(form).map(([k,v])=>['extracurricular','placement_training'].includes(k)?[k,v]:[k,Number(v)])))})
      const data=await response.json()
      if(!response.ok) throw new Error(typeof data.detail==='string'?data.detail:'Prediction could not be completed.')
      setResult(data)
      setView('results')
      window.location.hash = '#results'
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }catch(err){setError(err.message||'Could not reach the prediction server.')}
    finally{setLoading(false)}
  }

  const { placedPercent, notPlacedPercent, statusText, isPlaced, summaryTier, summaryLabel } = useMemo(() => {
    if (!result) {
      return {
        placedPercent: null,
        notPlacedPercent: null,
        statusText: '',
        isPlaced: false,
        summaryTier: null,
        summaryLabel: ''
      }
    }

    const p = result.probability_placed != null
      ? result.probability_placed * 100
      : (result.probabilities?.Placed != null ? result.probabilities.Placed * 100 : (result.prediction === 'Placed' ? 100 : 0))

    const np = result.probability_not_placed != null
      ? result.probability_not_placed * 100
      : (result.probabilities?.NotPlaced != null ? result.probabilities.NotPlaced * 100 : Math.max(0, 100 - p))

    const isPl = result.placement_status === 'Placed' || result.prediction === 'Placed'
    const status = isPl ? 'Placed' : 'Not Placed'

    let tier = 'moderate'
    let label = 'Moderate predicted placement probability'
    if (p >= 70) {
      tier = 'high'
      label = 'High predicted placement probability'
    } else if (p < 40) {
      tier = 'low'
      label = 'Low predicted placement probability'
    }

    return {
      placedPercent: p,
      notPlacedPercent: np,
      statusText: status,
      isPlaced: isPl,
      summaryTier: result.summary_tier || tier,
      summaryLabel: result.result_summary || label
    }
  }, [result])

  const reset=()=>{
    setForm(initial)
    setResult(null)
    setError('')
    setView('home')
    window.location.hash = '#predict'
  }

  const goHome = (hash = '#home') => {
    setView('home')
    window.location.hash = hash
    if (hash === '#predict') {
      requestAnimationFrame(() => document.getElementById('predict')?.scrollIntoView({ behavior: 'smooth' }))
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return <div className="app-shell">
    <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
    <header className="nav-wrap">
      <div className="nav container">
        <a href="#home" className="brand" onClick={(e) => { e.preventDefault(); goHome('#home') }}>
          <span className="brand-mark"><GraduationCap size={23}/></span>
          <span>placement<span className="brand-accent">.ai</span></span>
        </a>
        <nav className={mobileOpen?'nav-links show':'nav-links'}>
          <a href="#home" onClick={()=>{setMobileOpen(false); goHome('#home')}}>Home</a>
          <a href="#predict" onClick={()=>{setMobileOpen(false); goHome('#predict')}}>Predictor Form</a>
          {result && (
            <a href="#results" onClick={()=>{setMobileOpen(false); setView('results'); window.location.hash='#results'; window.scrollTo({top:0,behavior:'smooth'})}}>
              Prediction Results
            </a>
          )}
          <a href="#how-it-works" onClick={()=>{setMobileOpen(false); goHome('#how-it-works')}}>How it works</a>
        </nav>
        {view === 'results' ? (
          <button type="button" className="nav-cta" onClick={() => goHome('#predict')}>
            <ArrowLeft size={16}/> Edit Profile
          </button>
        ) : (
          <a className="nav-cta" href="#predict" onClick={() => goHome('#predict')}>
            Try predictor <ArrowUpRight size={16}/>
          </a>
        )}
        <button className="mobile-toggle" onClick={()=>setMobileOpen(!mobileOpen)} aria-label="Toggle menu">{mobileOpen?<X/>:<Menu/>}</button>
      </div>
    </header>

    {view === 'results' && result ? (
      <main id="results-view" className="results-page container">
        {/* Top Action Bar */}
        <div className="results-top-bar">
          <button type="button" className="back-btn" onClick={() => goHome('#predict')}>
            <ArrowLeft size={16} /> Back to Profile Form
          </button>
          <div className="results-actions-group">
            <button type="button" className="secondary-btn-sm" onClick={reset}>
              <RotateCcw size={14} /> New Profile
            </button>
            <button type="button" className="secondary-btn-sm" onClick={() => window.print()}>
              <Printer size={14} /> Print / Save
            </button>
          </div>
        </div>

        {/* Results Page Header Banner */}
        <div className="results-header-banner">
          <div className="eyebrow"><span className="pulse" /> MACHINE LEARNING INFERENCE REPORT • PREDICTION RESULTS</div>
          <h1>Placement Prediction <span>Report</span></h1>
          <p className="results-header-desc">
            Comprehensive evaluation of your academic, project, and experience profile using machine learning probability modeling and SHAP explainable AI attribution.
          </p>
        </div>

        {/* Student Profile Snapshot Strip */}
        <div className="profile-summary-strip">
          <div className="profile-summary-heading">
            <ClipboardList size={14} /> Student Profile Inputs Analyzed by Model
          </div>
          <div className="profile-chips-wrap">
            <div className="profile-chip"><strong>CGPA:</strong> {form.cgpa} / 10</div>
            <div className="profile-chip"><strong>Class 10:</strong> {form.ssc_marks}%</div>
            <div className="profile-chip"><strong>Class 12:</strong> {form.hsc_marks}%</div>
            <div className="profile-chip"><strong>Internships:</strong> {form.internships}</div>
            <div className="profile-chip"><strong>Projects:</strong> {form.projects}</div>
            <div className="profile-chip"><strong>Certifications:</strong> {form.certifications}</div>
            <div className="profile-chip"><strong>Aptitude Score:</strong> {form.aptitude} / 100</div>
            <div className="profile-chip"><strong>Soft Skills:</strong> {form.soft_skills} / 5</div>
            <div className="profile-chip"><strong>Extracurricular:</strong> {form.extracurricular}</div>
            <div className="profile-chip"><strong>Placement Training:</strong> {form.placement_training}</div>
          </div>
        </div>

        {/* Navigation Tabs on Results Page */}
        <div className="sim-tabs-nav" role="tablist">
          <button
            type="button"
            className={`sim-tab-btn ${resultTab === 'overview' ? 'active' : ''}`}
            onClick={() => setResultTab('overview')}
            role="tab"
            aria-selected={resultTab === 'overview'}
          >
            <BarChart3 size={16} /> Full Report &amp; SHAP Analysis
          </button>
          <button
            type="button"
            className={`sim-tab-btn ${resultTab === 'simulator' ? 'active' : ''}`}
            onClick={() => setResultTab('simulator')}
            role="tab"
            aria-selected={resultTab === 'simulator'}
          >
            <Sliders size={16} /> What-If Placement Simulator
            <span className="sim-tab-tag">Interactive</span>
          </button>
        </div>

        {resultTab === 'simulator' ? (
          <WhatIfSimulator originalProfile={form} originalResult={result} />
        ) : (
          <>
            {/* Banner to launch simulator directly */}
            <div className="sim-banner-cta">
              <div>
                <h4>Interactive What-If Placement Simulator</h4>
                <p>Simulate how tweaking your CGPA, internships, projects, or aptitude score affects your model placement probability.</p>
              </div>
              <button type="button" className="primary-button" onClick={() => setResultTab('simulator')}>
                Launch What-If Simulator <ArrowRight size={16} />
              </button>
            </div>

            {/* Two-Column Results Dashboard */}
            <div className="results-grid-layout">
              {/* Left Column: Outcomes, Gauge, Probabilities & Ranges */}
              <div className="results-col-card">
                {/* Status Header */}
                <div className="result-header-wrap">
                  <div className={`status-badge ${isPlaced ? 'status-placed' : 'status-not-placed'}`}>
                    {isPlaced ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    <span>Predicted Placement Status</span>
                  </div>
                  <h2 className={`result-status-title ${isPlaced ? 'placed' : 'not-placed'}`}>
                    {statusText}
                  </h2>
                  <p className="result-subtitle">
                    Model estimate based on patterns recognized by the trained classifier.
                  </p>
                </div>

                {/* Summary Tier Banner */}
                <div className={`summary-banner tier-${summaryTier}`}>
                  <div className="summary-banner-top">
                    <span className="summary-tag">RESULT SUMMARY</span>
                    <span className="summary-tier-badge">
                      {summaryTier === 'high' ? 'High Tier (≥ 70%)' : summaryTier === 'moderate' ? 'Moderate Tier (40%–69.9%)' : 'Low Tier (< 40%)'}
                    </span>
                  </div>
                  <h4 className="summary-title">{summaryLabel}</h4>
                  <p className="summary-caption">
                    Statistical indicator based on historical placement records. Does not imply guaranteed placement.
                  </p>
                  <div className="range-spectrum" role="group" aria-label="Probability ranges">
                    <div className={`spectrum-segment ${summaryTier === 'low' ? 'active-low' : ''}`}>
                      Low (&lt; 40%)
                    </div>
                    <div className={`spectrum-segment ${summaryTier === 'moderate' ? 'active-moderate' : ''}`}>
                      Moderate (40%–69.9%)
                    </div>
                    <div className={`spectrum-segment ${summaryTier === 'high' ? 'active-high' : ''}`}>
                      High (≥ 70%)
                    </div>
                  </div>
                </div>

                {/* Circular Gauge */}
                <CircularProbabilityGauge
                  placedPercent={placedPercent}
                  notPlacedPercent={notPlacedPercent}
                />

                {/* Dual Progress Bars */}
                <div className="metrics-section">
                  <div className="metric-card">
                    <div className="metric-card-header">
                      <span className="metric-card-title placed-title">
                        <TrendingUp size={16} /> Placement Probability
                      </span>
                      <span className="metric-card-value placed-val">
                        {placedPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="metric-bar-bg">
                      <div
                        className="metric-bar-fill placed-fill"
                        style={{ width: `${Math.min(100, Math.max(0, placedPercent))}%` }}
                      />
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-card-header">
                      <span className="metric-card-title not-placed-title">
                        <TrendingDown size={16} /> Non-Placement Probability
                      </span>
                      <span className="metric-card-value not-placed-val">
                        {notPlacedPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="metric-bar-bg">
                      <div
                        className="metric-bar-fill not-placed-fill"
                        style={{ width: `${Math.min(100, Math.max(0, notPlacedPercent))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Defined Probability Ranges */}
                <div className="ranges-guide">
                  <div className="ranges-guide-title">
                    <Info size={13} /> Defined Probability Classification
                  </div>
                  <div className="ranges-grid">
                    <div className="range-item">
                      <span className="range-item-tier low">Low</span>
                      <span className="range-item-bound">&lt; 40%</span>
                    </div>
                    <div className="range-item">
                      <span className="range-item-tier moderate">Moderate</span>
                      <span className="range-item-bound">40% – 69.9%</span>
                    </div>
                    <div className="range-item">
                      <span className="range-item-tier high">High</span>
                      <span className="range-item-bound">≥ 70%</span>
                    </div>
                  </div>
                </div>

                {/* Statistical Disclaimer */}
                <div className="result-footnote">
                  <CircleAlert size={16} />
                  <span>
                    Statistical estimate: Probability categories and classifications are derived from patterns in historical training data and do not imply or guarantee future placement.
                  </span>
                </div>
              </div>

              {/* Right Column: Explain My Prediction (SHAP) */}
              <div className="results-col-card">
                <ExplainSection
                  explanation={result.explanation}
                  tab={explainTab}
                  onTabChange={setExplainTab}
                  expanded={explainExpanded}
                  onToggleExpand={() => setExplainExpanded(prev => !prev)}
                />
              </div>
            </div>
          </>
        )}

        {/* Bottom Actions */}
        <div className="results-bottom-bar">
          <button type="button" className="primary-button" onClick={() => goHome('#predict')}>
            <ArrowLeft size={16} /> Edit Student Profile
          </button>
          <button type="button" className="secondary-button" onClick={reset}>
            <RotateCcw size={16} /> Start Another Prediction
          </button>
        </div>
      </main>
    ) : (
      <main id="home">
        <section className="hero container">
          <div className="hero-copy">
            <div className="eyebrow"><span className="pulse"/> MACHINE LEARNING • CAREER INSIGHTS</div>
            <h1>Your future,<br/><span>in focus.</span></h1>
            <p className="hero-desc">Turn your academic journey into meaningful insights. Explore your estimated placement outcome with a machine learning model trained on student data.</p>
            <div className="hero-actions">
              <a className="primary-button" href="#predict" onClick={() => goHome('#predict')}>Check my potential <ArrowRight size={19}/></a>
              <a className="secondary-button" href="#how-it-works">See how it works <ChevronRight size={17}/></a>
            </div>
            <div className="hero-trust"><span className="avatar-stack"><i>AI</i><i>ML</i><i>+</i></span><span>Built for students, powered by data</span></div>
          </div>
          <div className="hero-visual">
            <div className="visual-grid"/>
            <div className="orbital orbital-a"/><div className="orbital orbital-b"/>
            <div className="hero-card hero-card-top"><span className="mini-icon mint"><TrendingUp size={18}/></span><div><small>MODEL INSIGHT</small><strong>Data-driven outlook</strong></div><Sparkles size={17} className="sparkle"/></div>
            <div className="core-glow"><div className="core-ring"><BrainCircuit size={90} strokeWidth={1.2}/></div></div>
            <div className="hero-card hero-card-bottom"><div className="graph-bars">{[28,42,38,66,52,80,100].map((n,i)=><i key={i} style={{height:`${n}%`}}/>)}</div><div><small>SMART ANALYSIS</small><strong>10 student features</strong></div></div>
            <div className="floating-dot dot-a"/><div className="floating-dot dot-b"/>
          </div>
        </section>

        <section className="feature-strip container" aria-label="Highlights">
          <div><span className="strip-icon"><Cpu size={20}/></span><div><strong>Real ML model</strong><small>Trained on placement data</small></div></div>
          <div><span className="strip-icon"><BarChart3 size={20}/></span><div><strong>10 key inputs</strong><small>Academics, skills & more</small></div></div>
          <div><span className="strip-icon"><ShieldCheck size={20}/></span><div><strong>Instant results</strong><small>Prediction via Python API</small></div></div>
        </section>

        <section id="predict" className="predict-section container">
          <div className="section-head"><div><span className="section-kicker">THE PREDICTOR</span><h2>Let's explore your <span>potential.</span></h2><p>Fill in your details to see your model-estimated placement outcome.</p></div>
            <div className={`status-pill ${health?.model_loaded?'online':'offline'}`}><span className="status-dot"/>{health?.model_loaded?'Model online':health?'Model unavailable':'Checking model...'}</div>
          </div>
          <div className="workspace">
            <form className="form-panel" onSubmit={submit}>
              <div className="panel-header"><span className="panel-icon"><ClipboardList size={21}/></span><div><h3>Student profile</h3><p>Tell us a little about yourself</p></div><span className="step-tag">01 / 02</span></div>
              {groups.map(group=><div className="form-group" key={group.title}>
                <div className="group-heading"><group.icon size={18}/><div><h4>{group.title}</h4><p>{group.caption}</p></div></div>
                <div className="field-grid">{group.fields.map(field=><Field key={field.key} field={field} value={form[field.key]} onChange={update}/>)}</div>
              </div>)}
              <div className="form-group final-group">
                <div className="group-heading"><BadgeCheck size={18}/><div><h4>Additional activities</h4><p>Small details make the profile complete</p></div></div>
                <Toggle label="Extracurricular activities" value={form.extracurricular} onChange={v=>update('extracurricular',v)}/>
                <Toggle label="Completed placement training" value={form.placement_training} onChange={v=>update('placement_training',v)}/>
              </div>
              {error&&<div className="error-box" role="alert"><CircleAlert size={18}/>{error}</div>}
              <div className="form-actions"><button type="button" className="reset-button" onClick={reset}><RotateCcw size={17}/> Reset</button><button type="submit" className="primary-button predict-button" disabled={loading||!valid}>{loading?'Analyzing your profile...':'Generate prediction'}{loading?<span className="spinner"/>:<ArrowRight size={18}/>}</button></div>
            </form>
            <aside className="insight-panel">
              <div className="insight-head"><span className="section-kicker">PREDICTOR PREVIEW</span><span className="step-tag">02 / 02</span></div>
              <div className="insight-main">
                {result ? (
                  <div className="result-container">
                    <div className="status-badge status-placed">
                      <CheckCircle2 size={15} />
                      <span>Report Ready</span>
                    </div>
                    <h3 className="result-title" style={{ fontSize: '32px', margin: '10px 0' }}>{statusText}</h3>
                    <p className="result-text">
                      Prediction calculated: {placedPercent.toFixed(1)}% placement probability.
                    </p>
                    <button
                      type="button"
                      className="primary-button"
                      style={{ marginTop: '12px' }}
                      onClick={() => { setView('results'); window.location.hash = '#results'; window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    >
                      Open Full Prediction Page <ArrowRight size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="empty-orbit"><div><WandSparkles size={43} strokeWidth={1.4}/></div></div>
                    <span className="waiting-pill"><span className="pulse"/> READY WHEN YOU ARE</span>
                    <h3>Your insights<br/>start here.</h3>
                    <p>Complete your student profile and click “Generate prediction” to open your dedicated prediction and explainability report.</p>
                    <div className="empty-steps">
                      <div><span>01</span> Add your academic details <Check size={15}/></div>
                      <div><span>02</span> Include experience & skills <Check size={15}/></div>
                      <div><span>03</span> View full report on new page <ArrowRight size={15}/></div>
                    </div>
                  </>
                )}
              </div>
              <div className="insight-footer"><ShieldCheck size={17}/><span>Predictions run through your saved ML pipeline</span></div>
            </aside>
          </div>
        </section>

        <section id="how-it-works" className="how-section container">
          <div className="how-title"><span className="section-kicker">HOW IT WORKS</span><h2>Complex ML.<br/><span>Simple experience.</span></h2><p>No complicated setup for students. Just your profile and a prediction.</p></div>
          <div className="how-cards">
            <div className="how-card"><span className="how-number">01</span><div className="how-icon"><BookOpen size={25}/></div><h3>Enter your profile</h3><p>Add academics, internships, projects and skill ratings using a quick form.</p></div>
            <div className="how-card"><span className="how-number">02</span><div className="how-icon"><BrainCircuit size={25}/></div><h3>Model analyzes</h3><p>The Python backend preprocesses inputs and uses your trained classifier.</p></div>
            <div className="how-card"><span className="how-number">03</span><div className="how-icon"><TrendingUp size={25}/></div><h3>Get an estimate</h3><p>View the predicted placement status and estimated probability when available.</p></div>
          </div>
        </section>
      </main>
    )}
    <footer className="footer container">
      <div className="brand" onClick={() => goHome('#home')} style={{ cursor: 'pointer' }}>
        <span className="brand-mark"><GraduationCap size={20}/></span>
        <span>placement<span className="brand-accent">.ai</span></span>
      </div>
      <p>Built for learning and exploration. Predictions are not career guarantees.</p>
      <span>Powered by React + FastAPI</span>
    </footer>
  </div>
}
