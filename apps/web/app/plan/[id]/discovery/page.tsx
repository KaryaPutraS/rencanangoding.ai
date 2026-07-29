"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { getAiHeaders } from "@/lib/useSettings";
import { ArrowRight, ArrowLeft, SkipForward, CheckCircle2, Loader2, Terminal, HelpCircle } from "lucide-react";

interface DiscoveryQuestion {
  questionIndex: number;
  questionText: string;
  suggestedChips: string[];
}

export default function DiscoveryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [questions, setQuestions] = useState<DiscoveryQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/plans/${id}/discovery`, {
      headers: { ...getAiHeaders() }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.questions) {
          setQuestions(data.questions);
        } else if (data.answers) {
          // Already answered, proceed to structure
          router.push(`/plan/${id}/structure`);
        }
      })
      .catch(() => setError("Gagal memuat pertanyaan discovery"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const currentQ = questions[currentIndex];

  const handleChipClick = (chipText: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.questionIndex]: chipText
    }));
  };

  const handleTextChange = (val: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.questionIndex]: val
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishDiscovery();
    }
  };

  const handleSkip = () => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.questionIndex]: "Dilewati (Bebas disesuaikan AI)"
    }));
    handleNext();
  };

  const finishDiscovery = async () => {
    setSubmitting(true);
    setError("");

    const payloadAnswers = questions.map((q) => ({
      questionIndex: q.questionIndex,
      questionText: q.questionText,
      answerText: answers[q.questionIndex] || "Dilewati (Bebas disesuaikan AI)"
    }));

    try {
      const res = await fetch(`/api/plans/${id}/discovery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payloadAnswers })
      });
      const data = await res.json();

      if (data.success) {
        // Trigger structure generation
        await fetch(`/api/plans/${id}/generate-structure`, {
          method: "POST",
          headers: { ...getAiHeaders() }
        });
        router.push(`/plan/${id}/structure`);
      } else {
        setError(data.error || "Gagal menyimpan jawaban");
        setSubmitting(false);
      }
    } catch (err) {
      setError("Gagal terhubung ke server");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dot-grid text-gray-100 flex flex-col">
        <Navbar currentPlanId={id} />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
          <h2 className="text-lg font-bold text-gray-200 font-mono">PHASE 01 // ANALYZING ARCHITECTURE...</h2>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            Menyiapkan 5 pertanyaan adaptif dengan rekomendasi pilihan kontekstual.
          </p>
        </main>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="min-h-screen bg-dot-grid text-gray-100 flex flex-col">
        <Navbar currentPlanId={id} />
        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <p className="text-sm text-red-400">{error || "Pertanyaan tidak dapat dimuat"}</p>
        </main>
      </div>
    );
  }

  const currentAnswer = answers[currentQ.questionIndex] || "";

  return (
    <div className="min-h-screen bg-dot-grid text-gray-100 flex flex-col">
      <Navbar currentPlanId={id} />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-10 sm:py-16 w-full flex flex-col justify-center">
        {/* Progress Bar Header */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Terminal className="w-3.5 h-3.5" />
              <span>PHASE 01 // DISCOVERY WIZARD ({currentIndex + 1}/5)</span>
            </span>
            <span>{Math.round(((currentIndex + 1) / 5) * 100)}% COMPLETE</span>
          </div>
          <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden border border-white/[0.08]">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300 rounded-full"
              style={{ width: `${((currentIndex + 1) / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="tech-panel p-6 sm:p-8 rounded-3xl border border-white/[0.08] shadow-2xl space-y-6">
          <div className="space-y-3">
            <span className="inline-block px-3 py-1 rounded-md bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-800 uppercase tracking-widest">
              QUESTION #{currentQ.questionIndex}
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-100 leading-snug">
              {currentQ.questionText}
            </h2>
          </div>

          {/* Recommended Chips */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">
              Rekomendasi Jawaban Cepat (Klik Chip):
            </label>
            <div className="flex flex-wrap gap-2">
              {currentQ.suggestedChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChipClick(chip)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all text-left ${
                    currentAnswer === chip
                      ? "bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/30 scale-[1.02]"
                      : "bg-gray-950/80 border-gray-800 text-gray-300 hover:border-emerald-500/40 hover:bg-gray-900"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Open Text Answer */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">
              Atau Tulis Jawaban Detail Kamu:
            </label>
            <textarea
              value={currentAnswer}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Tulis konteks tambahan sesuai kebutuhan aplikasi kamu..."
              rows={3}
              className="w-full p-4 rounded-2xl tech-input text-xs text-gray-100 leading-relaxed resize-none font-sans"
            />
          </div>

          {/* Controls Footer */}
          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl bg-gray-900 border border-white/[0.08] text-xs font-semibold text-gray-300 hover:bg-gray-800 disabled:opacity-30 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSkip}
                className="px-3.5 py-2 rounded-xl bg-gray-900/60 border border-white/[0.08] text-xs text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-1"
              >
                <span>Lewati</span>
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleNext}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyiapkan Mind Map...</span>
                  </>
                ) : currentIndex === questions.length - 1 ? (
                  <>
                    <span>Selesai & Generate Structure</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Pertanyaan Lanjutan</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
