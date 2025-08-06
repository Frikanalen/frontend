"use client";
import { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { Card, CardFooter, Image, ScrollShadow } from "@heroui/react";
import Link from "next/link";

export const VideoVerticalList = ({ videos }: { videos: Video[] }) => {
  return (
    <ScrollShadow
      className="p-4 border-1 border-secondary-600/20 rounded-xl overflow-y-scroll max-h-[700px]"
      hideScrollBar={false}
    >
      <div className="flex flex-col gap-4">
        {videos.map((video) => (
          <Card
            as={Link}
            key={video.id}
            className="shrink-0"
            href={`/video/${video.id}`}
          >
            <Image
              alt=""
              className="aspect-video"
              src={video.largeThumbnailUrl}
              width={"100%"}
            />
            <CardFooter
              className={
                "bg-content1/70" +
                " overflow-hidden py-1 absolute  rounded-none bottom-0 w-full " +
                "shadow-small z-10"
              }
            >
              <div className={""}>{video.name}</div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </ScrollShadow>
  );
};
