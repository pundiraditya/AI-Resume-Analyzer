import { useState, useRef, useEffect } from "react";

// ── PASTE YOUR API KEY IN .env AS: REACT_APP_ANTHROPIC_KEY=sk-ant-...
const API_KEY = process.env.REACT_APP_ANTHROPIC_KEY || "";

const ALL_ANIMS = `
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}
@keyframes pulse-ring {
  0% { transform: scale(0.9); opacity: 1; }
  100% { transform: scale(1.6); opacity: 0; }
}
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes countUp {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes orbit {
  from { transform: rotate(0deg) translateX(45px) rotate(0deg); }
  to { transform: rotate(360deg) translateX(45px) rotate(-360deg); }
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
@keyframes trailFade {
  0% { opacity: 0.85; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.1); }
}
@keyframes cursorPulse {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.3); opacity: 1; }
}
@keyframes particleDrift {
  0%   { transform: translateY(0px)   translateX(0px)   scale(1);   opacity: 0.6; }
  33%  { transform: translateY(-18px) translateX(10px)  scale(1.1); opacity: 1;   }
  66%  { transform: translateY(-10px) translateX(-8px)  scale(0.9); opacity: 0.8; }
  100% { transform: translateY(0px)   translateX(0px)   scale(1);   opacity: 0;   }
}
`;

const C = {
  bg:          "#0a0a0f",
  surface:     "#12121a",
  card:        "#1a1a28",
  border:      "#2a2a40",
  accent:      "#6c63ff",
  accentLight: "#8b85ff",
  cyan:        "#00d4ff",
  green:       "#00ff9d",
  amber:       "#ffb800",
  red:         "#ff4b6e",
  text:        "#e8e8f0",
  muted:       "#6b6b8a",
};

