/* eslint-disable no-console */
import { graphql } from '@octokit/graphql'
import { subWeeks, formatISO } from 'date-fns'

const { GITHUB_TOKEN } = process.env

type Response = {
  viewer: {
    contributionsCollection: {
      contributionCalendar: {
        totalContributions: number
        weeks: {
          contributionDays: {
            contributionCount: number
            date: string
          }[]
        }[]
      }
    }
  }
}

const query = `
query weeklyContribution($from: DateTime, $to: DateTime) {
  viewer {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }
    }
  }
}
`

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function fetchContribution() {
  const graphqlWithAuth = graphql.defaults({
    headers: { authorization: `token ${GITHUB_TOKEN}` },
  })
  const to = new Date()
  const from = subWeeks(to, 1)
  const {
    viewer: {
      contributionsCollection: {
        contributionCalendar: { totalContributions, weeks },
      },
    },
  } = (await graphqlWithAuth(query, {
    from: formatISO(from),
    to: formatISO(to),
  })) as Response
  const todayContribution = weeks.slice(-1)[0].contributionDays.slice(-1)[0]
  return {
    totalContributions,
    weeks,
    todayContribution,
  } as const
}

async function main(): Promise<void> {
  const { todayContribution, totalContributions } = await fetchContribution()
  console.log(
    `${todayContribution.date}のコントリビューション数: ${todayContribution.contributionCount}`
  )
  console.log(`直近1週間の総コントリビューション数: ${totalContributions}`)
}

main()
