# Security Token Standard

## Objective

Increase Security Token adoption by creating a standard which provides specifications for how a compliant token can be interfaced with and behaves on-chain.

This specification will increase adoption by allowing standardization and therefore lower cost of off-chain processes needed to fulfill compliance requirements.

These off-chain processes are required because the current state of blockchain technology cannot provide guarantees that all the actions of a security token issuer are compliant. This standard therefore is limited to providing the possibility for on-chain enforcement of certain investor actions.

This standard is meant to be a foundational block upon which additional standards will be established. As such, it was designed to be generalizable across jurisdictions and asset classes.

## Introduction

Moving the issuance, trading and lifecycle events of a security onto a public ledger requires having a standard way of modeling securities, their ownership and their properties on-chain.

A security token requires the following features:

- Ability to associate metadata with specific securities which are otherwise fungible
- Flexibility in permissions and control
- Ability to moderate transfers of securities using either an on-chain codified rule set or off-chain approvals
- Association of public data to the security (e.g. issuer details, legal documentation)

## Requirements

The following requirements have been compiled following discussions with parties across the Security Token ecosystem.
- MUST have a standard interface to query if a transfer would be successful and return a reason for failure.
- MUST be able to perform forced transfer for legal action or fund recovery.
- MUST emit standard events for issuance and redemption.
- MUST be able to attach metadata to a subset of a token holder's balance such as special shareholder rights or data for transfer restrictions.
- MUST be able to modify metadata at time of transfer based on off-chain data, on-chain data and the parameters of the transfer.
- MAY require signed data to be passed into a transfer transaction in order to validate it on-chain.
- SHOULD NOT restrict the range of asset classes across jurisdictions which can be represented.
- SHOULD be ERC20 and ERC777 compatible.

## Partially-Fungible Token

This allows a token to partition an owners balances into any number of tranches.

Each tranche can be associated with additional metadata that relates to securities in that tranche.

Additional benefits or features can be associated with token ownership within certain tranches - for example a specific tranche could be used to record all balances received during primary issuance (e.g. during ICO / STO) and transfers from these tranches could have additional restrictions or benefits.

In the context of securities, this metadata can be used to record additional data about groups of securities that can then be used for transfer restrictions, reporting, access restriction and other lifecycle events.

This is presented as an independent EIP as there are other contexts in which this structure may be useful.

## Signed Irreversible Decisions

This provides a structure for an authorised entity (e.g. the token issuer) to signal that they are revoking a permission and that this revocation is permanent.

For example, an issuer of securities may wish to revoke their ability to mint more tokens, either in general, or of a specific tranche. If this action is also irreversible then it is useful to have the issuer acknowledge specifically that they know this to be the case by sending a signed message attesting to this.

The security token standard enforces this approach for issuers indicating that no additional securities can be minted.

## Restricted Transfers

Transfers of securities can fail for a number of reasons in contrast to utility tokens which generally only require the sender to have a sufficient balance.

These conditions could be related to metadata of the shares being transferred (i.e. whether they are subject to a lock-up period), the identity and eligibility of the sender and receiver of the securities (i.e. whether they have been through a KYC process and whether they are accredited or an affiliate of the issuer) or for reasons unrelated to the specific transfer but instead set at the security level (i.e. the security enforces a maximum number of investors or a cap on the percentage held by any single investor).

For utility tokens (ERC20 / ERC777) the `balanceOf` and `allowance` functions provide a way to check that a transfer is likely to succeed before executing the transfer which can be executed both on and off-chain.

For tokens representing securities we introduce a function `checkSecurityTokenSend` which provides a more general purpose way to achieve this when the reasons for failure are more complex and a function of the whole transfer (i.e. includes any data sent with the transfer and the receiver of the securities).

In order to provide a richer result than just true or false, a byte return code is returned. This provides additional information for why the transfer failed, or at least which category of reason the failure was in.

NB - the result of a call to `checkSecurityTokenSend` may change depending on on-chain state (including block numbers or timestamps) and possibly off-chain oracles. If it is called, not as part of a transfer itself, but in a speculative fashion (i.e. not as part of a transfer), it should be considered a view function that does not modify any state.

## Identity

Whether an individual is able to receive and send securities will likely depend on the characteristics of the individuals identity. For example most jurisdictions require some level of KYC / AML process before an individual is eligible to purchase or sell a particular security. Additionally, an individual may be categorised as an accredited or non-accredited investor, and their citizenship may also inform the restrictions associated with their securities.

There are various identity standards (ERC725, Civic, uPort) which can be used to capture this data as well as simpler approaches which are centrally managed (e.g. maintaining a whitelist of KYC'ed addresses). These standards have in common to key off an Ethereum address (which could be an individuals wallet, or an identity contract), and as such the `checkSecurityTokenSend` function can use the address of both the sender and receiver of the security as a proxy for identity in deciding if eligibility requirements are met.

Beyond this, the standard does not mandate any particular approach to identity.

## Security Information

When a security is issued it may be useful or required to associate documents with it. This could be details of the issuer, legal documentation or the share legend. This data is not associated with individual securities but all securities in this issuance. We do this by allowing external URIs to be associated with document names.

We can optionally associate a hash of the data which can be used to demonstrate knowledge of the original document contents with the external URL.
