---

eip: ERC-PFT (working name until EIP assigned)
title: Standard for Partially-Fungible Tokens
author: Adam Dossa, Pablo Ruiz, Fabian Vogelsteller, Stephane Gosselin
discussions-to: ststandard@polymath.network
status: Draft
type: Standards Track
category: ERC
created: 2018-08-05
require: ERC165, ERC777

---

## Simple Summary

A standard interface for organising an owners tokens into a set of tranches.

## Abstract

Describes an interface to support an owners tokens being grouped into tranches, with each tranche being represented by an identifying key and a balance.

Tokens are operated upon at a tranche granularity, but data about the overall supply of tokens and overall balances of owners is also tracked.

This standard is an extension of ERC777 and therefore is implicitly compatible with ERC20 and ERC777.

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

## Methods

[WIP - complete method explanations]

### Sending Tokens

Token transfers always have an associated source and destination tranche, as well as the usual amounts and sender and receiver addresses.

#### getDefaultTranches

In order to provide compatibility with ERC777 we need to know which tranches to use when a ERC777 `send` function is executed.

This function returns the tranches to use in this circumstance. For example, a security token may return the `bytes32("unrestricted")` tranche, or a simple implementation with a small set of possible tranches could just return all tranches associated with an owner.

The return value can be empty which implies there is no default tranche (and hence the ERC777 `send` function will throw), or return more than one tranche, in which case the ERC777 `send` function should loop over these tranches in order until the specified amount has been successfully transferred.

``` solidity
function getDefaultTranches(address _owner) external view returns (bytes32[]);
```

#### setDefaultTranches

Allows default tranches to be set for a specified address, which will be used during ERC777 `send` function executions.

This function could be open for all owners to call for themselves, or restricted to just the token owner depending on the required implementation behaviour.

``` solidity
function setDefaultTranche(bytes32[] _tranches) external;
```

#### balanceOfByTranche

As well as querying total balances across all tranches through `balanceOf` it may be that a user of the standard wants to determine the balance of a specific tranche.

``` solidity
function balanceOfByTranche(bytes32 _tranche, address _owner) external view returns (uint256);
```

#### sendByTranche

By extending the ERC777 standard, and providing a default tranche (through `getDefaultTranches`) it is possible to send tokens (from default tranches). To send tokens from a specific tranche, the `sendByTranche` function can be used.

For permissioned tokens, this function may check that the transfer is valid based on:  
  - the `_tranche` value
  - any additional data associated with the `_tranche` value (e.g. a lockup timestamp that may be associated with `_tranche`)
  - any details associated with the sender or receiver of tokens (e.g. has their identity been established)
  - the amount of tokens being transferred (e.g. does it respect any daily or other period based volume restrictions)
  - the `_data` parameter allows the caller to supply any additional authorisation or details associated with the transfer (e.g. signed data from an authorised entity who is permissioned to authorise the transfer)

This function MUST throw if the transfer of tokens is not successful for any reason.

When transferring tokens from a particular tranche, it is useful to know on-chain (i.e. not just via an event being fired) the destination tranche of those tokens. The destination tranche will be determined by the implementation of this function and will vary depending on use-case.

This function MUST emit a `SentByTranche` event for successful transfers.

``` solidity
function sendByTranches(bytes32[] _tranches, address[] _tos, uint256[] _amounts, bytes _data) external returns (bytes32);
```

### Operators

Operators can be authorised for:
  - all owners and tranches (`defaultOperators` inherited from ERC777)
  - all owners for a specific tranche (`defaultOperatorsByTranche`)
  - all tranches for a specific owner (`isOperatorFor` inherited from ERC777)
  - a specific tranche for a specific owner (`isOperatorForTranche`)

#### defaultOperatorsByTranche

This function returns the set of default operators who are authorised for all owners and a specified tranche.

``` solidity
function defaultOperatorsByTranche(bytes32 _tranche) public view returns (address[]);
```

