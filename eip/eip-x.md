---

eip: ERC-x
title: Custodial Ownership Standard (part of the ERC-1400 Security Token Standards)
discussions-to: #x
status: Draft
type: Standards Track
category: ERC
created: 2019-07-09
require: ERC20 / ERC720

---

## Simple Summary

This standard sits under the ERC-1400 (#1411) umbrella set of standards related to security tokens.

Provides a standard for separating the concepts of beneficial and custodial ownership of tokens.

## Abstract

Security tokens represent a way to record ownership of some underlying asset. ERC20 and other token standards represent this through a token balance associated with an Ethereum address representing the token owner.

Many use-cases require a more granular concept of ownership, and specifically security tokens may be held in custody by an entity on behalf of the token owner. In this case the token owner remains the beneficial owner of the security with respect to capital distribution and governance, whilst the custodian has exclusive rights over changing the beneficial owner.

Example 1:

  - a DeFi protocol requires you to provide security tokens as collateral. The DeFi smart contract must be able to transfer away your tokens if there is a liquidation event, so requires custodial ownership. The investor who is posting her tokens as collateral should continue to receive any dividends and be able to vote in any corporate actions.

Example 2:

  - the investor nominates a custodian to safe-guard their tokens. They transfer custodial ownership to the custodian, and retain capital distribution and governance rights. This means that their assets are secured (via the custodian in cold storage) whilst the investor can still use a hot wallet to interact with governance and capital distribution.

## Motivation

Within ERC20 the `approve` and `transferFrom` functions provide a kind of limited custodial ownership, but the token owner retains full rights to decrease the custody allowance or transferring tokens away entirely to a different address.

In practice this means that contracts which need to be able to guarantee control must hold tokens directly and retain a second balance mapping of tokens which it has under custody.

This ERC aims to make this common pattern simpler as well as differentiating between custodial and beneficial ownership so that owners of tokens do not have to give up these rights (or pass them through the custodian) in order to receive e.g. dividends and vote.

## Requirements

See ERC-1400 (#1411) for a full set of requirements across the library of standards.

## Rationale

Standardising this simplifies many use-cases and provides additional functionality for token holders in many domains.

## Specification

A token holder can choose to nominate a custodian for a fixed number of tokens.

A token holder cannot transfer away tokens which have been put into custody (across all custodians).

For example, Alice has 100 ACME:  

  - she sets a `custodyLimit` of 20 ACME to Bob
  - she sets a `custodyLimit` of 20 ACME to Charlie

Alice can now only transfer 60 ACME (she has a `totalCustodyLimit` of 40).

Alice can only put tokens into custody provided that she has sufficient free (un-custodied) allowance. This provides the guarantee that a custodian will always be able to transfer up to their custodyLimit of tokens.

As the custodian (external address or smart contract) exercises their right to transfer ACME tokens on behalf of Alice, their `custodyLimit` is decreased accordingly.

A custodian transfers tokens by calling `transferCustody`. Calling this function decreases a custodians custodyLimit appropriately on completion.

### increaseCustodyLimit

Used to increase the amount of tokens held in custody by the specified custodian. Note that a token holder can only ever increase this limit and cannot unilaterally decrease it. The only way this limit can be decreased is by the custodian transferring tokens. A custodian can transfer tokens back to the same beneficiary if they wish to remove their custody limit without impacting the beneficial owner.

`increaseCustodyLimit` must throw if unsuccessful.
The sum of `_amount` and `totalCustodyLimit` MUST NOT be greater than the token holders balance
The event `CustodyLimitChanged` MUST be emitted if the custody limit is successfully changed.

``` solidity
function increaseCustodyLimit(address _custodian, uint256 _amount) external;
```

### increaseCustodyLimitOf

As per `increaseCustodyLimit` but can be called by someone other than the token holder.

The token holder can provide the caller with signed data to authorise the custody limit being amended, and anyone (e.g. the custodian) can then call this function to update the custody limit.

`increaseCustodyLimitOf` must throw if unsuccessful.
The sum of `_amount` and `totalCustodyLimit` MUST NOT be greater than the token holders balance
The event `CustodyLimitChanged` MUST be emitted if the custody limit is successfully changed.

``` solidity
function increaseCustodyLimitOf(address _tokenHolder, address _custodian, uint256 _amount, uint256 _nonce, bytes _sig) external;
```

### custodyLimit

Returns the current custody limit associated with a token holder and custodian.

``` solidity
function custodyLimit(address _tokenHolder, address _custodian) external view returns (uint256);
```

### totalCustodyLimit

Returns the total amount of tokens that the token holder has assigned under custody to custodians.

The token holder MUST always have a token balance greater than their `totalCustodyLimit`
`totalCustodyLimit` MUST be the sum across all custodians of `custodyLimit`.

``` solidity
function totalCustodyLimit(address _tokenHolder) external view returns (uint256);
```

### transferCustody

Used by a custodian to transfer tokens over which they have custody.

MUST emit a `CustodyTransfer` event on successful completion.
MUST emit a `CustodyLimitChanged` event on successful completion.
MUST decrease the `custodyLimit` of the custodian by `_amount`

``` solidity
function transferCustody(address _tokenHolder, address _receiver, uint256 _amount) external;
```

## Interface

``` solidity
/// @title IERCx Custodial Ownership Standard (part of the ERC1400 Security Token Standards Library)
/// @dev See https://github.com/SecurityTokenStandard/EIP-Spec

interface IERCx {

    // Increase the custody limit of a custodian either directly or via signed authorisation
    function increaseCustodyLimit(address _custodian, uint256 _amount) external;
    function increaseCustodyLimitOf(address _tokenHolder, address _custodian, uint256 _amount, uint256 _nonce, bytes _sig) external;

    // Query individual custody limit and total custody limit across all custodians
    function custodyLimit(address _tokenHolder, address _custodian) external view returns (uint256);
    function totalCustodyLimit(address _tokenHolder) external view returns (uint256);

    // Allows a custodian to exercise their right to transfer custodied tokens
    function transferCustody(address _tokenHolder, address _receiver, uint256 _amount) external;

    // Custody Events
    event CustodyTransfer(address _custodian, address _from, address _to, uint256 _amount);
    event CustodyLimitChanged(address _tokenHolder, address _custodian, uint256 _oldLimit, uint256 _newLimit);

}
```

## References
- [EIP 1400: Security Token Standard](https://github.com/ethereum/EIPs/issues/1411)
- [EIP Draft](https://github.com/SecurityTokenStandard/EIP-Spec)
