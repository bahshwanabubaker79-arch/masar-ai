"use client";

import React, { useState, useEffect } from "react";
import {
  Language,
  AgentStatus,
  AnalysisReport,
  OptimizationReport,
  InterviewPack,
  AgentTraceEntry,
} from "@/types/agents";
import { t } from "@/lib/translations";
import { SAMPLE_DATA } from "@/lib/mockData";
import { Navbar } from "@/components/Navbar";
import { AgentStatusTimeline } from "@/components/AgentStatusTimeline";
import { ResumeAnalyzerView } from "@/components/ResumeAnalyzerView";
import { ResumeOptimizerView } from "@/components/ResumeOptimizerView";
import { InterviewCoachView } from "@/components/InterviewCoachView";
import { AgentTraceDrawer } from "@/components/AgentTraceDrawer";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import {
  Play,
  RotateCcw,
  Sparkles,
  FileText,
  Briefcase,
  Loader2,
  CheckCircle,
  HelpCircle,
} from "lucide-react";

export default function HomePage() {
  const [lang, setLang] = useState<Language>("ar");
  const [apiKey, setApiKey] = useState<string>("");
  const [resume, setResume] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");

  const [activeTab, setActiveTab] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [agent1Status, setAgent1Status] = useState<AgentStatus>("idle");
  const [agent2Status, setAgent2Status] = useState<AgentStatus>("idle");
  const [agent3Status, setAgent3Status] = useState<AgentStatus>("idle");

  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
  const [optimizationReport, setOptimizationReport] = useState<OptimizationReport | null>(null);
  const [interviewPack, setInterviewPack] = useState<InterviewPack | null>(null);

  const [traces, setTraces] = useState<AgentTraceEntry[]>([]);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [isTraceDrawerOpen, setIsTraceDrawerOpen] = useState<boolean>(false);

  // Sync lang attribute on html tag
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  // Read stored api key if available
  useEffect(() => {
    try {
      const stored = localStorage.getItem("masar_groq_api_key");
      if (stored) setApiKey(stored);
    } catch {
      // ignore in environments without localStorage
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    try {
      if (key) {
        localStorage.setItem("masar_groq_api_key", key);
      } else {
        localStorage.removeItem("masar_groq_api_key");
      }
    } catch {
      // ignore
    }
  };

  const handleToggleLang = () => {
    setLang((prev) => (prev === "ar" ? "en" : "ar"));
  };

  const handleLoadSample = () => {
    const data = SAMPLE_DATA[lang];
    setResume(data.resume);
    setJobDescription(data.jobDescription);
  };

  const handleClear = () => {
    setResume("");
    setJobDescription("");
    setAnalysisReport(null);
    setOptimizationReport(null);
    setInterviewPack(null);
    setAgent1Status("idle");
    setAgent2Status("idle");
    setAgent3Status("idle");
    setTraces([]);
    setActiveTab(1);
  };

  // The Autonomous Multi-Agent Pipeline Execution
  const runMultiAgentPipeline = async () => {
    if (!resume.trim() || !jobDescription.trim()) return;

    setIsProcessing(true);
    setAgent1Status("running");
    setAgent2Status("idle");
    setAgent3Status("idle");
    const newTraces: AgentTraceEntry[] = [];

    try {
      // Step 1: Agent 1 (ATS & Requirements Analyzer)
      const res1 = await fetch("/api/agents/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "x-groq-key": apiKey } : {}),
        },
        body: JSON.stringify({ resume, jobDescription, apiKey }),
      });
      const json1 = await res1.json();
      if (!res1.ok || !json1.data) {
        throw new Error(json1.error || "Failed in Agent 1");
      }

      const report1: AnalysisReport = json1.data;
      setAnalysisReport(report1);
      setAgent1Status("done");

      newTraces.push({
        id: "trace-1",
        from: lang === "ar" ? "الوكيل 1 (فاحص ATS)" : "Agent 1 (ATS Analyzer)",
        to: lang === "ar" ? "الوكيل 2 (مهندس الصياغة)" : "Agent 2 (Resume Optimizer)",
        timestamp: new Date().toLocaleTimeString(),
        durationMs: json1.durationMs || 1200,
        summary: `${lang === "ar" ? "رصد" : "Identified"} ${report1.missingKeywords.length} ${
          lang === "ar" ? "كلمات ناقصة و" : "missing keywords and"
        } ${report1.skillGaps.length} ${lang === "ar" ? "فجوات مهارية." : "skill gaps."}`,
        payload: {
          atsScore: report1.atsScore,
          targetRole: report1.targetRole,
          missingKeywords: report1.missingKeywords,
          skillGaps: report1.skillGaps,
          handoffToOptimizer: report1.handoffToOptimizer,
        },
      });
      setTraces([...newTraces]);

      // Step 2: Agent 2 (Resume Optimizer & Rewriter)
      setAgent2Status("running");
      const res2 = await fetch("/api/agents/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "x-groq-key": apiKey } : {}),
        },
        body: JSON.stringify({
          originalResume: resume,
          analysisReport: report1,
          apiKey,
        }),
      });
      const json2 = await res2.json();
      if (!res2.ok || !json2.data) {
        throw new Error(json2.error || "Failed in Agent 2");
      }

      const report2: OptimizationReport = json2.data;
      setOptimizationReport(report2);
      setAgent2Status("done");

      newTraces.push({
        id: "trace-2",
        from: lang === "ar" ? "الوكيل 2 (مهندس الصياغة)" : "Agent 2 (Resume Optimizer)",
        to: lang === "ar" ? "الوكيل 3 (مدرب المقابلات)" : "Agent 3 (Interview Coach)",
        timestamp: new Date().toLocaleTimeString(),
        durationMs: json2.durationMs || 1400,
        summary: `${lang === "ar" ? "أعاد صياغة" : "Transformed"} ${
          report2.rewrittenBullets.length
        } ${lang === "ar" ? "إنجازات بصيغة XYZ ورفع التوافق لـ" : "bullets to XYZ format, projected ATS"} ${
          report2.projectedAtsScore
        }%.`,
        payload: {
          projectedAtsScore: report2.projectedAtsScore,
          rewrittenBullets: report2.rewrittenBullets,
          handoffToInterviewer: report2.handoffToInterviewer,
        },
      });
      setTraces([...newTraces]);

      // Step 3: Agent 3 (Interview Coach)
      setAgent3Status("running");
      const res3 = await fetch("/api/agents/interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "x-groq-key": apiKey } : {}),
        },
        body: JSON.stringify({
          analysisReport: report1,
          optimizationReport: report2,
          apiKey,
        }),
      });
      const json3 = await res3.json();
      if (!res3.ok || !json3.data) {
        throw new Error(json3.error || "Failed in Agent 3");
      }

      const report3: InterviewPack = json3.data;
      setInterviewPack(report3);
      setAgent3Status("done");

      newTraces.push({
        id: "trace-3",
        from: lang === "ar" ? "الوكيل 3 (مدرب المقابلات)" : "Agent 3 (Interview Coach)",
        to: lang === "ar" ? "المرشح / الوكيل 4 (مقيم STAR)" : "Candidate / Agent 4 (Evaluator)",
        timestamp: new Date().toLocaleTimeString(),
        durationMs: json3.durationMs || 1100,
        summary: `${lang === "ar" ? "ولّد" : "Formulated"} ${
          report3.questions.length
        } ${lang === "ar" ? "أسئلة ذكية تستهدف سد فجوات الوكيل 1 والتحقق من إضافات الوكيل 2." : "targeted questions verifying claims and probing gaps."}`,
        payload: {
          interviewStrategy: report3.interviewStrategy,
          questionsCount: report3.questions.length,
          questions: report3.questions,
        },
      });
      setTraces([...newTraces]);

      // Switch view to Agent 1 results tab
      setActiveTab(2);
    } catch (err) {
      console.error("Multi-agent error:", err);
      if (agent1Status === "running") setAgent1Status("error");
      if (agent2Status === "running") setAgent2Status("error");
      if (agent3Status === "running") setAgent3Status("error");
    } finally {
      setIsProcessing(false);
    }
  };

  const strings = t[lang];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Navigation */}
      <Navbar
        lang={lang}
        onToggleLang={handleToggleLang}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenTraceDrawer={() => setIsTraceDrawerOpen(true)}
        hasCustomKey={Boolean(apiKey)}
        traceCount={traces.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Hero Section */}
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white p-6 sm:p-10 shadow-xl overflow-hidden border border-teal-900/60">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>{strings.heroBadge}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-3">
              {strings.heroTitle}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              {strings.heroSubtitle}
            </p>
          </div>
        </div>

        {/* Multi-Agent Collaboration Timeline & Progress Bar */}
        <AgentStatusTimeline
          lang={lang}
          agent1Status={agent1Status}
          agent2Status={agent2Status}
          agent3Status={agent3Status}
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
        />

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab(1)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 1
                ? "bg-teal-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <span>{strings.tabInput}</span>
          </button>

          <button
            onClick={() => setActiveTab(2)}
            disabled={!analysisReport}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 2
                ? "bg-teal-600 text-white shadow-sm"
                : analysisReport
                ? "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                : "text-slate-300 dark:text-slate-700 cursor-not-allowed"
            }`}
          >
            <span>{strings.tabAnalyze}</span>
            {analysisReport && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                {analysisReport.atsScore}%
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab(3)}
            disabled={!optimizationReport}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 3
                ? "bg-teal-600 text-white shadow-sm"
                : optimizationReport
                ? "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                : "text-slate-300 dark:text-slate-700 cursor-not-allowed"
            }`}
          >
            <span>{strings.tabOptimize}</span>
            {optimizationReport && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                {optimizationReport.projectedAtsScore}%
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab(4)}
            disabled={!interviewPack}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 4
                ? "bg-teal-600 text-white shadow-sm"
                : interviewPack
                ? "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                : "text-slate-300 dark:text-slate-700 cursor-not-allowed"
            }`}
          >
            <span>{strings.tabInterview}</span>
            {interviewPack && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
                {interviewPack.questions.length} Qs
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Input & Configuration */}
        {activeTab === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>
                  {lang === "ar"
                    ? "أدخل سيرتك الحالية مع الوصف الوظيفي المستهدف، أو اضغط زر النموذج لتعبئة بيانات خريج جاهزة فوراً."
                    : "Enter your resume and job description, or load the pre-filled graduate capstone sample."}
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleLoadSample}
                  className="px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 text-xs font-bold border border-teal-200 dark:border-teal-800 transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{strings.loadSampleBtn}</span>
                </button>
                <button
                  onClick={handleClear}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold transition flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{strings.clearBtn}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Resume Text Input */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span>{strings.resumeInputLabel}</span>
                </label>
                <textarea
                  rows={14}
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                  placeholder={strings.resumeInputPlaceholder}
                  className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed font-sans"
                />
              </div>

              {/* Job Description Input */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                  <span>{strings.jobInputLabel}</span>
                </label>
                <textarea
                  rows={14}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder={strings.jobInputPlaceholder}
                  className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed font-sans"
                />
              </div>
            </div>

            {/* Launch Multi-Agent Pipeline CTA */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg">
                  {lang === "ar"
                    ? "هل أنت مستعد لتشغيل سرب الوكلاء الذكي؟"
                    : "Ready to launch the autonomous agent swarm?"}
                </h3>
                <p className="text-xs text-teal-100 mt-1 max-w-xl leading-relaxed">
                  {lang === "ar"
                    ? "سيقوم الوكيل 1 بتحليل التوافق وتجهيز تقرير التسليم، ثم يستلمه الوكيل 2 لإعادة الصياغة، ثم يمرره للوكيل 3 لتوليد أسئلة المقابلة المناسبة."
                    : "Agent 1 inspects ATS match and creates handoff, Agent 2 optimizes with XYZ formula, and Agent 3 crafts tailored STAR interview questions."}
                </p>
              </div>

              <button
                disabled={!resume.trim() || !jobDescription.trim() || isProcessing}
                onClick={runMultiAgentPipeline}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-teal-800 hover:bg-teal-50 disabled:bg-slate-200 disabled:text-slate-400 font-extrabold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 flex-shrink-0"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                    <span>{strings.processingPipeline}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current text-teal-600" />
                    <span>{strings.startMultiAgentBtn}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Agent 1 - ATS Analyzer View */}
        {activeTab === 2 && analysisReport && (
          <ResumeAnalyzerView
            lang={lang}
            report={analysisReport}
            onProceedToOptimizer={() => setActiveTab(3)}
          />
        )}

        {/* Tab 3: Agent 2 - Resume Optimizer View */}
        {activeTab === 3 && optimizationReport && (
          <ResumeOptimizerView
            lang={lang}
            report={optimizationReport}
            onProceedToInterviewer={() => setActiveTab(4)}
          />
        )}

        {/* Tab 4: Agent 3 - Interview Coach & Simulator */}
        {activeTab === 4 && interviewPack && (
          <InterviewCoachView
            lang={lang}
            pack={interviewPack}
            apiKey={apiKey}
          />
        )}
      </main>

      {/* Global Modals & Drawers */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveKey={handleSaveApiKey}
        lang={lang}
      />

      <AgentTraceDrawer
        isOpen={isTraceDrawerOpen}
        onClose={() => setIsTraceDrawerOpen(false)}
        traces={traces}
        lang={lang}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {strings.appName}
            </span>
            <span>•</span>
            <span>{strings.footerText}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsTraceDrawerOpen(true)}
              className="text-teal-600 hover:underline"
            >
              {strings.navTrace} ({traces.length})
            </button>
            <span>•</span>
            <span className="text-emerald-600 flex items-center gap-1 font-semibold">
              <CheckCircle className="w-3 h-3" /> Ready for Vercel
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
