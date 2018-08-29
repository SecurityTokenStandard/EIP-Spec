# Security Token Standard

## Objective

Increase Security Token adoption by creating a standard which provides specifications for how a compliant Token can be interfaced with and behaves on-chain.

This specification will increase adoption by allowing standardization and therefore lower cost of off-chain processes needed to fulfill compliance requirements.

These off-chain processes are required because the current state of blockchain technology cannot provide guarantees that all the actions of a security issuer are compliant. This standard therefore is limited to providing the possibility for on-chain enforcement of certain investor actions.

This standard is meant to be a foundational block upon which additional standards will be established. As such, it was designed to be generalizable across jurisdictions and asset classes.

## Requirements

The following requirements have been compiled following discussions with parties across the Security Token ecosystem.
- MUST have a standard interface to query if a transfer would be successful.
- MUST be able to perform forced transfer for legal action or fund recovery.
- MUST emit standard events for minting and burning.
- MUST be able to query a document which outlines share restrictions for disclosure purposes.
- MUST be able to modify document which describes share restrictions based on token holder investor profile (including but not limited to jurisdiction or accreditation status).
- MAY be able to programmatically modify document which describes share restrictions based on on-chain rule engine.
- MAY require all transfers to be signed by approved parties off-chain.
- SHOULD NOT restrict the range of asset classes across jurisdictions which can be represented.
- SHOULD be ERC20 and MUST be ERC777 compatible.

## Introduction

Moving the issuance, trading and lifecycle events of a security onto a public ledger requires having a standard way of modeling securities, their ownership and their properties on-chain.

A security token requires the following features:

  - ability to associate metadata with specific securities which are otherwise fungible

  - flexibility in permissioning and control

  - ability to moderate transfers of securities using either an on-chain codified rule set or off-chain approvals

  - association of public data to the security (e.g. issuer details, legal documentation)

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

These conditions could be related to metadata of the shares being transferred (i.e. whether they are subject to a lock-up period), the identity of the sender and receiver of the securities (i.e. whether they have been through a KYC process and whether they are accredited or an affiliate of the issuer) or for reasons unrelated to the specific transfer but instead set at the security level (i.e. the security enforces a maximum number of investors or a cap on the percentage held by any single investor).

For utility tokens (ERC20 / ERC777) the `balanceOf` and `allowance` functions provide a way to check that a transfer is likely to succeed before executing the transfer which can be executed both on and off-chain.

For tokens representing securities we introduce a function `checkSecurityTokenSend` which provides a more general purpose way to achieve this when the reasons for failure are more complex and a function of the whole transfer (i.e. includes any data sent with the transfer and the receiver of the securities).

In order to provide a richer result than just true or false, a byte return code is returned. This allows us to give an reason for why the transfer failed, or at least which category of reason the failure was in.

NB - the result of a call to `checkSecurityTokenSend` may change depending on on-chain state (including block numbers or timestamps) and possibly off-chain oracles. If it is called, not as part of a transfer itself, but in a speculative fashion (i.e. not as part of a transfer), it should be considered a view function that does not modify any state.

## Identity

Whether an individual is able to receive and send securities will likely depend on the characteristics of the individuals identity. For example most jurisdictions require some level of KYC / AML process before an individual is able to purchase a particular security. An individual may also be categorised into an accredited or non-accredited investor category, and their citizenship may also impact on restrictions associated with their securities.

There are various identity standards (ERC725, Civic, uPort) that can be used to capture this data as well as simpler approaches which are centrally managed (e.g. maintaining a whitelist of KYC'ed addresses). These standards all have in common that they key off an Ethereum address (which could be an individuals wallet, or an identity contract), and as such the `checkSecurityTokenSend` function takes the address of both the sender and receiver of the security so that these can be used as inputs to the decision.

Beyond this, the standard does not mandate any particular approach to identity.

## Security Information

When a security is issued it may be useful to associate documents with it. This could be details of the issuer, legal documentation or the share legend. This data is not associated with individual securities but all securities in this issuance. We do this by allowing external URIs to be associated with document names.

We can optionally associate a hash of the data which can be used to demonstrate knowledge of the original document contents with the external URL.
