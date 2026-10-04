import { useEffect, useMemo, useState } from "react";
import InfoTip from "./InfoTip.jsx";
import DataMatrixChart from "./DataMatrixChart.jsx";
import { LanguageDevelopmentCharts } from "./LanguageDevelopmentCharts.jsx";
import {
    CONTENT_CATEGORIES,
    buildDeckModel,
    filterByDateRange,
    presetRange,
    weeksOverlapping,
    weightedPerMinute,
    weightedWordsPerIdea,
} from "../lib/talkMetrics.js";

const METRIC_LABELS = {
    wpm: "Words per minute",
    wh: "Why/how questions per minute",
    different: "Different words per minute",
    ideas: "Words per idea",
};

const SCHOOL_METRICS = ["wpm", "wh", "different", "ideas"];
const HOME_METRICS = ["wpm", "wh", "different"];

function percent(value) {
    if (value == null) return "—";
    return `${Math.round(value * 100)}%`;
}

function showNumber(value) {
    return value == null ? "—" : value;
}

function weekChartPoints(recordings, start, end, metric) {
    return weeksOverlapping(start, end).map((week) => {
        const group = filterByDateRange(recordings, week.start, week.end);
        const values = {};
        for (const category of CONTENT_CATEGORIES) {
            if (group.length === 0) {
                values[category] = null;
                continue;
            }
            const hasUtterances = group.some((row) => (row?.categoryLanguageFeatures?.[category]?.utteranceCount || 0) > 0);
            if (metric === "wpm") {
                values[category] = weightedPerMinute(group, (row) => row?.categoryWordCount?.[category]);
            } else if (!hasUtterances) {
                values[category] = null;
            } else if (metric === "ideas") {
                values[category] = weightedWordsPerIdea(group, category);
            } else if (metric === "wh") {
                values[category] = weightedPerMinute(group, (row) => row?.categoryLanguageFeatures?.[category]?.whQuestionCount);
            } else {
                values[category] = weightedPerMinute(group, (row) => row?.categoryLanguageFeatures?.[category]?.uniqueWordCount);
            }
        }
        return { label: week.label, values };
    });
}

function summedMonthlyRows(recordings) {
    const sums = {};
    recordings.forEach((row) => {
        if (!row?.date) return;
        const date = new Date(row.date);
        if (Number.isNaN(date.getTime())) return;
        const month = date.getMonth();
        CONTENT_CATEGORIES.forEach((category) => {
            const value = row.categoryWPM?.[category];
            if (value == null || Number.isNaN(value)) return;
            if (!sums[month]) sums[month] = {};
            sums[month][category] = (sums[month][category] || 0) + value;
        });
    });
    const year = new Date().getFullYear();
    return Object.entries(sums).map(([month, categoryWPM]) => ({
        date: new Date(year, Number(month), 15).toISOString(),
        categoryWPM,
    }));
}

