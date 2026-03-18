import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // 1. Refresh Supabase auth session
  const response = await updateSession(request);

  // 2. Detect device type and set header for layout switching
  const userAgent = request.headers.get("user-agent") || "";
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent,
    );
  response.headers.set("x-device-type", isMobile ? "mobile" : "desktop");

  // 3. Detect locale preference from cookie or Accept-Language
  const localeCookie = request.cookies.get("i18nextLng")?.value;
  const acceptLang = request.headers.get("accept-language") || "";
  const preferredLocale =
    localeCookie || (acceptLang.includes("ar") ? "ar" : "en");
  response.headers.set("x-locale", preferredLocale);
  response.headers.set("x-direction", preferredLocale === "ar" ? "rtl" : "ltr");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
