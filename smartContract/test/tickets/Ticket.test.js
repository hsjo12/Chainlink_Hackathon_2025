const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { setupContracts } = require("../shared/fixtures");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  getSampleEventStructSet,
  getSampleSeat,
  getExpectedTokenURI,
} = require("../shared/utilities");
const { VIP, STANDARD } = require("../shared/constants");

describe("Ticket Test", () => {
  let deployer, user1, ticketFactory, organizerRegistry;
  let ticket, ticketLaunchpad;
  const {
    ethUsdPriceFeed,
    eventDetails,
    tierIds,
    imageURIByTier,
    tierInfoList,
    paymentTokens,
    priceFeeds,
  } = getSampleEventStructSet();
  const sampleSeatData = getSampleSeat();
  beforeEach(async () => {
    ({ deployer, user1, ticketFactory, organizerRegistry } = await loadFixture(
      setupContracts
    ));
    await organizerRegistry.setOrganizer(deployer, true);
    await ticketFactory.createTicketPair(
      ethUsdPriceFeed,
      eventDetails,
      tierIds,
      imageURIByTier,
      tierInfoList,
      paymentTokens,
      priceFeeds
    );

    ticket = await ethers.getContractAt(
      "Ticket",
      (
        await ticketFactory.getTicketListByUser(deployer.address)
      )[0]
    );

    ticketLaunchpad = await ethers.getContractAt(
      "TicketLaunchpad",
      await ticketFactory.getLaunchpadByTicket(ticket.target)
    );
    //mint
    await ticketLaunchpad.adminMint(user1.address, [sampleSeatData]);
  });

  context("Valid Scenarios", () => {
    it("Should return correct metadata (name, symbol, description, times, imageURIs, tokenURI)", async () => {
      const [
        name,
        symbol,
        imageURI,
        description,
        location,
        startTime,
        endTime,
      ] = eventDetails;
      const [section, seatNumber, tier] = sampleSeatData;
      expect(await ticket.name()).to.eq(name);
      expect(await ticket.symbol()).to.eq(symbol);
      expect(await ticket.description()).to.eq(description);
      expect(await ticket.location()).to.eq(location);
      expect(await ticket.startTime()).to.eq(startTime);
      expect(await ticket.endTime()).to.eq(endTime);

      const eventDetail = {
        name,
        symbol,
        imageURI,
        description,
        location,
        startTime,
        endTime,
      };
      const seat = {
        section,
        seatNumber,
        tier,
      };
      const tokenId = 0;
      const tierImageURI = await ticket.imageURIByTier(tier);

      const actualURI = await ticket.tokenURI(tokenId);
      const actualJson = JSON.parse(actualURI);
      const expectedJson = JSON.parse(
        getExpectedTokenURI(eventDetail, tierImageURI, seat, tokenId)
      );
      expect(actualJson).to.deep.eq(expectedJson);
    });

    it("Owner can successfully update eventDetails and imageURIsByTier", async () => {
      const NEW_NAME = "NEW_NAME";
      const NEW_SYMBOL = "NEW_SYMBOL";
      const NEW_IMAGE_URI = "NEW_IMAGE_URI";
      const NEW_DESC = "NEW_DESC";
      const NEW_LOCATION = "NEW_LOCATION";
      const NEW_START_TIME = Math.floor(new Date().getTime() / 1000);
      const NEW_END_TIME = Math.floor(new Date().getTime() / 1000) * 3600;

      await ticket.setEventDetails([
        NEW_NAME,
        NEW_SYMBOL,
        NEW_IMAGE_URI,
        NEW_DESC,
        NEW_LOCATION,
        NEW_START_TIME,
        NEW_END_TIME,
      ]);

      expect(await ticket.name()).to.eq(NEW_NAME);
      expect(await ticket.symbol()).to.eq(NEW_SYMBOL);
      expect(await ticket.description()).to.eq(NEW_DESC);
      expect(await ticket.location()).to.eq(NEW_LOCATION);
      expect(await ticket.startTime()).to.eq(NEW_START_TIME);
      expect(await ticket.endTime()).to.eq(NEW_END_TIME);

      const NEW_VIP_IMAGE_URI = "NEW_VIP_IMAGE_URI";
      const NEW_STANDARD_IMAGE_URI = "NEW_STANDARD_IMAGE_URI";

      await ticket.setImageURIsByTier(
        [VIP, STANDARD],
        [NEW_VIP_IMAGE_URI, NEW_STANDARD_IMAGE_URI]
      );

      expect(await ticket.imageURIByTier(VIP)).to.eq(NEW_VIP_IMAGE_URI);
      expect(await ticket.imageURIByTier(STANDARD)).to.eq(
        NEW_STANDARD_IMAGE_URI
      );
    });
  });

  context("Error Scenarios", () => {
    it("should revert when non‑owner calls setters", async () => {
      await expect(ticket.connect(user1).setEventDetails(eventDetails)).to
        .rejected;
      await expect(
        ticket.connect(user1).setImageURIsByTier([VIP, STANDARD], ["", ""])
      ).to.rejected;
    });

    it("Should revert when event times are invalid", async () => {
      const [
        name,
        symbol,
        imageURI,
        description,
        location,
        startTime,
        endTime,
      ] = eventDetails;

      // startTime > endTime
      const invalidStartTime = startTime + endTime;

      await expect(
        ticket.setEventDetails([
          name,
          symbol,
          imageURI,
          description,
          location,
          invalidStartTime,
          endTime,
        ])
      ).to.revertedWithCustomError(ticket, "InvalidTime");
    });
  });
});
