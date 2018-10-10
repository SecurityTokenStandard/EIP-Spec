pragma solidity ^0.4.24;

/**
 * @title Interface of ERC1410 standard
 * @dev ref. https://github.com/ethereum/EIPs/issues/1410
 * @dev ERC1410 is dependent on the ERC777 
 */

 interface IERC1410 {

    /// @notice A descriptive name for tokens in this contract
    function name() external view returns (string _name);

    /// @notice An abbreviated name for tokens in this contract
    function symbol() external view returns (string _symbol);

    /// @notice Counts the sum of all tranche balances assigned to an owner
    /// @param _owner An address for whom to query the balance
    /// @return The number of tokens owned by `_owner`, possibly zero
    function balanceOf(address _owner) external view returns (uint256);

    /// @notice Counts the balance associated with a specific tranche assigned to an owner
    /// @param _tranche The tranche for which to query the balance
    /// @param _owner An address for whom to query the balance
    /// @return The number of tokens owned by `_owner` with the metadata associated with `_tranche`, possibly zero
    function balanceOfTranche(bytes32 _tranche, address _owner) external view returns (uint256);

    /// @notice Count all tokens tracked by this contract
    /// @return A count of all tokens tracked by this contract
    function totalSupply() external view returns (uint256);

    /// @notice Transfers the ownership of tokens from a specified tranche from one address to another address
    /// @param _tranche The tranche from which to transfer tokens
    /// @param _to The address to which to transfer tokens to
    /// @param _amount The amount of tokens to transfer from `_tranche`
    /// @param _data Additional data attached to the transfer of tokens
    /// @return A reason code related to the success of the send operation
    /// @return The tranche to which the transferred tokens were allocated for the _to address
    function sendTranche(bytes32 _tranche, address _to, uint256 _amount, bytes _data) external returns (byte, bytes32);

    /// @notice Transfers the ownership of tokens from a specified tranche from one address to another address
    /// @param _tranche The tranche from which to transfer tokens
    /// @param _from The address from which to transfer tokens from
    /// @param _to The address to which to transfer tokens to
    /// @param _amount The amount of tokens to transfer from `_tranche`
    /// @param _data Additional data attached to the transfer of tokens
    /// @param _operatorData Additional data attached to the transfer of tokens by the operator
    /// @return A reason code related to the success of the send operation
    /// @return The tranche to which the transferred tokens were allocated for the _to address
    function operatorSendTranche(bytes32 _tranche, address _from, address _to, uint256 _amount, bytes _data, bytes _operatorData) external returns (byte, bytes32);

    /// @notice Allows enumeration over an individual owners tranches
    /// @param _owner An address over which to enumerate tranches
    /// @param _index The index of the tranche
    /// @return The tranche key corresponding to `_index`
    function trancheByIndex(address _owner, uint256 _index) external view returns (bytes32);

    /// @notice Enables caller to determine the count of tranches owned by an address
    /// @param _owner An address over which to enumerate tranches
    /// @return The number of tranches owned by an `_owner`
    function tranchesOf(address _owner) external view returns (uint256);

    /// @notice Defines a list of operators which can operate over all addresses and tranches
    /// @return The list of default operators
    function defaultOperators() public view returns (address[]);

    /// @notice Defines a list of operators which can operate over all addresses for the specified tranche
    /// @return The list of default operators for `_tranche`
    function defaultOperatorsTranche(bytes32 _tranche) public view returns (address[]);

    /// @notice Authorises an operator for all tranches of `msg.sender`
    /// @param _operator An address which is being authorised
    function authorizeOperator(address _operator) public;

    /// @notice Authorises an operator for a given tranche of `msg.sender`
    /// @param _tranche The tranche to which the operator is authorised
    /// @param _operator An address which is being authorised
    function authorizeOperatorTranche(bytes32 _tranche, address _operator) public;

    /// @notice Revokes authorisation of an operator previously given for all tranches of `msg.sender`
    /// @param _operator An address which is being de-authorised
    function revokeOperator(address _operator) public;

    /// @notice Revokes authorisation of an operator previously given for a specified tranche of `msg.sender`
    /// @param _tranche The tranche to which the operator is de-authorised
    /// @param _operator An address which is being de-authorised
    function revokeOperatorTranche(bytes32 _tranche, address _operator) public;

    /// @notice Determines whether `_operator` is an operator for all tranches of `_owner`
    /// @param _operator The operator to check
    /// @param _owner The owner to check
    /// @return Whether the `_operator` is an operator for all tranches of `_owner`
    function isOperatorFor(address _operator, address _owner) public view returns (bool);

    /// @notice Determines whether `_operator` is an operator for a specified tranche of `_owner`
    /// @param _tranche The tranche to check
    /// @param _operator The operator to check
    /// @param _owner The owner to check
    /// @return Whether the `_operator` is an operator for a specified tranche of `_owner`
    function isOperatorForTranche(bytes32 _tranche, address _operator, address _owner) public view returns (bool);

    /// @notice Increases totalSupply and the corresponding amount of the specified owners tranche
    /// @param _tranche The tranche to allocate the increase in balance
    /// @param _owner The owner whose balance should be increased
    /// @param _amount The amount by which to increase the balance
    /// @param _data Additional data attached to the minting of tokens
    /// @return A reason code related to the success of the mint operation
    function mint(bytes32 _tranche, address _owner, uint256 _amount, bytes _data) public returns (byte reason);

    /// @notice Decreases totalSupply and the corresponding amount of the specified owners tranche
    /// @param _tranche The tranche to allocate the decrease in balance
    /// @param _owner The owner whose balance should be decreased
    /// @param _amount The amount by which to decrease the balance
    /// @param _data Additional data attached to the burning of tokens
    /// @return A reason code related to the success of the burn operation
    function burn(bytes32 _tranche, address _owner, uint256 _amount, bytes _data) public returns (byte reason);

    /// @notice This emits on any successful call to `mint`
    event Minted(address indexed owner, bytes32 tranche, uint256 amount, bytes data);

    /// @notice This emits on any successful call to `burn`
    event Burnt(address indexed owner, bytes32 tranche, uint256 amount, bytes data);

    /// @notice This emits on any successful transfer or minting of tokens
    event SentTranche(
        address indexed operator,
        address indexed from,
        address indexed to,
        bytes32 fromTranche,
        bytes32 toTranche,
        uint256 amount,
        bytes data,
        bytes operatorData
    );

    /// @notice This emits on any successful operator approval for all tranches, excluding default operators
    event AuthorizedOperator(address indexed operator, address indexed owner);

    /// @notice This emits on any successful operator approval for a single tranche, excluding default tranche operators
    event AuthorizedOperatorTranche(bytes32 indexed tranche, address indexed operator, address indexed owner);

    /// @notice This emits on any successful revoke of an operators approval for all tranches
    event RevokedOperator(address indexed operator, address indexed owner);

    /// @notice This emits on any successful revoke of an operators approval for a single tranche
    event RevokedOperatorTranche(bytes32 indexed tranche, address indexed operator, address indexed owner);

}