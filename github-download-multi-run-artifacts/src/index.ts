
import fs from 'fs'
import {resolve} from 'path'
import * as os from 'os'
import * as core from "@actions/core";
import * as github from "@actions/github";
import AdmZip from 'adm-zip'

async function run() {
  try {
    const inputRepo = core.getInput('repo', { required: false });
    const inputOwner = core.getInput('owner', { required: false});
    const workflowName = core.getInput('workflowName', { required: true });
    const workflowLimit = parseInt(core.getInput('workflowLimit', {required: false}))
    const token = core.getInput('token', { required: true });
    const path = core.getInput('path', {required:true})

    let resolvedPath: string
    if (path.startsWith(`~`)) {
      resolvedPath = resolve(path.replace('~', os.homedir()))
    } else {
      resolvedPath = resolve(path)
    }
    const owner = inputOwner || github.context.repo.owner;
    const repo = inputRepo || github.context.repo.repo

    const octokit = github.getOctokit(token);
    const workflows = await octokit.request('GET /repos/{owner}/{repo}/actions/workflows', {
      owner,
      repo,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
    const workflowMatchigTheName = workflows.data.workflows.filter(workflow=>workflow.name===workflowName)
    if(!workflowMatchigTheName.length){
      throw new Error('No workflow found for repository');
    }
    const workflowId = workflowMatchigTheName[0].id;

    const response = await octokit.request('GET /repos/{owner}/{repo}/actions/runs', {
        owner,
        repo,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
    const filteredRunIdsList = response.data.workflow_runs
    .filter(workflow=>workflow.workflow_id===workflowId)
    .sort((a,b)=>{return b.run_number - a.run_number})
    .slice(0,workflowLimit)
    .map(workflow=>workflow.id);
    
    if(!filteredRunIdsList.length){
      throw new Error('Workflow runs query returned an empty list');
    }

    const workflowRunArtifactMatrix = await Promise.all(filteredRunIdsList.map(run_id => octokit.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts?', {
        owner,
        repo,
        run_id,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
    })))

    const artifacts = workflowRunArtifactMatrix.map(el=>el.data.artifacts).flat(1)

    if(!artifacts.length){
      throw new Error('No artifacts to download');
    }

    fs.mkdirSync(resolvedPath)

    artifacts.map(async artifact => {
      const artifactResponse = await octokit.rest.actions.downloadArtifact({
        artifact_id: artifact.id,
        repo,
        owner,
        archive_format: "zip"});

      const dir = resolve(resolvedPath,artifact.name);
      fs.promises.mkdir(dir, { recursive:true });
      const adm = new AdmZip(Buffer.from(artifactResponse.data as any))
      adm.extractAllTo(dir, true)
    })
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();