#### authorizeOperatorByTranche

Allows an owner to set an operator for their tokens on a specific tranche.

``` solidity
function authorizeOperatorByTranche(bytes32 _tranche, address _operator) public;
```

#### revokeOperatorByTranche

Allows an owner to revoke an operator for their tokens on a specific tranche.

NB - it is possible the operator will retain authorisation over this owner and tranche through either `defaultOperatorsByTranche` or `defaultOperators`.

``` solidity
function revokeOperatorByTranche(bytes32 _tranche, address _operator) public;
```

#### isOperatorForTranche

Returns whether a specified address is an operator for the given owner and tranche.

This should return TRUE if the address is an operator under any of the above categories.

``` solidity
function isOperatorForTranche(bytes32 _tranche, address _operator, address _owner) public view returns (bool);
```

## Specification

[TODO: Specify token receiver interface]

``` solidity
/// @title ERC-PFT Fungible Token Metadata Standard
/// @dev See https://github.com/ethereum/EIPs/blob/master/EIPS/eip-PFT.md
///  Note: the ERC-165 identifier for this interface is 0xffe8e498.

interface IERCPFT is IERC777 {

    /// @notice Obtain the tranches for ERC777 compatibility
    /// @param _owner The address for which default tranches are required
    /// @return The default tranches defined by the token creator and / or by the user or operator
    function getDefaultTranches(address _owner) external view returns (bytes32[]);

    /// @notice Allows a token owner to change their default tranche
    /// @dev MUST modify the default tranche of msg.sender
    /// @param _tranches The tranche to set as default
    function setDefaultTranche(bytes32[] _tranches) external;

    /// @notice Counts the balance associated with a specific tranche assigned to an owner
    /// @param _tranche The tranche for which to query the balance
    /// @param _owner An address for whom to query the balance
    /// @return The number of tokens owned by `_owner` with the metadata associated with `_tranche`, possibly zero
    function balanceOfByTranche(bytes32 _tranche, address _owner) external view returns (uint256);

    /// @notice Transfers the ownership of tokens from a specified tranche from one address to another address
    /// @dev MUST revert if tokens not successfully sent
    /// @param _tranche The tranche from which to transfer tokens
    /// @param _to The address to which to transfer tokens to
    /// @param _amount The amount of tokens to transfer from `_tranche`
    /// @param _data Additional data attached to the transfer of tokens
    /// @return The tranche to which the transferred tokens were allocated for the _to address
    function sendByTranche(bytes32 _tranche, address _to, uint256 _amount, bytes _data) external returns (bytes32);

    /// @notice Batch transfers the ownership of tokens from specified tranches
    /// @dev MUST revert if all tokens not successfully sent
    /// @dev The length of _tranches, _tos & _amounts must be equal
    /// @param _tranches The tranches from which to transfer tokens
    /// @param _tos The addresses to which to transfer tokens to
    /// @param _amounts The amount of tokens to transfer from each `_tranche`
    /// @param _data Additional data attached to the transfer of tokens
    /// @return The tranche to which the transferred tokens were allocated for the _to address
    function sendByTranches(bytes32[] _tranches, address[] _tos, uint256[] _amounts, bytes _data) external returns (bytes32);

    /// @notice Transfers the ownership of tokens from a specified tranche from one address to another address
    /// @dev MUST revert if tokens not successfully sent
    /// @param _tranche The tranche from which to transfer tokens
    /// @param _from The address from which to transfer tokens from
    /// @param _to The address to which to transfer tokens to
    /// @param _amount The amount of tokens to transfer from `_tranche`
    /// @param _data Additional data attached to the transfer of tokens
    /// @param _operatorData Additional data attached to the transfer of tokens by the operator
    /// @return The tranche to which the transferred tokens were allocated for the _to address
    function operatorSendByTranche(bytes32 _tranche, address _from, address _to, uint256 _amount, bytes _data, bytes _operatorData) external returns (bytes32[]);

    /// @notice Batch transfers the ownership of tokens from specified tranches
    /// @dev MUST revert if tokens not successfully sent
    /// @dev The length of _tranches, _froms, _tos & _amounts must be equal
    /// @param _tranches The tranches from which to transfer tokens
    /// @param _froms The addresses from which to transfer tokens from
    /// @param _tos The addresses to which to transfer tokens to
    /// @param _amounts The amounts of tokens to transfer from `_tranche`
    /// @param _data Additional data attached to the transfer of tokens
    /// @param _operatorData Additional data attached to the transfer of tokens by the operator
    /// @return The tranche to which the transferred tokens were allocated for the _to address
    function operatorSendByTranches(bytes32[] _tranches, address[] _froms, address[] _tos, uint256[] _amounts, bytes _data, bytes _operatorData) external returns (bytes32[]);

    /// @notice Allows enumeration over an individual owners tranches
    /// @param _owner An address over which to enumerate tranches
    /// @param _index The index of the tranche
    /// @return The tranche key corresponding to `_index`
    function trancheByIndex(address _owner, uint256 _index) external view returns (bytes32);

    /// @notice Enables caller to determine the count of tranches owned by an address
    /// @param _owner An address over which to enumerate tranches
    /// @return The number of tranches owned by an `_owner`
    function tranchesOf(address _owner) external view returns (uint256);

    /// @notice Defines a list of operators which can operate over all addresses for the specified tranche
    /// @return The list of default operators for `_tranche`
    function defaultOperatorsByTranche(bytes32 _tranche) public view returns (address[]);

    /// @notice Authorises an operator for a given tranche of `msg.sender`
    /// @param _tranche The tranche to which the operator is authorised
    /// @param _operator An address which is being authorised
    function authorizeOperatorByTranche(bytes32 _tranche, address _operator) public;

    /// @notice Revokes authorisation of an operator previously given for a specified tranche of `msg.sender`
    /// @param _tranche The tranche to which the operator is de-authorised
    /// @param _operator An address which is being de-authorised
    function revokeOperatorByTranche(bytes32 _tranche, address _operator) public;

    /// @notice Determines whether `_operator` is an operator for a specified tranche of `_owner`
    /// @param _tranche The tranche to check
    /// @param _operator The operator to check
    /// @param _owner The owner to check
    /// @return Whether the `_operator` is an operator for a specified tranche of `_owner`
    function isOperatorForTranche(bytes32 _tranche, address _operator, address _owner) public view returns (bool);

    /// @notice Decreases totalSupply and the corresponding amount of msg.sender tranche
    /// @dev MUST revert if tokens not successfully burned
    /// @dev MUST emit event `Burned()`
    /// @dev MUST emit event `BurnedByTranche()`
    /// @param _tranche The tranche to allocate the decrease in balance
    /// @param _amount The amount by which to decrease the balance
    /// @param _data Additional data attached to the burning of tokens by msg.sender
    function burnByTranche(bytes32 _tranche, uint256 _amount, bytes _data) public;

    /// @notice Decreases totalSupply and the corresponding amount of the specified owners tranche
    /// @dev MUST revert if tokens not successfully burned
    /// @dev MUST emit event `Burned()`
    /// @dev MUST emit event `BurnedByTranche()`
    /// @param _owner The owner whose balance should be decreased
    /// @param _tranche The tranche to allocate the decrease in balance
    /// @param _amount The amount by which to decrease the balance
    /// @param _operatorData Additional data attached to the burning of tokens by the operator
    function operatorBurnByTranche(bytes32 _tranche, address _owner, uint256 _amount, bytes _operatorData) public;

    /// @notice This emits on any successful transfer or minting of tokens
    event SentByTranche(
        bytes32 indexed fromTranche,
        bytes32 toTranche,
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 amount,
        bytes data,
        bytes operatorData
    );

    /// @notice This emits on any increase to token supply
    event MintedByTranche(bytes32 indexed tranche, address indexed operator, address indexed to, uint256 amount, bytes data, bytes operatorData);

    /// @notice This emits on any decrease to token supply
    event BurnedByTranche(bytes32 indexed tranche, address indexed operator, address indexed from, uint256 amount, bytes operatorData);

    /// @notice This emits on any successful operator approval for a single tranche, excluding default tranche operators
    event AuthorizedOperatorByTranche(bytes32 indexed tranche, address indexed operator, address indexed tokenHolder);

    /// @notice This emits on any successful revoke of an operators approval for a single tranche
    event RevokedOperatorByTranche(bytes32 indexed tranche, address indexed operator, address indexed tokenHolder);

}
```

