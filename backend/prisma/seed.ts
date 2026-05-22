import {
  TournamentFormat,
  TournamentGame,
  TournamentStatus,
  UserRole,
} from '@prisma/client'
import bcrypt from 'bcrypt'

import { prisma } from '../src/prisma/client.js'
import { generateSingleEliminationBracket } from '../src/services/bracketGenerationService.js'
import { applyMatchWinner } from '../src/services/matchPropagationService.js'
import { generateRoundRobin } from '../src/services/roundRobinGenerationService.js'
import { updateScheduleMatchResult } from '../src/services/scheduleMatchService.js'
import {
  generateSwissNextRound,
  generateSwissRound1,
} from '../src/services/swissRoundService.js'

const db = prisma

const PASSWORD = 'password123'

function playerAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`
}

function teamLogoUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(seed)}`
}

function tournamentAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(seed)}`
}

type RosterPlayer = {
  nickname: string
  role: string
  realName?: string
  country?: string
}

async function clearDatabase() {
  await db.userReward.deleteMany()
  await db.reward.deleteMany()
  await db.fantasyMatchPrediction.deleteMany()
  await db.fantasyTeamSelection.deleteMany()
  await db.fantasyTeam.deleteMany()
  await db.match.deleteMany()
  await db.player.deleteMany()
  await db.team.deleteMany()
  await db.tournament.deleteMany()
  await db.refreshToken.deleteMany()
  await db.user.deleteMany()
}

async function seedTeamWithRoster(
  tournamentId: string,
  name: string,
  logoSeed: string,
  roster: RosterPlayer[],
) {
  const team = await db.team.create({
    data: {
      name,
      logo: teamLogoUrl(logoSeed),
      tournamentId,
      players: {
        create: roster.map((p, i) => ({
          nickname: p.nickname,
          realName: p.realName ?? null,
          role: p.role,
          country: p.country ?? null,
          avatar: playerAvatarUrl(`${logoSeed}-${p.nickname}`),
          isStarter: i < 5,
        })),
      },
    },
    include: { players: { select: { id: true, nickname: true, teamId: true } } },
  })
  return team
}

/** Типичный состав из 5 стартовых + 1 запасной. */
function valorantRoster(prefix: string): RosterPlayer[] {
  return [
    { nickname: `${prefix}IGL`, role: 'IGL', country: 'RU' },
    { nickname: `${prefix}Duel`, role: 'Duelist', country: 'RU' },
    { nickname: `${prefix}Init`, role: 'Initiator', country: 'UA' },
    { nickname: `${prefix}Sent`, role: 'Sentinel', country: 'PL' },
    { nickname: `${prefix}Flex`, role: 'Flex', country: 'DE' },
    { nickname: `${prefix}Sub`, role: 'Sub', country: 'FR', realName: 'Reserve' },
  ]
}

function cs2Roster(prefix: string): RosterPlayer[] {
  return [
    { nickname: `${prefix}AWP`, role: 'AWPer', country: 'DK' },
    { nickname: `${prefix}Rif`, role: 'Rifler', country: 'SE' },
    { nickname: `${prefix}Ent`, role: 'Entry', country: 'NO' },
    { nickname: `${prefix}Sup`, role: 'Support', country: 'FI' },
    { nickname: `${prefix}IGL`, role: 'IGL', country: 'DE' },
    { nickname: `${prefix}Coa`, role: 'Coach (sub)', country: 'UK' },
  ]
}

function dotaRoster(prefix: string): RosterPlayer[] {
  return [
    { nickname: `${prefix}Carry`, role: 'Carry', country: 'CN' },
    { nickname: `${prefix}Mid`, role: 'Mid', country: 'RU' },
    { nickname: `${prefix}Off`, role: 'Offlane', country: 'UA' },
    { nickname: `${prefix}Sup4`, role: 'Soft Support', country: 'PH' },
    { nickname: `${prefix}Sup5`, role: 'Hard Support', country: 'ID' },
    { nickname: `${prefix}Stand`, role: 'Stand-in', country: 'BR' },
  ]
}

async function playMatch(
  tournamentId: string,
  matchId: string,
  winnerTeamId: string,
  scoreA: number,
  scoreB: number,
  extras?: { mvpPlayerId?: string; firstKillPlayerId?: string },
) {
  await applyMatchWinner(tournamentId, matchId, {
    winnerId: winnerTeamId,
    scoreA,
    scoreB,
    mvpPlayerId: extras?.mvpPlayerId ?? null,
    firstKillPlayerId: extras?.firstKillPlayerId ?? null,
  })
}

async function seedValorantCup(adminId: string) {
  const tournament = await db.tournament.create({
    data: {
      title: 'VCT Pacific — Демо-сетка',
      description: 'Одиночная сетка на 8 команд, четвертьфиналы сыграны, полуфинал в процессе.',
      avatarUrl: tournamentAvatarUrl('vct-pacific-demo'),
      game: TournamentGame.VALORANT,
      format: TournamentFormat.SINGLE_ELIMINATION,
      status: TournamentStatus.IN_PROGRESS,
      createdBy: adminId,
    },
  })

  const teamNames = [
    'Team Spirit',
    'NAVI',
    'Paper Rex',
    'Gen.G',
    'Fnatic',
    'LOUD',
    'DRX',
    'ZETA',
  ]
  const teams = []
  for (const name of teamNames) {
    const slug = name.replace(/\s+/g, '')
    teams.push(
      await seedTeamWithRoster(tournament.id, name, `val-${slug}`, valorantRoster(slug.slice(0, 4))),
    )
  }

  const teamIds = teams.map((t) => t.id)
  const matches = await generateSingleEliminationBracket(tournament.id, teamIds)
  const round1 = matches.filter((m) => m.round === 1)

  const pickStarter = (teamId: string) => teams.find((t) => t.id === teamId)!.players[0]!

  for (const m of round1) {
    if (!m.teamAId || !m.teamBId) continue
    const winnerId = m.position % 2 === 1 ? m.teamAId : m.teamBId
    const loserId = winnerId === m.teamAId ? m.teamBId : m.teamAId
    const scoreWinner = 2
    const scoreLoser = m.position === 2 ? 0 : 1
    const scoreA = winnerId === m.teamAId ? scoreWinner : scoreLoser
    const scoreB = winnerId === m.teamBId ? scoreWinner : scoreLoser
    await playMatch(tournament.id, m.id, winnerId, scoreA, scoreB, {
      mvpPlayerId: pickStarter(winnerId).id,
      firstKillPlayerId: pickStarter(loserId).id,
    })
  }

  const round2 = matches.filter((m) => m.round === 2)
  const semi1 = round2.find((m) => m.position === 1)
  if (semi1?.teamAId && semi1.teamBId) {
    await playMatch(tournament.id, semi1.id, semi1.teamAId, 2, 1, {
      mvpPlayerId: pickStarter(semi1.teamAId).id,
    })
  }

  return tournament.id
}

async function seedCs2Showdown(adminId: string) {
  const tournament = await db.tournament.create({
    data: {
      title: 'CS2 LAN Finals — Демо',
      description: 'Финальная четвёрка: оба полуфинала завершены, финал ждёт старт.',
      avatarUrl: tournamentAvatarUrl('cs2-lan-finals'),
      game: TournamentGame.CS2,
      format: TournamentFormat.SINGLE_ELIMINATION,
      status: TournamentStatus.IN_PROGRESS,
      createdBy: adminId,
    },
  })

  const specs = [
    { name: 'FaZe Clan', seed: 'faze' },
    { name: 'MOUZ', seed: 'mouz' },
    { name: 'Vitality', seed: 'vita' },
    { name: 'NAVI', seed: 'navi-cs' },
  ]
  const teams = []
  for (const s of specs) {
    teams.push(await seedTeamWithRoster(tournament.id, s.name, s.seed, cs2Roster(s.seed)))
  }

  const matches = await generateSingleEliminationBracket(
    tournament.id,
    teams.map((t) => t.id),
  )
  const round1 = matches.filter((m) => m.round === 1)

  for (const m of round1) {
    if (!m.teamAId || !m.teamBId) continue
    const winnerId = m.position === 1 ? m.teamAId : m.teamBId
    const scoreA = winnerId === m.teamAId ? 2 : 0
    const scoreB = winnerId === m.teamBId ? 2 : 1
    const mvp = teams.find((t) => t.id === winnerId)!.players[0]!
    await playMatch(tournament.id, m.id, winnerId, scoreA, scoreB, { mvpPlayerId: mvp.id })
  }

  return tournament.id
}

async function seedDotaMinor(adminId: string) {
  const tournament = await db.tournament.create({
    data: {
      title: 'Dota 2 Minor — Групповая сетка',
      description: 'Восемь команд, сетка сгенерирована, сыграны первые два матча 1/4.',
      avatarUrl: tournamentAvatarUrl('dota-minor-bracket'),
      game: TournamentGame.DOTA2,
      format: TournamentFormat.SINGLE_ELIMINATION,
      status: TournamentStatus.IN_PROGRESS,
      createdBy: adminId,
    },
  })

  const teamNames = ['OG', 'Team Liquid', 'Tundra', 'Spirit', 'Gaimin', 'BetBoom', 'LGD', 'Falcons']
  const teams = []
  for (const name of teamNames) {
    const slug = name.replace(/\s+/g, '')
    teams.push(await seedTeamWithRoster(tournament.id, name, `dota-${slug}`, dotaRoster(slug.slice(0, 4))))
  }

  const matches = await generateSingleEliminationBracket(
    tournament.id,
    teams.map((t) => t.id),
  )
  const round1 = matches.filter((m) => m.round === 1).slice(0, 2)

  for (const m of round1) {
    if (!m.teamAId || !m.teamBId) continue
    await playMatch(tournament.id, m.id, m.teamAId, 2, 1)
  }

  return tournament.id
}

async function seedRoundRobinDemo(adminId: string) {
  const tournament = await db.tournament.create({
    data: {
      title: 'Лига 6 команд — Круговая',
      description: 'Демо круговой системы: 15 матчей, часть результатов уже внесена.',
      avatarUrl: tournamentAvatarUrl('rr-league-6'),
      game: TournamentGame.VALORANT,
      format: TournamentFormat.ROUND_ROBIN,
      status: TournamentStatus.IN_PROGRESS,
      createdBy: adminId,
    },
  })

  const names = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot']
  const teams = []
  for (const name of names) {
    teams.push(
      await seedTeamWithRoster(tournament.id, name, `rr-${name}`, valorantRoster(name.slice(0, 3))),
    )
  }

  const matches = await generateRoundRobin(
    tournament.id,
    teams.map((t) => t.id),
  )

  const played = matches.filter((m) => m.round === 1).slice(0, 3)
  for (const m of played) {
    if (!m.teamAId || !m.teamBId) continue
    await updateScheduleMatchResult(tournament.id, m.id, {
      mode: 'set',
      scoreA: 2,
      scoreB: 1,
    })
  }

  return tournament.id
}

async function seedSwissDemo(adminId: string) {
  const tournament = await db.tournament.create({
    data: {
      title: 'Швейцарка 8 команд — Демо',
      description: 'Первый тур сыгран, второй тур сформирован.',
      avatarUrl: tournamentAvatarUrl('swiss-8-demo'),
      game: TournamentGame.CS2,
      format: TournamentFormat.SWISS,
      status: TournamentStatus.IN_PROGRESS,
      formatConfig: { swissRounds: 5 },
      createdBy: adminId,
    },
  })

  const specs = [
    { name: 'Astralis', seed: 'ast' },
    { name: 'ENCE', seed: 'ence' },
    { name: 'Heroic', seed: 'hero' },
    { name: 'BIG', seed: 'big' },
    { name: 'G2', seed: 'g2' },
    { name: 'Liquid', seed: 'liq' },
    { name: 'Cloud9', seed: 'c9' },
    { name: 'Complexity', seed: 'col' },
  ]
  const teams = []
  for (const s of specs) {
    teams.push(await seedTeamWithRoster(tournament.id, s.name, s.seed, cs2Roster(s.seed)))
  }

  let matches = await generateSwissRound1(
    tournament.id,
    teams.map((t) => t.id),
  )

  for (const m of matches) {
    if (!m.teamAId || !m.teamBId) continue
    const winA = m.position % 2 === 1
    await updateScheduleMatchResult(tournament.id, m.id, {
      mode: 'set',
      scoreA: winA ? 2 : 0,
      scoreB: winA ? 0 : 2,
    })
  }

  matches = await generateSwissNextRound(tournament.id)
  return tournament.id
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10)

  await clearDatabase()

  const admin = await db.user.create({
    data: {
      email: 'admin@example.com',
      password: passwordHash,
      role: UserRole.ADMIN,
      displayName: 'Head TO',
      bio: 'Оператор платформы.',
      avatarUrl: playerAvatarUrl('admin'),
      fantasyPointsBalance: 12_000,
    },
  })

  await db.user.create({
    data: {
      email: 'viewer@example.com',
      password: passwordHash,
      role: UserRole.VIEWER,
      displayName: 'Зритель',
      bio: 'Аккаунт зрителя для тестов.',
      avatarUrl: playerAvatarUrl('viewer'),
      fantasyPointsBalance: 4800,
    },
  })

  await db.reward.createMany({
    data: [
      {
        title: 'Скин «Нео-Нуар» на винтовку',
        description:
          'Виртуальный скин на штурмовую винтовку: матовый чёрный корпус, неоновые полосы и анимация inspect в карточке состава.',
        price: 22_000,
        image: 'https://api.dicebear.com/7.x/shapes/svg?seed=skin-rifle-neon',
        sortOrder: 10,
      },
      {
        title: 'Скин «Ледяной клинок» (нож)',
        description:
          'Редкий виртуальный нож: ледяная текстура клинка, след частиц при смене стороны и звук экипировки для превью.',
        price: 32_000,
        image: 'https://api.dicebear.com/7.x/shapes/svg?seed=skin-knife-frost',
        sortOrder: 20,
      },
      {
        title: 'Скин оператора «Carbon Ops»',
        description:
          'Набор текстур на оператора: тактический костюм, маска с термальным визором и перчатки — для витрины fantasy-ростера.',
        price: 18_500,
        image: 'https://api.dicebear.com/7.x/shapes/svg?seed=skin-operator-carbon',
        sortOrder: 30,
      },
      {
        title: 'Девайс: гарнитура Pulse Wireless',
        description:
          'Виртуальный дроп периферии: беспроводные наушники с шумоподавлением микрофона — отображается в профиле как экипировка.',
        price: 16_500,
        image: 'https://api.dicebear.com/7.x/shapes/svg?seed=device-headset-pulse',
        sortOrder: 40,
      },
      {
        title: 'Девайс: мышь Flick Pro 8K',
        description:
          'Игровая мышь с опросом 8 кГц и сменными ножками: виртуальный предмет для коллекции и баннер «loadout».',
        price: 14_500,
        image: 'https://api.dicebear.com/7.x/shapes/svg?seed=device-mouse-flick',
        sortOrder: 50,
      },
      {
        title: 'Девайс: клавиатура RapidFire TKL',
        description:
          'Компактная TKL с оптическими свичами и RGB-подсветкой по зонам — виртуальный девайс для витрины арены.',
        price: 26_500,
        image: 'https://api.dicebear.com/7.x/shapes/svg?seed=device-keyboard-tkl',
        sortOrder: 60,
      },
    ],
  })

  await seedValorantCup(admin.id)
  await seedCs2Showdown(admin.id)
  await seedDotaMinor(admin.id)
  await seedRoundRobinDemo(admin.id)
  await seedSwissDemo(admin.id)

  const played = await db.match.count({ where: { winnerId: { not: null } } })

  console.log('Seed OK. Login:', { admin: 'admin@example.com', viewer: 'viewer@example.com', password: PASSWORD })
  console.log(
    'Tournaments:',
    await db.tournament.count(),
    'Teams:',
    await db.team.count(),
    'Players:',
    await db.player.count(),
    'Matches played:',
    played,
  )
}

main()
  .then(async () => {
    await db.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })
