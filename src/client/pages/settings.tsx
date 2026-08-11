import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { DashboardLayout } from "../components/layout";

function ToneSlider({ label, description, leftLabel, rightLabel, value, onChange }: {
  label: string;
  description: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <span className="text-sm font-semibold">{label}</span>
          <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>{description}</span>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded-lg" style={{ background: "var(--bg-elevated)", color: "var(--accent-2)" }}>
          {value}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs w-16 text-right" style={{ color: "var(--text-muted)" }}>{leftLabel}</span>
        <div className="flex-1 relative">
          <input
            type="range"
            min={0}
            max={100}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #7C3AED ${value}%, var(--border) ${value}%)`,
              outline: "none",
            }}
          />
        </div>
        <span className="text-xs w-16" style={{ color: "var(--text-muted)" }}>{rightLabel}</span>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [examples, setExamples] = useState<string[]>(["", "", ""]);
  const [toneFormality, setToneFormality] = useState(50);
  const [toneLength, setToneLength] = useState(50);
  const [toneHumor, setToneHumor] = useState(30);
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["voice"],
    queryFn: async () => {
      const res = await api.voice.$get();
      return res.json();
    },
  });

  useEffect(() => {
    const voice = (data as any)?.voice;
    if (voice) {
      const exArr = JSON.parse(voice.examples || "[]");
      const padded = [...exArr, "", "", ""].slice(0, 3);
      setExamples(padded);
      setToneFormality(voice.toneFormality ?? 50);
      setToneLength(voice.toneLength ?? 50);
      setToneHumor(voice.toneHumor ?? 30);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.voice.$post({
        json: {
          examples: examples.filter(e => e.trim()),
          toneFormality,
          toneLength,
          toneHumor,
        },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const updateExample = (i: number, val: string) => {
    const updated = [...examples];
    updated[i] = val;
    setExamples(updated);
  };

  const addExample = () => {
    if (examples.length < 5) setExamples([...examples, ""]);
  };

  const removeExample = (i: number) => {
    setExamples(examples.filter((_, idx) => idx !== i));
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-black" style={{ letterSpacing: "-0.02em" }}>Brand Voice</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Train the AI to write in your style. The more examples you provide, the more accurate the output.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-2xl skeleton" />)}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Examples */}
            <div
              className="p-6 rounded-2xl gradient-border"
              style={{ background: "var(--bg-secondary)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold">Writing examples</h2>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Paste 3–5 samples of your best writing. Tweets, emails, blog intros — anything in your voice.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(124,58,237,0.15)", color: "var(--accent-2)" }}>
                  {examples.filter(e => e.trim()).length}/{examples.length} filled
                </span>
              </div>

              <div className="space-y-3">
                {examples.map((ex, i) => (
                  <div key={i} className="relative">
                    <div className="flex items-start gap-2">
                      <span
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-3"
                        style={{ background: "rgba(124,58,237,0.2)", color: "var(--accent-2)" }}
                      >
                        {i + 1}
                      </span>
                      <textarea
                        value={ex}
                        onChange={(e) => updateExample(i, e.target.value)}
                        placeholder={`Example ${i + 1}: Paste a piece of your writing here...`}
                        className="flex-1 text-sm rounded-xl p-3 resize-none transition-all"
                        rows={3}
                        style={{
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border)",
                          color: "var(--text-primary)",
                          fontFamily: "'Poppins', sans-serif",
                        }}
                        onFocus={(e) => e.target.style.borderColor = "rgba(124, 58, 237, 0.4)"}
                        onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                      />
                      {examples.length > 1 && (
                        <button
                          onClick={() => removeExample(i)}
                          className="flex-shrink-0 mt-3 p-1.5 rounded-lg cursor-pointer transition-all"
                          style={{ color: "var(--text-muted)", background: "none", border: "none" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {examples.length < 5 && (
                <button
                  onClick={addExample}
                  className="mt-3 flex items-center gap-1.5 text-xs cursor-pointer transition-all"
                  style={{ color: "var(--accent-2)", background: "none", border: "none" }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add another example
                </button>
              )}
            </div>

            {/* Tone sliders */}
            <div
              className="p-6 rounded-2xl gradient-border space-y-6"
              style={{ background: "var(--bg-secondary)" }}
            >
              <div>
                <h2 className="text-base font-bold">Tone settings</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Fine-tune how the AI interprets your style.
                </p>
              </div>

              <ToneSlider
                label="Formality"
                description="How formal should the writing feel?"
                leftLabel="Casual"
                rightLabel="Formal"
                value={toneFormality}
                onChange={setToneFormality}
              />
              <ToneSlider
                label="Length"
                description="Shorter punchy copy vs. detailed explanations"
                leftLabel="Concise"
                rightLabel="Detailed"
                value={toneLength}
                onChange={setToneLength}
              />
              <ToneSlider
                label="Humor"
                description="How much wit and humor to inject"
                leftLabel="Serious"
                rightLabel="Witty"
                value={toneHumor}
                onChange={setToneHumor}
              />
            </div>

            {/* Preview */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--accent-2)" }}>Voice preview</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {toneFormality < 33 ? "Casual & conversational" : toneFormality > 66 ? "Professional & formal" : "Semi-formal"} ·{" "}
                {toneLength < 33 ? "Short & punchy" : toneLength > 66 ? "Long & thorough" : "Balanced length"} ·{" "}
                {toneHumor < 33 ? "Straightforward" : toneHumor > 66 ? "Witty & humorous" : "Occasionally light"}
              </p>
            </div>

            {/* Save */}
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="btn-glow text-white font-semibold px-8 py-3 rounded-xl cursor-pointer border-0 disabled:opacity-50"
            >
              {saveMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />
                  Saving...
                </span>
              ) : saved ? (
                <span className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Saved!
                </span>
              ) : (
                "Save brand voice"
              )}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
