const fs = require("fs");
const path = require("path");
const createDeploymentArtifacts = async (contract, contractName) => {
  const chainId = hre.network.config.chainId;

  const abiPath = path.join(__dirname, "../../deployments/abi");

  if (!fs.existsSync(abiPath)) {
    fs.mkdirSync(abiPath, { recursive: true });
  }

  const artifacts = await hre.artifacts.readArtifact(contractName);

  artifacts.networkId = chainId;
  artifacts.address = contract.target;

  fs.writeFileSync(
    abiPath + `/${contractName}.json`,
    JSON.stringify(artifacts, null, 2)
  );

  console.log(
    `✅ Contract successfully deployed (${contractName} : ${contract.target})`
  );
};

module.exports = {
  createDeploymentArtifacts,
};
