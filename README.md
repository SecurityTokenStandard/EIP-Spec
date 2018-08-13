# Security Token Standard

## Introduction

Moving the issuance, trading and lifecycle events of a security onto a public ledger requires having a standard way of modelling securities, their ownership and their properties on-chain.

A security token requires the following features:

  - ability to associate metadata with specific securities which are otherwise fungible

  - flexibility in permissioning and control

  - ability to moderate transfers of securities using either an on-chain codified rule set or off-chain approvals (e.g. restrict transfers)

  - association of public data to the security (e.g. issuer details, documentation)

## Semi-Fungible Token

This allows a token to partition an owners balances into any number of tranches.

Each tranche can be associated with additional metadata that relates to securities in that tranche.

Additional benefits or features can be associated with token ownership within certain tranches - for example a specific tranche could be used to record all balances received during primary issuance (e.g. during ICO / STO) and transfers from these tranches could have additional restrictions or benefits.

In the context of securities, this metadata can be used to record additional data about groups of securities that can then be used for transfer restrictions, reporting, access restriction and other lifecycle events.

This is presented as an independent EIP as there are other contexts in which this structure may be useful.

## Signed Irreversible Decisions

This provides a structure for an authorised entity (e.g. the token issuer) to signal that they are revoking a permission and that this revocation is permanent.

For example, an issuer of securities may wish to revoke their ability to mint more tokens, either in general, or of a specific tranche. If this action is also irreversible then it is useful to have the issuer acknowledge specifically that they know this to be the case by sending a signed message attesting to this.

This is modelled by having a collection of named boolean variables we can only be toggled from false to true (not back from true to false) and toggling requires the authorised entity to submit a signature of "This operation is irreversible".

## Restricted Transfers

Transfers of securities can fail for a number of reasons in contrast to utility tokens which generally only require the sender to have a sufficient balance.

These conditions could be related to metadata of the shares being transferred (i.e. whether they are subject to a lock-up period), the identity of the sender and receiver of the securities (i.e. whether they have been through a KYC process and whether they are accredited or an affiliate of the issuer) or for reasons unrelated to the specific transfer but instead set at the security level (i.e. the security enforces a maximum number of investors or a cap on the percentage held by any single investor).

For utility ERC20 / ERC77 tokens the `balanceOf` and `allowance` functions provide a way to check that a transfer is likely to succeed before executing the transfer which can be executed both on and off-chain.

For tokens representing securities we introduce a function `verifyTransfer` which provides a more general purpose way to achieve this when the reasons for failure are more complex and a function of the whole transfer (i.e. includes any data sent with the transfer and the receiver of the securities).

In order to provide a richer result than just true or false, a byte return code is returned. This allows us to give an reason for why the transfer failed, or at least which category of reason the failure was in.

NB - the result of a call to verifyTransfer may change depending on on-chain state (including block numbers or timestamps) and possibly off-chain oracles. If it is called, not as part of a transfer itself, but in a speculative fashion (i.e. not as part of a transfer), it should be considered a view function that does not modify any state.

## Security Information

When a security is issued it may be useful to associate data with it. This could be details of the issuer, legal documentation or the share legend. This data is not associated with individual securities but all securities in this issuance. We do this by allowing external URLs to be associated with document names.

We can optionally associate a hash of the data which can be used to prove the original contents with the external URL.

## Security Token (inc. Restricted Token, Token Transfer Error Codes)

A security token combines the above EIPs
