import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const routeRoles: Array<{ prefix: string; role: string }> = [
  { prefix: "/student", role: "student" },
  { prefix: "/parent", role: "parent" },
  { prefix: "/teacher", role: "teacher" },
];

export async function middleware(request: NextRequest) {
  const required = routeRoles.find(({ prefix }) => request.nextUrl.pathname.startsWith(prefix));
  if (!required || request.nextUrl.pathname.includes("/signup")) return NextResponse.next();

  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.redirect(new URL("/", request.url));

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, {
          ...(options as CookieOptions), httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/",
        }));
      },
    },
  });
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims ?? null;
  if (!claims?.sub) return NextResponse.redirect(new URL("/", request.url));
  const { data: profile } = await supabase.from("users").select("role").eq("auth_user_id", claims.sub).maybeSingle();
  if (profile?.role !== required.role) return NextResponse.redirect(new URL("/", request.url));
  return response;
}

export const config = { matcher: ["/student/:path*", "/parent/:path*", "/teacher/:path*"] };
