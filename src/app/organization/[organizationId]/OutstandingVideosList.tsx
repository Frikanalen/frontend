"use client";
import { useVideosList } from "@/generated/videos/videos";
import { VideoList } from "@/app/video/VideoList";
import { IngestStatusChip } from "@/app/organization/[organizationId]/IngestStatusChip";
import { useVideoDeletion } from "@/app/organization/[organizationId]/useVideoDeletion";
import { Button } from "@heroui/react";
import Link from "next/link";
import { Alert } from "@heroui/alert";

/**
 * The organization's videos that have no watchable copy yet: the ones an
 * upload was never finished for, the ones ingest is still working through,
 * and the ones it gave up on.
 *
 * It is a separate list from the main one rather than a filter on it because
 * these need doing something about, and the warning above them says so. The
 * server draws the same line: `proper_import` omitted is the finished
 * catalogue, and `false` is exactly this list.
 */
export const OutstandingVideosList = ({ organizationId }: { organizationId: number }) => {
  const { remove, isRemoving, error } = useVideoDeletion();
  const { data } = useVideosList({
    organization: organizationId,
    proper_import: false,
    ordering: "-id",
  });
  const videos = data?.data.results ?? [];

  if (!videos.length) return null;

  return (
    <section className={"space-y-4"}>
      <h2 className={"text-xl font-bold"}>Uferdige videoer</h2>

      <Alert color="warning">
        <div className="space-y-2">
          <p>
            Disse videoene har ingen ferdig visningskopi ennå. Status under hver av dem sier hvor
            langt behandlingen er kommet.
          </p>
          <p>
            Har behandlingen stoppet, eller ble det aldri lastet opp noen fil, kan du prøve på nytt
            med &laquo;last opp&raquo; - eller slette videoen om den er blitt igjen ved en feil.
          </p>
        </div>
      </Alert>

      <VideoList
        videos={videos}
        showOrganization={false}
        showCategory={false}
        status={(video) => <IngestStatusChip videoId={video.id} />}
        actions={(video) => (
          <>
            <Button as={Link} href={`/video/${video.id}/upload`} color="primary" size="sm">
              Last opp
            </Button>
            <Button
              color="danger"
              variant="flat"
              size="sm"
              isLoading={isRemoving(video.id)}
              onPress={() =>
                remove(video.id, video.name, `Slett den uimporterte videoen «${video.name}»?`)
              }
            >
              Slett
            </Button>
          </>
        )}
      />

      {error && (
        <p role="alert" className="text-danger-700 text-sm">
          Videoen kunne ikke slettes: {error}
        </p>
      )}
    </section>
  );
};
