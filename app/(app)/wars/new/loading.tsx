import { PageShell } from "@/components/page-shell"
import { FormCardSkeleton } from "@/components/skeletons"

export default function NewWarLoading() {
  return (
    <PageShell
      crumbs={[{ label: "Wars", href: "/wars" }, { label: "New war" }]}
      title="New war"
      description="Set up the war, pick who's fighting, then log attacks as they happen."
    >
      <FormCardSkeleton fields={4} />
    </PageShell>
  )
}
