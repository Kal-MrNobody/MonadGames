// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {GameToken} from "./GameToken.sol";

/// @title GameFactory - deploys one ERC20 per MonadGames mini-game, handles play fees and rewards
contract GameFactory is Ownable, ReentrancyGuard {
    struct GameInfo {
        address creator;
        string gameId;
        uint256 playFee;
        uint256 plays;
        bool exists;
    }

    error EmptyGameId();
    error GameIdTaken();
    error GameNotFound();
    error NotCreator();
    error InsufficientFee();
    error NotRewarder();
    error RewardTooLarge();
    error TransferFailed();
    error ZeroAddress();

    event GameCreated(
        address indexed token,
        address indexed creator,
        string gameId,
        string name,
        string symbol,
        uint256 playFee
    );
    event PlayFeeUpdated(address indexed token, uint256 fee);
    event Played(address indexed token, address indexed player, uint256 paid);
    event Rewarded(address indexed token, address indexed player, uint256 amount);
    event RewarderUpdated(address indexed rewarder);
    event MaxRewardPerCallUpdated(uint256 maxRewardPerCall);
    event Withdrawn(address indexed to, uint256 amount);

    uint256 public constant PLATFORM_FEE_BPS = 1000; // 10%

    mapping(address => GameInfo) public games;
    mapping(string => address) public tokenByGameId;
    address[] public allTokens;

    address public rewarder;
    uint256 public maxRewardPerCall = 1000 * 1e18;

    constructor(address initialRewarder) Ownable(msg.sender) {
        rewarder = initialRewarder;
        emit RewarderUpdated(initialRewarder);
    }

    // ---------------------------------------------------------------- views

    function allGames() external view returns (address[] memory) {
        return allTokens;
    }

    function gamesCount() external view returns (uint256) {
        return allTokens.length;
    }

    // ---------------------------------------------------------------- admin

    function setRewarder(address newRewarder) external onlyOwner {
        rewarder = newRewarder;
        emit RewarderUpdated(newRewarder);
    }

    function setMaxRewardPerCall(uint256 newMax) external onlyOwner {
        maxRewardPerCall = newMax;
        emit MaxRewardPerCallUpdated(newMax);
    }

    function withdraw(address payable to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        uint256 amount = address(this).balance;
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit Withdrawn(to, amount);
    }

    // ---------------------------------------------------------------- games

    function createGame(
        string calldata name,
        string calldata symbol,
        string calldata gameId,
        uint256 playFee
    ) external returns (address token) {
        if (bytes(gameId).length == 0) revert EmptyGameId();
        if (tokenByGameId[gameId] != address(0)) revert GameIdTaken();

        token = address(new GameToken(name, symbol, msg.sender, address(this)));

        games[token] = GameInfo({
            creator: msg.sender,
            gameId: gameId,
            playFee: playFee,
            plays: 0,
            exists: true
        });
        tokenByGameId[gameId] = token;
        allTokens.push(token);

        emit GameCreated(token, msg.sender, gameId, name, symbol, playFee);
    }

    function setPlayFee(address token, uint256 fee) external {
        GameInfo storage g = games[token];
        if (!g.exists) revert GameNotFound();
        if (msg.sender != g.creator) revert NotCreator();
        g.playFee = fee;
        emit PlayFeeUpdated(token, fee);
    }

    function payToPlay(address token) external payable nonReentrant {
        GameInfo storage g = games[token];
        if (!g.exists) revert GameNotFound();
        if (msg.value < g.playFee) revert InsufficientFee();

        g.plays += 1;

        uint256 platformCut = (msg.value * PLATFORM_FEE_BPS) / 10_000;
        uint256 creatorCut = msg.value - platformCut;
        if (creatorCut > 0) {
            (bool ok, ) = payable(g.creator).call{value: creatorCut}("");
            if (!ok) revert TransferFailed();
        }

        emit Played(token, msg.sender, msg.value);
    }

    function reward(address token, address player, uint256 amount) external {
        if (msg.sender != rewarder && msg.sender != owner()) revert NotRewarder();
        if (!games[token].exists) revert GameNotFound();
        if (amount > maxRewardPerCall) revert RewardTooLarge();

        GameToken(token).mint(player, amount);
        emit Rewarded(token, player, amount);
    }
}
