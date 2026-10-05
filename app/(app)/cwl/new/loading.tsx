import { PageShell } from "@/components/page-shell"
import { FormCardSkeleton } from "@/components/skeletons"

export default function NewSeasonLoading() {
  return (
    <PageShell
      crumbs={[{ label: "CWL", href: "/cwl" }, { label: "New season" }]}
      title="New CWL season"
      description="Register your roster once. You'll pick each day's lineup from it."
    >
      <FormCardSkeleton fields={3} />
    </PageShell>
  )
}
