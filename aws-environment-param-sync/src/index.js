const core = require('@actions/core');
const { SSM } = require('aws-sdk');
const { Octokit } = require("@octokit/core");

const getParameter = async ({
     path,
  }) => {
  const ssm = new SSM();
  const parameters = {};
  let nextToken = undefined;

  do {
    const { Parameters, NextToken } = await ssm
      .getParametersByPath({
        Path: path,
        Recursive: true,
        WithDecryption: false,
        ParameterFilters: [{
            Key: 'Type',
            Option: 'Equals',
            Values: ['String'],
        }],
        NextToken: nextToken,
      })
      .promise();

    Parameters.forEach((parameter) => {
      const name = formatParameterName(parameter.Name);
      const value = parameter.Value.trim();

      core.info(`Param: ${parameter.Name} Name: ${name} Value: ${value}`);
      parameters[name] = value;
    });

    nextToken = NextToken;
  } while (Boolean(nextToken));

  return parameters;
};

const getAwsEnvironmentParams = async ({
   awsEnvironments,
   environmentVariablesPath
  }) => {
  const awsEnvironmentVariables = {};
  for (const key in awsEnvironments) {
    core.info(`Getting params for ${awsEnvironments[key]}...`);
    const variablesPath = environmentVariablesPath + '/' + awsEnvironments[key];
    awsEnvironmentVariables[awsEnvironments[key]] = await getParameter({path: variablesPath});
  }

  return awsEnvironmentVariables;
};

const getGitHubEnvironmentVariables = async ({
    awsEnvironments,
    octokit,
    repoId
  }) => {
  const githubEnvironmentVariables = {};
  for (const envKey in awsEnvironments) {
    core.info(`Getting variables for ${awsEnvironments[envKey]}...`);
    const awsEnvironment = awsEnvironments[envKey];
    githubEnvironmentVariables[awsEnvironment] = {};
    let furtherResults = true;
    const perPage = 30;
    let page = 1;
    do {
      core.info(`Page ${page}...`);
      const vars = await octokit.request(`GET /repositories/${repoId}/environments/${awsEnvironment}/variables`, {
        per_page: perPage,
        page: page,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })

      let count = 0;
      if (vars.hasOwnProperty('data') && vars['data'].hasOwnProperty('variables')) {
        for (const key in vars['data']['variables']) {
          count++;
          const variable =  vars['data']['variables'][key];
          core.info(`Found variable ${variable['name']} with value ${variable['value']}`);
          githubEnvironmentVariables[awsEnvironment][variable['name']] = variable['value']
        }
      }
      if (count < perPage) {
        core.info(`No more variables.`);
        furtherResults = false
      } else {
        page++;
      }
    } while (furtherResults)
  }

  return githubEnvironmentVariables;
};

const syncEnvironments = async ({
    octokit,
    awsEnvironments,
    owner,
    repo
  }) => {
  for (const key in awsEnvironments) {
    core.info(`Syncing ${awsEnvironments[key]}...`)
    await octokit.request(`PUT /repos/${owner}/${repo}/environments/${awsEnvironments[key]}`, {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
  }
}

const syncEnvironmentVariables = async ({
      octokit,
      repoId,
      awsEnvironmentParams,
      githubEnvironmentVariables
  }) => {
  for (const env in awsEnvironmentParams) {
    core.info(`Syncing variables for ${env}...`);

    for (const name in awsEnvironmentParams[env]) {
      const value = awsEnvironmentParams[env][name];
      if (githubEnvironmentVariables.hasOwnProperty(env) && githubEnvironmentVariables[env].hasOwnProperty(name)) {
        const githubValue = githubEnvironmentVariables[env][name]
        if (githubValue !== value) {
          core.info(`Updating Variable: ${name} from ${githubValue} to ${value}`);
          await octokit.request(`PATCH /repositories/${repoId}/environments/${env}/variables/${name}`, {
            name: name,
            value: value,
            headers: {
              'X-GitHub-Api-Version': '2022-11-28'
            }
          })
        } else {
          core.info(`Skipping Variable: ${name}`);
        }
        continue
      }
      core.info(`Creating variable with name: ${name} and value: ${value}...`);
      await octokit.request(`POST /repositories/${repoId}/environments/${env}/variables`, {
        name: name,
        value: value,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
    }
  }
}


const formatParameterName = (name) => {
  const splitName = name.split('/');
  let formattedName = splitName[splitName.length-1];
  formattedName = formattedName.toUpperCase().replaceAll('-', '_');

  return formattedName;
}

async function run() {
  try {
    const environmentPath = core.getInput('environmentPath', { required: true });
    const environmentVariablesPath = core.getInput('environmentVariablesPath', { required: true });
    const token = core.getInput('token');
    const owner = core.getInput('owner');
    const repo = core.getInput('repo');
    const repoId = core.getInput('repoId');

    const octokit = new Octokit({
      auth: token
    })

    core.info('Getting AWS environments..')
    const awsEnvironments = await getParameter({ path: environmentPath });

    // TODO add delete option for action to remove old environments (after environment migration)
    core.info('Syncing AWS environments to GitHub Environments..')
    await syncEnvironments({octokit, awsEnvironments, owner, repo});

    core.info('Getting AWS Environment Params..');
    const awsEnvironmentParams = await getAwsEnvironmentParams( {awsEnvironments, environmentVariablesPath});

    core.info('Getting GitHub Environment Variables..');
    const githubEnvironmentVariables = await getGitHubEnvironmentVariables( {awsEnvironments, octokit, repoId});

    core.info('Syncing AWS environment params with GitHub environment variables..');
    await syncEnvironmentVariables({octokit, repoId, awsEnvironmentParams, githubEnvironmentVariables})

    core.info('Finished.');
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
