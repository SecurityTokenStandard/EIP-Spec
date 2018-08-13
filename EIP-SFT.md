---

eip: ERC-SFT (working name until EIP assigned)
title: Standard for Semi-Fungible Tokens
author: Polymath, Adam Dossa, Pablo Ruiz, Fabian Vogelsteller, Stephane Gosselin
discussions-to: ststandard@polymath.network
status: Draft
type: Standards Track
category: ERC
created: 2018-08-05
require: ERC1066, ERC165, ERC820

---

## Simple Summary

A standard interface for organising an owners tokens into a set of tranches.

## Abstract

Describes an interface to support an owners tokens being grouped into tranches, with each tranche being represented by an identifying key and a balance.

Tokens are operated upon at a tranche granularity, but data about the overall supply of tokens and overall balances of owners is also tracked.

Whilst this standard is not directly backwards compatible with ERC20 / ERC777, it is fairly trivial to provide implementations of the ERC20 / ERC777 standard functions based on this standard.

[TODO - Should we include the below section or is this covered elsewhere]

## Tranche Metadata

An owners tokens are split into tranches, with each tranche being identified by a `bytes32` key and associated with a `uint256` balance.

Tranche keys can be further linked to whatever tranche metadata the implementation requires.

The specification for this metadata, beyond the existence of a key to identify it, does not form part of this standard.

For an individual owner, each token in a tranche therefore shares common metadata.

Token fungibility includes metadata so we have:
  - for a specific user, tokens within a given tranche are fungible
  - for a specific user, tokens from different tranche may not be fungible

Note - tranches with the same `bytes32` key across different users may be associated with different metadata depending on the implementation.

## Motivation

Being able to associate metadata with individual fungible tokens is useful when building functionality associated with those tokens.

For example, knowing when an individual token was minted allows vesting or lockup logic to be implemented for a portion of a token holders balance.

Tokens that represent securities often require metadata to be attached to individual tokens, such as the category of share or restrictions associated with the share.

Being able to associate arbitrary metadata with groups of tokens held by users is useful in a variety of use-cases. It can be used for token provenance (i.e. recording the previous owner(s) of tokens) or to attach data to a token which is then used to determine any transfer restrictions of that token.

In general it may be that whilst tokens are fungible under some circumstances, they are not under others (for example restricted and non-restricted shares). Being able to define such groupings and operate on them whilst maintaining data about the overall distribution of a token irrespective of this is useful in modelling these types of assets.

## Specification

TODO: Specify token receiver interface

TODO: Specify reason codes within the ERC1066 framework

