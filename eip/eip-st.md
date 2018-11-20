---

eip: ERCXXX
title: Security Token Standard
author: Adam Dossa (@adamdossa), Pablo Ruiz (@pabloruiz55), Fabian Vogelsteller (@frozeman), Stephane Gosselin (@thegostep)
discussions-to: #1411
status: Draft
type: Standards Track
category: ERC
created: 2018-09-09
require: ERC-20 (#20), ERC-1066 (#1066)

---

## Simple Summary

A standard interface for issuing security tokens, managing their ownership and transfer restrictions.

This standard represents a decomposition of ERC-1400 (#1411) to split out the tranche functionality (ERC-1410 #1410) from the remainder of the security token functionality.

## Abstract

Incorporates document management, error signalling, gate keeper (operator) access control, off-chain data injection and issuance / redemption semantics.

This standard inherits from ERC-20 (#20) and could be easily extended to meet the ERC-777 (#777) standard if needed.

## Motivation

Accelerate the issuance and management of securities on the Ethereum blockchain by specifying a standard interface through which security tokens can be operated on and interrogated by all relevant parties.

Security tokens differ materially from other token use-cases, with more complex interactions between off-chain and on-chain actors, and considerable regulatory scrutiny.

Security tokens should be able to represent any asset class, be issued and managed across any jurisdiction, and comply with the associated regulatory restrictions.

## Requirements

Moving the issuance, trading and lifecycle events of a security onto a public ledger requires having a standard way of modeling securities, their ownership and their properties on-chain.

The following requirements have been compiled following discussions with parties across the Security Token ecosystem.

- MUST have a standard interface to query if a transfer would be successful and return a reason for failure.
- MUST be able to perform forced transfer for legal action or fund recovery.
- MUST emit standard events for issuance and redemption.
- MAY require signed data to be passed into a transfer transaction in order to validate it on-chain.
- SHOULD NOT restrict the range of asset classes across jurisdictions which can be represented.
- MUST be ERC-20 compatible.
- COULD be ERC-777 compatible.

## Rationale

### Document Management

Being able to attach documents to a security token allows the issuer, or other authorised entities, to communicate documentation associated with the security to token holders. An attached document can optionally include a hash of its contents in order to provide an immutability guarantee.

### Transfer Restrictions

Transfers of securities can fail for a variety of reasons in contrast to utility tokens which generally only require the sender to have a sufficient balance.

These conditions could be related to metadata of the securities being transferred (i.e. whether they are subject to a lock-up period), the identity of the sender and receiver of the securities (i.e. whether they have been through a KYC process, whether they are accredited or an affiliate of the issuer) or for reasons unrelated to the specific transfer but instead set at the token level (i.e. the token contract enforces a maximum number of investors or a cap on the percentage held by any single investor).

For ERC20 / ERC777 tokens, the `balanceOf` and `allowance` functions provide a way to check that a transfer is likely to succeed before executing the transfer, which can be executed both on and off-chain.

For tokens representing securities the standard introduces a function `canTransfer` which provides a more general purpose way to achieve this when the reasons for failure are more complex; and a function of the whole transfer (i.e. includes any data sent with the transfer and the receiver of the securities).

In order to support off-chain data inputs to transfer functions, transfer functions are extended to `transferWithData` / `transferFromWithData` which can optionally take an additional `bytes _data` parameter.

In order to provide a richer result than just true or false, a byte return code is returned. This allows us to give a reason for why the transfer failed, or at least which category of reason the failure was in. The ability to query documents and the expected success of a transfer is included in Security Token section.

### Transparent Control

A token representing ownership in a security may require authorised operators to have additional controls over the tokens.

This includes the ability to issue additional supply, as well as make forced transfers of tokens. The standard allows these controls to be managed and also critically ensures their transparency. If an issuer requires the ability to issue additional tokens, or make forced transfers (operator access) then these rights can be transparently assessed rather than being implemented in a bespoke or obfuscated manner.

## Specification

### Document Management

#### getDocument / setDocument

These functions are used to manage a library of documents associated with the token. These documents can be legal documents, or other reference materials.

A document is associated with a short name (represented as a `bytes32`) and can optionally have a hash of the document contents associated with it on-chain.

It is referenced via a generic URI that could point to a website or other document portal.

`setDocument` MUST emit a `Document` event with details of the document being attached or modified.

``` solidity
function getDocument(bytes32 _name) external view returns (string, bytes32);
function setDocument(bytes32 _name, string _uri, bytes32 _documentHash) external;
```

### Restricted Transfers

#### canTransfer

Transfers of securities may fail for a number of reasons, for example relating to:
  - the identity of the sender or receiver of the tokens
  - limits placed on the specific tokens being transferred (i.e. lockups on certain quantities of token)
  - limits related to the overall state of the token (i.e. total number of investors)

The standard provides an on-chain function to determine whether a transfer will succeed, and return details indicating the reason if the transfer is not valid.

These rules can either be defined using smart contracts and on-chain data, or rely on `_data` passed as part of the `transferWithData` function which could represent authorisation for the transfer (e.g. a signed message by a transfer agent attesting to the validity of this specific transfer).

The function will return both a ESC (Ethereum Status Code) following the EIP-1066 standard, and an additional `bytes32` parameter that can be used to define application specific reason codes with additional details (for example the transfer restriction rule responsible for making the transfer operation invalid).

If `bytes _data` is empty, then this corresponds to a check on whether a `transfer` (or `transferFrom`) request will succeed, if `bytes _data` is populated, then this corresponds to a check on `transferWithData` (or `transferFromWithData`) will succeed.

``` solidity
function canTransfer(address _from, address _to, uint256 _amount, bytes _data) external view returns (byte, bytes32);
```

#### transferWithData

Transfer restrictions can take many forms and typically involve on-chain rules or whitelists. However for many types of approved transfers, maintaining an on-chain list of approved transfers can be cumbersome and expensive. An alternative is the co-signing approach, where in addition to the token holder approving a token transfer, and authorised entity provides signed data which further validates the transfer.

The `bytes _data` allows arbitrary data to be submitted alongside the transfer, for the token contract to interpret or record. This could be signed data authorising the transfer (e.g. a dynamic whitelist) but is flexible enough to accomadate other use-cases.

`transferWithData` MUST emit a `Transfer` event with details of the transfer.

``` solidity
function transferWithData(address _to, uint256 _amount, bytes _data) external;
```

#### operatorTransferWithData

This is the operator driven analogy to the `transferWithData` function.

``` solidity
function operatorTransferWithData(address _from, address _to, uint256 _amount, bytes _data, bytes _operatorData) external;
```

### Token Issuance

#### isIssuable

A security token issuer can specify that issuance has finished for the token (i.e. no new tokens can be minted or issued).

If a token returns FALSE for `isIssuable()` then it MUST always return FALSE in the future.

If a token returns FALSE for `isIssuable()` then it MUST never allow additional tokens to be issued.

``` solidity
function isIssuable() external view returns (bool);
```

#### issue

This function must be called to increase the total supply.

The `bytes _data` parameter can be used to inject off-chain data (e.g. signed data) to authorise or authenticate the issuance and receiver of issued tokens.

When called, this function MUST emit the `Issued` event.

``` solidity
function issue(address _tokenHolder, uint256 _amount, bytes _data) external;
```

### Token Redemption

#### operatorRedeem

Allows an operator to redeem (burn) tokens on behalf of a token holder.

The redeemed tokens must be subtracted from the total supply and the balance of the token holder. The token redemption should act like sending tokens and be subject to the same conditions. The `Redeemed` event must be emitted every time this function is called.

``` solidity
function operatorRedeem(address _tokenHolder, uint256 _amount, bytes _data, bytes _operatorData) external;
```

#### redeem

Allows a token holder to redeem tokens.

The redeemed tokens must be subtracted from the total supply and the balance of the token holder. The token redemption should act like sending tokens and be subject to the same conditions. The `Redeemed` event must be emitted every time this function is called.

``` solidity
function redeem(uint256 _amount, bytes _data) external;
```

### Controller Operation

In order to provide transparency over whether `defaultOperators` can be defined by the issuer, the function `isControllable` can be used.

If a token returns FALSE for `isControllable()` then it MUST:
  - always return FALSE in the future.
  - return empty lists for `defaultOperators`
  - never add new addresses for `defaultOperators`

In other words, if an issuer sets `isControllable` to return FALSE, then there can be no default operators for the token.

``` solidity
function isControllable() external view returns (bool);
```

### Interface

``` solidity
/// @title IERCST Security Token Standard (EIP 1400)
/// @dev See https://github.com/SecurityTokenStandard/EIP-Spec

interface IERCST is IERC20 {

    // Document Management
    function getDocument(bytes32 _name) external view returns (string, bytes32);
    function setDocument(bytes32 _name, string _uri, bytes32 _documentHash) external;

    // Transfers
    function transferWithData(address _to, uint256 _value, bytes _data) external;
    function transferFromWithData(address _from, address _to, uint256 _value, bytes _data) external;

    // Controller Operation
    function isControllable() external view returns (bool);
    function controllerTransfer(address _from, address _to, uint256 _value, bytes _data, bytes _operatorData) external;

[delete]
    // Operator Management
    function defaultOperators() external view returns (address[]);
    function isOperator(address _operator, address _tokenHolder) external view returns (bool);
    function authorizeOperator(address _operator) external;
    function revokeOperator(address _operator) external;
[/delete]

    // Token Issuance
    function isIssuable() external view returns (bool);
    function issue(address _tokenHolder, uint256 _amount, bytes _data) external;
    event Issued(address indexed operator, address indexed to, uint256 amount, bytes data);

    // Token Redemption
    function redeem(uint256 _amount, bytes _data) external;
    function redeemFrom(address _tokenHolder, uint256 _amount, bytes _data) external;
    event Redeemed(address indexed operator, address indexed from, uint256 amount, bytes data);

    // Transfer Validity
    function canTransfer(address _from, address _to, uint256 _amount, bytes _data) external view returns (byte, bytes32);

    // Transfer Events
    event ControllerTransfer(
        address controller,
        address indexed from,
        address indexed to,
        uint256 amount,
        bytes data,
        bytes operatorData
    );

    event Document(
        bytes32 name,
        string uri,
        bytes32 documentHash
    );

}
```

### Notes

#### Forced Transfers

It may be that regulations require an issuer or a trusted third party to retain the power to transfer tokens on behalf of investors. As such, the ERC-1400 (Security Token Standard) specification supersedes ERC-1410 (Partially Fungible Tokens) in that a token holder MUST NOT be allowed revoke a default operator or tranche default operator.

#### Restricted Transfers

Transfers of security tokens can fail for a number of reasons in contrast to utility tokens which generally only require the sender to have a sufficient balance.

These conditions could be related to metadata of the security tokens being transferred (i.e. whether they are subject to a lock-up period), the identity and eligibility of the sender and receiver of the tokens (i.e. whether they have been through a KYC process and whether they are accredited or an affiliate of the issuer) or for reasons unrelated to the specific transfer but instead set at the security level for regulatory purposes (i.e. the security enforces a maximum number of investors or a cap on the percentage held by any single investor).

For utility tokens (ERC20 / ERC777) the `balanceOf` and `allowance` functions provide a way to check that a transfer is likely to succeed before executing the transfer which, can be executed both on and off-chain.

The standard introduces a function `canSend` which provides a more general purpose way to query if sending tokens would be successful. It accepts a set of parameters which may include signed data and returns a reason byte code with information about the success or failure of the transaction.

NB - the result of a call to `canSend` may change depending on on-chain state (including block numbers or timestamps) and possibly off-chain oracles. As such, it does not provide guarantees that a future transfer will be successful after being called as a view function that does not modify any state.

#### Identity

Under many jurisdictions, whether a party is able to receive and send security tokens depends on the characteristics of the party's identity. For example, most jurisdictions require some level of KYC / AML process before a party is eligible to purchase or sell a particular security. Additionally, a party may be categorized into an investor qualification category (e.g. accredited investor, qualified purchaser), and their citizenship may also inform restrictions associated with their securities.

There are various identity standards (e.g. ERC725, Civic, uPort) which can be used to capture the party's identity data, as well as other approaches which are centrally managed (e.g. maintaining a whitelist of addresses that have been approved from a KYC perspective). These identity standards have in common to key off an Ethereum address (which could be a party's wallet, or an identity contract), and as such the `canSend` function can use the address of both the sender and receiver of the security token as a proxy for identity in deciding if eligibility requirements are met.

Beyond this, the standard does not mandate any particular approach to identity.

#### Reason Codes

To improve the token holder experience, `canSend` MUST return a reason byte code on success or failure based on the EIP-1066 application-specific status codes specified below. An implementation can also return arbitrary data as a `bytes32` to provide additional information not captured by the reason code.

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

The rules determining if a security token can be sent may be self-executing (e.g. a rule which limits the maximum number of investors in the security) or require off-chain inputs (e.g. an explicit broker approval for the trade). To facilitate the latter, the `transferByTranche` and `canSend` functions accept an additional `bytes _data` parameter which can be signed by an approved party and used to validate a transfer.

The specification for this data is outside the scope of this standard and would be implementation specific.

## References
- [EIP 1410: Partially Fungible Token Standard](https://github.com/ethereum/EIPs/issues/1410)
- [EIP Draft](https://github.com/SecurityTokenStandard/EIP-Spec)

_Copied from original issue_: https://github.com/ethereum/EIPs/issues/1400
