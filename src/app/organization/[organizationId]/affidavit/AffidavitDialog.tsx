"use client";
import { Button, Modal } from "@heroui/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { AFFIDAVIT_PARAM } from "@/app/organization/[organizationId]/affidavit/affidavitHref";

/**
 * The editor's declaration as a dialog over Kom i gang, so the steps stay in
 * view behind it. Opened by the URL, so a link or a reload lands in it.
 */
export const AffidavitDialog = ({ children }: { children: ReactNode }) => {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const close = () => router.replace(path, { scroll: false });

  return (
    <Modal
      isOpen={params.has(AFFIDAVIT_PARAM)}
      onOpenChange={(open) => (open ? undefined : close())}
    >
      <Modal.Backdrop>
        <Modal.Container size="lg" scroll="inside" className="max-w-3xl">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Redaktørerklæringen</Modal.Heading>
            </Modal.Header>
            <Modal.Body>{children}</Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={close}>
                Lukk
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};
