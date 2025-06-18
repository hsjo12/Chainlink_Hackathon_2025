function deployProxy(m, contractName, idPrefix = contractName) {
  const impl = m.contract(contractName, [], { id: `${idPrefix}_Impl` });
  const proxy = m.contract("ERC1967Proxy", [impl, "0x"], {
    id: `${idPrefix}_Proxy`,
  });
  const instance = m.contractAt(contractName, proxy);

  return instance;
}

function deployContract(m, contractName, constructorArgs = []) {
  const instance = m.contract(contractName, constructorArgs);

  return instance;
}
module.exports = { deployProxy, deployContract };
