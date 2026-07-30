import AppShell from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/civilmind";
import SearchExperience from "@/components/search/search-experience";

export default function SearchPage() {
  return <AppShell><div className="space-y-6"><PageHeader eyebrow="جستجوی هوشمند" title="جستجو در مرکز دانش" description="عنوان مباحث مقررات ملی را جستجو کنید و مستقیم وارد نمای مطالعه شوید." /><SearchExperience /></div></AppShell>;
}
