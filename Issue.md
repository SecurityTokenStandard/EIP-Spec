---

eip: ERC-ST (working name until EIP assigned)
title: Standard for Security Tokens
author: Adam Dossa, Pablo Ruiz, Fabian Vogelsteller, Stephane Gosselin
discussions-to: https://github.com/ethereum/EIPs/issues/1390
status: Draft
type: Standards Track
category: ERC
created: 2018-09-09
require: ERC-777, ERC-1066

---

# Security Token Standard

## Motivation

Accelerate the issuance and management of securities on the Ethereum blockchain by specifying a standard interface through which security tokens can be operated on and interrogated by all relevant parties.

Security tokens differ materially from other token use-cases, with more complex interactions between off-chain and on-chain actors, and considerable regulatory scrutiny.

Security tokens should be able to represent any asset class, issued and managed across any jurisdiction, with the associated regulatory restrictions.

## Requirements

Moving the issuance, trading and lifecycle events of a security onto a public ledger requires having a standard way of modelling securities, their ownership and their properties on-chain.

The following requirements have been compiled following discussions with parties across the Security Token ecosystem.

- MUST have a standard interface to query if a transfer would be successful and return a reason for failure.
- MUST be able to perform forced transfer for legal action or fund recovery.
- MUST emit standard events for minting and burning.
- MUST be able to attach metadata to a subset of a user's balance such as special shareholder rights or data for transfer restrictions.
- MUST be able to modify metadata at time of transfer based on off-chain data, on-chain data and the parameters of the transfer.
- MAY require signed data to be passed into a transfer transaction in order to validate it on-chain.
- SHOULD NOT restrict the range of asset classes across jurisdictions which can be represented.
- SHOULD be ERC20 and ERC777 compatible.

## Abstract

There are many types of securities which, although they represent the same underlying asset, need to have differentiating data tied to them.

This additional metadata implicitly renders these securities non-fungible, but in practice this data is usually applied to a subset of the security rather than an individual security. The ability to partition a token holders balance into tranches, each with separate metadata is addressed in the Partially-Fungible Token section.

For example a token holders balance may be split into those tokens minted during the primary issuance, and those received through secondary trading.

Security token transfers can reference this metadata in order to apply additional logic to determine whether or not the transfer is valid, and the metadata that should be associated with the tokens once transferred into the receivers balance.

--

Transfers of securities can fail for a variety of reasons in contrast to utility tokens which generally only require the sender to have a sufficient balance.

These conditions could be related to metadata of the securities being transferred (i.e. whether they are subject to a lock-up period), the identity of the sender and receiver of the securities (i.e. whether they have been through a KYC process, whether they are accredited or an affiliate of the issuer) or for reasons unrelated to the specific transfer but instead set at the token level (i.e. the token contract enforces a maximum number of investors or a cap on the percentage held by any single investor).

For ERC20 / ERC777 tokens the `balanceOf` and `allowance` functions provide a way to check that a transfer is likely to succeed before executing the transfer which can be executed both on and off-chain.

For tokens representing securities we introduce a function `checkSecurityTokenSend` which provides a more general purpose way to achieve this when the reasons for failure are more complex and a function of the whole transfer (i.e. includes any data sent with the transfer and the receiver of the securities).

In order to provide a richer result than just true or false, a byte return code is returned. This allows us to give an reason for why the transfer failed, or at least which category of reason the failure was in. The ability to query documents and the expected success of a transfer is included in Security Token section.

--



## Partially-Fungible Token

A Partially-Fungible Token allows for attaching metadata to a partial balance of a token holder. These partial balances are called tranches and are indexed by a `bytes32 _tranche` key which can be associated with metadata on-chain or off-chain.

### Sending Tokens

Token transfers always have an associated source and destination tranche, as well as the usual amounts and sender / receiver addresses.

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

As an example, a permissioned token may use tranche metadata to enfore transfer restrictions based on:
  - the `_tranche` value
  - any additional data associated with the `_tranche` value (e.g. a lockup timestamp that may be associated with `_tranche`)
  - any details associated with the sender or receiver of tokens (e.g. has their identity been established)
  - the amount of tokens being transferred (e.g. does it respect any daily or other period based volume restrictions)
  - the `_data` parameter allows the caller to supply any additional authorisation or details associated with the transfer (e.g. signed data from an authorised entity who is permissioned to authorise the transfer)

Other use-cases include tracking provenance of tokens by associating previous holders with destination tranches.

