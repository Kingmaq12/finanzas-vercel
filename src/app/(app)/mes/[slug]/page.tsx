import { MonthExtraSpend } from "@/components/month-extra-spend";
import { slugToMonthIndex } from "@/lib/months";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export default async function MesPage({ params }: Props) {
  const { slug } = await params;
  const monthIndex = slugToMonthIndex(slug);
  if (monthIndex === null) {
    notFound();
  }
  return <MonthExtraSpend monthIndex={monthIndex} />;
}
