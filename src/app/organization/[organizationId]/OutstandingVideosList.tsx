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
import { Alert } from "@heroui/alert";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale/nb";

export const OutstandingVideosList = ({ organizationId }: { organizationId: number }) => {
  const { data } = useVideosList({
    organization: organizationId,
    properImport: false,
  } as VideosListParams);
  const videos = data?.data.results.filter((v) => !v.properImport) ?? [];
  return (
    <div className={"space-y-4"}>
      {!!videos.length && (
        <>
          <Alert color="warning">
            <h2 className={"font-bold"}>Du har uimporterte videoer</h2>
            <p>Du har opprettet de følgende videoene uten at en import er blitt ferdigstilt.</p>
            <p>
              Om du ønsker å prøve på nytt å laste opp en original, trykk &laquo;last opp&raquo;.
            </p>
            <p>Om videoen er blitt igjen ved en feil, slett den gjerne.</p>
          </Alert>

          <Table aria-label="Ufullstendige videoer">
            <TableHeader>
              <TableColumn>Navn</TableColumn>
              <TableColumn>Dato</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn>Handlinger</TableColumn>
            </TableHeader>
            <TableBody>
              {videos.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>
                    {r.createdTime
                      ? format(parseISO(r.createdTime), "PPPPpp", { locale: nb })
                      : "unknown"}
                  </TableCell>
                  <TableCell>
                    <Chip>feil eller ikke importert</Chip>
                  </TableCell>
                  <TableCell className={"space-x-2"}>
                    <Button as={Link} href={`/organization`} color="danger" size="sm">
                      Slett
                    </Button>
                    <Button as={Link} href={`/video/${r.id}/upload`} color="primary" size="sm">
                      Last opp
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
};
