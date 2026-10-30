import { Alert } from "@heroui/react";
import { ReactNode } from "react";

type NoticeStatus = "default" | "accent" | "success" | "warning" | "danger";

/** App-level status message built from HeroUI 3's compound Alert API. */
export const Notice = ({
  status = "default",
  className,
  id,
  children,
}: {
  status?: NoticeStatus;
  className?: string;
  id?: string;
  children: ReactNode;
}) => (
  <Alert status={status} className={className} id={id}>
    <Alert.Content>{children}</Alert.Content>
  </Alert>
);
