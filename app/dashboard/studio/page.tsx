import { redirect } from "next/navigation";

/** Legacy URL — studio lives under /studio */
export default function LegacyStudioPage() {
  redirect("/studio");
}
