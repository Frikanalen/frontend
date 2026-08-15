"use client";
import { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { Card, CardFooter, Image, ScrollShadow } from "@heroui/react";
import Link from "next/link";

export const VideoHorizontalList = ({ videos }: { videos: Video[] }) => {
  return (
    <ScrollShadow
      className="w-full p-4 border-1 border-secondary-600/20 rounded-xl overflow-x-scroll"
      orientation={"horizontal"}
      hideScrollBar={false}
    >
      <div className="flex flex-nowrap w-auto gap-4">
        {videos.map((video) => (
          <Card as={Link} key={video.id} className="w-72 shrink-0" href={`/video/${video.id}`}>
            <Image alt="" className="" src={video.largeThumbnailUrl} width={288} height={162} />
            <CardFooter
              className={
                "bg-content1/70" +
                " overflow-hidden py-1 absolute  rounded-none bottom-0 w-full " +
                "shadow-small z-10"
              }
            >
              <div className={""}>{video.name}</div>
              {/*<pre>{JSON.stringify(video, null, 2)}</pre>*/}
            </CardFooter>
          </Card>
        ))}
      </div>
    </ScrollShadow>
  );
};
