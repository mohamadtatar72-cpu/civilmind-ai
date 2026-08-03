import { redirect } from "next/navigation";

export default function OfficialSourcesPage() {
  redirect("/resources?type=official");
}
