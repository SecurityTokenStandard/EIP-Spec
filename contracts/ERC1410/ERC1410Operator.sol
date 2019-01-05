pragma solidity ^0.4.24;

import "./ERC1410Operator.sol";

contract ERC1410Operator is ERC1410Basic {

    // Mapping from (investor, tranche, operator) to approved status
    mapping (address => mapping (bytes32 => mapping (address => bool))) partitionApprovals;

    // Mapping from (investor, operator) to approved status (can be used against any tranches)
    mapping (address => mapping (address => bool)) approvals;

    event AuthorizedOperator(address indexed operator, address indexed tokenHolder);
    event RevokedOperator(address indexed operator, address indexed tokenHolder);

    event AuthorizedOperatorByPartition(bytes32 indexed partition, address indexed operator, address indexed tokenHolder);
    event RevokedOperatorByPartition(bytes32 indexed partition, address indexed operator, address indexed tokenHolder);

    function isOperator(address _operator, address _tokenHolder) external view returns (bool) {
        return approvals[msg.sender][_operator];
    }

    function isOperatorForPartition(bytes32 _partition, address _operator, address _tokenHolder) external view returns (bool) {
        return partitionApprovals[msg.sender][_partition][_operator];
    }

    // Operator Management
    function authorizeOperator(address _operator) external {
        approvals[msg.sender][_operator] = true;
        emit AuthorizedOperator(_operator, msg.sender);
    }
    function revokeOperator(address _operator) external {
        approvals[msg.sender][_operator] = false;
        emit RevokedOperator(operator, msg.sender);
    }
    function authorizeOperatorByPartition(bytes32 _partition, address _operator) external {
        partitionApprovals[msg.sender][_partition][_operator] = true;
        emit AuthorizedOperatorByPartition(_partition, _operator, msg.sender);
    }

    function revokeOperatorByPartition(bytes32 _partition, address _operator) external {
        partitionApprovals[msg.sender][_partition][_operator] = false;
        emit RevokedOperatorByPartition(_partition, _operator, msg.sender);
    }

    function operatorTransferByPartition(bytes32 _partition, address _from, address _to, uint256 _value, bytes _data, bytes _operatorData) external returns (bytes32) {
        // TODO: Add a functionality of verifying the `_operatorData`
        // TODO: Add a functionality of verifying the `_data`
        require(partitionApprovals[_from][_partition][msg.sender], "Not authorised");
        _transferByPartition(_from, _to, _value, _partition, _data, msg.sender, _operatorData);
    }

}