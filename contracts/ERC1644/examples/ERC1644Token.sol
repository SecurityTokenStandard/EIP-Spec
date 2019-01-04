pragma solidity ^0.4.24;

import "../ERC1644.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";

contract ERC1644Token is ERC1644, ERC20Burnable, ERC20Mintable {

    constructor(address _controller)
    public
    ERC1644(_controller) {
        
    }
}