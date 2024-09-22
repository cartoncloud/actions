import * as core from "@actions/core";
import * as github from "@actions/github";
import { v4 as uuidv4 } from 'uuid';

interface UnparsedRepo {
  repo: string;
}

interface ParsedRepo {
  owner: string
  repo: string
  workflow_id: number
}

function sleep(seconds: number) {
  return new Promise(resolve => setTimeout(resolve, seconds*1000));
}

async function run() {
  try {
    const environment = core.getInput("environment", { required: true });
    const token = core.getInput("token", { required: true });
    const workflowName = core.getInput("workflowName", { required: true });
    const waitTimeout = parseInt(core.getInput("waitTimeout", { required: false }));
    const checkInterval = parseInt(core.getInput("checkInterval", { required: false }));
    const inputRepos = core.getInput("repos", { required: true });
    
    const workflowStartISOTimestamp = new Date().toISOString();
    
    const octokit = github.getOctokit(token);

    async function parseRepos(repos:string): Promise <ParsedRepo[]> {
      core.info(`Parsing repo list:${repos} ...`);

      const unprocessedRepos = JSON.parse(repos) as UnparsedRepo[];
      const repoList = await Promise.all(unprocessedRepos.map(async (repoRecord) => {
        const splitedRepo = repoRecord.repo.split("/");
        if (splitedRepo.length != 2) {
          throw new Error("🔴 Invalid repos format for: " + repoRecord.repo);
        }
        const owner = splitedRepo[0]
        const repo = splitedRepo[1]

        const response = await octokit.rest.actions.listRepoWorkflows({owner,repo});
        const workflowMatchigTheName = response.data.workflows.filter(workflow=>workflow.name === workflowName)
        if(!workflowMatchigTheName.length){
          throw new Error(`🔴 No workflow found for repository ${owner}/${repo}`);
        }
        const workflow_id = workflowMatchigTheName[0].id;
        return { owner, repo, workflow_id }
      }));

      core.info(`✅ Successfully parsed repo list: ${JSON.stringify(repoList)}`);
      return repoList;
    }

    async function triggerRepoWorkflows(repos:ParsedRepo[]) {
      let success = true
      core.info("⏳⏳⏳ Triggering workflows list: ");
      await Promise.all(repos.map(async ({owner,repo, workflow_id})=>{
        core.info(`Triggering workflow for :${owner}/${repo} ...`);

        const response = await octokit.rest.actions.createWorkflowDispatch({owner ,repo ,workflow_id, ref:"main", inputs: {environment}});
        if (response.status !== 204) {
          core.error(`Failed to trigger workflow dispatch for :${owner}/${repo}`);
          success = false;
        }
        else {
          core.info(`Successfully trigerred workflow dispatch for :${owner}/${repo}`);
        }
      }));

      if(success) {
        core.info("✅ Successfully triggered all workflows")
      }
      else {
        throw new Error('🔴 There were failures triggering some of the workflow dispatches. Look for above workflow dispatch failures');
      }
      return success;
    };

    async function waitForWorkflowStatuses(repos:ParsedRepo[]) {
      let oneWorkflowFailed = false;
      let attemptNumber = 1;
      const maxAttempts = Math.ceil(waitTimeout/checkInterval);
      const remainingWorkflowsMap = new Map(repos.map(repo => [`${repo.owner}/${repo.repo}`, true]));

      core.info('⏳⏳⏳ Waiting for workflows to report status ...');
      while(remainingWorkflowsMap.size > 0 && oneWorkflowFailed === false && attemptNumber<=maxAttempts) {
        await sleep(checkInterval);
        await Promise.all(repos.map(async ({owner, repo, workflow_id}) => {
          // Skip checking for workflow status check if it already reported successfull
          const noSuccessReportYet = remainingWorkflowsMap.get(`${owner}/${repo}`);
          if(!noSuccessReportYet) {
            return;
          }
          const response = await octokit.rest.actions.listWorkflowRuns({owner, repo, workflow_id, per_page:10, created: `>${workflowStartISOTimestamp}`});
          const desiredRun = response.data.workflow_runs.filter((run)=>run.name?.includes(environment))[0];
          if(!desiredRun){
            core.info(`⏳ Attempt number: ${attemptNumber}, Workflow has not yet started for ${owner}/${repo} ...`);
          }
          else if (desiredRun.status != 'completed') {
            core.info(`⏳ Attempt number: ${attemptNumber}, Workflow in progress with status: "${desiredRun.status}" for ${owner}/${repo}`);
          }
          else if (desiredRun.conclusion != 'success') {
            core.info(`🔴 Attempt number: ${attemptNumber}, Workflow finished with conclusion: "${desiredRun.conclusion}" for ${owner}/${repo}`);
            oneWorkflowFailed = true;
          }
          else {
            core.info(`✅ Attempt number: ${attemptNumber}, Workflow status: "${desiredRun.status}" conclussion: "${desiredRun.conclusion}" for ${owner}/${repo}`);
            remainingWorkflowsMap.delete(`${owner}/${repo}`);
          }
        }));
        attemptNumber+=1;
      }
      if(oneWorkflowFailed){
        throw new Error('🔴🔴🔴 There were problems in some triggered workflows 🔴🔴🔴');
      } 
      else if(remainingWorkflowsMap.size > 0) {
        throw new Error('🔴🔴🔴 Some of the triggered workflow dispatches didnt finish in time or were not found 🔴🔴🔴');
      }
      core.info(`✅✅✅ All triggered jobs finished successfully ✅✅✅`);
    }
    
    const repos = await parseRepos(inputRepos);
    await triggerRepoWorkflows(repos);
    await waitForWorkflowStatuses(repos);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
