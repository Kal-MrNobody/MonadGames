// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title GameToken - ERC20 token for a single MonadGames mini-game
contract GameToken is ERC20 {
    error OnlyFactory();

    address public immutable factory;
    address public immutable creator;

    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 1e18;

    constructor(string memory name_, string memory symbol_, address creator_, address factory_)
        ERC20(name_, symbol_)
    {
        factory = factory_;
        creator = creator_;
        _mint(creator_, INITIAL_SUPPLY);
    }

    function mint(address to, uint256 amount) external {
        if (msg.sender != factory) revert OnlyFactory();
        _mint(to, amount);
    }
}