// ─────────────────────────────────────────
//  Root component
// ─────────────────────────────────────────
export default function ResumeAnalyzer() {
  const [step,        setStep]        = useState("upload");
  const [resumeFile,  setResumeFile]  = useState(null);
  const [resumeText,  setResumeText]  = useState("");
  const [jobDesc,     setJobDesc]     = useState("");
  const [results,     setResults]     = useState(null);
  const [analysisLog, setAnalysisLog] = useState([]);
  const [dragOver,    setDragOver]    = useState(false);
  const [parseError,  setParseError]  = useState("");

  // cursor state
  const [cursor,      setCursor]      = useState({ x: -200, y: -200 });
  const [trail,       setTrail]       = useState([]);
  const [particles,   setParticles]   = useState([]);

  const fileInputRef = useRef(null);
  const logRef       = useRef(null);
  const particleId   = useRef(0);

  // inject keyframes
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = ALL_ANIMS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  // cursor tracking
  useEffect(() => {
    const onMove = (e) => {
      const pos = { x: e.clientX, y: e.clientY };
      setCursor(pos);

      // trail
      setTrail(prev => [
        { ...pos, id: Date.now() + Math.random() },
        ...prev.slice(0, 10),
      ]);

      // occasionally spawn a floating particle
      if (Math.random() < 0.12) {
        const id = particleId.current++;
        setParticles(prev => [
          ...prev.slice(-18),
          { id, x: e.clientX, y: e.clientY },
        ]);
        setTimeout(() => {
          setParticles(prev => prev.filter(p => p.id !== id));
        }, 900);
      }
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // auto-scroll analysis log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [analysisLog]);

  // ── file reader
  const handleFile = async (file) => {
    if (!file) return;
    const ok = ["application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"];
    if (!ok.includes(file.type) && !file.name.match(/\.(pdf|docx|txt)$/i)) {
      setParseError("Please upload a PDF, DOCX, or TXT file.");
      return;
    }
    setParseError("");
    setResumeFile(file);
    try {
      const text = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload  = e => res(e.target.result);
        r.onerror = rej;
        r.readAsText(file);
      });
      setResumeText(text);
    } catch {
      setResumeText(`[File: ${file.name}]`);
    }
  };

  // ── main analysis
  const runAnalysis = async () => {
    setStep("analyzing");
    setAnalysisLog([]);

    const logs = [
      "🔍 Parsing resume structure...",
      "📋 Extracting personal information...",
      "🛠️  Identifying technical skills...",
      "💼 Analyzing work experience...",
      "🎓 Processing education details...",
      "🔗 Matching against job description...",
      "📊 Calculating compatibility score...",
      "💡 Generating improvement suggestions...",
      "🏆 Ranking resume strength...",
      "✅ Finalizing analysis report...",
    ];

    for (const log of logs) {
      await new Promise(r => setTimeout(r, 550 + Math.random() * 450));
      setAnalysisLog(prev => [...prev, log]);
    }

    const prompt = `You are an expert AI Resume Analyzer. Analyze the following resume against the job description and return ONLY valid JSON (no markdown, no backticks, no extra text).

RESUME CONTENT:
${resumeText || `[Resume file: ${resumeFile?.name}]`}

JOB DESCRIPTION:
${jobDesc}

Return EXACTLY this JSON structure (no other text):
{
  "name": "Full name from resume or Unknown",
  "email": "email or Not found",
  "phone": "phone or Not found",
  "location": "location or Not found",
  "skills": ["skill1","skill2","skill3","skill4","skill5"],
  "matchScore": 78,
  "rankLabel": "Strong Match",
  "rankColor": "green",
  "matchedKeywords": ["keyword1","keyword2","keyword3"],
  "missingKeywords": ["missing1","missing2","missing3"],
  "strengths": ["strength 1","strength 2","strength 3"],
  "improvements": ["improvement 1","improvement 2","improvement 3"],
  "experienceYears": "5 years",
  "topRole": "Software Engineer",
  "educationLevel": "Bachelor's Degree",
  "insights": { "skillsScore": 80, "experienceScore": 75, "educationScore": 70, "keywordsScore": 65 }
}

matchScore 0-100. rankLabel: "Excellent Match"|"Strong Match"|"Good Match"|"Partial Match"|"Weak Match". rankColor: green 80+, cyan 65-79, amber 50-64, red <50.`;

    try {
      if (!API_KEY) throw new Error("No API key – set REACT_APP_ANTHROPIC_KEY in .env");

      const res  = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type":    "application/json",
          "x-api-key":       API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model:      "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages:   [{ role: "user", content: prompt }],
        }),
      });
      const data  = await res.json();
      const raw   = (data.content ?? []).map(c => c.text || "").join("");
      const clean = raw.replace(/```json|```/g, "").trim();
      setResults(JSON.parse(clean));
      setStep("results");
    } catch (e) {
      console.error(e);
      setResults({
        name: "Analysis Error", email: "N/A", phone: "N/A", location: "N/A",
        skills: ["Check console for errors"],
        matchScore: 0, rankLabel: "Error", rankColor: "red",
        matchedKeywords: [], missingKeywords: [],
        strengths: [e.message || "Unknown error"],
        improvements: ["Ensure REACT_APP_ANTHROPIC_KEY is set in .env and server restarted"],
        experienceYears: "N/A", topRole: "N/A", educationLevel: "N/A",
        insights: { skillsScore: 0, experienceScore: 0, educationScore: 0, keywordsScore: 0 },
      });
      setStep("results");
    }
  };

  const reset = () => {
    setStep("upload"); setResumeFile(null); setResumeText("");
    setJobDesc(""); setResults(null); setAnalysisLog([]); setParseError("");
  };

  const scoreColor = s => s >= 80 ? C.green : s >= 65 ? C.cyan : s >= 50 ? C.amber : C.red;

  // ── render
  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      fontFamily: "'Syne', 'Space Grotesk', sans-serif",
      color: C.text,
      padding: "0 0 80px",
      cursor: "none",            // hide default cursor
      overflowX: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* ══ BACKGROUND VIDEO ══ */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <video
  autoPlay
  muted
  loop
  playsInline
  style={{
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    objectFit: "cover",
  }}
