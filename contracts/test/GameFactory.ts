import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("GameFactory", function () {
  async function deployFixture() {
    const [owner, rewarder, creator, player, other] = await ethers.getSigners();
    const factory = await ethers.deployContract("GameFactory", [rewarder.address]);
    await factory.waitForDeployment();
    return { factory, owner, rewarder, creator, player, other };
  }

  async function withGameFixture() {
    const base = await deployFixture();
    const fee = ethers.parseEther("1");
    await base.factory.connect(base.creator).createGame("Flappy Monad", "FLAP", "demo-flappy", fee);
    const tokenAddr = await base.factory.tokenByGameId("demo-flappy");
    const token = await ethers.getContractAt("GameToken", tokenAddr);
    return { ...base, token, tokenAddr, fee };
  }

  it("creates a game with token, info and event", async function () {
    const { factory, creator } = await loadFixture(deployFixture);
    const fee = ethers.parseEther("0.01");
    const tx = factory.connect(creator).createGame("Flappy Monad", "FLAP", "demo-flappy", fee);
    await expect(tx).to.emit(factory, "GameCreated");

    const tokenAddr = await factory.tokenByGameId("demo-flappy");
    expect(tokenAddr).to.not.equal(ethers.ZeroAddress);
    await expect(tx)
      .to.emit(factory, "GameCreated")
      .withArgs(tokenAddr, creator.address, "demo-flappy", "Flappy Monad", "FLAP", fee);

    const info = await factory.games(tokenAddr);
    expect(info.creator).to.equal(creator.address);
    expect(info.gameId).to.equal("demo-flappy");
    expect(info.playFee).to.equal(fee);
    expect(info.plays).to.equal(0n);
    expect(info.exists).to.equal(true);

    expect(await factory.gamesCount()).to.equal(1n);
    expect(await factory.allGames()).to.deep.equal([tokenAddr]);
    expect(await factory.allTokens(0)).to.equal(tokenAddr);

    const token = await ethers.getContractAt("GameToken", tokenAddr);
    expect(await token.name()).to.equal("Flappy Monad");
    expect(await token.symbol()).to.equal("FLAP");
    expect(await token.creator()).to.equal(creator.address);
    expect(await token.factory()).to.equal(await factory.getAddress());
    expect(await token.balanceOf(creator.address)).to.equal(ethers.parseEther("1000000"));
  });

  it("reverts on duplicate or empty gameId", async function () {
    const { factory, other } = await loadFixture(withGameFixture);
    await expect(
      factory.connect(other).createGame("X", "X", "demo-flappy", 0)
    ).to.be.revertedWithCustomError(factory, "GameIdTaken");
    await expect(factory.connect(other).createGame("X", "X", "", 0)).to.be.revertedWithCustomError(
      factory,
      "EmptyGameId"
    );
  });

  it("only creator can set play fee", async function () {
    const { factory, tokenAddr, creator, other } = await loadFixture(withGameFixture);
    await expect(factory.connect(other).setPlayFee(tokenAddr, 5)).to.be.revertedWithCustomError(
      factory,
      "NotCreator"
    );
    await expect(factory.connect(creator).setPlayFee(tokenAddr, 5))
      .to.emit(factory, "PlayFeeUpdated")
      .withArgs(tokenAddr, 5);
    expect((await factory.games(tokenAddr)).playFee).to.equal(5n);
  });

  it("payToPlay splits fees 90/10 and owner can withdraw", async function () {
    const { factory, tokenAddr, creator, player, owner, other, fee } = await loadFixture(withGameFixture);

    await expect(
      factory.connect(player).payToPlay(tokenAddr, { value: fee - 1n })
    ).to.be.revertedWithCustomError(factory, "InsufficientFee");
    await expect(
      factory.connect(player).payToPlay(other.address, { value: fee })
    ).to.be.revertedWithCustomError(factory, "GameNotFound");

    const tx = factory.connect(player).payToPlay(tokenAddr, { value: fee });
    await expect(tx).to.emit(factory, "Played").withArgs(tokenAddr, player.address, fee);
    await expect(tx).to.changeEtherBalances(
      [player, creator, factory],
      [-fee, (fee * 9n) / 10n, fee / 10n]
    );
    expect((await factory.games(tokenAddr)).plays).to.equal(1n);

    await expect(factory.connect(other).withdraw(other.address)).to.be.revertedWithCustomError(
      factory,
      "OwnableUnauthorizedAccount"
    );
    await expect(factory.connect(owner).withdraw(other.address)).to.changeEtherBalances(
      [factory, other],
      [-(fee / 10n), fee / 10n]
    );
  });

  it("reward is only callable by rewarder or owner", async function () {
    const { factory, token, tokenAddr, rewarder, owner, player, other } = await loadFixture(withGameFixture);
    const amt = ethers.parseEther("10");

    await expect(
      factory.connect(other).reward(tokenAddr, player.address, amt)
    ).to.be.revertedWithCustomError(factory, "NotRewarder");

    await expect(factory.connect(rewarder).reward(tokenAddr, player.address, amt))
      .to.emit(factory, "Rewarded")
      .withArgs(tokenAddr, player.address, amt);
    await factory.connect(owner).reward(tokenAddr, player.address, amt);
    expect(await token.balanceOf(player.address)).to.equal(amt * 2n);

    // direct mint on token is blocked
    await expect(token.connect(other).mint(other.address, 1)).to.be.revertedWithCustomError(
      token,
      "OnlyFactory"
    );

    // rewarder can be changed by owner only
    await expect(factory.connect(other).setRewarder(other.address)).to.be.revertedWithCustomError(
      factory,
      "OwnableUnauthorizedAccount"
    );
    await factory.connect(owner).setRewarder(other.address);
    await expect(
      factory.connect(rewarder).reward(tokenAddr, player.address, amt)
    ).to.be.revertedWithCustomError(factory, "NotRewarder");
    await factory.connect(other).reward(tokenAddr, player.address, amt);
  });

  it("enforces maxRewardPerCall cap", async function () {
    const { factory, tokenAddr, rewarder, owner, player, other } = await loadFixture(withGameFixture);
    const cap = await factory.maxRewardPerCall();
    expect(cap).to.equal(ethers.parseEther("1000"));

    await factory.connect(rewarder).reward(tokenAddr, player.address, cap);
    await expect(
      factory.connect(rewarder).reward(tokenAddr, player.address, cap + 1n)
    ).to.be.revertedWithCustomError(factory, "RewardTooLarge");

    await expect(factory.connect(other).setMaxRewardPerCall(1)).to.be.revertedWithCustomError(
      factory,
      "OwnableUnauthorizedAccount"
    );
    await factory.connect(owner).setMaxRewardPerCall(cap * 2n);
    await factory.connect(rewarder).reward(tokenAddr, player.address, cap + 1n);
  });
});
