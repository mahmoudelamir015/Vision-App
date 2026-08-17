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
  const { data: authUser } = await supabase.auth.getUser();
  const user = authUser.user;

  const applyRedirect = (urlPath: string) => {
    const redirectUrl = new URL(urlPath, request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    const setCookieHeaders = response.headers.getSetCookie();
    setCookieHeaders.forEach((c) => redirectResponse.headers.append("Set-Cookie", c));
    return redirectResponse;
  };

  if (!user) return applyRedirect("/");
  const { data: profile } = await supabase.from("users").select("role, permissions").eq("auth_user_id", user.id).maybeSingle();

  if (!profile) return applyRedirect("/");

  // Allow staff or master_admin with manage_teachers / gate permission to access teacher routes
  const permissions: string[] = Array.isArray(profile.permissions) ? profile.permissions : [];
  const isMasterAdmin = profile.role === "master_admin" || (process.env.MASTER_ADMIN_EMAIL && user.email === process.env.MASTER_ADMIN_EMAIL);
  const isStaffTeacherManager = profile.role === "staff" && (permissions.includes("manage_teachers") || permissions.includes("gate"));

  if (profile.role !== required.role && !isMasterAdmin && !(required.role === "teacher" && isStaffTeacherManager)) {
    return applyRedirect("/");
  }

  return response;
}

export const config = { matcher: ["/student/:path*", "/parent/:path*", "/teacher/:path*"] };