>
  <source src="/bg.mp4" type="video/mp4" />
</video>

        {/* dark overlay keeps text readable */}
        <div style={{
          position: "fixed", inset: 0,
          background: `linear-gradient(160deg, ${C.bg}dd 0%, ${C.bg}aa 50%, ${C.bg}ee 100%)`,
        }} />

        {/* grid lines on top */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(${C.border}25 1px, transparent 1px),
                            linear-gradient(90deg, ${C.border}25 1px, transparent 1px)`,
          backgroundSize: "44px 44px",
        }} />

        {/* ambient orbs */}
        <div style={{
          position: "absolute", top: "18%", left: "8%",
          width: 420, height: 420, borderRadius: "50%",
          background: `radial-gradient(circle, ${C.accent}14 0%, transparent 70%)`,
          animation: "float 7s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", bottom: "15%", right: "8%",
          width: 320, height: 320, borderRadius: "50%",
          background: `radial-gradient(circle, ${C.cyan}0e 0%, transparent 70%)`,
          animation: "float 9s ease-in-out infinite reverse",
        }} />
      </div>

      {/* ══ CURSOR: large soft glow that follows mouse ══ */}
      <div style={{
        position: "fixed",
        left: cursor.x - 220,
        top:  cursor.y - 220,
        width: 440, height: 440,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${C.accent}12 0%, transparent 68%)`,
        pointerEvents: "none",
        zIndex: 9990,
        transition: "left 0.06s linear, top 0.06s linear",
      }} />

      {/* ══ CURSOR: ring ══ */}
      <div style={{
        position: "fixed",
        left: cursor.x - 18, top: cursor.y - 18,
        width: 36, height: 36,
        borderRadius: "50%",
        border: `1.5px solid ${C.accentLight}99`,
        pointerEvents: "none",
        zIndex: 9999,
        transition: "left 0.10s ease, top 0.10s ease",
        animation: "cursorPulse 2s ease-in-out infinite",
      }} />

      {/* ══ CURSOR: dot center ══ */}
      <div style={{
        position: "fixed",
        left: cursor.x - 4, top: cursor.y - 4,
        width: 8, height: 8,
        borderRadius: "50%",
        background: C.cyan,
        pointerEvents: "none",
        zIndex: 9999,
        boxShadow: `0 0 8px ${C.cyan}`,
      }} />

      {/* ══ CURSOR: motion trail ══ */}
      {trail.map((dot, i) => (
        <div key={dot.id} style={{
          position: "fixed",
          left: dot.x - (5 - i * 0.35),
          top:  dot.y - (5 - i * 0.35),
          width:  Math.max(2, 10 - i * 0.8),
          height: Math.max(2, 10 - i * 0.8),
          borderRadius: "50%",
          background: i < 3 ? C.cyan : C.accent,
          opacity: Math.max(0, 0.75 - i * 0.07),
          pointerEvents: "none",
          zIndex: 9998,
          transition: `left ${0.04 + i * 0.018}s ease, top ${0.04 + i * 0.018}s ease`,
          boxShadow: i < 4 ? `0 0 ${6 - i}px ${C.accent}` : "none",
        }} />
      ))}

      {/* ══ CURSOR: floating spark particles ══ */}
      {particles.map(p => (
        <div key={p.id} style={{
          position: "fixed",
          left: p.x - 4, top: p.y - 4,
          width: 6 + Math.random() * 4,
          height: 6 + Math.random() * 4,
          borderRadius: "50%",
          background: Math.random() > 0.5 ? C.accent : C.cyan,
          pointerEvents: "none",
          zIndex: 9997,
          animation: "particleDrift 0.9s ease-out forwards",
          boxShadow: `0 0 6px ${C.accent}`,
        }} />
      ))}

      {/* ══ PAGE CONTENT ══ */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 860, margin: "0 auto", padding: "40px 24px 0" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48, animation: "fadeSlideUp 0.6s ease both" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `linear-gradient(135deg, ${C.accent}, ${C.cyan})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, animation: "float 4s ease-in-out infinite",
            }}>🧠</div>
            <div style={{
              fontSize: 12, fontFamily: "'Space Mono'", letterSpacing: 4,
              color: C.muted, textTransform: "uppercase",
            }}>AI Resume Analyzer</div>
          </div>
          <h1 style={{
            fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, margin: 0, lineHeight: 1.1,
            background: `linear-gradient(135deg, ${C.text} 30%, ${C.accentLight} 60%, ${C.cyan} 90%)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundSize: "200% auto",
            animation: "shimmer 3s linear infinite",
          }}>
            Decode Your Resume
          </h1>
          <p style={{ color: C.muted, marginTop: 12, fontSize: 15 }}>
            AI-powered analysis · Match scoring · Actionable feedback
          </p>
        </div>

        <StepBar current={step} />

        {step === "upload"    && (
          <UploadPanel
            file={resumeFile} error={parseError}
            dragOver={dragOver} setDragOver={setDragOver}
            onFile={handleFile} fileInputRef={fileInputRef}
            onNext={() => setStep("job_desc")}
          />
        )}
        {step === "job_desc"  && (
          <JobDescPanel
            value={jobDesc} onChange={setJobDesc}
            onBack={() => setStep("upload")} onAnalyze={runAnalysis}
          />
        )}
        {step === "analyzing" && <AnalyzingPanel logs={analysisLog} logRef={logRef} />}
        {step === "results"   && results && (
          <ResultsPanel results={results} scoreColor={scoreColor} onReset={reset} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  Step indicator bar
// ─────────────────────────────────────────
function StepBar({ current }) {
  const steps = [
    { id: "upload",    label: "Upload"   },
    { id: "job_desc",  label: "Job Desc" },
    { id: "analyzing", label: "Analyzing"},
    { id: "results",   label: "Results"  },
  ];
  const idx = steps.findIndex(s => s.id === current);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 40 }}>
      {steps.map((s, i) => {
        const done   = i < idx;
        const active = i === idx;
        return (
          <div key={s.id} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: done ? C.green : active ? C.accent : C.surface,
                border: `2px solid ${done ? C.green : active ? C.accent : C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, fontFamily: "'Space Mono'",
                color: done || active ? "#fff" : C.muted,
                transition: "all 0.4s",
                boxShadow: active ? `0 0 18px ${C.accent}66` : "none",
              }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 11, color: active ? C.text : C.muted, fontWeight: active ? 600 : 400, letterSpacing: 1 }}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: 60, height: 2, marginBottom: 18,
                background: done ? C.green : C.border,
                transition: "background 0.4s",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────
//  Step 1 – Upload
// ─────────────────────────────────────────
function UploadPanel({ file, error, dragOver, setDragOver, onFile, fileInputRef, onNext }) {
  return (
    <div style={{ animation: "fadeSlideUp 0.5s ease both" }}>
      <div
        onDragOver={e  => { e.preventDefault(); setDragOver(true);  }}
        onDragLeave={() =>   setDragOver(false)}
        onDrop={e      => { e.preventDefault(); setDragOver(false); onFile(e.dataTransfer.files[0]); }}
        onClick={() =>       fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? C.accent : file ? C.green : C.border}`,
          borderRadius: 20, padding: "60px 40px",
          background: dragOver ? `${C.accent}09` : file ? `${C.green}08` : C.surface,
          cursor: "none", textAlign: "center",
          transition: "all 0.3s",
          boxShadow: dragOver ? `0 0 32px ${C.accent}22` : "none",
        }}
      >
        <input
          ref={fileInputRef} type="file" accept=".pdf,.docx,.txt"
          style={{ display: "none" }}
          onChange={e => onFile(e.target.files[0])}
        />
        <div style={{ fontSize: 56, marginBottom: 16, animation: "float 3s ease-in-out infinite" }}>
          {file ? "📄" : "⬆️"}
        </div>
        {file ? (
          <>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.green, marginBottom: 8 }}>✓ {file.name}</div>
            <div style={{ color: C.muted, fontSize: 14 }}>{(file.size / 1024).toFixed(1)} KB · Click to change</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Drop your resume here</div>
            <div style={{ color: C.muted, fontSize: 14 }}>or click to browse · PDF, DOCX, TXT supported</div>
          </>
        )}
      </div>

      {error && <div style={{ marginTop: 12, color: C.red, fontSize: 13, textAlign: "center" }}>{error}</div>}

      {/* Orbit decoration */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 36, height: 100 }}>
        <div style={{ position: "relative", width: 100, height: 100 }}>
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            width: 40, height: 40, borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.accent}, ${C.cyan})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>🤖</div>
          {["📊", "💡", "🏆"].map((icon, i) => (
            <div key={i} style={{
              position: "absolute", top: "50%", left: "50%",
              animation: `orbit ${3 + i}s linear infinite`,
              animationDelay: `${i * -1}s`,
              fontSize: 16, marginLeft: -10, marginTop: -10,
            }}>{icon}</div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 32, textAlign: "center" }}>
        <Btn disabled={!file} onClick={onNext}>Continue →</Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  Step 2 – Job Description
// ─────────────────────────────────────────
function JobDescPanel({ value, onChange, onBack, onAnalyze }) {
  return (
    <div style={{ animation: "fadeSlideUp 0.5s ease both" }}>
      <div style={{ background: C.surface, borderRadius: 20, padding: 32, border: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 28, animation: "float 3s ease-in-out infinite" }}>📋</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Job Description</div>
            <div style={{ fontSize: 13, color: C.muted }}>Paste the full job description for accurate matching</div>
          </div>
        </div>

        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={`Paste the job description here...\n\ne.g.:\nWe are looking for a Senior Software Engineer with 5+ years of experience in React, Node.js, and cloud technologies...`}
          style={{
            width: "100%", minHeight: 240, borderRadius: 12,
            background: C.card, border: `1px solid ${C.border}`,
            color: C.text, fontSize: 14, padding: 16, lineHeight: 1.7,
            resize: "vertical", outline: "none",
            fontFamily: "'Syne', sans-serif",
            boxSizing: "border-box",
            transition: "border-color 0.2s",
            cursor: "none",
          }}
          onFocus={e => e.target.style.borderColor = C.accent}
          onBlur={e  => e.target.style.borderColor = C.border}
        />
        <div style={{ marginTop: 6, fontSize: 12, color: C.muted, textAlign: "right" }}>
          {value.split(/\s+/).filter(Boolean).length} words
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "center" }}>
        <GhostBtn onClick={onBack}>← Back</GhostBtn>
        <Btn disabled={!value.trim()} onClick={onAnalyze}>⚡ Analyze Resume</Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  Step 3 – Analyzing
// ─────────────────────────────────────────
function AnalyzingPanel({ logs, logRef }) {
  return (
    <div style={{ textAlign: "center", animation: "fadeSlideUp 0.5s ease both" }}>
      {/* Triple spinner */}
      <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto 32px" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `3px solid ${C.border}` }} />
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "3px solid transparent",
          borderTopColor: C.accent, borderRightColor: C.cyan,
          animation: "spin 1.2s linear infinite",
        }} />
        <div style={{
          position: "absolute", inset: 12, borderRadius: "50%",
          border: "2px solid transparent",
          borderTopColor: C.green,
          animation: "spin 0.8s linear infinite reverse",
        }} />
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center", fontSize: 36,
        }}>🧠</div>
        <div style={{
          position: "absolute", inset: -10, borderRadius: "50%",
          border: `2px solid ${C.accent}44`,
          animation: "pulse-ring 2s ease-out infinite",
        }} />
      </div>

      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Analyzing Resume</div>
      <div style={{ color: C.muted, fontSize: 14, marginBottom: 32 }}>AI is processing your documents…</div>

      {/* Log terminal */}
      <div ref={logRef} style={{
        background: C.surface, borderRadius: 16,
        border: `1px solid ${C.border}`,
        padding: 20, maxHeight: 260, overflowY: "auto",
        textAlign: "left", fontFamily: "'Space Mono'", fontSize: 13,
      }}>
        {logs.map((log, i) => (
          <div key={i} style={{
            padding: "6px 0",
            color: i === logs.length - 1 ? C.text : C.muted,
            animation: "fadeSlideUp 0.4s ease both",
            borderBottom: i < logs.length - 1 ? `1px solid ${C.border}33` : "none",
          }}>
            {log}
          </div>
        ))}
        {logs.length < 10 && (
          <div style={{ color: C.accent, animation: "blink 1s infinite" }}>▋</div>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ marginTop: 20, height: 4, borderRadius: 4, background: C.border, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 4,
          background: `linear-gradient(90deg, ${C.accent}, ${C.cyan})`,
          width: `${(logs.length / 10) * 100}%`,
          transition: "width 0.5s ease",
          boxShadow: `0 0 10px ${C.accent}`,
        }} />
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: C.muted, fontFamily: "'Space Mono'" }}>
        {Math.round((logs.length / 10) * 100)}%
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  Step 4 – Results
// ─────────────────────────────────────────
function ResultsPanel({ results, scoreColor, onReset }) {
  const sc = scoreColor(results.matchScore);

  return (
    <div style={{ animation: "fadeSlideUp 0.6s ease both" }}>

      {/* ── Score hero card ── */}
      <div style={{
        background: C.surface, borderRadius: 24,
        border: `1px solid ${C.border}`,
        padding: "40px 32px", marginBottom: 20, textAlign: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: 340, height: 340, borderRadius: "50%",
          background: `radial-gradient(circle, ${sc}12 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 40, flexWrap: "wrap" }}>
          {/* Circular score gauge */}
          <div style={{ position: "relative", width: 140, height: 140 }}>
            <svg width="140" height="140" style={{ position: "absolute", top: 0, left: 0 }}>
              <circle cx="70" cy="70" r="60" fill="none" stroke={C.border} strokeWidth="8" />
              <circle
                cx="70" cy="70" r="60" fill="none" stroke={sc} strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 60}`}
                strokeDashoffset={`${2 * Math.PI * 60 * (1 - results.matchScore / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 70 70)"
                style={{ transition: "stroke-dashoffset 1.5s ease", filter: `drop-shadow(0 0 8px ${sc})` }}
              />
            </svg>
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: sc, animation: "countUp 0.6s ease both" }}>
                {results.matchScore}
              </div>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: "'Space Mono'" }}>/ 100</div>
            </div>
          </div>

          <div style={{ textAlign: "left" }}>
            <div style={{
              display: "inline-block", padding: "6px 16px", borderRadius: 20,
              background: `${sc}22`, color: sc, fontWeight: 700, fontSize: 14,
              border: `1px solid ${sc}44`, marginBottom: 12,
              boxShadow: `0 0 12px ${sc}33`,
            }}>
              {results.rankLabel}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{results.name}</div>
            <div style={{ color: C.muted, fontSize: 14 }}>{results.topRole}</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 8 }}>
              {results.email} · {results.phone}
            </div>
            <div style={{ fontSize: 13, color: C.muted }}>{results.location}</div>
          </div>
        </div>
      </div>

      {/* ── Info tiles ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Experience",  value: results.experienceYears, icon: "💼" },
          { label: "Education",   value: results.educationLevel,  icon: "🎓" },
          { label: "Top Skills",  value: `${results.skills?.length || 0} found`, icon: "🛠️" },
        ].map(item => (
          <div key={item.label} style={{
            background: C.surface, borderRadius: 16, padding: "20px 16px",
            border: `1px solid ${C.border}`, textAlign: "center",
            animation: "fadeSlideUp 0.5s ease both",
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{item.value}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* ── Score breakdown ── */}
      <div style={{ background: C.surface, borderRadius: 20, padding: 28, border: `1px solid ${C.border}`, marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>📊 Score Breakdown</div>
        {[
          { label: "Skills Match", value: results.insights?.skillsScore     || 0 },
          { label: "Experience",   value: results.insights?.experienceScore || 0 },
          { label: "Education",    value: results.insights?.educationScore  || 0 },
          { label: "Keywords",     value: results.insights?.keywordsScore   || 0 },
        ].map((item, i) => (
          <div key={item.label} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: C.muted }}>{item.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(item.value) }}>{item.value}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 4, background: C.border, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 4,
                background: `linear-gradient(90deg, ${scoreColor(item.value)}, ${scoreColor(item.value)}aa)`,
                width: `${item.value}%`,
                transition: `width 1.2s ease ${i * 0.15}s`,
                boxShadow: `0 0 8px ${scoreColor(item.value)}66`,
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Skills ── */}
      <div style={{ background: C.surface, borderRadius: 20, padding: 28, border: `1px solid ${C.border}`, marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🛠️ Extracted Skills</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {results.skills?.map(sk => (
            <span key={sk} style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
              background: `${C.accent}18`, color: C.accentLight,
              border: `1px solid ${C.accent}33`,
              animation: "fadeSlideUp 0.4s ease both",
            }}>{sk}</span>
          ))}
        </div>
      </div>

      {/* ── Keywords matched / missing ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <KeywordBox title="✅ Matched Keywords" color={C.green}  items={results.matchedKeywords} />
        <KeywordBox title="❌ Missing Keywords"  color={C.red}   items={results.missingKeywords} />
      </div>

      {/* ── Strengths & Improvements ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 36 }}>
        <BulletBox title="💪 Strengths"    color={C.green} items={results.strengths}    />
        <BulletBox title="💡 Improvements" color={C.amber} items={results.improvements} />
      </div>

      <div style={{ textAlign: "center" }}>
        <Btn onClick={onReset}>🔄 Analyze Another Resume</Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  Small reusable components
// ─────────────────────────────────────────
function KeywordBox({ title, color, items = [] }) {
  return (
    <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color }}>{title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {items.map(kw => (
          <span key={kw} style={{
            padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600,
            background: `${color}18`, color, border: `1px solid ${color}33`,
          }}>{kw}</span>
        ))}
      </div>
    </div>
  );
}

function BulletBox({ title, color, items = [] }) {
  return (
    <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>{title}</div>
      {items.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <div style={{ color, flexShrink: 0, marginTop: 2 }}>◆</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{s}</div>
        </div>
      ))}
    </div>
  );
}

function Btn({ onClick, disabled, children }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: "14px 48px", borderRadius: 12, border: "none", cursor: disabled ? "none" : "none",
        background: disabled
          ? C.surface
          : `linear-gradient(135deg, ${C.accent}, ${C.cyan})`,
        color:  disabled ? C.muted : "#fff",
        fontSize: 16, fontWeight: 700, fontFamily: "'Syne'",
        boxShadow: disabled ? "none" : `0 8px 24px ${C.accent}44`,
        transition: "all 0.3s", transform: "scale(1)",
      }}
      onMouseOver={e => !disabled && (e.currentTarget.style.transform = "scale(1.04)")}
      onMouseOut={e  =>              (e.currentTarget.style.transform = "scale(1)")}
    >
      {children}
    </button>
  );
}

function GhostBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "14px 32px", borderRadius: 12,
        border: `1px solid ${C.border}`,
        background: "transparent", color: C.text,
        cursor: "none", fontSize: 15, fontWeight: 600,
        fontFamily: "'Syne'", transition: "all 0.2s",
      }}
      onMouseOver={e => e.currentTarget.style.background = C.surface}
      onMouseOut={e  => e.currentTarget.style.background = "transparent"}
    >
      {children}
    </button>
  );
}
