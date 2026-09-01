"use client";
import { useVideosList } from "@/generated/videos/videos";
import { VideoList } from "@/app/video/VideoList";
import { useVideoDeletion } from "@/app/organization/[organizationId]/useVideoDeletion";
import { Button } from "@heroui/react";
import Link from "next/link";

/**
 * The organization's finished videos, as its own administrators see them:
 * the same rows the archive shows anyone, with the buttons only they get.
 *
 * The whole row is already a link to the public page, so the buttons beside
 * it are the two things that link cannot do.
 */
export const OrgVideosList = ({ organizationId }: { organizationId: number }) => {
  const { remove, isRemoving, error } = useVideoDeletion();
  // Newest first, by id rather than by date: `created_time` is rewritten by
  // re-imports, which floats decade-old material to the top of what should be
  // "what we did lately". Ids only ever ascend.
  const { data } = useVideosList({ organization: organizationId, ordering: "-id" });
  const videos = data?.data.results ?? [];

  return (
    <section className={"space-y-4"}>
      <h2 className={"text-xl font-bold"}>Videoer</h2>

      {videos.length ? (
        <VideoList
          videos={videos}
          showOrganization={false}
          actions={(video) => (
            <>
              <Button as={Link} href={`/video/${video.id}/edit`} color="primary" size="sm">
                Rediger
              </Button>
              <Button
                color="danger"
                variant="flat"
                size="sm"
                isLoading={isRemoving(video.id)}
                onPress={() =>
                  remove(
                    video.id,
                    video.name,
                    `Slett videoen «${video.name}»? Dette kan ikke angres.`,
                  )
                }
              >
                Slett
              </Button>
            </>
          )}
        />
      ) : (
        <p className="text-foreground/75">Dere har ingen ferdige videoer ennå.</p>
      )}

      {error && (
        <p role="alert" className="text-danger-700 text-sm">
          Videoen kunne ikke slettes: {error}
        </p>
      )}
    </section>
  );
};
