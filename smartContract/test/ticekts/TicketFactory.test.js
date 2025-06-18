const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { setupContracts } = require("../shared/fixtures");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { getSampleEventStructSet } = require("../shared/utilities");

describe("TicketFactory Test", () => {
  let deployer, user1, ticketFactory, organizerRegistry;
  const {
    ethUsdPriceFeed,
    eventDetails,
    tierIds,
    imageURIByTier,
    tierInfoList,
    paymentTokens,
    priceFeeds,
  } = getSampleEventStructSet();

  beforeEach(async () => {
    ({ deployer, user1, ticketFactory, organizerRegistry } = await loadFixture(
      setupContracts
    ));
    await organizerRegistry.setOrganizer(deployer.address, true);
  });
  context("Valid Scenarios", () => {
    context("Organizer only function", () => {
      it("should create ticket and launchpad contracts correctly", async () => {
        // Predict addresses without sending a transaction
        const [predictedTicket, predictedLaunchpad] =
          await ticketFactory.createTicketPair.staticCall(
            ethUsdPriceFeed,
            eventDetails,
            tierIds,
            imageURIByTier,
            tierInfoList,
            paymentTokens,
            priceFeeds
          );

        // Call and expect Created event with correct args
        await expect(
          ticketFactory.createTicketPair(
            ethUsdPriceFeed,
            eventDetails,
            tierIds,
            imageURIByTier,
            tierInfoList,
            paymentTokens,
            priceFeeds
          )
        )
          .to.emit(ticketFactory, "Created")
          .withArgs(deployer.address, predictedTicket, predictedLaunchpad);

        // Verify contracts are deployed at predicted addresses
        expect(await ethers.provider.getCode(predictedTicket)).to.not.eq("0x");
        expect(await ethers.provider.getCode(predictedLaunchpad)).to.not.eq(
          "0x"
        );
      });
    });

    context("Owner-manager role Functions", () => {
      it("Should allow manager to change TicketImplementation", async () => {
        await ticketFactory.setTicketImplementation(ethers.ZeroAddress);
        expect(await ticketFactory.getTicketImplementation()).to.eq(
          ethers.ZeroAddress
        );
      });

      it("Should allow manager to change TicketLaunchpadImplementation", async () => {
        await ticketFactory.setTicketLaunchpadImplementation(
          ethers.ZeroAddress
        );
        expect(await ticketFactory.getTicketLaunchpadImplementation()).to.eq(
          ethers.ZeroAddress
        );
      });

      it("Should allow manager to change config address", async () => {
        await ticketFactory.setConfigAddress(ethers.ZeroAddress);
        expect(await ticketFactory.getConfigAddress()).to.eq(
          ethers.ZeroAddress
        );
      });

      it("Should allow manager to change AuthorizedSigner address", async () => {
        await ticketFactory.setAuthorizedSigner(ethers.ZeroAddress);
        expect(await ticketFactory.getAuthorizedSigner()).to.eq(
          ethers.ZeroAddress
        );
      });
    });

    context("View function", () => {
      it("should check getLaunchpadByTicket and getTicketListByUser", async () => {
        // Predict addresses without sending a transaction
        const [predictedTicket, predictedLaunchpad] =
          await ticketFactory.createTicketPair.staticCall(
            ethUsdPriceFeed,
            eventDetails,
            tierIds,
            imageURIByTier,
            tierInfoList,
            paymentTokens,
            priceFeeds
          );

        // Call and create
        await ticketFactory.createTicketPair(
          ethUsdPriceFeed,
          eventDetails,
          tierIds,
          imageURIByTier,
          tierInfoList,
          paymentTokens,
          priceFeeds
        );

        expect(await ticketFactory.getLaunchpadByTicket(predictedTicket)).to.eq(
          predictedLaunchpad
        );
        expect(
          await ticketFactory.getTicketListByUser(deployer.address)
        ).to.deep.eq([predictedTicket]);
      });
    });
  });

  context("Invalid Scenarios", () => {
    context("Organizer only function", () => {
      it("should revert if non-approved user tries to create ticket pair", async () => {
        await expect(
          ticketFactory
            .connect(user1)
            .createTicketPair(
              ethUsdPriceFeed,
              eventDetails,
              tierIds,
              imageURIByTier,
              tierInfoList,
              paymentTokens,
              priceFeeds
            )
        ).to.be.reverted;
      });
    });

    context("Owner-manager role Functions", () => {
      it("Should revert if non-manager tries to set manager-only functions", async () => {
        await expect(
          ticketFactory
            .connect(user1)
            .setTicketImplementation(ethers.ZeroAddress)
        ).to.be.reverted;

        await expect(
          ticketFactory
            .connect(user1)
            .setTicketLaunchpadImplementation(ethers.ZeroAddress)
        ).to.be.reverted;

        await expect(
          ticketFactory.connect(user1).setConfigAddress(ethers.ZeroAddress)
        ).to.be.reverted;

        await expect(
          ticketFactory.connect(user1).setAuthorizedSigner(ethers.ZeroAddress)
        ).to.be.reverted;
      });
    });
  });
});
