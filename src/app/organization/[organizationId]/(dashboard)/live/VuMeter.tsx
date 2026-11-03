"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/react";
import { ballistics, FLOOR_DB, meterFraction, PEAK_HOLD_MS, peakDb } from "@/lib/live/meter";

const CHANNELS = ["V", "H"] as const;
const SCALE = [-48, -36, -24, -18, -12, -6, 0];

/**
 * A stereo peak meter measured in the browser from the audio it receives,
 * so it moves with the picture. It listens to the stream rather than the
 * player's output, so it works with playback muted.
 */
export const VuMeter = ({ stream }: { stream: MediaStream | null }) => {
  const covers = useRef<(HTMLDivElement | null)[]>([]);
  const peaks = useRef<(HTMLDivElement | null)[]>([]);
  // Browsers start an AudioContext suspended until the page is interacted
  // with; the preview may have started by itself, so offer to wake it.
  const [suspended, setSuspended] = useState<AudioContext | null>(null);
  const hasAudio = !!stream?.getAudioTracks().length;

  useEffect(() => {
    if (!stream || !stream.getAudioTracks().length) return;
    const context = new AudioContext();
    const source = context.createMediaStreamSource(stream);
    const splitter = context.createChannelSplitter(2);
    source.connect(splitter);
    const analysers = CHANNELS.map((_, channel) => {
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      splitter.connect(analyser, channel);
      return analyser;
    });
    // Nothing reaches context.destination: this only measures.

    const buffer = new Float32Array(analysers[0].fftSize);
    const shown = CHANNELS.map(() => FLOOR_DB);
    const held = CHANNELS.map(() => ({ db: FLOOR_DB, at: 0 }));
    let last = performance.now();
    let frame = requestAnimationFrame(function draw(now) {
      analysers.forEach((analyser, channel) => {
        analyser.getFloatTimeDomainData(buffer);
        const measured = peakDb(buffer);
        shown[channel] = ballistics(shown[channel], measured, now - last);
        const peak = held[channel];
        if (measured >= peak.db) Object.assign(peak, { db: measured, at: now });
        else if (now - peak.at > PEAK_HOLD_MS) peak.db = ballistics(peak.db, measured, now - last);
        // The cover hides the unlit part, so the colour bands stay put.
        const cover = covers.current[channel];
        if (cover) cover.style.transform = `scaleX(${1 - meterFraction(shown[channel])})`;
        const marker = peaks.current[channel];
        if (marker) {
          marker.style.left = `${meterFraction(peak.db) * 100}%`;
          marker.style.opacity = peak.db > FLOOR_DB ? "1" : "0";
        }
      });
      last = now;
      frame = requestAnimationFrame(draw);
    });

    const onStateChange = () => setSuspended(context.state === "suspended" ? context : null);
    context.addEventListener("statechange", onStateChange);
    onStateChange();

    return () => {
      cancelAnimationFrame(frame);
      context.removeEventListener("statechange", onStateChange);
      setSuspended(null);
      void context.close();
    };
  }, [stream]);

  if (!hasAudio) return <p className="text-sm text-default-600">Ingen lyd mottas.</p>;

  return (
    <div className="space-y-1" aria-label="Lydnivå">
      {CHANNELS.map((name, channel) => (
        <div key={name} className="flex items-center gap-2">
          <span className="w-3 text-xs text-default-500">{name}</span>
          {/* Green to -18 dBFS, yellow to -6, red above. */}
          <div className="relative h-3 grow overflow-hidden rounded bg-[linear-gradient(to_right,var(--color-green-500)_70%,var(--color-yellow-400)_70%,var(--color-yellow-400)_90%,var(--color-red-500)_90%)]">
            <div
              ref={(element) => {
                covers.current[channel] = element;
              }}
              className="absolute inset-0 origin-right bg-default-200"
            />
            <div
              ref={(element) => {
                peaks.current[channel] = element;
              }}
              className="absolute inset-y-0 w-0.5 bg-foreground opacity-0"
            />
          </div>
        </div>
      ))}
      <div className="relative ml-5 h-4 text-[10px] text-default-500">
        {SCALE.map((db) => (
          <span
            key={db}
            className="absolute -translate-x-1/2"
            style={{ left: `${meterFraction(db) * 100}%` }}
          >
            {db}
          </span>
        ))}
      </div>
      {suspended && (
        <Button size="sm" variant="tertiary" onPress={() => void suspended.resume()}>
          Vis lydnivå
        </Button>
      )}
    </div>
  );
};
