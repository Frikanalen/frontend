"use client";
import { Card, CardBody, CardHeader } from "@heroui/react";
import React from "react";

export const AdvarselKort = () => (
  <Card className={"mb-4"}>
    <CardHeader>
      <h2 className={"text-lg font-bold"}>
        NB: Dette dokumentet er ikke ajourført.
      </h2>
    </CardHeader>
    <CardBody>
      Under årsmøtet 2021 ble det vedtatt å endre styrets medlemmer, disse
      endringene er ikke ennå flettet inn. I tillegg ble det under årsmøtet 2025
      oppdaget at vedtektene av 2021 er selvmotstridende, og det ble enstemmig
      vedtatt at et ekstraordinært årsmøte skal avholdes snarlig for å
      harmonisere disse.
    </CardBody>
  </Card>
);
