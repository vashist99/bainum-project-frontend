import { useState } from "react";
import {
    ArrowRight,
    Eye,
    House,
    Mic,
    School,
    Shield,
    Trash2,
    UserRound,
} from "lucide-react";
import {
    ACTORS,
    CLASSROOM_VIEWERS,
    COPY,
    DELETION_FACT,
    HOME_VIEWERS,
    JOIN_NOTE,
    PATHS,
    PERSPECTIVES,
    PLACES,
    connectorEmphasized,
    pathCellLabel,
    pathLabel,
    perspectiveEmphasis,
} from "../lib/accessModel.js";
import { useAuth } from "../contexts/AuthContext";

const ACTOR_ICON = {
    shield: Shield,
    mic: Mic,
    eye: Eye,
    user: UserRound,
};

const PLACE_ICON = {
    school: School,
    house: House,
};

const PERSPECTIVE_LABEL = {
    all: "All",
    ...Object.fromEntries(ACTORS.map((actor) => [actor.id, actor.label])),
};

function actorById(id) {
    return ACTORS.find((actor) => actor.id === id);
}

function pathById(id) {
    return PATHS.find((path) => path.id === id);
}

function emphasisClass(level) {
    return level === "full" ? "opacity-100" : "opacity-40 hover:opacity-70";
}

function PersonDot({ actor, size = "sm" }) {
    const box = size === "lg" ? "w-12 h-12" : "w-7 h-7";
    const iconSize = size === "lg" ? "w-6 h-6" : "w-3.5 h-3.5";
    const Icon = ACTOR_ICON[actor.icon];
    return (
        <span className={`${box} rounded-full flex items-center justify-center shrink-0 ${actor.headerClass}`}>
            {Icon ? <Icon className={iconSize} aria-hidden="true" /> : null}
        </span>
    );
}

function PersonCard({ actor, selected, onSelect }) {
    const pressed = selected === actor.id;
    const level = perspectiveEmphasis(selected, actor.id);
    return (
        <button
            type="button"
            onClick={() => onSelect(actor.id)}
            aria-pressed={pressed}
            aria-label={`View as ${actor.label}`}
            className={`flex flex-col items-center text-center gap-2 p-3 bg-base-100 border border-base-300 rounded-xl transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-base-content ${emphasisClass(level)} ${
                pressed ? `ring-2 ring-offset-2 ring-offset-base-200 ${actor.ringClass}` : ""
            }`}
        >
            <PersonDot actor={actor} size="lg" />
            <span className="font-semibold text-base-content leading-tight">{actor.label}</span>
            <span className="text-xs text-base-content/70 leading-snug">{actor.job}</span>
        </button>
    );
}

function ArrowRow({ path, selected }) {
    const from = actorById(path.from);
    const on = connectorEmphasized(selected, path.actors);
    if (!from) return null;
    return (
        <div
            id={`arrow-${path.id}`}
            className={`flex flex-wrap items-center gap-2 px-3 py-2 rounded-lg bg-base-100 border border-base-300 text-sm text-base-content transition-opacity ${
                on ? "opacity-100" : "opacity-40"
            }`}
        >
            <PersonDot actor={from} />
            <span className="font-medium">{from.label}</span>
            <ArrowRight className="w-4 h-4 shrink-0 text-base-content/50" aria-hidden="true" />
            <span>{path.toLabel}</span>
            <span className="font-semibold">{pathLabel(path)}</span>
        </div>
    );
}

function Cell({ value, pathId, labelKey, selected }) {
    if (value === "yes") {
        return <span className="text-sm font-medium text-base-content">{COPY.yes}</span>;
    }
    if (value === "no") {
        return <span className="text-sm font-medium text-base-content">{COPY.no}</span>;
    }
    const path = pathById(pathId);
    const on = path ? connectorEmphasized(selected, path.actors) : true;
    const words = labelKey ? COPY[labelKey] : path ? pathCellLabel(path) : "";
    return (
        <span
            className={`text-sm text-base-content leading-snug transition-opacity ${on ? "opacity-100" : "opacity-40"}`}
            aria-describedby={pathId ? `arrow-${pathId}` : undefined}
        >
            {words}
        </span>
    );
}

