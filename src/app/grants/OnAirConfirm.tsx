"use client";
import { formatOsloTime, inOsloTime } from "@/lib/osloTime";
import { Button, Modal } from "@heroui/react";
import { format } from "date-fns";

/** The time now. For event handlers only; render reads the time once, on mount. */
export const timeNow = () => new Date().getTime();

/** How close to air a change has to be to ask first. */
export const CLOSE_CALL_MILLISECONDS = 2 * 60 * 1000;

/** An instant as an Oslo wall clock, to the second. */
export const clock = (instant: Date) => format(inOsloTime(instant), "HH:mm:ss");

/** A warning for a change that reaches something starting at `start`, if that is soon. */
export const closeCallWarning = (start: Date | undefined, now: number) =>
  start !== undefined && start.getTime() - now < CLOSE_CALL_MILLISECONDS
    ? `Endringen gjelder noe som skal starte kl. ${clock(start)}, om under to minutter. Playout kan ha gjort det klart allerede.`
    : undefined;

/** A warning for taking a programme off the air at `at`. */
export const cutWarning = (name: string, at: Date, now: number) =>
  at.getTime() <= now + 5000
    ? `«${name}» er på lufta og tas av lufta med en gang.`
    : `«${name}» er på lufta og kuttes kl. ${formatOsloTime(at)}.`;

/**
 * Asks before a staff change that touches what is on air or about to be:
 * the warnings say what will happen, and nothing is saved until confirmed.
 */
export const OnAirConfirm = ({
  warnings,
  pending,
  onConfirm,
  onCancel,
}: {
  /** Shown when there is at least one. */
  warnings: string[];
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <Modal isOpen={warnings.length > 0} onOpenChange={(open) => (open ? undefined : onCancel())}>
    <Modal.Backdrop isDismissable={!pending}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>Endre det som sendes nå?</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="space-y-2">
            {warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </Modal.Body>
          <Modal.Footer>
            <Button isDisabled={pending} variant="tertiary" onPress={onCancel}>
              Avbryt
            </Button>
            <Button isPending={pending} variant="danger" onPress={onConfirm}>
              Gjør endringen
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  </Modal>
);
