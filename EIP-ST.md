---

eip: ERC-ST (working name until EIP assigned)
title: Standard for Security Tokens
author: Adam Dossa, Pablo Ruiz, Fabian Vogelsteller, Stephane Gosselin
discussions-to: ststandard@polymath.network
status: Draft
type: Standards Track
category: ERC
created: 2018-08-05
require: ERC1066, ERC165, ERC820, ERC-PFT

---

## Simple Summary

A standard interface for representing securities and their ownership.

## Abstract

Extends EIP-PFT to provide additional methods for verifying transfers and capturing data about the security.

## Specification

```
/// @title ERC-ST Fungible Token Metadata Standard
/// @dev See https://github.com/ethereum/EIPs/blob/master/EIPS/eip-ST.md
///  Note: the ERC-165 identifier for this interface is [TODO].

interface IERCST is IERCPFT {

    /// @notice Returns the URI associated with a named document
    /// @param _name The name of the document to fetch the URI for
    /// @return A URI for the named document
    /// @return A hash of the URI linked document (optional - set to 0x0 if not required)
    function getDocument(bytes32 _name) public view returns (string, bytes32)

    /// @notice Sets a URI for a named document, and an optional hash of the document contents
    /// @param _name The name of the document to fetch the URI for
    /// @param _uri The URI for the document
    /// @param _documentHash A hash of the document content (optional - set to 0x0 if not required)
    function setDocument(bytes32 _name, string _uri, bytes32 _documentHash) public;

    /// @notice Used to indicate that no more securities can be issued (irreversible)
    /// @param _declaration A signed statement indicating that the caller acknowledges that this action is irreversible
    function finishMinting(bytes32 _declaration) public;

    /// @notice Used to check whether additional securities can be minted
    /// @return A boolean indicating whether additional securities can be minted
    function canMint() public view returns (bool);

    /// @notice Verifies whether a transfer would succeed or not
    /// @param _from The address from which to transfer tokens
    /// @param _to The address to which to transfer tokens
    /// @param _tranche The tranche from which to transfer tokens
    /// @param _amount The amount of tokens to transfer from `_tranche`
    /// @param _data Additional data attached to the transfer of tokens
    /// @return A reason code related to the success or failure of the send operation following the specification
    /// @return Arbitrary data a token implementation can append as further explanation for the reason code
    /// @return The tranche to which the transferred tokens were allocated for the _to address
    function verifySendTranche(address _from, address _to, bytes32 _tranche, uint256 _amount, bytes _data) public view returns (byte, bytes32, bytes32);

}
```

### Notes

This standard extends EIP-PFT to add additional features required to represent securities.

The result of a call to verifySendTranche may change depending on on-chain state (including block numbers or timestamps) and possibly off-chain oracles. If it is called, not as part of a transfer itself, but in a speculative fashion (i.e. not as part of a transfer), it should be considered a view function that does not modify any state.

### Rationale

There are many types of securities which, although they represent the same asset, need to have differentiating data tied to them.

This additional metadata implicitly renders these securities non-fungible, but in practice this data is usually applied to groups of securities rather than individual securities.

For example tokens may be split into those minted during the primary issuance, and those received through secondary trading.

Having this data allows token contracts to implement sophisticated logic to govern transfers from a particular tranche, and in determining the tranche into which to deposit the receivers balance.

Transfers of securities can fail for a number of reasons in contrast to utility tokens which generally only require the sender to have a sufficient balance.

These conditions could be related to metadata of the shares being transferred (i.e. whether they are subject to a lock-up period), the identity of the sender and receiver of the securities (i.e. whether they have been through a KYC process and whether they are accredited or an affiliate of the issuer) or for reasons unrelated to the specific transfer but instead set at the security level (i.e. the security enforces a maximum number of investors or a cap on the percentage held by any single investor).

For utility ERC20 / ERC77 tokens the `balanceOf` and `allowance` functions provide a way to check that a transfer is likely to succeed before executing the transfer which can be executed both on and off-chain.

For tokens representing securities we introduce a function `verifySendTranche` which provides a more general purpose way to achieve this when the reasons for failure are more complex and a function of the whole transfer (i.e. includes any data sent with the transfer and the receiver of the securities).

In order to provide a richer result than just true or false, a byte return code is returned. This allows us to give an reason for why the transfer failed, or at least which category of reason the failure was in.

### Reason Codes

Sending a security token could fail for any number of reasons. To improve the user experience, `verifySendTranche` MUST return a reason code on success or failure based on the EIP-1066 application-specific status codes specified below. An implementation can also return arbitrary data as a `bytes32` to provide additional information not captured by the reason code.

| Code   | Reason                                                        |
| ------ | ------------------------------------------------------------- |
| `0xA0` | Transfer Verified - Unrestricted                              |
| `0xA1` | Transfer Verified - Rule Engine Approval for Restricted Token |
| `0xA2` | Transfer Verified - Off-Chain Approval for Restricted Token   |
| `0xA3` | Transfer Blocked - Sender lockup period not ended             |
| `0xA4` | Transfer Blocked - Sender balance insufficient                |
| `0xA5` | Transfer Blocked - Sender not whitelisted                     |
| `0xA6` | Transfer Blocked - Receiver not whitelisted                   |
| `0xA6` | Transfer Blocked - Identity restriction                       |
| `0xA7` | Transfer Blocked - Token restriction                          |
| `0xA8` | Transfer Blocked - Token granularity                          |
| `0xA9` |                                                               |
| `0xAA` |                                                               |
| `0xAB` |                                                               |
| `0xAC` |                                                               |
| `0xAD` |                                                               |
| `0xAE` |                                                               |
| `0xAF` |                                                               |

[TODO - improve list of reason codes based on community feedback]

### ERC20 / ERC777 Backwards Compatibility

If the EIP-PFT implementation is ERC20 / ERC777 compatible (by adding send / transfer functions which define default tranches to operate on) then verifySend should be correspondingly implemented to use the same default logic.

### On-chain vs. Off-chain Transfer Restrictions

Transfers may be restricted or unrestricted based on rules that form part of the code for the securities contract. These rules may be self-contained (e.g. a rule which limits the maximum number of investors in the security) or require off-chain inputs (e.g. an explicit broker approval for the trade). To facilitate the latter, the sendTranche and verifySendTranche functions take an additional `bytes _data` parameter which can be used by a token owner or operator to provide additional data for the contract to interpret when considering whether the transfer should be allowed.

The specification for this data is outside the scope of this standard and would be implementation specific.

## Implementation
[Link to Polymath GitHub repo w/ reference implementation]

## Copyright
Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
