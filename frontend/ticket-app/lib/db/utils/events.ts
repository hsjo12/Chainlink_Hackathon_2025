import { dbCreateEventParams } from "@/types/params";

export async function storeNewEvent(eventData: dbCreateEventParams) {
  const res = await fetch("/api/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventData),
  });
  console.log(res);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error || "Failed to create event");
  }

  return res.json();
}

export async function fetchEvents() {
  const res = await fetch("/api/events", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || err.message || "Failed to fetch events");
  }

  return res.json();
}

export async function fetchEventById(id: string) {
  const res = await fetch(`/api/events/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || err.message || `Failed to fetch event ${id}`);
  }

  return res.json();
}

export async function fetchCreatedEventsByAddress() {
  const res = await fetch(`/api/events`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || err.message);
  }

  return res.json();
}

export async function updateEvents(
  eventId: string,
  mode: string,
  updatedData: any
) {
  const res = await fetch(`/api/events/${eventId}?mode=${mode}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedData),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update event details");
  }

  return res.json();
}
