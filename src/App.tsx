import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { CodeEditor } from "./components/CodeEditor";
import { DiffView } from "./components/DiffView";
import { PreviewPane } from "./components/PreviewPane";
import { AiAssistPanel } from "./components/AiAssistPanel";
import { TsxPreviewPane } from "./components/TsxPreviewPane";
import { samples } from "./samples";
import { formatCode } from "./core/format";
import {
  runPipeline,
  type CleanupOptions,
  type OutputFormat,
  type PipelineOptions,
} from "./core/pipeline";
import { type ClassRenameRule } from "./core/classRules";
import { aiTransform, type Aggressiveness, type AiProviderId } from "./api/ai";
import { aiProviders } from "./ai";

const DEFAULT_COMPONENT_NAME = "FigmaComponent";

type PreviewMode = "before" | "after";
type OutputTab = "output" | "diff" | "preview";

type StyleMode = "object" | "string";

const DEFAULT_AI_MODELS: Record<AiProviderId, string> = aiProviders.reduce(
  (acc, provider) => {
    acc[provider.id] = provider.models[0] ?? "";
    return acc;
  },
  {} as Record<AiProviderId, string>
);

const defaultCleanup: CleanupOptions = {
  removeEmpty: true,
  flattenWrappers: true,
  normalizeWhitespace: true,
  removeDuplicateAttrs: true,
  fixNesting: true,
  semanticTags: true,
};

