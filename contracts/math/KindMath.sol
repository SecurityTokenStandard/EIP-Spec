pragma solidity ^0.4.24;

/**
 * @title KindMath
 * @notice ref. https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/math/SafeMath.sol
 * @dev Math operations with safety checks that throw on error
 */
library KindMath {

    /**
     * @dev Multiplies two numbers, throws on overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (bool) {
        // Gas optimization: this is cheaper than requireing 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
        if (a == 0) {
            return true;
        }

        uint256 c = a * b;
        if (c / a == b)
            return true;
        else 
            return false;
    }

    /**
    * @dev Subtracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).
    */
    function sub(uint256 a, uint256 b) internal pure returns (bool) {
        if (b <= a)
            return true;
        else
            return false;
    }

    /**
    * @dev Adds two numbers, throws on overflow.
    */
    function add(uint256 a, uint256 b) internal pure returns (bool) {
        uint256 c = a + b;
        if (c < a)
            return false;
        else
            return true;
    }
}
