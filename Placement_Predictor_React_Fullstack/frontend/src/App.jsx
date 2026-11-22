import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BarChart3, BookOpen, BrainCircuit, Check,
  ChevronRight, CircleAlert, CircleCheck, ClipboardList, Cpu, GraduationCap, Layers3,
  Menu, RotateCcw, ShieldCheck, Sparkles, TrendingUp, WandSparkles, X
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

function Donut({ percent }) {
  const p = Math.max(0,Math.min(100,percent))
  return <div className="donut" style={{'--p':`${p}%`}}>
    <div className="donut-core"><span className="donut-number">{Math.round(p)}<small>%</small></span><span className="donut-sub">estimated</span></div>
  </div>
}

export default function App() {
  const [form,setForm]=useState(initial)
  const [result,setResult]=useState(null)
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [model,setModel]=useState(null)
  const [health,setHealth]=useState(null)
  const [mobileOpen,setMobileOpen]=useState(false)
  const [active,setActive]=useState('predict')

  useEffect(()=>{
    fetch('/api/health').then(r=>r.json()).then(setHealth).catch(()=>setHealth({status:'offline'}))
    fetch('/api/model-info').then(r=>r.ok?r.json():null).then(setModel).catch(()=>{})
  },[])

  const update=(key,value)=>{setForm(f=>({...f,[key]:value}));setResult(null);setError('')}
  const valid=useMemo(()=>groups.every(g=>g.fields.every(f=>{
    const n=Number(form[f.key]);return form[f.key]!==''&&Number.isFinite(n)&&n>=f.min&&n<=f.max&&(f.step!==1||Number.isInteger(n))
  })),[form])

  async function submit(e){
    e.preventDefault()
    if(!valid){setError('Please check the numeric values and their allowed ranges.');return}
    setLoading(true);setError('');setResult(null)
    try{
      const response=await fetch('/api/predict',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify(Object.fromEntries(Object.entries(form).map(([k,v])=>['extracurricular','placement_training'].includes(k)?[k,v]:[k,Number(v)])))})
      const data=await response.json()
      if(!response.ok) throw new Error(typeof data.detail==='string'?data.detail:'Prediction could not be completed.')
      setResult(data)
      requestAnimationFrame(()=>document.getElementById('result')?.scrollIntoView({behavior:'smooth',block:'center'}))
    }catch(err){setError(err.message||'Could not reach the prediction server.')}
    finally{setLoading(false)}
  }

  const probability = result?.probability_placed == null ? null : result.probability_placed*100
  const isPlaced = result?.prediction === 'Placed'
  const reset=()=>{setForm(initial);setResult(null);setError('')}

  return <div className="app-shell">
    <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
    <header className="nav-wrap">
      <div className="nav container">
        <a href="#home" className="brand"><span className="brand-mark"><GraduationCap size={23}/></span><span>placement<span className="brand-accent">.ai</span></span></a>
        <nav className={mobileOpen?'nav-links show':'nav-links'}>
          <a href="#home" onClick={()=>setMobileOpen(false)}>Home</a>
          <a href="#predict" onClick={()=>setMobileOpen(false)}>Predict</a>
          <a href="#how-it-works" onClick={()=>setMobileOpen(false)}>How it works</a>
        </nav>
        <a className="nav-cta" href="#predict">Try predictor <ArrowUpRight size={16}/></a>
        <button className="mobile-toggle" onClick={()=>setMobileOpen(!mobileOpen)} aria-label="Toggle menu">{mobileOpen?<X/>:<Menu/>}</button>
      </div>
    </header>

    <main id="home">
      <section className="hero container">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse"/> MACHINE LEARNING • CAREER INSIGHTS</div>
          <h1>Your future,<br/><span>in focus.</span></h1>
          <p className="hero-desc">Turn your academic journey into meaningful insights. Explore your estimated placement outcome with a machine learning model trained on student data.</p>
          <div className="hero-actions">
            <a className="primary-button" href="#predict">Check my potential <ArrowRight size={19}/></a>
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
            <div className="insight-head"><span className="section-kicker">YOUR INSIGHT</span><span className="step-tag">02 / 02</span></div>
            <div id="result" className="insight-main">
              {result ? <>
                <div className={`result-icon ${isPlaced?'success':'warning'}`}>{isPlaced?<CircleCheck size={30}/>:<BrainCircuit size={30}/>}</div>
                <div className="result-eyebrow">PREDICTED PLACEMENT STATUS</div>
                <h3 className="result-title">{result.prediction}</h3>
                <p className="result-text">Based on the profile you entered and the patterns learned by the model.</p>
                {probability!==null&&<><Donut percent={probability}/><div className="probability-label"><span>Estimated probability of placement</span><strong>{probability.toFixed(1)}%</strong></div><div className="progress-track"><div style={{width:`${probability}%`}}/></div></>}
                <div className="result-footnote"><CircleAlert size={17}/>This is a statistical estimate, not a guarantee of placement.</div>
              </> : <>
                <div className="empty-orbit"><div><WandSparkles size={43} strokeWidth={1.4}/></div></div>
                <span className="waiting-pill"><span className="pulse"/> READY WHEN YOU ARE</span>
                <h3>Your insights<br/>start here.</h3>
                <p>Complete your student profile and hit “Generate prediction” to see your personalized result.</p>
                <div className="empty-steps"><div><span>01</span> Add your academic details <Check size={15}/></div><div><span>02</span> Include experience & skills <Check size={15}/></div><div><span>03</span> Discover your result <ArrowRight size={15}/></div></div>
              </>}
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
    <footer className="footer container"><div className="brand"><span className="brand-mark"><GraduationCap size={20}/></span><span>placement<span className="brand-accent">.ai</span></span></div><p>Built for learning and exploration. Predictions are not career guarantees.</p><span>Powered by React + FastAPI</span></footer>
  </div>
}