function ViewerRow({ row, selected }) {
    const actor = actorById(row.actor);
    if (!actor) return null;
    const level = perspectiveEmphasis(selected, row.actor);
    const fade = `py-2 border-t border-base-300 transition-opacity ${emphasisClass(level)}`;
    return (
        <div className="contents">
            <div className={`flex items-center gap-2 min-w-0 ${fade}`}>
                <PersonDot actor={actor} />
                <span className="font-medium text-sm text-base-content truncate">{actor.label}</span>
            </div>
            <div className={fade}>
                <Cell value={row.charts} pathId={row.chartsPath} selected={selected} />
            </div>
            <div className={fade}>
                <Cell
                    value={row.transcript}
                    pathId={row.transcriptPath}
                    labelKey={row.transcriptLabelKey}
                    selected={selected}
                />
            </div>
        </div>
    );
}

function PlaceCard({ place, selected }) {
    const Icon = PLACE_ICON[place.icon];
    const viewers = place.id === "classroom" ? CLASSROOM_VIEWERS : HOME_VIEWERS;
    const on = connectorEmphasized(selected, place.actors);
    return (
        <section
            className={`bg-base-100 border border-base-300 rounded-xl p-4 text-base-content transition-opacity ${
                on ? "opacity-100" : "opacity-40"
            }`}
        >
            <h3 className="flex items-center gap-2 font-semibold text-lg">
                {Icon ? <Icon className="w-5 h-5 shrink-0" aria-hidden="true" /> : null}
                {place.title}
            </h3>
            <div className="mt-3 grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)_minmax(0,1fr)] gap-x-2 items-center">
                <span aria-hidden="true" />
                <span className="text-sm font-semibold text-base-content">{COPY.charts}</span>
                <span className="text-sm font-semibold text-base-content">{COPY.writtenTranscript}</span>
                {viewers.map((row) => (
                    <ViewerRow key={row.actor} row={row} selected={selected} />
                ))}
            </div>
        </section>
    );
}

function DeletionStrip() {
    return (
        <p className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-xl bg-base-100 border border-base-300 text-sm text-base-content">
            <Trash2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{DELETION_FACT.label}:</span>
            {DELETION_FACT.actors.map((id) => {
                const actor = actorById(id);
                if (!actor) return null;
                return (
                    <span key={id} className="inline-flex items-center gap-1.5">
                        <PersonDot actor={actor} />
                        {actor.label}
                    </span>
                );
            })}
        </p>
    );
}

/**
 * Map of people, labeled arrows, classroom vs home.
 * View as highlights paths; it does not reprint the picture.
 */
export default function AccessModelDiagram() {
    const { user } = useAuth();
    const initial =
        user?.role && PERSPECTIVES.includes(user.role) ? user.role : "all";
    const [selected, setSelected] = useState(initial);

    return (
        <div className="flex flex-col gap-4">
            <div className="sticky top-0 z-10 -mx-1 px-1 py-3 bg-base-200/95 border-b border-base-300">
                <p className="text-xs font-semibold uppercase tracking-wide text-base-content/60 mb-2">
                    View as
                </p>
                <div
                    role="radiogroup"
                    aria-label="Actor perspective"
                    className="flex flex-wrap gap-2"
                >
                    {PERSPECTIVES.map((id) => {
                        const active = selected === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                className={`btn btn-sm ${active ? "btn-neutral" : "btn-ghost border border-base-300"}`}
                                onClick={() => setSelected(id)}
                            >
                                {PERSPECTIVE_LABEL[id]}
                            </button>
                        );
                    })}
                </div>
            </div>

            <p
                className="text-sm leading-relaxed px-4 py-3 rounded-xl bg-base-100 border border-accent/40 text-base-content"
                role="note"
            >
                {JOIN_NOTE}
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {ACTORS.map((actor) => (
                    <PersonCard
                        key={actor.id}
                        actor={actor}
                        selected={selected}
                        onSelect={setSelected}
                    />
                ))}
            </div>

            <div className="flex flex-col gap-2" aria-label="What each person does">
                {PATHS.map((path) => (
                    <ArrowRow key={path.id} path={path} selected={selected} />
                ))}
            </div>

            <p className="text-sm text-base-content px-1">
                <span className="font-semibold">{COPY.charts}</span>
                {" — "}
                {COPY.chartsGloss}
                {"  "}
                <span className="font-semibold">{COPY.writtenTranscript}</span>
                {" — "}
                {COPY.transcriptGloss}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <PlaceCard place={PLACES[0]} selected={selected} />
                <PlaceCard place={PLACES[1]} selected={selected} />
            </div>

            <DeletionStrip />
        </div>
    );
}
