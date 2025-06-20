const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { setupContracts } = require("../shared/fixtures");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  getSampleEventStructSet,
  getSampleSeat,
  getMintSignatureParams,
  feeCalculator,
  faucetUSDC,
  getUSDCContractOnETHMainNet,
  getSampleMultipleSeats,
  getMintBatchSignatureParams,
  getSampleStandingSeat,
  getSampleMultipleStandingSeats,
} = require("../shared/utilities");
const {
  VIP,
  STANDARD,
  FEE_RATE,
  USDC_ADDRESS_ON_ETH_MAIN_NET,
} = require("../shared/constants");

describe("Ticket Test", () => {
  let deployer, user1, ticketFactory, organizerRegistry, treasury;
  let ticket, ticketLaunchpad;
  let usdc;

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
    ({ deployer, user1, treasury, ticketFactory, organizerRegistry } =
      await loadFixture(setupContracts));
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
    usdc = await getUSDCContractOnETHMainNet();
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
    await faucetUSDC(deployer.address, ethers.parseUnits("1000", 6));
  });

  context("Valid Scenarios", () => {
    context("Mint functions", () => {
      it("Should allow the user to mint a ticket by paying with ETH", async () => {
        const seat = getSampleSeat();
        const nonce = await ticketLaunchpad.nonces(deployer.address);
        const deadline = Math.floor(new Date().getTime() / 1000);
        const mintSignatureParams = await getMintSignatureParams(
          deployer.address,
          seat,
          nonce,
          deadline
        );

        const price = await ticketLaunchpad.getPriceInETH(seat[2]);
        const fee = feeCalculator(price, FEE_RATE);

        await ticketLaunchpad.payWithETH(mintSignatureParams, { value: price });
        expect(await ticket.balanceOf(deployer.address)).to.eq(1);
        expect(await ethers.provider.getBalance(treasury.target)).to.eq(fee);
        expect(await ethers.provider.getBalance(ticketLaunchpad)).to.eq(
          price - fee
        );
      });

      it("Should allow the user to mint a ticket by paying with USDC", async () => {
        const seat = getSampleSeat();
        const nonce = await ticketLaunchpad.nonces(deployer.address);
        const deadline = Math.floor(new Date().getTime() / 1000);
        const mintSignatureParams = await getMintSignatureParams(
          deployer.address,
          seat,
          nonce,
          deadline
        );

        const price = await ticketLaunchpad.getPriceInToken(
          seat[2],
          USDC_ADDRESS_ON_ETH_MAIN_NET
        );
        const fee = feeCalculator(price, FEE_RATE);

        await usdc.approve(ticketLaunchpad.target, price);
        await ticketLaunchpad.payWithToken(
          USDC_ADDRESS_ON_ETH_MAIN_NET,
          mintSignatureParams
        );
        expect(await ticket.balanceOf(deployer.address)).to.eq(1);
        expect(await usdc.balanceOf(treasury.target)).to.eq(fee);
        expect(await usdc.balanceOf(ticketLaunchpad)).to.eq(price - fee);
      });

      it("Should allow the user to mint multiple tickets by paying with ETH", async () => {
        // [["A", "A-1", 0], ["A", "A-2", 0], , ["B", "B-22", 1]]
        const seats = getSampleMultipleSeats();
        const nonce = await ticketLaunchpad.nonces(deployer.address);
        const deadline = Math.floor(new Date().getTime() / 1000);
        const mintSignatureParams = await getMintBatchSignatureParams(
          deployer.address,
          seats,
          nonce,
          deadline
        );

        const vipPrice = await ticketLaunchpad.getPriceInETH(0);
        const standardPrice = await ticketLaunchpad.getPriceInETH(1);
        const totalPrice = vipPrice * 2n + standardPrice;

        const fee = feeCalculator(totalPrice, FEE_RATE);

        await ticketLaunchpad.payBatchWithETH(mintSignatureParams, {
          value: totalPrice,
        });
        expect(await ticket.balanceOf(deployer.address)).to.eq(seats.length);
        expect(await ethers.provider.getBalance(treasury.target)).to.eq(fee);
        expect(await ethers.provider.getBalance(ticketLaunchpad)).to.eq(
          totalPrice - fee
        );
      });

      it("Should allow the user to mint multiple tickets by paying with USDC", async () => {
        // [["A", "A-1", 0], ["A", "A-2", 0], , ["B", "B-22", 1]]
        const seats = getSampleMultipleSeats();
        const nonce = await ticketLaunchpad.nonces(deployer.address);
        const deadline = Math.floor(new Date().getTime() / 1000);
        const mintSignatureParams = await getMintBatchSignatureParams(
          deployer.address,
          seats,
          nonce,
          deadline
        );

        const vipPrice = await ticketLaunchpad.getPriceInToken(
          0,
          USDC_ADDRESS_ON_ETH_MAIN_NET
        );
        const standardPrice = await ticketLaunchpad.getPriceInToken(
          1,
          USDC_ADDRESS_ON_ETH_MAIN_NET
        );
        const totalPrice = vipPrice * 2n + standardPrice;

        const fee = feeCalculator(totalPrice, FEE_RATE);
        await usdc.approve(ticketLaunchpad.target, totalPrice);

        await ticketLaunchpad.payBatchWithToken(
          USDC_ADDRESS_ON_ETH_MAIN_NET,
          mintSignatureParams
        );
        expect(await ticket.balanceOf(deployer.address)).to.eq(seats.length);
        expect(await usdc.balanceOf(treasury.target)).to.eq(fee);
        expect(await usdc.balanceOf(ticketLaunchpad)).to.eq(totalPrice - fee);
      });

      it("Should only allow the admin to mint a ticket with no payment", async () => {
        await ticketLaunchpad.adminMint(deployer.address, [sampleSeatData]);
        expect(await ticket.balanceOf(deployer.address)).to.eq(1);
      });

      it("Should mint tickets with no SeatAlreadyClaimed check", async () => {
        const sampleStandingSeatData = getSampleStandingSeat();
        const sampleMultipleStandingSeats = getSampleMultipleStandingSeats();
        await ticketLaunchpad.adminMint(deployer.address, [
          sampleStandingSeatData,
        ]);
        expect(await ticket.balanceOf(deployer.address)).to.eq(1);
        await ticketLaunchpad.adminMint(
          deployer.address,
          sampleMultipleStandingSeats
        );
        expect(await ticket.balanceOf(deployer.address)).to.eq(4);
      });
    });

    context("Owner-only Functions", () => {
      it("should allow only the owner to set max supply per tier", async () => {
        const MAX_SUPPLY = 10;
        await ticketLaunchpad.setTierMaxSupply([STANDARD], [MAX_SUPPLY]);
        expect((await ticketLaunchpad.tierInfo(STANDARD)).maxSupply).to.eq(
          MAX_SUPPLY
        );
      });

      it("should allow only the owner to set ticket price per tier", async () => {
        const USD_PRICE = ethers.parseUnits("300", 8);
        await ticketLaunchpad.setTierPrices([STANDARD], [USD_PRICE]);
        expect((await ticketLaunchpad.tierInfo(STANDARD)).priceUSD).to.eq(
          USD_PRICE
        );
      });

      it("should allow only the owner to set payment tokens and price feeds", async () => {
        const FAKE_TOKEN = ethers.ZeroAddress;
        const FAKE_PRICE_FEED = ethers.ZeroAddress;
        await ticketLaunchpad.setPaymentTokens([FAKE_TOKEN], [FAKE_PRICE_FEED]);
        expect(await ticketLaunchpad.paymentTokenPriceFeeds(FAKE_TOKEN)).to.eq(
          FAKE_PRICE_FEED
        );
      });

      it("should allow only the owner to withdraw ETH", async () => {
        const seat = getSampleSeat();
        const nonce = await ticketLaunchpad.nonces(deployer.address);
        const deadline = Math.floor(new Date().getTime() / 1000);
        const mintSignatureParams = await getMintSignatureParams(
          deployer.address,
          seat,
          nonce,
          deadline
        );

        const price = await ticketLaunchpad.getPriceInETH(seat[2]);
        const fee = feeCalculator(price, FEE_RATE);
        const receivedETHFromTicketSale = price - fee;
        await ticketLaunchpad.payWithETH(mintSignatureParams, { value: price });

        const ethBalanceOfTicketLaunchpad = await ethers.provider.getBalance(
          ticketLaunchpad.target
        );

        const ethBalanceOfUser1 = await ethers.provider.getBalance(
          user1.address
        );

        await ticketLaunchpad.withdrawETH(user1.address);

        expect(await ethers.provider.getBalance(ticketLaunchpad.target)).to.eq(
          ethBalanceOfTicketLaunchpad - receivedETHFromTicketSale
        );
        expect(await ethers.provider.getBalance(user1.address)).to.eq(
          ethBalanceOfUser1 + receivedETHFromTicketSale
        );
      });

      it("should allow only the owner to withdraw ERC20 tokens", async () => {
        const USDC_AMOUNT = ethers.parseUnits("10", 6);

        await usdc.transfer(ticketLaunchpad.target, USDC_AMOUNT);

        const usdcBalanceOfTicketLaunchpad = await usdc.balanceOf(
          ticketLaunchpad.target
        );

        const usdcBalanceOfUser1 = await usdc.balanceOf(user1.address);
        await ticketLaunchpad.withdrawToken(user1.address, usdc.target);

        expect(await usdc.balanceOf(ticketLaunchpad.target)).to.eq(
          usdcBalanceOfTicketLaunchpad - USDC_AMOUNT
        );
        expect(await usdc.balanceOf(user1.address)).to.eq(
          usdcBalanceOfUser1 + USDC_AMOUNT
        );
      });
    });
  });

  context("Invalid Scenarios", () => {
    context("Mint functions", () => {
      it("Should revert with InsufficientAmount when sent ETH is less than required", async () => {
        const seat = getSampleSeat();
        const seats = getSampleMultipleSeats();
        const nonce = await ticketLaunchpad.nonces(deployer.address);
        const deadline = Math.floor(new Date().getTime() / 1000);
        const mintSignatureParams = await getMintSignatureParams(
          deployer.address,
          seat,
          nonce,
          deadline
        );
        const mintBatchSignatureParams = await getMintBatchSignatureParams(
          deployer.address,
          seats,
          nonce,
          deadline
        );

        await expect(
          ticketLaunchpad.payWithETH(mintSignatureParams, { value: 0 })
        ).to.revertedWithCustomError(ticketLaunchpad, "InsufficientAmount");
        await expect(
          ticketLaunchpad.payBatchWithETH(mintBatchSignatureParams, {
            value: 0,
          })
        ).to.revertedWithCustomError(ticketLaunchpad, "InsufficientAmount");
      });

      it("Should revert with UnacceptablePayment when using an invalid payment token address", async () => {
        const seat = getSampleSeat();
        const seats = getSampleMultipleSeats();
        const nonce = await ticketLaunchpad.nonces(deployer.address);
        const deadline = Math.floor(new Date().getTime() / 1000);
        const mintSignatureParams = await getMintSignatureParams(
          deployer.address,
          seat,
          nonce,
          deadline
        );
        const mintBatchSignatureParams = await getMintBatchSignatureParams(
          deployer.address,
          seats,
          nonce,
          deadline
        );
        await expect(
          ticketLaunchpad.payWithToken(ethers.ZeroAddress, mintSignatureParams)
        ).to.revertedWithCustomError(ticketLaunchpad, "UnacceptablePayment");
        await expect(
          ticketLaunchpad.payBatchWithToken(
            ethers.ZeroAddress,
            mintBatchSignatureParams
          )
        ).to.revertedWithCustomError(ticketLaunchpad, "UnacceptablePayment");
      });

      it("Should revert with ExceedsMaxSupply when tier supply limit is exceeded", async () => {
        const seat = getSampleSeat();
        const seats = getSampleMultipleSeats();
        const nonce = await ticketLaunchpad.nonces(deployer.address);
        const deadline = Math.floor(new Date().getTime() / 1000);
        const mintSignatureParams = await getMintSignatureParams(
          deployer.address,
          seat,
          nonce,
          deadline
        );
        const mintBatchSignatureParams = await getMintBatchSignatureParams(
          deployer.address,
          seats,
          nonce,
          deadline
        );
        const vipPrice = await ticketLaunchpad.getPriceInETH(0);
        const standardPrice = await ticketLaunchpad.getPriceInETH(1);
        const ethBatchPrice = vipPrice * 2n + standardPrice;

        const ethPrice = await ticketLaunchpad.getPriceInETH(seat[2]);
        await ticketLaunchpad.setTierMaxSupply([VIP, STANDARD], [0, 0]);

        await expect(
          ticketLaunchpad.payWithETH(mintSignatureParams, { value: ethPrice })
        ).to.revertedWithCustomError(ticketLaunchpad, "ExceedsMaxSupply");

        await expect(
          ticketLaunchpad.payBatchWithETH(mintBatchSignatureParams, {
            value: ethBatchPrice,
          })
        ).to.revertedWithCustomError(ticketLaunchpad, "ExceedsMaxSupply");

        await usdc.approve(ticketLaunchpad.target, ethers.MaxUint256);
        await expect(
          ticketLaunchpad.payWithToken(usdc.target, mintSignatureParams)
        ).to.revertedWithCustomError(ticketLaunchpad, "ExceedsMaxSupply");

        await expect(
          ticketLaunchpad.payBatchWithToken(
            usdc.target,
            mintBatchSignatureParams
          )
        ).to.revertedWithCustomError(ticketLaunchpad, "ExceedsMaxSupply");

        await expect(
          ticketLaunchpad.adminMint(deployer.address, [seat])
        ).to.revertedWithCustomError(ticketLaunchpad, "ExceedsMaxSupply");
      });

      it("Should revert with InvalidNonce when using an incorrect nonce", async () => {
        const seat = getSampleSeat();
        const seats = getSampleMultipleSeats();
        const invalidNonce = 99;
        const deadline = Math.floor(new Date().getTime() / 1000);
        const mintSignatureParams = await getMintSignatureParams(
          deployer.address,
          seat,
          invalidNonce,
          deadline
        );
        const mintBatchSignatureParams = await getMintBatchSignatureParams(
          deployer.address,
          seats,
          invalidNonce,
          deadline
        );
        const vipPrice = await ticketLaunchpad.getPriceInETH(0);
        const standardPrice = await ticketLaunchpad.getPriceInETH(1);
        const ethBatchPrice = vipPrice * 2n + standardPrice;

        const ethPrice = await ticketLaunchpad.getPriceInETH(seat[2]);

        await expect(
          ticketLaunchpad.payWithETH(mintSignatureParams, { value: ethPrice })
        ).to.revertedWithCustomError(ticketLaunchpad, "InvalidNonce");

        await expect(
          ticketLaunchpad.payBatchWithETH(mintBatchSignatureParams, {
            value: ethBatchPrice,
          })
        ).to.revertedWithCustomError(ticketLaunchpad, "InvalidNonce");
        await usdc.approve(ticketLaunchpad.target, ethers.MaxUint256);
        await expect(
          ticketLaunchpad.payWithToken(usdc.target, mintSignatureParams)
        ).to.revertedWithCustomError(ticketLaunchpad, "InvalidNonce");

        await expect(
          ticketLaunchpad.payBatchWithToken(
            usdc.target,
            mintBatchSignatureParams
          )
        ).to.revertedWithCustomError(ticketLaunchpad, "InvalidNonce");
      });

      it("Should revert with SignatureExpired when signature deadline has passed", async () => {
        const seat = getSampleSeat();
        const seats = getSampleMultipleSeats();
        const nonce = await ticketLaunchpad.nonces(deployer.address);
        const invalidDeadline = 1000;
        const mintSignatureParams = await getMintSignatureParams(
          deployer.address,
          seat,
          nonce,
          invalidDeadline
        );
        const mintBatchSignatureParams = await getMintBatchSignatureParams(
          deployer.address,
          seats,
          nonce,
          invalidDeadline
        );
        const vipPrice = await ticketLaunchpad.getPriceInETH(0);
        const standardPrice = await ticketLaunchpad.getPriceInETH(1);
        const ethBatchPrice = vipPrice * 2n + standardPrice;

        const ethPrice = await ticketLaunchpad.getPriceInETH(seat[2]);

        await expect(
          ticketLaunchpad.payWithETH(mintSignatureParams, { value: ethPrice })
        ).to.revertedWithCustomError(ticketLaunchpad, "SignatureExpired");

        await expect(
          ticketLaunchpad.payBatchWithETH(mintBatchSignatureParams, {
            value: ethBatchPrice,
          })
        ).to.revertedWithCustomError(ticketLaunchpad, "SignatureExpired");
        await usdc.approve(ticketLaunchpad.target, ethers.MaxUint256);
        await expect(
          ticketLaunchpad.payWithToken(usdc.target, mintSignatureParams)
        ).to.revertedWithCustomError(ticketLaunchpad, "SignatureExpired");

        await expect(
          ticketLaunchpad.payBatchWithToken(
            usdc.target,
            mintBatchSignatureParams
          )
        ).to.revertedWithCustomError(ticketLaunchpad, "SignatureExpired");
      });

      it("Should revert with InvalidSignature when signature is signed by an unauthorized signer", async () => {
        const invalidSinger = ethers.Wallet.createRandom().connect(
          ethers.provider
        );
        const seat = getSampleSeat();
        const seats = getSampleMultipleSeats();
        const nonce = await ticketLaunchpad.nonces(deployer.address);
        const deadline = Math.floor(new Date().getTime() / 1000);
        const mintSignatureParams = await getMintSignatureParams(
          deployer.address,
          seat,
          nonce,
          deadline,
          invalidSinger
        );
        const mintBatchSignatureParams = await getMintBatchSignatureParams(
          deployer.address,
          seats,
          nonce,
          deadline,
          invalidSinger
        );
        const vipPrice = await ticketLaunchpad.getPriceInETH(0);
        const standardPrice = await ticketLaunchpad.getPriceInETH(1);
        const ethBatchPrice = vipPrice * 2n + standardPrice;

        const ethPrice = await ticketLaunchpad.getPriceInETH(seat[2]);
        await usdc.approve(ticketLaunchpad.target, ethers.MaxUint256);

        await expect(
          ticketLaunchpad.payWithETH(mintSignatureParams, { value: ethPrice })
        ).to.revertedWithCustomError(ticketLaunchpad, "InvalidSignature");

        await expect(
          ticketLaunchpad.payBatchWithETH(mintBatchSignatureParams, {
            value: ethBatchPrice,
          })
        ).to.revertedWithCustomError(ticketLaunchpad, "InvalidSignature");

        await expect(
          ticketLaunchpad.payWithToken(usdc.target, mintSignatureParams)
        ).to.revertedWithCustomError(ticketLaunchpad, "InvalidSignature");

        await expect(
          ticketLaunchpad.payBatchWithToken(
            usdc.target,
            mintBatchSignatureParams
          )
        ).to.revertedWithCustomError(ticketLaunchpad, "InvalidSignature");
      });

      it("Should revert with SeatAlreadyClaimed when a seat is claimed", async () => {
        const seat = getSampleSeat();
        const seats = getSampleMultipleSeats();
        let nonce = await ticketLaunchpad.nonces(deployer.address);
        const deadline = Math.floor(new Date().getTime() / 1000);
        let mintSignatureParams = await getMintSignatureParams(
          deployer.address,
          seat,
          nonce,
          deadline
        );

        const vipPrice = await ticketLaunchpad.getPriceInETH(0);
        const standardPrice = await ticketLaunchpad.getPriceInETH(1);
        const ethBatchPrice = vipPrice * 2n + standardPrice;

        const ethPrice = await ticketLaunchpad.getPriceInETH(seat[2]);

        await ticketLaunchpad.payWithETH(mintSignatureParams, {
          value: ethPrice,
        });
        nonce = await ticketLaunchpad.nonces(deployer.address);
        mintSignatureParams = await getMintSignatureParams(
          deployer.address,
          seat,
          nonce,
          deadline
        );
        const mintBatchSignatureParams = await getMintBatchSignatureParams(
          deployer.address,
          seats,
          nonce,
          deadline
        );
        await expect(
          ticketLaunchpad.payWithETH(mintSignatureParams, { value: ethPrice })
        ).to.revertedWithCustomError(ticket, "SeatAlreadyClaimed");

        await expect(
          ticketLaunchpad.payBatchWithETH(mintBatchSignatureParams, {
            value: ethBatchPrice,
          })
        ).to.revertedWithCustomError(ticket, "SeatAlreadyClaimed");

        await usdc.approve(ticketLaunchpad.target, ethers.MaxUint256);
        await expect(
          ticketLaunchpad.payWithToken(usdc.target, mintSignatureParams)
        ).to.revertedWithCustomError(ticket, "SeatAlreadyClaimed");

        await expect(
          ticketLaunchpad.payBatchWithToken(
            usdc.target,
            mintBatchSignatureParams
          )
        ).to.revertedWithCustomError(ticket, "SeatAlreadyClaimed");

        await expect(
          ticketLaunchpad.adminMint(deployer.address, [seat])
        ).to.revertedWithCustomError(ticket, "SeatAlreadyClaimed");
      });
    });

    context("Owner-only Functions", () => {
      it("should revert with LengthMismatch when input array lengths are not equal", async () => {
        await expect(
          ticketLaunchpad.setTierMaxSupply([STANDARD], [])
        ).to.revertedWithCustomError(ticketLaunchpad, "LengthMismatch");

        await expect(
          ticketLaunchpad.setTierPrices([STANDARD], [])
        ).to.revertedWithCustomError(ticketLaunchpad, "LengthMismatch");

        await expect(
          ticketLaunchpad.setPaymentTokens([usdc.target], [])
        ).to.revertedWithCustomError(ticketLaunchpad, "LengthMismatch");
      });

      it("should revert when non-owner tries to call withdrawETH or withdrawToken", async () => {
        await expect(ticketLaunchpad.connect(user1).withdrawETH(user1.address))
          .rejected;

        await expect(
          ticketLaunchpad
            .connect(user1)
            .withdrawToken(user1.address, usdc.target)
        ).rejected;
      });
    });
  });
});