```
/// @title ERC-SFT Fungible Token Metadata Standard
/// @dev See https://github.com/ethereum/EIPs/blob/master/EIPS/eip-SFT.md
///  Note: the ERC-165 identifier for this interface is [TODO].

interface IERCSFT {

    /// @notice A descriptive name for tokens in this contract
    function name() external view returns (string _name);

    /// @notice An abbreviated name for tokens in this contract
    function symbol() external view returns (string _symbol);

    /// @notice Counts the sum of all tranche balances assigned to an owner
    /// @param _owner An address for whom to query the balance
    /// @return The number of tokens owned by `_owner`, possibly zero
    function balanceOf(address _owner) external view returns (uint256);

    /// @notice Counts the balance associated with a specific tranche assigned to an owner
    /// @param _owner An address for whom to query the balance
    /// @param _tranche The tranche for which to query the balance
    /// @return The number of tokens owned by `_owner` with the metadata associated with `_tranche`, possibly zero
    function balanceOfTranche(address _owner, bytes32 _tranche) external view returns (uint256);

    /// @notice Count all tokens tracked by this contract
    /// @return A count of all tokens tracked by this contract
    function totalSupply() external view returns (uint256);

    /// @notice Transfers the ownership of tokens from a specified tranche from one address to another address
    /// @param _to The address to which to transfer tokens to
    /// @param _tranche The tranche from which to transfer tokens
    /// @param _amount The amount of tokens to transfer from `_tranche`
    /// @param _data Additional data attached to the transfer of tokens
    /// @return A reason code related to the success of the send operation
    /// @return The tranche to which the transferred tokens were allocated for the _to address
    function sendTranche(address _to, bytes32 _tranche, uint256 _amount, bytes _data) external returns (byte, bytes32);

    /// @notice Transfers the ownership of tokens from a specified tranche from one address to another address
    /// @param _from The address from which to transfer tokens from
    /// @param _to The address to which to transfer tokens to
    /// @param _tranche The tranche from which to transfer tokens
    /// @param _amount The amount of tokens to transfer from `_tranche`
    /// @param _data Additional data attached to the transfer of tokens
    /// @param _operatorData Additional data attached to the transfer of tokens by the operator
    /// @return A reason code related to the success of the send operation
    /// @return The tranche to which the transferred tokens were allocated for the _to address
    function operatorSendTranche(address _from, address _to, bytes32 _tranche, uint256 _amount, bytes _data, bytes _operatorData) external returns (byte, bytes32);

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
    function authorizeTrancheOperator(bytes32 _tranche, address _operator) public;

    /// @notice Revokes authorisation of an operator previously given for all tranches of `msg.sender`
    /// @param _operator An address which is being de-authorised
    function revokeOperator(address _operator) public;

    /// @notice Revokes authorisation of an operator previously given for a specified tranche of `msg.sender`
    /// @param _tranche The tranche to which the operator is de-authorised
    /// @param _operator An address which is being de-authorised
    function revokeTrancheOperator(bytes32 _tranche, address _operator) public;

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
    function isOperatorTrancheFor(bytes32 _tranche, address _operator, address _owner) public view returns (bool);

    /// @notice Increases totalSupply and the corresponding amount of the specified owners tranche
    /// @param _owner The owner whose balance should be increased
    /// @param _tranche The tranche to allocate the increase in balance
    /// @param _amount The amount by which to increase the balance
    /// @param _data Additional data attached to the minting of tokens
    /// @return A reason code related to the success of the mint operation
    function mint(address _owner, bytes32 _tranche, uint256 _amount, bytes _data) public returns (byte reason);

    /// @notice Decreases totalSupply and the corresponding amount of the specified owners tranche
    /// @param _owner The owner whose balance should be decreased
    /// @param _tranche The tranche to allocate the decrease in balance
    /// @param _amount The amount by which to decrease the balance
    /// @param _data Additional data attached to the burning of tokens
    /// @return A reason code related to the success of the burn operation
    function burn(address _owner, bytes32 _tranche, uint256 _amount, bytes _data) public returns (byte reason);

    /// @notice This emits on any successful call to `mint`
    event Minted(address indexed owner, bytes32 tranche, uint256 amount, bytes data);

    /// @notice This emits on any successful call to `burn`
    event Burnt(address indexed owner, bytes32 tranche, uint256 amount, bytes data);

    /// @notice This emits on any successful transfer or minting of tokens
    event Sent(
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
    event AuthorizedTrancheOperator(bytes32 indexed tranche, address indexed operator, address indexed owner);

    /// @notice This emits on any successful revoke of an operators approval for all tranches
    event RevokedOperator(address indexed operator, address indexed owner);

    /// @notice This emits on any successful revoke of an operators approval for a single tranche
    event RevokedTrancheOperator(bytes32 indexed tranche, address indexed operator, address indexed owner);

}
```

The token contract MUST register the ERCSFTToken interface (pending EIP approval) with its own address via ERC820. It MAY register the ERC20 and ERC777 interface based on the implementation. If the contract has a switch to enable or disable ERCSFT, ERC20 or ERC777 functions, every time the switch is triggered, the token MUST register or unregister the appropriate interface via ERC820. (Unregistering implies setting the address to 0x0.)

### Notes

`defaultOperators` can be used to transparently grant an account (which could be a multi-sig or other smart contract) unrestricted authorisation to transfer tokens for all owners and tranches. An implementation can enforce that this is always an empty list if required.

[TODO - Add more detail to the below section]

### Rationale

There are many types of securities which, although they represent the same asset, need to have differentiating data tied to them.

This additional metadata implicitly renders these securities non-fungible, but in practice this data is usually applied to groups of securities rather than individual securities.

For example tokens may be split into those minted during the primary issuance, and those received through secondary trading.

Having this data allows token contracts to implement sophisticated logic to govern transfers from a particular tranche, and in determining the tranche into which to deposit the receivers balance.

### Caveats

Given the enumerable nature of an owners tranches, implementations should avoid using for / while loops to enumerate tranches on-chain. Doing so may incur unbounded gas costs or breach block gas limits.

### Reason Codes

Transactions that could fail, for example transfers, return a reason code. Reason codes follow the ERC-1066 specification, and are defined as:  

0x00 - success
[TODO - complete...]

### ERC20 / ERC777 Backwards Compatibility

In order to remain backwards compatible with ERC20 / ERC777 (and other fungible token standards) it is necessary to define what tranche or tranches are used when a `transfer` / `send` operation is executed (i.e. when not explicitly specifying the tranche).

There are a variety of approaches here - the implementation could define a default tranche (e.g. "unrestricted") which is used by these operations, or the tranche could be determined dynamically in code based on the owner.

If the implementation guarantees a small number of possible tranches per owner, it could be reasonable to iterate over all of an owners tranches.

## Implementation
[Link to Polymath GitHub repo w/ reference implementation]

## Copyright
Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
