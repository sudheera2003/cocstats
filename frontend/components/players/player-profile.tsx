import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { PlayerProfileDTO } from "@/lib/types"

function Fact({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-[0.7rem] text-muted-foreground">{label}</dt>
      <dd className="font-heading text-lg font-semibold tabular-nums">
        {children}
      </dd>
    </div>
  )
}

const number = new Intl.NumberFormat("en-US")

/** The player's own profile from the game: career numbers, not just the wars shown here. */
export function PlayerProfile({ profile }: { profile: PlayerProfileDTO }) {
  return (
    <Card size="sm">
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
          <Fact label="War stars, all-time">
            {number.format(profile.warStars)}
          </Fact>
          <Fact label="Trophies">
            {number.format(profile.trophies)}
            <span className="text-xs font-normal text-muted-foreground">
              {" "}
              best {number.format(profile.bestTrophies)}
            </span>
          </Fact>
          <Fact label="Attack wins">{number.format(profile.attackWins)}</Fact>
          <Fact label="Donated">
            {number.format(profile.donations)}
            <span className="text-xs font-normal text-muted-foreground">
              {" "}
              / {number.format(profile.donationsReceived)} received
            </span>
          </Fact>
          <Fact label="Level">{profile.expLevel}</Fact>
          <Fact label="War preference">
            {profile.warPreference === "in"
              ? "In"
              : profile.warPreference === "out"
                ? "Out"
                : "—"}
          </Fact>
        </dl>
        {profile.heroes.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {profile.heroes.map((hero) => (
              <li key={hero.name}>
                <Badge variant="secondary" className="tabular-nums">
                  {hero.name} {hero.level}
                  <span className="text-muted-foreground">
                    /{hero.maxLevel}
                  </span>
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
