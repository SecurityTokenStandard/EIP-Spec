pragma solidity ^0.5.0;

import "../ERC1594.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";

contract ERC1594Token is ERC1594, ERC20Detailed {

    constructor(string memory name, string memory symbol, uint8 decimals) 
    public 
    ERC20Detailed(name, symbol, decimals)
    {

    }

    event IssuanceFinalized();

    function finalizeIssuance() external onlyOwner {
        require(issuance, "Issuance already closed");
        issuance = false;
        emit IssuanceFinalized();
    }

}
