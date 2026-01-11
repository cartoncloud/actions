import * as core from "@actions/core";
import * as github from "@actions/github";

interface UnparsedRepo {
  repo: string;
}

interface ParsedRepo {
  owner: string
  repo: string
  workflow_id: number
}

interface RepoBaseline {
  owner: string
  repo: string
  workflow_id: number
  latestRunId: number | null
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
    const continueOnTimeout = core.getBooleanInput("continueOnTimeout", { required: false });
    const inputRepos = core.getInput("repos", { required: true });
    const debug = core.getBooleanInput("debug", { required: false });
    
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

    async function getBaselineRunIds(repos:ParsedRepo[]): Promise<RepoBaseline[]> {
      core.info('📊 Getting baseline workflow run IDs before triggering...');
      const baselines = await Promise.all(repos.map(async ({owner, repo, workflow_id}) => {
        try {
          const response = await octokit.rest.actions.listWorkflowRuns({
            owner,
            repo,
            workflow_id,
            per_page: 1
          });
          const latestRunId = response.data.workflow_runs.length > 0 
            ? response.data.workflow_runs[0].id 
            : null;
          core.info(`Baseline for ${owner}/${repo}: latest run ID = ${latestRunId || 'none'}`);
          return { owner, repo, workflow_id, latestRunId };
        } catch (error: any) {
          // If baseline retrieval fails, we can't determine if latestRunId would be null (no previous runs)
          // or a number (there were previous runs). Without knowing this, we can't reliably identify which run we triggered.
          // Fail fast rather than risk false positive detection.
          throw new Error(`🔴 Failed to get baseline for ${owner}/${repo}: ${error.message}. Cannot proceed without baseline to reliably detect triggered workflow.`);
        }
      }));
      return baselines;
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

    async function waitForWorkflowStatuses(baselines:RepoBaseline[]) {
      let oneWorkflowFailed = false;
      let attemptNumber = 1;
      // Add 1 to account for the immediate first check (no sleep before it)
      // This ensures we monitor for the full waitTimeout duration
      const maxAttempts = Math.ceil(waitTimeout/checkInterval) + 1;
      const remainingWorkflowsMap = new Map(baselines.map(baseline => [`${baseline.owner}/${baseline.repo}`, true]));

      core.info('⏳⏳⏳ Waiting for workflows to report status ...');
      while(remainingWorkflowsMap.size > 0 && oneWorkflowFailed === false && attemptNumber<=maxAttempts) {
        if (attemptNumber > 1) {
          await sleep(checkInterval);
        }
        
        await Promise.all(baselines.map(async ({owner, repo, workflow_id, latestRunId}) => {
          const noSuccessReportYet = remainingWorkflowsMap.get(`${owner}/${repo}`);
          if(!noSuccessReportYet) {
            return;
          }
          
          const response = await octokit.rest.actions.listWorkflowRuns({
            owner, 
            repo, 
            workflow_id, 
            per_page: 10
          });
          
          if (debug) {
            core.info(`DEBUG: Found ${response.data.workflow_runs.length} runs, baseline is ${latestRunId}`);
            response.data.workflow_runs.forEach((run) => {
              core.info(`DEBUG: Run ID ${run.id}, name: "${run.name}", created: ${run.created_at}, status: ${run.status}`);
            });
          }
          
          // Filter to runs that are newer than baseline
          // Since we filtered by workflow_id and have a baseline, any run with higher ID could be the one we triggered
          const newerRuns = response.data.workflow_runs.filter((run) => {
            return latestRunId === null || run.id > latestRunId;
          });
          
          if (debug) {
            core.info(`DEBUG: ${newerRuns.length} runs are newer than baseline ${latestRunId}`);
          }
          
          if (newerRuns.length === 0) {
            core.info(`⏳ Attempt number: ${attemptNumber}, Workflow has not yet started for ${owner}/${repo} ...`);
            return;
          }
          
          newerRuns.sort((a, b) => {
            const timeA = new Date(a.created_at).getTime();
            const timeB = new Date(b.created_at).getTime();
            return timeB - timeA;
          });
          
          // Prefer runs matching environment name, but use newest if none match
          // (The run name may not include the environment, so we can't require it)
          const runMatchingEnvironment = newerRuns.find((run) => {
            const matches = run.name?.includes(environment) || false;
            if (debug) {
              core.info(`DEBUG: Run ID ${run.id}, name: "${run.name}", matches environment "${environment}": ${matches}`);
            }
            return matches;
          });
          
          const desiredRun = runMatchingEnvironment || newerRuns[0];
          
          if (debug) {
            if (runMatchingEnvironment) {
              core.info(`DEBUG: Using run ${desiredRun.id} that matches environment "${environment}"`);
            } else {
              core.info(`DEBUG: No run name matches environment "${environment}", using newest run ${desiredRun.id} (name: "${desiredRun.name}")`);
            }
          }
          
          if (desiredRun.status != 'completed') {
            core.info(`⏳ Attempt number: ${attemptNumber}, Workflow in progress with status: "${desiredRun.status}" for ${owner}/${repo}`);
          }
          else if (desiredRun.conclusion != 'success') {
            core.info(`🔴 Attempt number: ${attemptNumber}, Workflow finished with conclusion: "${desiredRun.conclusion}" for ${owner}/${repo}`);
            oneWorkflowFailed = true;
          }
          else {
            core.info(`✅ Attempt number: ${attemptNumber}, Workflow status: "${desiredRun.status}" conclusion: "${desiredRun.conclusion}" for ${owner}/${repo}`);
            remainingWorkflowsMap.delete(`${owner}/${repo}`);
          }
        }));
        
        attemptNumber += 1;
      }
      if(oneWorkflowFailed){
        throw new Error('🔴🔴🔴 There were problems in some triggered workflows 🔴🔴🔴');
      } 
      else if(remainingWorkflowsMap.size > 0) {
        if (continueOnTimeout) {
          const remaining = Array.from(remainingWorkflowsMap.keys()).join(', ');
          core.info(`Timeout reached. Continuing as continueOnTimeout is true. Workflows still running: ${remaining}`);
        } else {
          throw new Error('🔴🔴🔴 Some of the triggered workflow dispatches didnt finish in time or were not found 🔴🔴🔴');
        }
      }
      else {
        core.info(`✅✅✅ All triggered jobs finished successfully ✅✅✅`);
      }
    }
    
    const repos = await parseRepos(inputRepos);
    const baselines = await getBaselineRunIds(repos);
    await triggerRepoWorkflows(repos);
    await waitForWorkflowStatuses(baselines);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
