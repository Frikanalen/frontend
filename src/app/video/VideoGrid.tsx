"use client";

import { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { Card, CardBody, Image } from "@heroui/react";
import Link from "next/link";

export const VideoGrid = ({ videos }: { videos: Video[] }) => (
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
            <h2 className="line-clamp-2 font-medium">{video.name}</h2>
            <p className="text-sm text-foreground/75">{video.organization.name}</p>
          </CardBody>
        </Card>
      </li>
    ))}
  </ul>
);
