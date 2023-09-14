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
        NextToken: nextToken,
      })
      .promise();

    Parameters.forEach((parameter) => {
      const name = formatParameterName(parameter.Name);
      const value = parameter.Value.trim();

      core.info('Param: ' + parameter.Name + ' Name: ' + name + ' Value: ' + value);
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
    core.info('Getting params for ' + awsEnvironments[key] + '...');
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
    core.info('Getting variables for ' + awsEnvironments[envKey] + '...');
    const awsEnvironment = awsEnvironments[envKey];
    const vars = await octokit.request('GET /repositories/' + repoId + '/environments/' + awsEnvironment + '/variables', {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    githubEnvironmentVariables[awsEnvironment] = {};
    if (vars.hasOwnProperty('data') && vars['data'].hasOwnProperty('variables')) {
      for (const key in vars['data']['variables']) {
        const variable =  vars['data']['variables'][key];
        core.info('Found variable ' + variable['name'] + ' with value ' + variable['value']);
        githubEnvironmentVariables[awsEnvironment][variable['name']] = variable['value']
      }
    }
  }

  return githubEnvironmentVariables;
};


const createGitHubEnvironments = async ({
    octokit,
    awsEnvironments,
    owner,
    repo
  }) => {
  for (const key in awsEnvironments) {
    core.info('Creating/Updating ' + awsEnvironments[key] + '...')
    octokit.request('PUT /repos/' + owner + '/' + repo + '/environments/' + awsEnvironments[key], {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
  }

  return true
}

const createGitHubEnvironmentVariables = async ({
      octokit,
      repoId,
      awsEnvironmentParams,
      githubEnvironmentVariables
  }) => {
  for (const env in awsEnvironmentParams) {
    core.info('Creating variables for ' + env + '...');
    for (const name in awsEnvironmentParams[env]) {

      core.info('Come onnnnnnnn');
      if (githubEnvironmentVariables.hasOwnProperty(env)) {
        core.info('Yayyyyyy');
        core.info('Name: ' + name);

        const str = JSON.stringify(githubEnvironmentVariables[env], null, 4); // (Optional) beautiful indented output.
        core.info(str);

        if (githubEnvironmentVariables[env].hasOwnProperty(name)) {
          core.info('YESSSSS');
        }
      }

      if (githubEnvironmentVariables.hasOwnProperty(env) && githubEnvironmentVariables[env].hasOwnProperty(name)) {
        // TODO add update if values are unmatched.
        core.info('Skipping Variable: ' + name);
        continue
      }
      const envName = name.replaceAll('-', '_');
      const value = awsEnvironmentParams[env][name];
      core.info('Creating variable with name: ' + envName + ' and value: ' + value + '...');
      await octokit.request('POST /repositories/' + repoId + '/environments/' + env + '/variables', {
        name: envName,
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
  formattedName = formattedName.toUpperCase();

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

    // core.info('Getting existing GitHub environments..');
    // const environments = await octokit.request('GET /repos/' + owner + '/' + repo + '/environments', {
    //   headers: {
    //     'X-GitHub-Api-Version': '2022-11-28'
    //   }
    // })

    // const str = JSON.stringify(environments, null, 4); // (Optional) beautiful indented output.
    // core.info('Response');
    // core.info(str);
    //
    // let githubEnvironments = [];
    // if (environments.hasOwnProperty('data') && environments['data'].hasOwnProperty('environments')) {
    //   environments['data']['environments'].forEach(env => {
    //     core.info('Github environment name: ' + env['name']);
    //     githubEnvironments.push(env['name']);
    //   });
    // }

    core.info('Getting AWS environments..')
    const awsEnvironments = await getParameter({ path: environmentPath });

    core.info('Syncing AWS environments to GitHub Environments..')
    await createGitHubEnvironments({octokit, awsEnvironments, owner, repo});

    core.info('Getting AWS Environment Params..');
    const awsEnvironmentParams = await getAwsEnvironmentParams( {awsEnvironments, environmentVariablesPath});

    core.info('Getting GitHub Environment Variables..');
    const githubEnvironmentVariables = await getGitHubEnvironmentVariables( {awsEnvironments, octokit, repoId});

    core.info('Syncing AWS environment params with GitHub environment variables..');
    await createGitHubEnvironmentVariables({octokit, repoId, awsEnvironmentParams, githubEnvironmentVariables})

    core.info('Finished.');
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
