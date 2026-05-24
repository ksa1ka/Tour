import { useEffect, useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Player, Team } from '@/entities/team/model/types'
import { PlayerForm } from '@/features/player-form/ui/PlayerForm'
import { playerFormValuesFromPlayer } from '@/features/player-form/model/playerFormSchema'
import {
  useAddPlayerMutation,
  useRemovePlayerMutation,
  useUpdatePlayerMutation,
} from '@/features/team/api/usePlayerMutations'
import { useUpdateTeamMutation } from '@/features/team/api/useTeamMutations'
import { TeamRosterSection } from '@/features/team-roster/ui/TeamRosterSection'
import { getRestErrorMessage } from '@/shared/lib/restErrors'

import { TeamForm } from './TeamForm'

type TeamEditModalProps = {
  team: Team | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onError?: (message: string) => void
}

export function TeamEditModal({ team, open, onOpenChange, onError }: TeamEditModalProps) {
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const tournamentId = team?.tournamentId ?? ''
  const updateMutation = useUpdateTeamMutation()
  const addPlayerMutation = useAddPlayerMutation(tournamentId)
  const removePlayerMutation = useRemovePlayerMutation(tournamentId)
  const updatePlayerMutation = useUpdatePlayerMutation(tournamentId)

  useEffect(() => {
    if (!open) {
      setEditingPlayer(null)
      setLocalError(null)
    }
  }, [open])

  useEffect(() => {
    setEditingPlayer(null)
  }, [team?.id])

  if (!team) return null

  const reportError = (message: string) => {
    setLocalError(message)
    onError?.(message)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92vh,48rem)] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактирование команды</DialogTitle>
          <DialogDescription>
            Турнир: <span className="text-foreground">{team.tournament.title}</span> — сменить турнир нельзя.
          </DialogDescription>
        </DialogHeader>

        {localError ? <p className="text-sm text-destructive">{localError}</p> : null}

        <TeamForm
          idPrefix={`edit-${team.id}`}
          key={team.id}
          defaultValues={{
            name: team.name,
            logo: team.logo ?? '',
          }}
          submitLabel="Сохранить команду"
          isSubmitting={updateMutation.isPending}
          onSubmit={async (payload) => {
            setLocalError(null)
            try {
              await updateMutation.mutateAsync({
                tournamentId: team.tournamentId,
                teamId: team.id,
                payload,
              })
            } catch (err) {
              reportError(getRestErrorMessage(err))
            }
          }}
        />

        <div className="border-t border-border pt-2">
          <h3 className="mb-2 text-sm font-semibold tracking-tight">Состав</h3>
          <TeamRosterSection
            teamName={team.name}
            players={team.players ?? []}
            className="mt-0"
            rosterAdmin={{
              formIdPrefix: `edit-${team.id}-pl`,
              hideAddForm: editingPlayer !== null,
              editingPlayerId: editingPlayer?.id ?? null,
              addPending: addPlayerMutation.isPending,
              removePendingId: removePlayerMutation.isPending
                ? (removePlayerMutation.variables?.playerId ?? null)
                : null,
              onEdit: (player) => {
                setLocalError(null)
                setEditingPlayer(player)
              },
              onAdd: async (payload) => {
                setLocalError(null)
                try {
                  await addPlayerMutation.mutateAsync({ teamId: team.id, payload })
                } catch (err) {
                  reportError(getRestErrorMessage(err))
                }
              },
              onRemove: async (playerId) => {
                setLocalError(null)
                if (editingPlayer?.id === playerId) setEditingPlayer(null)
                try {
                  await removePlayerMutation.mutateAsync({ teamId: team.id, playerId })
                } catch (err) {
                  reportError(getRestErrorMessage(err))
                }
              },
            }}
          />

          {editingPlayer ? (
            <PlayerForm
              key={editingPlayer.id}
              idPrefix={`edit-${team.id}-pl-${editingPlayer.id}`}
              heading={`Редактировать: ${editingPlayer.nickname}`}
              defaultValues={playerFormValuesFromPlayer(editingPlayer)}
              resetAfterSubmit={false}
              isSubmitting={updatePlayerMutation.isPending}
              submitLabel="Сохранить игрока"
              onCancel={() => setEditingPlayer(null)}
              onSubmit={async (payload) => {
                setLocalError(null)
                try {
                  await updatePlayerMutation.mutateAsync({
                    teamId: team.id,
                    playerId: editingPlayer.id,
                    payload,
                  })
                  setEditingPlayer(null)
                } catch (err) {
                  reportError(getRestErrorMessage(err))
                }
              }}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
