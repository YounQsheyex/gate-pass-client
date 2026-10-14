"use client";

import { useParams } from "next/navigation";
import { EventForm } from "./EventForm";

export function EditEvent() {
  const { id } = useParams<{ id: string }>();
  return <EventForm key={id} eventId={id} />;
}
