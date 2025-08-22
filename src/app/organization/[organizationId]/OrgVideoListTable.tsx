"use client";

import { Video } from "@/generated/ssr/frikanalenDjangoAPI.schemas";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import Link from "next/link";

export const OrgVideoListTable = ({ videos = [] }: { videos: Video[] | undefined }) => {
  return (
    <Table>
      <TableHeader>
        <TableColumn>ID</TableColumn>
        <TableColumn>Navn</TableColumn>
        <TableColumn>Handlinger</TableColumn>
      </TableHeader>
      <TableBody>
        {videos.map((v) => (
          <TableRow key={v.id}>
            <TableCell>{v.id}</TableCell>
            <TableCell>{v.name}</TableCell>
            <TableCell className={"space-x-2"}>
              <Button as={Link} href={`/video/${v.id}`} color="primary" size="sm">
                Offentlig side
              </Button>
              <Button as={Link} href={`/video/${v.id}/edit`} color="primary" size="sm">
                Rediger
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
