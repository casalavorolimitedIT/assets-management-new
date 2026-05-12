import { redirectIfAuthenticated } from "@/lib/redirect/redirectIfAuthenticated";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await redirectIfAuthenticated();
  return (
    <main className="">
      {children}
    </main>
  );
}
