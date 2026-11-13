import { Live } from "@/components/stream/live";
import { getScheduleForToday } from "@/app/getScheduleForToday";
import { NowNextPanel } from "@/app/frontpage/NowNextPanel";
import { TonightStrip } from "@/app/frontpage/TonightStrip";
import { FromArchive } from "@/app/frontpage/FromArchive";
import { ssrVideosList } from "@/generated/ssr/videos/videos";
import { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import Link from "next/link";

export const dynamic = "force-dynamic"; // ensure Date() is evaluated at request time

/**
 * The newest programmes published to the web, or none if the archive can't be
 * had. Like the schedule, it is context around the live stream: a backend that
 * is down costs the page this section, not the page.
 */
const getNewestVideos = async (): Promise<Video[]> => {
  try {
    const { data, status } = await ssrVideosList(
      { publish_on_web: true, ordering: "-created_time", limit: 4 },
      { cache: "no-store" },
    );
    return status === 200 ? (data.results ?? []) : [];
  } catch (error) {
    console.error("Could not load the front page archive", error);
    return [];
  }
};

export default async function Home() {
  const [schedule, newest] = await Promise.all([getScheduleForToday(), getNewestVideos()]);

  return (
    <main className="w-full grow">
      {/* The stage: the channel itself, on the same dark surface as the bar
          above it. Everything below is about the channel, on paper. */}
      <div className="bg-stage text-stage-foreground">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-2 pb-12 sm:px-6">
          <aside aria-label="Frikanalen i unntakstilstand">
            <Link
              href="/unntakstilstand"
              className="block border border-stage-line px-4 py-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stage-foreground sm:px-5"
            >
              <p className="text-lg font-bold">Frikanalen i unntakstilstand</p>
              <p className="mt-1 max-w-4xl text-stage-muted">
                Inntil klagen vår til Enhetsregisteret er behandlet og situasjonen er avklart,
                formidler vi ikke innhold fra medlemmene som sto bak forsøket på å overta styringen
                av kanalen.
              </p>
              <p className="mt-2 underline underline-offset-4">Les redegjørelsen →</p>
            </Link>
          </aside>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
            <Live />
            <NowNextPanel schedule={schedule} />
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 pt-16 sm:px-6 lg:gap-20 lg:pt-20">
        <section className="grid grid-cols-1 items-end gap-x-16 gap-y-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <h2 className="text-5xl leading-[1.02] font-extrabold tracking-tighter text-balance sm:text-6xl">
            Sivilsamfunnets egen TV‑kanal.
          </h2>
          <div className="flex flex-col gap-3 text-lg text-default-800">
            <p>
              Frikanalen er sivilsamfunnets videoplattform. Her lager og sender organisasjonene
              programmene selv, og hvert medlem er selv ansvarlig for innholdet i sine sendinger.
            </p>
            <Link
              className="self-start py-1 font-semibold text-primary-700 hover:underline"
              href="/about"
            >
              Om Frikanalen →
            </Link>
          </div>
        </section>

        <TonightStrip schedule={schedule} />
        <FromArchive videos={newest} />
      </div>

      <section
        aria-labelledby="join-heading"
        className="mt-16 -mb-16 bg-brand-deep text-white lg:mt-20"
      >
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-x-16 gap-y-6 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:py-20">
          <h2
            className="text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl"
            id="join-heading"
          >
            Lag fjernsyn selv.
          </h2>
          <div className="flex flex-col gap-5">
            <p className="text-lg text-[#cfe9c8]">
              Er dere en frivillig organisasjon? Som medlem får dere sendetid på kanalen og plass i
              arkivet.
            </p>
            <Link
              className="inline-flex min-h-12 items-center self-start rounded-md bg-white px-5 text-lg font-bold text-brand-deep hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              href="/about/join"
            >
              Bli med
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
