const github = require('@actions/github');
const core = require('@actions/core');
const { SSM } = require('aws-sdk');

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
      core.info('Param: ' + parameter.Name);
      const name = formatParameterName(parameter.Name);
      const value = parameter.Value.trim();

      core.info('Name: ' + name + ' Value: ' + value);
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

    core.info('EnvironmentPath: ' + environmentPath);
    core.info('environmentVariablesPath: ' + environmentVariablesPath);

    core.info('Getting Environments..');
    const parameters = await getParameter({ path: environmentPath });

    Object.keys(parameters).forEach(key => {
      core.info('Getting params for ' + parameters[key] + '...');
      const variablesPath = environmentVariablesPath + '/' + parameters[key];
      const variables = getParameter({ path: variablesPath });
    });

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
