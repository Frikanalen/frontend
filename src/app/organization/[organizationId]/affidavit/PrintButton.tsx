"use client";
import { Button } from "@heroui/react";

export const PrintButton = () => <Button onPress={() => window.print()}>Skriv ut</Button>;
