import * as core from '@actions/core'
import * as github from '@actions/github'
import * as yaml from 'js-yaml'

async function run() {
  try {
    console.log('Starting the action');
    const token = process.env.BOT_TOKEN
    if (!token) {
      throw new Error('GitHub token not found')
    }
    console.log('GitHub token found:', token);

    const client = github.getOctokit(token)
    const { owner, repo, number } = github.context.issue

    console.log('Repository:', owner + '/' + repo);
    console.log('Issue number:', number);
    // Fetch issue comments
    const comments = await client.rest.issues.listComments({
      owner,
      repo,
      issue_number: number
    })
    console.log('Fetched comments:', comments.data.length);

    const botCommands = process.env.BOT_COMMAND?.split(',')

    for (const comment of comments.data) {
      if (comment.body) {
        const command = extractCommand(comment.body, botCommands)
        if (command) {
          // Execute logic based on command
          console.log('Executing command:', command)
          // Call the corresponding function for the command
          await executeCommand(command, client, owner, repo, number)
        }
      }
    }
  } catch (error: any) {
    core.setFailed(error.message)
  }
}

function extractCommand(commentBody: string, botCommands: string[] | undefined): string | null {
  if (!botCommands) return null
  for (const cmd of botCommands) {
    if (commentBody.includes(cmd)) {
      return cmd
    }
  }
  return null
}

async function executeCommand(command: string, client: ReturnType<typeof github.getOctokit>, owner: string, repo: string, number: number) {
  // Add logic to execute different commands
  switch (command) {
    case '/assign':
      // Logic to assign issue
      await assignIssue(client, owner, repo, number)
      break;
    case '/unassign':
      // Logic to unassign issue
      break;
    // Add more cases for other commands
    default:
      console.log('Invalid command:', command)
      break;
  }
}

async function assignIssue(client: ReturnType<typeof github.getOctokit>, owner: string, repo: string, issueNumber: number) {
  const assignee = github.context.actor // Assign issue to the person who commented
  try {
    await client.rest.issues.addAssignees({
      owner,
      repo,
      issue_number: issueNumber,
      assignees: [assignee]
    })
    console.log(`Issue #${issueNumber} assigned to ${assignee}`)
  } catch (error) {
    console.error(`Error assigning issue #${issueNumber} to ${assignee}: ${error}`)
  }
}

run()
