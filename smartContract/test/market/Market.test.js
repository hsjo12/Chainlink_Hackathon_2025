const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { setupContracts } = require("../shared/fixtures");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Market Test", () => {
  let user1, config;
  const ZERO_ADDRESS = ethers.ZeroAddress;
  beforeEach(async () => {
    ({ market } = await loadFixture(setupContracts));
  });

  context("Valid Scenarios", () => {
    it("random", async () => {
      console.log(await market.feeRecipient());
    });
  });
});