export default function App() {
  const [inputHtml, setInputHtml] = useState(samples[0]?.html ?? "");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("html");
  const [outputCode, setOutputCode] = useState("");
  const [lastGoodOutput, setLastGoodOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OutputTab>("output");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("after");
  const [isProcessing, setIsProcessing] = useState(false);

  const [cleanupOptions, setCleanupOptions] =
    useState<CleanupOptions>(defaultCleanup);

  const [componentName, setComponentName] = useState(DEFAULT_COMPONENT_NAME);
  const [wrapComponent, setWrapComponent] = useState(true);
  const [useClassName, setUseClassName] = useState(true);
  const [useFragments, setUseFragments] = useState(true);
  const [styleMode, setStyleMode] = useState<StyleMode>("object");

  const [removeClasses, setRemoveClasses] = useState("");
  const [removeClassesRegex, setRemoveClassesRegex] = useState(false);
  const [classPrefix, setClassPrefix] = useState("");
  const [tailwindMode, setTailwindMode] = useState(false);
  const [tailwindBulkMap, setTailwindBulkMap] = useState("");
  const [renameRules, setRenameRules] = useState<ClassRenameRule[]>([
    { from: "", to: "", isRegex: false },
  ]);

  const [fixFigmaIcons, setFixFigmaIcons] = useState(true);
  const [fixBackgroundImages, setFixBackgroundImages] = useState(true);
  const [fixRoleImages, setFixRoleImages] = useState(true);

  const [useAiAssist, setUseAiAssist] = useState(false);
  const [aiProvider, setAiProvider] = useState<AiProviderId>("ollama");
  const [aiModel, setAiModel] = useState(DEFAULT_AI_MODELS.ollama);
  const [aggressiveness, setAggressiveness] =
    useState<Aggressiveness>("balanced");
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    setAiModel(DEFAULT_AI_MODELS[aiProvider]);
  }, [aiProvider]);

  const rulesSummary = useMemo(() => {
    const removeList = parseClassList(removeClasses).join(", ") || "none";
    const renameList = renameRules
      .filter((rule) => rule.from && rule.to)
      .map(
        (rule) => `${rule.from} -> ${rule.to}${rule.isRegex ? " (regex)" : ""}`
      )
      .join("; ");
    const cleanupList = Object.entries(cleanupOptions)
      .filter(([, value]) => value)
      .map(([key]) => key)
      .join(", ");
    const imageRules = `figmaIcons=${fixFigmaIcons ? "on" : "off"}, background=${
      fixBackgroundImages ? "on" : "off"
    }, roleImages=${fixRoleImages ? "on" : "off"}`;

    return [
      `Remove classes: ${removeList}${removeClassesRegex ? " (regex)" : ""}`,
      `Rename rules: ${renameList || "none"}`,
      `Prefix: ${classPrefix || "none"}`,
      `Cleanup: ${cleanupList || "none"}`,
      `Image rules: ${imageRules}`,
    ].join(" | ");
  }, [
    removeClasses,
    removeClassesRegex,
    renameRules,
    classPrefix,
    cleanupOptions,
    fixFigmaIcons,
    fixBackgroundImages,
    fixRoleImages,
  ]);

  const pipelineOptions = useMemo<PipelineOptions>(
    () => ({
      output: outputFormat,
      cleanup: cleanupOptions,
      classRules: {
        remove: removeClassesRegex ? [] : parseClassList(removeClasses),
        removeRegex: removeClassesRegex ? parseClassList(removeClasses) : [],
        rename: renameRules.filter((rule) => rule.from && rule.to),
        prefix: classPrefix || undefined,
      },
      imageFix: {
        enableFigmaIcons: fixFigmaIcons,
        enableBackgroundImages: fixBackgroundImages,
        enableRoleImages: fixRoleImages,
      },
      react: {
        componentName,
        wrapComponent,
        useClassName,
        useFragments,
        styleMode,
      },
      format: true,
    }),
    [
      outputFormat,
      cleanupOptions,
      removeClassesRegex,
      removeClasses,
      renameRules,
      classPrefix,
      fixFigmaIcons,
      fixBackgroundImages,
      fixRoleImages,
      componentName,
      wrapComponent,
      useClassName,
      useFragments,
      styleMode,
    ]
  );

  useEffect(() => {
    handleConvert();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const result = runPipeline(inputHtml, pipelineOptions);
        setOutputCode(result);
        setLastGoodOutput(result);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        setOutputCode(lastGoodOutput);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [inputHtml, pipelineOptions, lastGoodOutput]);

  const handleConvert = () => {
    setIsProcessing(true);
    try {
      const result = runPipeline(inputHtml, pipelineOptions);
      setOutputCode(result);
      setLastGoodOutput(result);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setOutputCode(lastGoodOutput);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFormatInput = () => {
    const formatted = formatCode(inputHtml, "html");
    setInputHtml(formatted);
  };

  const handleReset = () => {
    setInputHtml("");
    setOutputCode("");
    setError(null);
  };

  const handleSampleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    const sample = samples.find((item) => item.id === value);
    if (sample) {
      setInputHtml(sample.html);
    }
  };

  const handleAiCleanup = async () => {
    setAiError(null);

    if (!useAiAssist) {
      return;
    }
    if (!aiModel.trim()) {
      setAiError("Model is required.");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await aiTransform({
        provider: aiProvider,
        model: aiModel,
        goal: outputFormat === "react" ? "react-tsx" : "clean-html",
        aggressiveness,
        inputCode: inputHtml,
        extraRules: rulesSummary,
      });

      setOutputCode(response.code);
      setLastGoodOutput(response.code);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown AI error";
      setAiError(message);
      setOutputCode(lastGoodOutput);
    } finally {
      setIsProcessing(false);
    }
  };

  const outputLanguage = outputFormat === "react" ? "tsx" : "html";
  const previewHtml = previewMode === "before" ? inputHtml : outputCode;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-amber-50 via-slate-50 to-emerald-50">
      <div className="pointer-events-none absolute -left-24 top-24 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="pointer-events-none absolute right-8 top-10 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-6 py-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Figma HTML Cleaner
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">
              Transform messy exports into clean markup
            </h1>
            <p className="mt-1 max-w-xl text-sm text-slate-600">
              Parse, clean, and preview Figma HTML with deterministic transforms
              and optional AI.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleConvert}
              disabled={isProcessing}
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-slate-800 disabled:opacity-60"
            >
              {isProcessing ? "Processing..." : "Run cleanup"}
            </button>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.9fr_1.15fr]">
          <section className="rounded-3xl max-w-[400px] border border-white/70 bg-white/80 p-5 shadow-glow backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Input</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleFormatInput}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
                >
                  Format input
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
                >
                  Reset
                </button>
                <select
                  onChange={handleSampleChange}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                >
                  <option value="">Load sample</option>
                  {samples.map((sample) => (
                    <option key={sample.id} value={sample.id}>
                      {sample.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div
              className={`mt-4 overflow-hidden rounded-2xl border ${
                error
                  ? "border-rose-400 ring-2 ring-rose-200"
                  : "border-slate-200"
              }`}
            >
              <CodeEditor
                value={inputHtml}
                onChange={setInputHtml}
                language="html"
              />
            </div>
            {error ? (
              <p className="mt-3 text-sm text-rose-600">{error}</p>
            ) : null}
          </section>

          <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-glow backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Options</h2>
              <span className="text-xs text-slate-500">Deterministic + AI</span>
            </div>
            <div className="mt-4 flex max-h-[640px] flex-col gap-4 overflow-y-auto pr-2">
              <OptionCard title="Output format">
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="outputFormat"
                      checked={outputFormat === "html"}
                      onChange={() => setOutputFormat("html")}
                    />
                    Clean HTML
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="outputFormat"
                      checked={outputFormat === "react"}
                      onChange={() => setOutputFormat("react")}
                    />
                    React TSX
                  </label>
                </div>
              </OptionCard>

              {outputFormat === "react" ? (
                <OptionCard title="React component">
                  <div className="flex flex-col gap-3 text-sm text-slate-700">
                    <label className="flex flex-col gap-1">
                      Component name
                      <input
                        value={componentName}
                        onChange={(event) =>
                          setComponentName(event.target.value)
                        }
                        className="rounded-xl border border-slate-200 px-3 py-2"
                      />
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={wrapComponent}
                        onChange={(event) =>
                          setWrapComponent(event.target.checked)
                        }
                      />
                      Wrap in export default function
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={useClassName}
                        onChange={(event) =>
                          setUseClassName(event.target.checked)
                        }
                      />
                      Use className conversion
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={useFragments}
                        onChange={(event) =>
                          setUseFragments(event.target.checked)
                        }
                      />
                      Use fragments where possible
                    </label>
                    <div className="flex flex-col gap-2">
                      <span>Inline styles</span>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="styleMode"
                          checked={styleMode === "object"}
                          onChange={() => setStyleMode("object")}
                        />
                        Convert to style object
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="styleMode"
                          checked={styleMode === "string"}
                          onChange={() => setStyleMode("string")}
                        />
                        Keep inline styles as-is
                      </label>
                    </div>
                  </div>
                </OptionCard>
              ) : null}

              <OptionCard title="Cleanup rules">
                <div className="grid grid-cols-1 gap-2 text-sm text-slate-700">
                  {(
                    [
                      ["removeEmpty", "Remove empty divs/spans"],
                      ["flattenWrappers", "Flatten single-child wrappers"],
                      [
                        "semanticTags",
                        "Convert wrappers to semantic tags when safe",
                      ],
                      ["normalizeWhitespace", "Normalize whitespace"],
                      ["removeDuplicateAttrs", "Remove duplicate attributes"],
                      ["fixNesting", "Fix obvious nesting issues"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={cleanupOptions[key]}
                        onChange={(event) =>
                          setCleanupOptions((prev) => ({
                            ...prev,
                            [key]: event.target.checked,
                          }))
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </OptionCard>

              <OptionCard title="Image fixes">
                <div className="grid gap-2 text-sm text-slate-700">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={fixFigmaIcons}
                      onChange={(event) =>
                        setFixFigmaIcons(event.target.checked)
                      }
                    />
                    Convert Figma icon divs to empty img
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={fixBackgroundImages}
                      onChange={(event) =>
                        setFixBackgroundImages(event.target.checked)
                      }
                    />
                    Convert background-image divs
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={fixRoleImages}
                      onChange={(event) =>
                        setFixRoleImages(event.target.checked)
                      }
                    />
                    Convert role=img / aria-label divs
                  </label>
                </div>
              </OptionCard>

              <OptionCard title="Class tools">
                <div className="flex flex-col gap-3 text-sm text-slate-700">
                  <div>
                    <label className="flex items-center justify-between">
                      Remove classes
                      <span className="text-xs text-slate-400">
                        Comma separated
                      </span>
                    </label>
                    <input
                      value={removeClasses}
                      onChange={(event) => setRemoveClasses(event.target.value)}
                      placeholder="figma-bg, /^auto-/"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                    <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={removeClassesRegex}
                        onChange={(event) =>
                          setRemoveClassesRegex(event.target.checked)
                        }
                      />
                      Treat remove list as regex
                    </label>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <span>Rename classes</span>
                      <button
                        type="button"
                        onClick={() =>
                          setRenameRules((prev) => [
                            ...prev,
                            { from: "", to: "", isRegex: false },
                          ])
                        }
                        className="rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600"
                      >
                        Add
                      </button>
                    </div>
                    <div className="mt-2 flex flex-col gap-2">
                      {renameRules.map((rule, index) => (
                        <div
                          key={`rule-${index}`}
                          className="grid grid-cols-[1fr_1fr_auto] gap-2"
                        >
                          <input
                            value={rule.from}
                            onChange={(event) =>
                              setRenameRules((prev) =>
                                prev.map((item, idx) =>
                                  idx === index
                                    ? { ...item, from: event.target.value }
                                    : item
                                )
                              )
                            }
                            placeholder="from"
                            className="rounded-xl border border-slate-200 px-3 py-2"
                          />
                          <input
                            value={rule.to}
                            onChange={(event) =>
                              setRenameRules((prev) =>
                                prev.map((item, idx) =>
                                  idx === index
                                    ? { ...item, to: event.target.value }
                                    : item
                                )
                              )
                            }
                            placeholder="to"
                            className="rounded-xl border border-slate-200 px-3 py-2"
                          />
                          <label className="flex items-center gap-1 text-xs text-slate-600">
                            <input
                              type="checkbox"
                              checked={rule.isRegex}
                              onChange={(event) =>
                                setRenameRules((prev) =>
                                  prev.map((item, idx) =>
                                    idx === index
                                      ? {
                                          ...item,
                                          isRegex: event.target.checked,
                                        }
                                      : item
                                  )
                                )
                              }
                            />
                            Regex
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <label className="flex flex-col gap-1">
                    Prefix all classes with
                    <input
                      value={classPrefix}
                      onChange={(event) => setClassPrefix(event.target.value)}
                      placeholder="tw-"
                      className="rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={tailwindMode}
                      onChange={(event) =>
                        setTailwindMode(event.target.checked)
                      }
                    />
                    Tailwind mode (manual mapping only)
                  </label>

                  {tailwindMode ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-600">
                      <p className="mb-2 font-semibold text-slate-700">
                        Bulk map classes (one per line)
                      </p>
                      <textarea
                        value={tailwindBulkMap}
                        onChange={(event) =>
                          setTailwindBulkMap(event.target.value)
                        }
                        placeholder="old-class -> new-class"
                        className="h-24 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newRules = tailwindBulkMap
                            .split("\n")
                            .map((line) => line.trim())
                            .filter(Boolean)
                            .map((line) => {
                              const parts = line
                                .split("->")
                                .map((part) => part.trim());
                              if (parts.length < 2 || !parts[0] || !parts[1]) {
                                return null;
                              }
                              return {
                                from: parts[0],
                                to: parts.slice(1).join("->"),
                                isRegex: false,
                              };
                            })
                            .filter((rule): rule is ClassRenameRule =>
                              Boolean(rule)
                            );

                          if (newRules.length > 0) {
                            setRenameRules((prev) => [...prev, ...newRules]);
                          }
                        }}
                        className="mt-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                      >
                        Apply bulk mappings
                      </button>
                    </div>
                  ) : null}
                </div>
              </OptionCard>

              <AiAssistPanel
                enabled={useAiAssist}
                provider={aiProvider}
                model={aiModel}
                aggressiveness={aggressiveness}
                isRunning={isProcessing}
                error={aiError}
                onToggle={setUseAiAssist}
                onProviderChange={(value) => setAiProvider(value)}
                onModelChange={setAiModel}
                onAggressivenessChange={setAggressiveness}
                onRun={handleAiCleanup}
              />
            </div>
          </section>

          <section className="rounded-3xl max-w-[400px] border border-white/70 bg-white/80 p-5 shadow-glow backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Output</h2>
              <div className="flex gap-2">
                {(["output", "diff", "preview"] as OutputTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
                      activeTab === tab
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 text-slate-600"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              {activeTab === "output" ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <CodeEditor
                    value={outputCode}
                    readOnly
                    language={outputLanguage}
                  />
                </div>
              ) : null}

              {activeTab === "diff" ? (
                <DiffView before={inputHtml} after={outputCode} />
              ) : null}

              {activeTab === "preview" ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewMode("before")}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        previewMode === "before"
                          ? "bg-slate-900 text-white"
                          : "border border-slate-200 text-slate-600"
                      }`}
                    >
                      Before
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode("after")}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        previewMode === "after"
                          ? "bg-slate-900 text-white"
                          : "border border-slate-200 text-slate-600"
                      }`}
                    >
                      After
                    </button>
                  </div>
                  {outputFormat === "react" && previewMode === "after" ? (
                    <TsxPreviewPane tsx={outputCode} />
                  ) : (
                    <PreviewPane html={previewHtml} />
                  )}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function OptionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function parseClassList(value: string): string[] {
  if (!value.trim()) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      if (entry.startsWith("/") && entry.endsWith("/") && entry.length > 2) {
        return entry.slice(1, -1);
      }
      return entry;
    });
}
