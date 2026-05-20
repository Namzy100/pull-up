import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import {
  computePostAuthDestination,
  profileRowToPostAuthSlice,
} from "@/lib/post-auth-routing";
import { getSupabasePublicEnv, hasSupabaseEnv } from "@/lib/supabase/env";
import { fetchProfileForAuthUser } from "@/lib/supabase/repositories";
import { ensureMinimalStudentProfileIfMissing } from "@/lib/supabase/signup-bootstrap";

type PendingCookie = { name: string; value: string; options: CookieOptions };

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";
  if (!hasSupabaseEnv()) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  const { url, anonKey } = getSupabasePublicEnv();

  const pendingCookies: PendingCookie[] = [];

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          pendingCookies.push({ name, value, options });
        });
      },
    },
  });

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  let destination = next;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    let profRes = await fetchProfileForAuthUser(supabase, user.id);

    if (!profRes.ok) {
      const { destination: dest, decision } = computePostAuthDestination(next, null, {
        profileReadFailed: true,
      });
      destination = dest;
      console.info(
        "[auth-routing]",
        JSON.stringify({
          event: "profile_route_decision",
          authUserId: user.id,
          destination,
          decision,
          code: profRes.error?.code ?? null,
        })
      );
    } else {
      let row = profRes.row;
      if (!row) {
        console.info(
          "[auth-routing]",
          JSON.stringify({ event: "profile_missing_for_auth_user", authUserId: user.id })
        );
        const ensured = await ensureMinimalStudentProfileIfMissing(supabase, user);
        if (!ensured.ok) {
          const { destination: dest } = computePostAuthDestination(next, null, {
            profileReadFailed: true,
          });
          destination = dest;
          console.info(
            "[auth-routing]",
            JSON.stringify({
              event: "profile_route_decision",
              authUserId: user.id,
              destination,
              decision: "profile_ensure_failed_oauth",
              code: ensured.code ?? null,
            })
          );
        } else {
          profRes = await fetchProfileForAuthUser(supabase, user.id);
          if (!profRes.ok) {
            const { destination: dest, decision } = computePostAuthDestination(next, null, {
              profileReadFailed: true,
            });
            destination = dest;
            console.info(
              "[auth-routing]",
              JSON.stringify({
                event: "profile_route_decision",
                authUserId: user.id,
                destination,
                decision,
                code: profRes.error?.code ?? null,
              })
            );
          } else {
            row = profRes.row;
            const slice = row ? profileRowToPostAuthSlice(row) : null;
            const routed = computePostAuthDestination(next, slice);
            destination = routed.destination;
            console.info(
              "[auth-routing]",
              JSON.stringify({
                event: "profile_route_decision",
                authUserId: user.id,
                destination,
                decision: routed.decision,
                hasProfileRow: Boolean(row),
              })
            );
          }
        }
      } else {
        const slice = profileRowToPostAuthSlice(row);
        const routed = computePostAuthDestination(next, slice);
        destination = routed.destination;
        console.info(
          "[auth-routing]",
          JSON.stringify({
            event: "profile_route_decision",
            authUserId: user.id,
            destination,
            decision: routed.decision,
            hasProfileRow: true,
          })
        );
      }
    }
  }

  const response = NextResponse.redirect(new URL(destination, request.url));
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
