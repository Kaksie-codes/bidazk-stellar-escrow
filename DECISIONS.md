# Design decisions

Why the code is shaped the way it is. Each entry says what we chose, what we
rejected, and the reason.

---

## 1. Our own Soroban contract, not an escrow-as-a-service layer

We evaluated [Trustless Work](https://www.trustlesswork.com/), the escrow
layer many Stellar teams build on, by reading its single-release contract
([Trustless-Work-Smart-Escrow](https://github.com/Trustless-Work/Trustless-Work-Smart-Escrow),
branch `single-release-develop`). It is a good product: audited, already on
mainnet, with a REST API, a React SDK, milestones, and an on-chain platform fee.
For a freelance or grant flow we would use it.

A goods marketplace needed three things it does not do today:

**Deadlines that settle the deal on their own.** The contract has no time
logic: release needs the approver to approve and the release signer to sign,
and the only other exit is a dispute. In a marketplace the two common failures
are a shop that never delivers and a buyer who receives the item and goes
quiet. Without deadlines both become disputes, and every one of them needs a
person at the platform to unstick it. Our contract settles both with the
ledger clock: after the delivery deadline anyone can refund the buyer, and
after the inspection window anyone can pay the shop.

**A referee who can only split between the two parties.** Its
`resolve_dispute` takes a free `Map<Address, i128>` of distributions, so the
dispute resolver can route a disputed balance to any address. Ours takes one
number, the buyer's share, and pays the remainder to the shop. Even a stolen
referee key cannot pay itself.

**A demo that a room full of people can use at once.** Each Trustless Work
escrow deploys its own contract and is driven through one API key, rate
limited to 50 requests a minute, and expects a trustline asset such as USDC.
In the hall that means a contract deployment per purchase, a USDC trustline
and faucet step per visitor, and every visitor sharing one rate limit. Ours is
one contract, any Stellar asset, and visitors talk to the network directly.

What we gave up by not using it: an audit, multi-milestone payouts, and its
platform-fee split. The first matters most and is listed under known gaps.
The deadline and two-party referee rules are small, well-tested additions
that would fit naturally into Trustless Work itself.

---

## 2. One contract holds many deals

**Chosen:** a single contract with deals keyed by an incrementing id.
**Rejected:** deploying a contract per deal.

One contract means one address to audit and watch, no deployment cost or delay
per purchase, and one place to list a user's deals. The cost is that every
deal shares the contract, so isolation comes from the code: each deal is its
own storage entry, every function loads exactly one deal by id, and no
function ever iterates over deals to move money.

## 3. Identity comes from the stored deal, never from arguments

`confirm(deal_id)` does not take a buyer address. It loads the deal and calls
`deal.buyer.require_auth()`. If the function accepted "who is the buyer" as an
argument, anyone could pass their own address and confirm someone else's
deal. Tests check both directions: the right party's signature is required,
and the wrong party's signature is rejected
(`seller_cannot_confirm_their_own_sale`, `stranger_cannot_cancel_and_refund_buyer`).

## 4. Time-based exits are permissionless

`claim_refund` and `claim_release` need no signature. That is safe because the
destination is fixed by the deal: a stranger calling `claim_refund` can only
send the money back to the buyer. Making them permissionless means a silent
party can never block the other one, and a keeper or the counterparty's own
app can trigger them.

## 5. The buyer cannot cancel; only the shop can

Before the delivery deadline the only refund path is the shop's `cancel` (for
example, out of stock). If the buyer could pull the money while the rider is
on the way, every delivery would be a risk for the shop. The buyer's
protection is the deadline: miss it, and the refund opens.

## 6. Delivery closes the refund path

Once the shop marks the item delivered, `claim_refund` is no longer
available. A buyer who received the item cannot then claim "never arrived"
after the deadline. Their only route is a dispute, inside the inspection
window, judged by the referee. Confirm is final, so a dissatisfied buyer
disputes instead of confirming.

## 7. State is written before money moves

Every payout sets the terminal state and saves the deal before calling the
token. Combined with "terminal states reject every action", a deal cannot pay
out twice even if a call is replayed. Stellar Asset Contract transfers do not
call back into us, but the ordering is kept as a habit that holds for any
token. Test: `terminal_states_reject_every_action`.

## 8. The token and the referee are fixed in the constructor

Neither can be passed per deal. A per-deal token would let a caller point the
contract at a malicious token contract; a per-deal referee would let a party
appoint themselves. The referee also cannot be the buyer or the shop on any
deal (`ArbiterIsParty`).

## 9. Bounded windows, with demo-friendly minimums

Delivery windows run from 1 minute to 30 days, inspection windows from 1
minute to 14 days. The 1-minute minimum exists so the time-based paths can be
watched live in a demo; production would raise the inspection minimum to at
least a day.

## 10. Storage time-to-live is extended on every write

Soroban archives storage entries whose time-to-live runs out. A long delivery
plus inspection window could outlive the default and leave a deal archived
mid-flight. Every deal write extends its TTL to about 60 days, and instance
reads extend the contract's own.

## 11. The contract is not upgradeable

There is no admin and no upgrade function. Whoever deployed it cannot change
the rules later or reach the money. The trade-off is that fixing a bug means
deploying a new contract and moving new deals to it; existing deals finish
under the rules they were created with.

## 12. The item is an opaque number on-chain

`create` stores a `u32` item id the contract never interprets. Without it the
shop's phone could not know what the buyer ordered, because each phone only
has its own local storage. Storing a number rather than a name or price keeps
the contract free of catalog logic and cheap to store.

## 13. One read for a page of deals

`get_deals(start, limit)` returns up to 50 deals in one call. Without it the
web app would make one RPC call per deal every few seconds.

---

## Web app

### 14. Pages depend on an interface, not on Stellar

Every page calls `EscrowService` (`web/lib/escrow/types.ts`). Only
`web/lib/escrow/stellar.ts` knows about the Stellar SDK, XDR or stroops.
Moving settlement to another backend, or adding a wallet-extension signer,
means writing another implementation of that interface; no page changes.

### 15. No backend

The contract is the source of truth, and the browser reads it through Stellar
RPC simulation and writes signed transactions to it. So the site is a static
export on Cloudflare: nothing to run, nothing to keep in sync.

### 16. Throwaway wallets, no extension

People trying the demo in a room will not install a wallet extension. Each
browser generates a buyer and a shop keypair, funds them from the testnet
faucet, and keeps them in local storage. This is only acceptable because the
coins are worthless; production uses the user's own wallet and never stores a
secret in the page. The demo referee's testnet key is in the bundle on purpose
so visitors can play the referee; it controls a separate demo contract
instance and nothing else.

### 17. Rule violations are explained, not just failed

The contract rejects a broken rule during simulation, before anything is
signed. The adapter reads the error code and shows the rule ("The delivery
deadline has not passed yet"), so "Try to cheat" demonstrates the contract
rather than a generic failure.

### 18. The timeline only shows what the ledger shows

A step is marked done only from on-chain fields: delivery from
`delivered_at`, settlement from a terminal status. The step being waited on
is shown as waiting, never as done, and steps that never happened (a refund
without delivery) are shown as skipped.

### 19. Buttons wait for the ledger clock

Ledger time trails the wall clock by a few seconds. Countdowns show the real
deadline, but deadline-gated buttons unlock six seconds later, so the page
never offers an action the contract would still refuse.

### 20. Naira on screen, test XLM underneath

Prices are naira. Testnet cannot hold naira, so the demo locks test XLM at a
labelled demo rate. The contract's token is a constructor argument, so
production uses a naira token such as NGNC with no code change.

---

## Known gaps

- **No audit.** Before real money, the contract needs an external review.
- **Delivery proof.** The contract cannot see an item change hands. Today the
  inspection window and disputes cover that; a handover PIN (hash stored at
  creation, code revealed at delivery) is the next step.
- **Referee liveness.** A referee who never resolves leaves a dispute frozen.
  A dispute timeout that defaults to a refund would remove that.
- **Demo keys.** Browser-generated keys and a public referee key are testnet
  conveniences only.