### Notes

`defaultOperators` can be used to transparently grant an account (which could be a multi-sig or other smart contract) unrestricted authorisation to transfer tokens for all owners and tranches. An implementation can enforce that this is always an empty list if required.

[TODO - Add more detail to the below section]

### EIP 165 Compliance

A Partially-Fungible Token MUST implement the ERC-165 interface and register as IERC165, and IERCPFT compliant. A token MAY register as ERC20 and ERC777 compliant if the appropriate functions are implemented based on the spec defined in ERC20 / ERC777 Backwards Compatibility.

### Rationale

There are many types of securities which, although they represent the same asset, need to have differentiating data tied to them.

This additional metadata implicitly renders these securities non-fungible, but in practice this data is usually applied to groups of securities rather than individual securities.

For example tokens may be split into those minted during the primary issuance, and those received through secondary trading.

Having this data allows token contracts to implement sophisticated logic to govern transfers from a particular tranche, and in determining the tranche into which to deposit the receivers balance.

### Caveats

Given the enumerable nature of an owners tranches, implementations should avoid using for / while loops to enumerate tranches on-chain. Doing so may incur unbounded gas costs or breach block gas limits.

### ERC20 / ERC777 Backwards Compatibility

In order to remain backwards compatible with ERC20 / ERC777 (and other fungible token standards) it is necessary to define what tranche or tranches are used when a `transfer` / `send` operation is executed (i.e. when not explicitly specifying the tranche).

