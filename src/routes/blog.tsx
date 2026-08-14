import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/blog")({
  loader: () => {
    throw redirect({ to: "/stories", statusCode: 301 });
  },
});
