import InfoTip from "./InfoTip.jsx";

function countLabel(count, singular, plural) {
    return `${count} ${count === 1 ? singular : plural}`;
}

function Metric({ children, helpKey }) {
    return (
        <span className="inline-flex items-center gap-0.5 max-w-full">
            <span>{children}</span>
            <InfoTip helpKey={helpKey} />
        </span>
    );
}

export default function LanguageFeatureStrip({ features, unavailableText = "Language extras not available" }) {
    if (!features) {
        return (
            <p className="text-sm text-base-content/70 mt-2 flex items-center gap-1">
                <span>{unavailableText}</span>
                <InfoTip helpKey="metric.sessionStrip" />
            </p>
        );
    }
    const wordsPerIdea = features.meanUtteranceLength == null ? null : features.meanUtteranceLength;
    return (
        <div className="mt-2 min-w-0">
            <p className="text-sm text-base-content flex flex-wrap items-center gap-x-2 gap-y-1">
                <InfoTip helpKey="metric.sessionStrip" />
                <Metric helpKey="metric.differentWords">{countLabel(features.uniqueWordCount ?? 0, "different word", "different words")}</Metric>
                <span aria-hidden="true" className="text-base-content/40">·</span>
                <Metric helpKey="metric.whyHow">{countLabel(features.whQuestionCount ?? 0, "why/how question", "why/how questions")}</Metric>
                <span aria-hidden="true" className="text-base-content/40">·</span>
                <Metric helpKey="metric.ideas">{countLabel(features.utteranceCount ?? 0, "idea", "ideas")}</Metric>
                {wordsPerIdea != null && (
                    <>
                        <span aria-hidden="true" className="text-base-content/40">·</span>
                        <Metric helpKey="metric.wordsPerIdea">{wordsPerIdea} words per idea</Metric>
                    </>
                )}
            </p>
            <details className="mt-2">
                <summary className="text-sm cursor-pointer text-base-content/70 w-fit">More detail</summary>
                <ul className="mt-2 text-sm space-y-1">
                    <li className="flex items-center gap-1"><span>Word variety {features.varietyRatio == null ? "—" : `${Math.round(features.varietyRatio * 100)}%`}</span><InfoTip helpKey="metric.wordVariety" /></li>
                    <li className="flex items-center gap-1"><span>Connecting words {features.conjunctionCount ?? 0}</span><InfoTip helpKey="metric.connectingWords" /></li>
                    <li className="flex items-center gap-1"><span>Content words {features.rareWordCount ?? 0}</span><InfoTip helpKey="metric.contentWords" /></li>
                    <li className="flex items-center gap-1"><span>Big-idea phrases {features.genericPhraseCount ?? 0}</span><InfoTip helpKey="metric.bigIdeaPhrases" /></li>
                </ul>
            </details>
        </div>
    );
}
