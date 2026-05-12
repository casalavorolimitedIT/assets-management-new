import { redirectIfNotAuthenticated } from "@/lib/redirect/redirectIfNotAuthenticated";

export default async function VerificationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await redirectIfNotAuthenticated();
  return <>{children}</>;
}