This function MUST throw if the transfer of tokens is not successful for any reason.

When transferring tokens from a particular tranche, it is useful to know on-chain (i.e. not just via an event being fired) the destination tranche of those tokens. The destination tranche will be determined by the implementation of this function and will vary depending on use-case.

This function MUST emit a `SentByTranche` event for successful transfers.

``` solidity
function sendByTranche(bytes32 _tranche, address _to, uint256 _amount, bytes _data) external returns (bytes32);
function sendByTranches(bytes32[] _tranches, address[] _tos, uint256[] _amounts, bytes _data) external returns (bytes32);
```

#### tranchesOf

A token holder may have their balance split into several partitions (tranches) - this function will return all of the tranches associated with a particular token holder address.

``` solidity
function tranchesOf(address _owner) external view returns (bytes32[]);
```

### Operators

Operators can be authorised for:
  - all owners and tranches (`defaultOperators` inherited from ERC777)
  - all owners for a specific tranche (`defaultOperatorsByTranche`)
  - all tranches (current and future) for a specific owner (`isOperatorFor` inherited from ERC777)
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

### Interface

``` solidity
/// @title ERC-PFT Fungible Token Metadata Standard
/// @dev See https://github.com/SecurityTokenStandard/EIP-Spec

interface IERCPFT is IERC777 {

    function getDefaultTranches(address _owner) external view returns (bytes32[]);
    function setDefaultTranche(bytes32[] _tranches) external;
    function balanceOfByTranche(bytes32 _tranche, address _owner) external view returns (uint256);
    function sendByTranche(bytes32 _tranche, address _to, uint256 _amount, bytes _data) external returns (bytes32);
    function sendByTranches(bytes32[] _tranches, address[] _tos, uint256[] _amounts, bytes _data) external returns (bytes32);
    function operatorSendByTranche(bytes32 _tranche, address _from, address _to, uint256 _amount, bytes _data, bytes _operatorData) external returns (bytes32[]);
    function operatorSendByTranches(bytes32[] _tranches, address[] _froms, address[] _tos, uint256[] _amounts, bytes _data, bytes _operatorData) external returns (bytes32[]);
    function tranchesOf(address _owner) external view returns (bytes32[]);
    function defaultOperatorsByTranche(bytes32 _tranche) external view returns (address[]);
    function authorizeOperatorByTranche(bytes32 _tranche, address _operator) external;
    function revokeOperatorByTranche(bytes32 _tranche, address _operator) external;
    function isOperatorForTranche(bytes32 _tranche, address _operator, address _owner) external view returns (bool);
    function burnByTranche(bytes32 _tranche, uint256 _amount, bytes _data) external;
    function operatorBurnByTranche(bytes32 _tranche, address _owner, uint256 _amount, bytes _operatorData) external;

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
    event AuthorizedOperatorByTranche(bytes32 indexed tranche, address indexed operator, address indexed tokenHolder);
    event RevokedOperatorByTranche(bytes32 indexed tranche, address indexed operator, address indexed tokenHolder);
    event BurnedByTranche(bytes32 indexed tranche, address indexed operator, address indexed from, uint256 amount, bytes operatorData);

}
```

### Notes

#### ERC20 / ERC777 Backwards Compatibility

In order to remain backwards compatible with ERC20 / ERC777 (and other fungible token standards) it is necessary to define what tranche or tranches are used when a `transfer` / `send` operation is executed (i.e. when not explicitly specifying the tranche).

If the implementation guarantees a small number of possible tranches per owner, it could be reasonable to iterate over all of an owners tranches (using `tranchesOf`).

The token creator MUST specify a default tranche(s) which is used by the ERC20 / ERC777 functions for all users. Each user or operator of a user's full token balance for all tranches MAY change the default tranche of the user. The ability for a user to change their default tranche allows them to change the tranche displayed in ERC20 / ERC777 wallets which are not yet ERC-PFT compatible.

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

## Security Token

### Methods

#### getDocument / setDocument

These functions are used to manage a library of documents associated with the token. These documents can be legal documents, or other reference materials.

A document is associated with a short name (represented as a `bytes32`) and can optionally have a hash of the document contents associated with it on-chain.

``` solidity
function getDocument(bytes32 _name) public view returns (string, bytes32);
function setDocument(bytes32 _name, string _uri, bytes32 _documentHash) public;
```

#### checkSecurityTokenSend

