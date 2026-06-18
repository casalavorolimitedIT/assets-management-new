import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/forgot-password",
  "/register",
  "/terms",
];

const ADMIN_ROUTES = ["/dashboard/payout", "/dashboard/broadcast"];

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL!,
  "http://localhost:3000",
];

function isAdminRoute(pathname: string) {
  return ADMIN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function isAdminRole(role: unknown) {
  return typeof role === "string" && role.trim().toUpperCase() === "ADMIN";
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
  const isMutationRequest = ["POST", "PUT", "PATCH", "DELETE"].includes(
    request.method,
  );

  if (isApiRoute || isMutationRequest) {
    const isAllowedOrigin = ALLOWED_ORIGINS.some(
      (allowed) => origin?.startsWith(allowed) || referer?.startsWith(allowed),
    );

    const isSameOrigin = !origin || origin === request.nextUrl.origin;

    if (!isAllowedOrigin && !isSameOrigin) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // Check gateway secret for API routes
  // Internal routes that rely on session auth instead of the gateway secret
  const INTERNAL_API_ROUTES = ["/api/send-email", "/api/update-email", "/api/notify-plan"];
  const isInternalApiRoute = INTERNAL_API_ROUTES.some((r) =>
    request.nextUrl.pathname.startsWith(r),
  );

  if (isApiRoute && !isInternalApiRoute) {
    const gatewaySecret = request.headers.get("x-api-gateway-secret");
    if (gatewaySecret !== process.env.SUPABASE_API_GATEWAY_SECRET) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          "x-api-gateway-secret": process.env.SUPABASE_API_GATEWAY_SECRET!,
        },
      },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isPublicRoute = PUBLIC_ROUTES.includes(request.nextUrl.pathname);

  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (user && isAdminRoute(request.nextUrl.pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!isAdminRole(profile?.role)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
