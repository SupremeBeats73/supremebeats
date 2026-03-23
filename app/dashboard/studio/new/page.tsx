import { redirect } from "next/navigation";

/** New music projects are created on the Music Studio page. */
export default function StudioNewRedirectPage() {
  redirect("/studio/music");
}
