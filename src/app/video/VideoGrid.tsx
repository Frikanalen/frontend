"use client";

import { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { Card, CardBody, Image } from "@heroui/react";
import Link from "next/link";

/**
 * `showOrganization` is off wherever the grid already sits under the name of
 * the organization that made every video in it - repeating it on all
 * twenty-four cards tells the reader nothing they aren't already looking at.
 *
 * `headingLevel` follows whatever the grid is nested under, so the card
 * titles don't skip a level: directly under the page's h1 on the archive, and
 * under a section heading on an organization's page.
 */
export const VideoGrid = ({
  videos,
  showOrganization = true,
  headingLevel = 2,
}: {
  videos: Video[];
  showOrganization?: boolean;
  headingLevel?: 2 | 3;
}) => {
  const Heading = `h${headingLevel}` as const;

  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
      {videos.map((video) => (
        <li key={video.id} className="h-full">
          <Card as={Link} href={`/video/${video.id}`} className="h-full w-full">
            <Image
              alt=""
              radius="none"
              src={video.largeThumbnailUrl}
              width={"100%"}
              className="aspect-video object-cover"
            />
            <CardBody className="gap-1">
              <Heading className="line-clamp-2 font-medium">{video.name}</Heading>
              {showOrganization && (
                <p className="text-sm text-foreground/75">{video.organization.name}</p>
              )}
            </CardBody>
          </Card>
        </li>
      ))}
    </ul>
  );
};
