import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { StandingRowDto } from '@/shared/api/services/scheduleService'

type StandingsTableProps = {
  rows: StandingRowDto[]
  loading?: boolean
}

export function StandingsTable({ rows, loading }: StandingsTableProps) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">Загрузка таблицы…</p>
  }
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
        Таблица появится после первых результатов матчей.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/90 bg-card/60 shadow-inner-glow">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>Команда</TableHead>
            <TableHead className="text-center">И</TableHead>
            <TableHead className="text-center">В</TableHead>
            <TableHead className="text-center">Н</TableHead>
            <TableHead className="text-center">П</TableHead>
            <TableHead className="text-center font-semibold">О</TableHead>
            <TableHead className="text-center">З</TableHead>
            <TableHead className="text-center">П</TableHead>
            <TableHead className="text-center">±</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.teamId}>
              <TableCell className="font-mono text-muted-foreground">{r.rank}</TableCell>
              <TableCell className="font-medium">{r.teamName}</TableCell>
              <TableCell className="text-center tabular-nums">{r.played}</TableCell>
              <TableCell className="text-center tabular-nums">{r.wins}</TableCell>
              <TableCell className="text-center tabular-nums">{r.draws}</TableCell>
              <TableCell className="text-center tabular-nums">{r.losses}</TableCell>
              <TableCell className="text-center font-semibold tabular-nums">{r.points}</TableCell>
              <TableCell className="text-center tabular-nums">{r.goalsFor}</TableCell>
              <TableCell className="text-center tabular-nums">{r.goalsAgainst}</TableCell>
              <TableCell className="text-center tabular-nums">
                {r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