Transfers of securities may fail for a number of reasons, for example relating to:
  - the identity of the sender or receiver of the tokens
  - limits placed on the specific tokens being transferred (i.e. limits associated with the tranche of the tokens being tranferred)
  - limits related to the overall state of the token (i.e. total number of investors)

The standard provides an on-chain function to determine whether a transfer will succeed, and return details indicating the reason if the transfer is not valid.

These rules can either be defined using smart contracts and on-chain data, or rely on `_data` passed as part of the `sendByTranche` function which could represent authorisation for the transfer (e.g. a signed message by a transfer agent attesting to the validity of this specific transfer).

The function will return both a ESC (Ethereum Status Code) following the EIP-1066 standard, and an additional `bytes32` parameter that can be used to define application specific reason codes with additional details (for example the transfer restriction rule responsible for making the send operation invalid).

It also returns the destination tranche of the tokens being transferred in an analogous way to `sendByTranche`.

``` solidity
function checkSecurityTokenSend(address _from, address _to, bytes32 _tranche, uint256 _amount, bytes _data) public view returns (byte, bytes32, bytes32);
```

#### mintable

A security token issuer can specify that issuance has finished for the token (i.e. no new tokens can be minted).

If a token returns FALSE for `mintable()` then it MUST always return FALSE in the future.

``` solidity
function mintable() external view returns (bool);
```

### Interface

``` solidity
/// @title ERC-ST Fungible Token Metadata Standard
/// @dev See https://github.com/ethereum/EIPs/blob/master/EIPS/eip-ST.md

interface IERCST is IERCPFT {
    function getDocument(bytes32 _name) external view returns (string, bytes32);
    function setDocument(bytes32 _name, string _uri, bytes32 _documentHash) external;
    function mintable() external view returns (bool);
    function checkSecurityTokenSend(address _from, address _to, bytes32 _tranche, uint256 _amount, bytes _data) external view returns (byte, bytes32, bytes32);
    function mintByTranche(bytes32 _tranche, address _owner, uint256 _amount, bytes _data) external;
    event MintedByTranche(bytes32 indexed tranche, address indexed operator, address indexed to, uint256 amount, bytes data, bytes operatorData);
}
```

### Notes

#### Forced Transfers

It may be that regulations require an issuer or a trusted third party to retain the power to transfer tokens on behalf of investors. As such, the ERC-ST specification supersedes ERC-PFT in that a token holder MUST NOT be allowed revoke a default operator.

#### Reason Codes

Sending a security token could fail for any number of reasons. To improve the user experience, `checkSecurityTokenSend` MUST return a reason code on success or failure based on the EIP-1066 application-specific status codes specified below. An implementation can also return arbitrary data as a `bytes32` to provide additional information not captured by the reason code.

| Code   | Reason                                                        |
| ------ | ------------------------------------------------------------- |
| `0xA0` | Transfer Verified - Unrestricted                              |
| `0xA1` | Transfer Verified - On-Chain approval for restricted token    |
| `0xA2` | Transfer Verified - Off-Chain approval for restricted token   |
| `0xA3` | Transfer Blocked - Sender lockup period not ended             |
| `0xA4` | Transfer Blocked - Sender balance insufficient                |
| `0xA5` | Transfer Blocked - Sender not eligible                        |
| `0xA6` | Transfer Blocked - Receiver not eligible                      |
| `0xA7` | Transfer Blocked - Identity restriction                       |
| `0xA8` | Transfer Blocked - Token restriction                          |
| `0xA9` | Transfer Blocked - Token granularity                          |
| `0xAA` |                                                               |
| `0xAB` |                                                               |
| `0xAC` |                                                               |
| `0xAD` |                                                               |
| `0xAE` |                                                               |
| `0xAF` |                                                               |

#### On-chain vs. Off-chain Transfer Restrictions

Transfers may be restricted or unrestricted based on rules that form part of the code for the securities contract. These rules may be self-contained (e.g. a rule which limits the maximum number of investors in the security) or require off-chain inputs (e.g. an explicit broker approval for the trade). To facilitate the latter, the `sendByTranche` and `checkSecurityTokenSend` functions take an additional `bytes _data` parameter which can be used by a token owner or operator to provide additional data for the contract to interpret when considering whether the transfer should be allowed.

The specification for this data is outside the scope of this standard and would be implementation specific.

## References
- [EIP Draft](https://github.com/SecurityTokenStandard/EIP-Spec)
