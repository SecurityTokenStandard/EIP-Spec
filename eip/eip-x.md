---

eip: ERC-x
title: Custodial Ownership Standard (part of the ERC-1400 Security Token Standards)
discussions-to: #x
status: Draft
type: Standards Track
category: ERC
created: 2019-07-09
require:

---

## Simple Summary

[TODO] This standard sits under the ERC-1400 (#1411) umbrella set of standards related to security tokens.

Provides a standard for separating the concepts of beneficial and custodial ownership of tokens.

## Abstract

Security tokens represent a way to record ownership of some underlying asset. ERC20 and other token standards represent this through a token balance associated with an Ethereum address representing the asset owner.

Many use-cases require a more granular concept of ownership, and specifically security tokens may be held in custody by an entity on behalf of the token owner. In this case the token owner remains the beneficial owner of the security with respect to capital distribution and governance, whilst the custodian has exclusive rights over changing the beneficial owner.

Example 1:

  - a DeFi protocol requires you to provide security tokens as collateral. The DeFi smart contract must be able to transfer away your tokens if there is a liquidation event, so requires custodial ownership. The investor who is posting her tokens as collateral should continue to receive any dividends and be able to vote in any corporate actions.

Example 2:

  - the investor nominates a custodian to safe-guard their tokens. They transfer custodial ownership to the custodian, and retain capital distribution and governance rights. This means that their assets are secured (via the custodian in cold storage) whilst the investor can still use a hot wallet to interact with governance and capital distribution.

## Motivation

Within ERC20 the `approve` and `transferFrom` functions provide a kind of limited custodial ownership, but the token owner retains full rights to decrease the custody allowance or transferring tokens away entirely to a different address.

In practice this means that entities which need to be able to guarantee control must hold tokens directly and retain a second balance mapping of tokens to owners, for the balance it has under custody.

This ERC aims to make this common pattern simpler as well as differentiating between custodial and beneficial ownership so that owners of tokens do not have to give up these rights (or pass them through the custodian) in order to receive e.g. dividends and vote.

Removing the requirement for custodians (external addresses or contracts) to transfer balances to themselves in order to act as custodians also means that token issuers see a consistent "cap table" of ownership when looking at token balances (e.g. through etherscan.io).

## Requirements

See ERC-1400 (#1411) for a full set of requirements across the library of standards.

## Rationale

Standardising this simplifies many use-cases and provides additional functionality for token holders in many domains.

Allows DeFi contracts to interact with security tokens in a standardised fashion improving composibility of protocols.

## Specification

A token holder can choose to nominate a custodian for a fixed number of tokens.

A token holder cannot transfer away tokens which have been put into custody (across all custodians).

For example, Alice has 100 ACME:  

  - she sets a `custodyAllowance` of 20 ACME to Bob (a custodian)  
  - she sets a `custodyAllowance` of 20 ACME to Charlie (a custodian)  

Alice can now only transfer 60 ACME (she has a `totalCustodyAllowance` of 40).

Alice can only put tokens into custody provided that she has sufficient free (un-custodied) balance. This provides the guarantee that a custodian will always be able to transfer up to their custodyAllowance of tokens. This means that the base transfer function must ensure that the remaining balance of the token holder is at least `totalCustodyAllowance` and otherwise revert.

As the custodian (external address or smart contract) exercises their right to transfer ACME tokens on behalf of Alice, their `custodyAllowance` is decreased accordingly.

A custodian transfers tokens by calling `transferByCustodian`. Calling this function decreases a custodians custodyAllowance appropriately on completion.

If the token also implements ERC-1410, then the `totalCustodyAllowance` can be presented as a partition of the token holders balance.

When a custodian is transferring tokens on behalf of a token holder, any other transfer rules must be respected (e.g. `canTransfer` should be true for the tokens being transferred from the current beneficial owner to the new owner irrespective of the fact that they are being transferred by a custodian rather than directly by the beneficial owner).

### increaseCustodyAllowance

Used to increase the amount of tokens held in custody by the specified custodian. Note that a token holder can only ever increase this limit and cannot unilaterally decrease it. The only way this limit can be decreased is by the custodian transferring tokens. A custodian can transfer tokens back to the same beneficiary if they wish to remove their custody limit without impacting the beneficial owner.

`increaseCustodyAllowance` must throw if unsuccessful.  
The sum of `_amount` and `totalCustodyAllowance` MUST NOT be greater than the token holders balance.  
The event `CustodyAllowanceChanged` MUST be emitted if the custody limit is successfully changed.  

``` solidity
function increaseCustodyAllowance(address _custodian, uint256 _amount) external;
```

### increaseCustodyAllowanceOf

As per `increaseCustodyAllowance` but can be called by someone other than the token holder.

The token holder can provide the caller with signed data to authorise the custody limit being amended, and anyone (e.g. the custodian) can then call this function to update the custody limit.

`increaseCustodyAllowanceOf` must throw if unsuccessful.  
The sum of `_amount` and `totalCustodyAllowance` MUST NOT be greater than the token holders balance.  
The event `CustodyAllowanceChanged` MUST be emitted if the custody limit is successfully changed.  

``` solidity
function increaseCustodyAllowanceOf(address _tokenHolder, address _custodian, uint256 _amount, uint256 _nonce, bytes _sig) external;
```

### custodyAllowance

Returns the current custody limit associated with a token holder and custodian.

``` solidity
function custodyAllowance(address _tokenHolder, address _custodian) external view returns (uint256);
```

### totalCustodyAllowance

Returns the total amount of tokens that the token holder has assigned under custody to custodians.

The token holder MUST always have a token balance greater than their `totalCustodyAllowance`.  
`totalCustodyAllowance` MUST be the sum across all custodians of `custodyAllowance`.  

``` solidity
function totalCustodyAllowance(address _tokenHolder) external view returns (uint256);
```

### transferByCustodian

Used by a custodian to transfer tokens over which they have custody.

MUST emit a `CustodyTransfer` event on successful completion.  
MUST emit a `CustodyAllowanceChanged` event on successful completion.  
MUST decrease the `custodyAllowance` of the custodian by `_amount`.  

``` solidity
function transferByCustodian(address _tokenHolder, address _receiver, uint256 _amount) external;
```

## Interface

``` solidity
/// @title IERCx Custodial Ownership Standard (part of the ERC1400 Security Token Standards Library)
/// @dev See https://github.com/SecurityTokenStandard/EIP-Spec

interface IERCx {

    // Increase the custody limit of a custodian either directly or via signed authorisation
    function increaseCustodyAllowance(address _custodian, uint256 _amount) external;
    function increaseCustodyAllowanceOf(address _tokenHolder, address _custodian, uint256 _amount, uint256 _nonce, bytes _sig) external;

    // Query individual custody limit and total custody limit across all custodians
    function custodyAllowance(address _tokenHolder, address _custodian) external view returns (uint256);
    function totalCustodyAllowance(address _tokenHolder) external view returns (uint256);

    // Allows a custodian to exercise their right to transfer custodied tokens
    function transferByCustodian(address _tokenHolder, address _receiver, uint256 _amount) external;

    // Custody Events
    event CustodyTransfer(address _custodian, address _from, address _to, uint256 _amount);
    event CustodyAllowanceChanged(address _tokenHolder, address _custodian, uint256 _oldAllowance, uint256 _newAllowance);

}
```

## References
- [EIP 1400: Security Token Standard](https://github.com/ethereum/EIPs/issues/1411)
- [EIP Draft](https://github.com/SecurityTokenStandard/EIP-Spec)
