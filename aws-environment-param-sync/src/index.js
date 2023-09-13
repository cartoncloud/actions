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

    const octokit = new Octokit({
      auth: token
    })

    core.info('Getting existing GitHub environments..');
    const environments = await octokit.request('GET /repos/' + owner + '/' + repo + '/environments', {
      owner: owner,
      repo: repo,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    const str = JSON.stringify(environments, null, 4); // (Optional) beautiful indented output.
    core.info('Response');
    core.info(str);

    let githubEnvironments = [];
    if (environments.hasOwnProperty('data') && environments['data'].hasOwnProperty('environments')) {
      environments['data']['environments'].forEach(env => {
        core.info('Github environment name: ' + env['name']);
        githubEnvironments.push(env['name']);
      });
    }

    core.info('EnvironmentPath: ' + environmentPath);
    core.info('environmentVariablesPath: ' + environmentVariablesPath);

    core.info('Getting AWS Environments..');
    const awsEnvironments = await getParameter({ path: environmentPath });

    Object.keys(awsEnvironments).forEach(key => {
      core.info('Checking if environment already exists...');
      if (githubEnvironments.includes(awsEnvironments[key])) {
        core.info('Environment already exists');
      } else {
        core.info('Creating environment...')

        octokit.request('PUT /repos/' + owner + '/' + repo + '/environments/' + awsEnvironments[key], {
          owner: owner,
          repo: repo,
          environment_name: awsEnvironments[key],
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        })
      }

      core.info('Getting params for ' + awsEnvironments[key] + '...');
      const variablesPath = environmentVariablesPath + '/' + awsEnvironments[key];
      const variables = getParameter({ path: variablesPath });
    });

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