If the implementation guarantees a small number of possible tranches per owner, it could be reasonable to iterate over all of an owners tranches.

The token creator MUST specify a default tranche which is used by the ERC20 / ERC777 functions for all users. Each user or operator of a user's full token balance for all tranches MAY change the default tranche of the user. The ability for a user to change their default tranche allows them to change the tranche displayed in ERC20 / ERC777 wallets which are not yet ERC-PFT compatible.

Here is a description of the implication for ERC777 functions:
- `send()` MUST obtain default tranche using `getDefaultTranche()`
- `operatorSend()` MUST obtain default tranche using `getDefaultTranche()`
- `burn()` MUST obtain default tranche using `getDefaultTranche()`
- `operatorBurn()` MUST obtain default tranche using `getDefaultTranche()`
- `balanceOf()` MUST count the sum of all tranche balances assigned to an owner
- `totalSupply()` MUST count all tokens tracked by this contract
- `defaultOperators()` MUST query a list of operators which can operate over all addresses and tranches
- `authorizeOperator()` MUST authorise an operator for all tranches of `msg.sender`
- `revokeOperator()` MUST revoke authorisation of an operator previously given for all tranches of `msg.sender`
- `isOperatorFor()` MUST query whether `_operator` is an operator for all tranches of `_owner`
- `event Minted()` and `event MintedByTranche()` MUST be emited for any increases in token supply
- `event Burned()` and `event BurnedByTranche()` MUST be emited for any decreases in token supply
- `event AuthorizedOperator()` MUST be emited by `authorizeOperator()`
- `event RevokedOperator()` MUST be emited by `revokeOperator()`

## Implementation
[Link to Polymath GitHub repo w/ reference implementation]

## Copyright
Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
