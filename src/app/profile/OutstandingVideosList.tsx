import { useVideosList } from "@/generated/videos/videos";
import { VideosListParams } from "@/generated/frikanalenDjangoAPI.schemas";
import {
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import Link from "next/link";

export const OutstandingVideosList = ({
  organizationId,
}: {
  organizationId: number;
}) => {
  const { data } = useVideosList({
    organization: organizationId,
    properImport: false,
  } as VideosListParams);
  const videos = data?.data.results.filter((v) => !v.properImport) ?? [];
  return (
    <div>
      <h2>Følgende videoer er ikke blitt importert:</h2>
      <Table aria-label="Ufullstendige videoer">
        <TableHeader>
          <TableColumn>Navn</TableColumn>
          <TableColumn>Status</TableColumn>
          <TableColumn>Handlinger</TableColumn>
        </TableHeader>
        <TableBody>
          {videos.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.name}</TableCell>
              <TableCell>
                <Chip>import mislykket (ukjent grunn) eller aldri forsøkt</Chip>
              </TableCell>
              <TableCell className={"space-x-2"}>
                <Button
                  as={Link}
                  href={`/organization`}
                  color="danger"
                  size="sm"
                >
                  Slett
                </Button>
                <Button
                  as={Link}
                  href={`/video/${r.id}/upload`}
                  color="primary"
                  size="sm"
                >
                  Last opp
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
