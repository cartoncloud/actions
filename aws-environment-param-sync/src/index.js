const github = require('@actions/github');
const core = require('@actions/core');
const { SSM } = require('aws-sdk');

const getParameter = async ({
     path,
  }) => {
  const ssm = new SSM();
  const parameters = {};
  let nextToken = undefined;
  core.info('Getting Params...');

  do {
    const { Parameters, NextToken } = await ssm
      .getParametersByPath({
        Path: path,
        Recursive: true,
        WithDecryption: false,
        NextToken: nextToken,
      })
      .promise();

    core.info('Param: ' + Parameters);

    Parameters.forEach((parameter) => {
      core.info('Param: ' + parameter.Name);
      const name = formatParameterName(parameter.Name);
      const value = parameter.Value.trim();

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
    const parameters = getParameter({ path: environmentPath });

    Object.keys(parameters).forEach(key => {
      core.info('Key: ' + key + ' Value: ' + parameters[key]);
    });

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
