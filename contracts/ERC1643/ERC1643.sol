pragma solidity ^0.4.24;

import "./IERC1643.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract ERC1643 is IERC1643, Ownable {

    struct Document {
        bytes32 docHash; // Hash of the document
        string uri; // URI of the document that exist off-chain
    }

    mapping(bytes32 => Document) internal _documents;

    bytes32[] _docNames;
    
    function setDocument(bytes32 _name, string _uri, bytes32 _documentHash) external onlyOwner



}