export default function TalkMetricsDeck({
    assessments = [],
    context = "school",
    role = "teacher",
    defaultPreset = "this-month",
    initialStart,
    initialEnd,
    initialView = "dotmatrix",
    cohortThresholdsByCategory = null,
    contextSubtitle = null,
    onFilteredChange,
    title = "Classroom language analysis",
}) {
    const initial = presetRange(defaultPreset);
    const [start, setStart] = useState(initialStart ?? initial.start);
    const [end, setEnd] = useState(initialEnd ?? initial.end);
    const [viewMode, setViewMode] = useState(initialView);
    const [metric, setMetric] = useState("wpm");
    const metrics = context === "home" ? HOME_METRICS : SCHOOL_METRICS;
    const model = useMemo(
        () => buildDeckModel(assessments, { start, end, context, metric }),
        [assessments, start, end, context, metric]
    );
    const chartPoints = context === "home"
        ? weekChartPoints(model.filtered, start, end, metric)
        : model.points.map((point) => ({ label: point.label, values: point.values }));
    const applyPreset = (preset) => {
        const next = presetRange(preset);
        setStart(next.start);
        setEnd(next.end);
    };
    const highlight = metric === "wpm" ? "avgWpm" : metric === "wh" ? "whyHow" : metric === "different" ? "differentWords" : "wordsPerIdea";
    const topWhy = Math.max(...model.activity.map((row) => row.whyHow ?? -1));
    const reading = model.activity.find((row) => row.bucket === "Books and literacy");
    const meals = model.activity.find((row) => row.bucket === "Meals");
    useEffect(() => {
        if (typeof onFilteredChange === "function") {
            onFilteredChange(model.reversed ? [] : model.filtered);
        }
    }, [model.filtered, model.reversed, onFilteredChange]);

    return (
        <section className="mb-6 min-w-0">
            <div className="flex flex-col gap-3 mb-4 min-w-0">
                {title ? <h2 className="text-xl font-bold">{title}</h2> : null}
                <div className="grid grid-cols-2 gap-x-2 gap-y-2 w-full min-w-0 sm:flex sm:flex-wrap sm:items-end">
                    <label className="form-control min-w-0">
                        <span className="label-text text-xs inline-flex items-center gap-1 whitespace-nowrap">From <InfoTip helpKey="metric.dateRange" /></span>
                        <input type="date" className="input input-bordered input-sm w-full min-w-0" value={start} onChange={(event) => setStart(event.target.value)} />
                    </label>
                    <label className="form-control min-w-0">
                        <span className="label-text text-xs">To</span>
                        <input type="date" className="input input-bordered input-sm w-full min-w-0" value={end} onChange={(event) => setEnd(event.target.value)} />
                    </label>
                    <div className="col-span-2 grid grid-cols-2 gap-1 sm:contents">
                        <button type="button" className="btn btn-ghost btn-sm w-full sm:w-auto" onClick={() => applyPreset("this-week")}>This week</button>
                        <button type="button" className="btn btn-ghost btn-sm w-full sm:w-auto" onClick={() => applyPreset("this-month")}>This month</button>
                        <button type="button" className="btn btn-ghost btn-sm w-full sm:w-auto" onClick={() => applyPreset("this-school-year")}>This school year</button>
                        <button type="button" className="btn btn-ghost btn-sm w-full sm:w-auto" onClick={() => applyPreset("all")}>All</button>
                    </div>
                    <label className="form-control col-span-2 min-w-0 sm:w-52">
                        <span className="label-text text-xs inline-flex items-center gap-1 whitespace-nowrap">Chart <InfoTip helpKey="metric.chartType" /></span>
                        <select className="select select-bordered select-sm w-full" value={viewMode} onChange={(event) => setViewMode(event.target.value)}>
                            <option value="dotmatrix">Dot Matrix</option>
                            <option value="semicircular">Semicircular Dials</option>
                            <option value="datamatrix">Data Matrix</option>
                        </select>
                    </label>
                    {viewMode === "datamatrix" && (
                        <label className="form-control col-span-2 min-w-0 sm:w-64">
                            <span className="label-text text-xs inline-flex items-center gap-1 whitespace-nowrap">Metric <InfoTip helpKey="metric.picker" /></span>
                            <select className="select select-bordered select-sm w-full" value={metric} onChange={(event) => setMetric(event.target.value)}>
                                {metrics.map((key) => <option key={key} value={key}>{METRIC_LABELS[key]}</option>)}
                            </select>
                        </label>
                    )}
                </div>
            </div>

            {model.reversed ? (
                <p className="text-sm text-base-content/70">Pick an end date on or after the start date.</p>
            ) : model.filtered.length === 0 ? (
                <p className="text-sm text-base-content/70">No recordings in these dates.</p>
            ) : viewMode === "datamatrix" ? (
                <div className="space-y-3">
                    <div className="card bg-base-100 shadow-xl border border-base-300 min-w-0">
                        <div className="card-body p-4 sm:p-6 gap-3">
                            <h3 className="font-semibold flex items-center gap-1">
                                <span>{context === "home" ? "Talk over the selected weeks" : "Data Matrix"}</span>
                                <InfoTip helpKey={context === "home" ? "metric.homeTrend" : "metric.dataMatrix"} />
                            </h3>
                            {context === "home" && <p className="text-sm text-base-content/70">Trend over weeks, not a red or green score.</p>}
                            <DataMatrixChart points={chartPoints} metricLabel={METRIC_LABELS[metric]} />
                        </div>
                    </div>
                    <div className="card bg-base-100 shadow-xl border border-base-300 min-w-0">
                        <div className="card-body p-4 sm:p-6 gap-3">
                            <h3 className="font-semibold flex items-center gap-1"><span>Talk by content bucket</span> <InfoTip helpKey="metric.contentBucket" /></h3>
                            <div className="overflow-x-auto max-w-full min-w-0">
                            <table className="table table-sm w-full min-w-[36rem]">
                                <thead>
                                    <tr>
                                        <th className="sticky left-0 z-10 bg-base-100 whitespace-nowrap">Category</th>
                                        <th className={`text-right whitespace-nowrap ${highlight === "avgWpm" ? "bg-warning/15" : ""}`}>Avg WPM</th>
                                        <th className={`text-right whitespace-nowrap ${highlight === "whyHow" ? "bg-warning/15" : ""}`}>Why/how q / min</th>
                                        <th className={`text-right whitespace-nowrap ${highlight === "differentWords" ? "bg-warning/15" : ""}`}>Different words / min</th>
                                        {context !== "home" && <th className={`text-right whitespace-nowrap ${highlight === "wordsPerIdea" ? "bg-warning/15" : ""}`}>Words per idea</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {model.content.map((row) => (
                                        <tr key={row.category}>
                                            <td className="sticky left-0 z-10 bg-base-100 whitespace-nowrap"><span className="inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle" style={{ background: row.color }} />{row.label}</td>
                                            <td className={`text-right tabular-nums ${highlight === "avgWpm" ? "bg-warning/15" : ""}`}>{showNumber(row.avgWpm)}</td>
                                            <td className={`text-right tabular-nums ${highlight === "whyHow" ? "bg-warning/15" : ""}`}>{showNumber(row.whyHow)}</td>
                                            <td className={`text-right tabular-nums ${highlight === "differentWords" ? "bg-warning/15" : ""}`}>{showNumber(row.differentWords)}</td>
                                            {context !== "home" && <td className={`text-right tabular-nums ${highlight === "wordsPerIdea" ? "bg-warning/15" : ""}`}>{showNumber(row.wordsPerIdea)}</td>}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                        </div>
                    </div>
                    <div className="card bg-base-100 shadow-xl border border-base-300 min-w-0">
                        <div className="card-body p-4 sm:p-6 gap-3">
                            <h3 className="font-semibold flex items-center gap-1"><span>{context === "home" ? "Talk by activity at home" : "Talk by activity"}</span> <InfoTip helpKey="metric.talkByActivity" /></h3>
                            <div className="overflow-x-auto max-w-full min-w-0">
                            <table className="table table-sm w-full min-w-[42rem]">
                                <thead>
                                    <tr>
                                        <th className="sticky left-0 z-10 bg-base-100 whitespace-nowrap">Activity</th>
                                        <th className="text-right whitespace-nowrap">Recordings</th>
                                        {context !== "home" && <th className="text-right whitespace-nowrap">Audio</th>}
                                        {context !== "home" && <th className="text-right whitespace-nowrap">Avg WPM</th>}
                                        <th className="text-right whitespace-nowrap">Different words / min</th>
                                        <th className="text-right whitespace-nowrap">Why/how q / min</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {model.activity.map((row) => {
                                        const leading = row.whyHow != null && row.whyHow === topWhy;
                                        const tint = leading ? "bg-success/15" : "";
                                        const sticky = leading
                                            ? "bg-[color-mix(in_oklab,oklch(var(--su))_22%,oklch(var(--b1)))]"
                                            : "bg-base-100";
                                        return (
                                        <tr key={row.bucket}>
                                            <td className={`sticky left-0 z-10 whitespace-nowrap ${sticky}`}>{row.bucket}</td>
                                            <td className={`text-right tabular-nums ${tint}`}>{row.recordings}</td>
                                            {context !== "home" && <td className={`text-right tabular-nums whitespace-nowrap ${tint}`}>{row.audioMinutes == null ? "—" : `${row.audioMinutes} min`}</td>}
                                            {context !== "home" && <td className={`text-right tabular-nums ${tint}`}>{showNumber(row.avgWpm)}</td>}
                                            <td className={`text-right tabular-nums ${tint}`}>{showNumber(row.differentWords)}</td>
                                            <td className={`text-right tabular-nums ${tint}`}>{showNumber(row.whyHow)}</td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            </div>
                            <p className="text-xs text-base-content/60 mt-2">These figures describe the recordings you captured, not every hour of the day.</p>
                            {context === "home" && reading && meals && (reading.whyHow ?? 0) > (meals.whyHow ?? 0) && (
                                <p className="text-sm mt-2">During reading together in these dates, recordings included more why/how questions than during meals.</p>
                            )}
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                        {model.alphabet && (
                            <div className="card bg-base-100 shadow-xl border border-base-300">
                                <div className="card-body">
                                    <h3 className="font-semibold flex items-center gap-1"><span>Alphabet vs knowledge</span> <InfoTip helpKey="metric.alphabetKnowledge" /></h3>
                                    <p className="text-sm">{percent(model.alphabet.alphabetShare)} alphabet and phonics</p>
                                    <progress className="progress progress-warning" value={model.alphabet.alphabetShare * 100} max="100" />
                                    <p className="text-sm">{percent(model.alphabet.knowledgeShare)} knowledge-building (reading, science, math, play)</p>
                                    <progress className="progress progress-success" value={model.alphabet.knowledgeShare * 100} max="100" />
                                </div>
                            </div>
                        )}
                        {model.story && (
                            <div className="card bg-base-100 shadow-xl border border-base-300">
                                <div className="card-body">
                                    <h3 className="font-semibold flex items-center gap-1"><span>Story-time interactivity</span> <InfoTip helpKey="metric.storyTime" /></h3>
                                    <p className="text-sm text-base-content/70">From {model.story.count} read-aloud recordings only</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                                        <div><div className="text-xs">Why/how q / min</div><div className="text-lg font-semibold">{showNumber(model.story.whyHow)}</div></div>
                                        <div><div className="text-xs">Different words / min</div><div className="text-lg font-semibold">{showNumber(model.story.differentWords)}</div></div>
                                        {context !== "home" && <div><div className="text-xs">Words per idea</div><div className="text-lg font-semibold">{showNumber(model.story.wordsPerIdea)}</div></div>}
                                    </div>
                                </div>
                            </div>
                        )}
                        {model.everyday && (
                            <div className="card bg-base-100 shadow-xl border border-base-300">
                                <div className="card-body">
                                    <h3 className="font-semibold flex items-center gap-1"><span>Everyday moments</span> <InfoTip helpKey="metric.everyday" /></h3>
                                    <p className="text-sm">Why/how questions per minute {showNumber(model.everyday.whyHow)}. Different words per minute {showNumber(model.everyday.differentWords)}. {context === "home" ? "Play" : "Lesson and play"} recordings are at {showNumber(model.everyday.comparisonWhyHow)} why/how questions per minute.</p>
                                </div>
                            </div>
                        )}
                        {model.mix && role !== "parent" && (
                            <div className="card bg-base-100 shadow-xl border border-base-300">
                                <div className="card-body">
                                    <h3 className="font-semibold flex items-center gap-1"><span>Lesson time and routines</span> <InfoTip helpKey="metric.instructionalMix" /></h3>
                                    {role === "teacher" ? (
                                        <p className="text-sm">{percent(model.mix.instructionalShare)} of these recordings were lesson time.</p>
                                    ) : (
                                        <p className="text-sm">{model.mix.instructional} lesson recordings ({percent(model.mix.instructionalShare)}) and {model.mix.routine} routine recordings ({percent(model.mix.routineShare)}).</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div>
                    <div className="flex items-center gap-1 mb-2 text-sm text-base-content/70 min-w-0">
                        {viewMode === "dotmatrix" ? "Words per minute by month" : "Words per minute dials"}
                        <InfoTip helpKey={viewMode === "dotmatrix" ? "metric.dotMatrix" : "metric.dials"} />
                    </div>
                    <LanguageDevelopmentCharts
                        assessments={viewMode === "dotmatrix" && context === "school" ? summedMonthlyRows(model.filtered) : model.filtered}
                        viewMode={viewMode}
                        title={viewMode === "dotmatrix" ? "Language Development Analysis - Year Overview" : "Words per minute"}
                        contextSubtitle={contextSubtitle}
                        cohortThresholdsByCategory={viewMode === "semicircular" ? cohortThresholdsByCategory : null}
                        dotMatrixSubtitle="Words per minute for the dates you picked"
                    />
                </div>
            )}
        </section>
    );
}
