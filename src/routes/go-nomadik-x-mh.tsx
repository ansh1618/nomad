import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/go-nomadik-x-mh")({
  beforeLoad: () => {
    throw redirect({
      to: "/college-trips",
      replace: true,
    });
  },
  component: () => null,
});
