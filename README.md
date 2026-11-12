# Bidazk: escrow for a reverse marketplace, on Stellar

**Buyers ask. Shops bid. Escrow holds the money.**

Bidazk is a reverse marketplace for physical goods: a buyer posts what they
want, nearby shops bid to supply it, and the buyer's payment waits in a
Soroban smart contract until the item arrives. This repository holds the
escrow contract and the web app that drives it.

| | |
|---|---|
| Live site | <https://bidazk.xyz> |
| Live demo (two phones, real testnet transactions) | <https://bidazk.xyz/demo> |
| How the escrow rules work | <https://bidazk.xyz/how-it-works> |
| Pitch | <https://bidazk.xyz/pitch> |
| Contract on Stellar testnet | [`CCTJT2…AGY2X`](https://stellar.expert/explorer/testnet/contract/CCTJT2ETAK42HFZDCGJTSMEGX3D2OOX2XAAHLWUQAOPHHMCP5ANAGY2X) |

## The problem in one paragraph

Online trade in Nigeria runs on trust nobody has. Buyers fear paying first and
receiving the wrong item or nothing. Shops fear delivering first and never
being paid. An escrow solves that only if the escrow itself cannot be bent: by
the buyer, by the shop, or by the platform running it. So the escrow is a
contract with public rules, not a company bank account.

## Repository layout

```
contract/   Soroban escrow contract (Rust), 34 tests, design notes
web/        Next.js site: landing, how-it-works, pitch, and the live demo
DECISIONS.md  Why the code is built the way it is, including why we did
              not use an escrow-as-a-service layer
```

Start with [`contract/DESIGN.md`](contract/DESIGN.md) for the rules and
[`DECISIONS.md`](DECISIONS.md) for the reasoning.

## The contract

One deployed contract holds many deals. Each deal moves through a small state
machine; every transition checks who signed, what state the deal is in, and
what the ledger clock says.

```
create (buyer) ──▶ FUNDED ──mark_delivered (shop, before deadline)──▶ DELIVERED
                     │                                                    │
                     ├─ cancel (shop) ─────────────▶ CANCELLED (refund)  ├─ confirm (buyer) ─────────▶ RELEASED
                     ├─ deadline passed (anyone) ──▶ REFUNDED            ├─ window ends (anyone) ────▶ RELEASED
                     └─ confirm (buyer) ───────────▶ RELEASED            └─ dispute (buyer) ──▶ DISPUTED
                                                                                                  │
                                                                         resolve (referee) ──▶ RESOLVED
```

Guarantees, each covered by tests:

- Money only ever leaves to that deal's buyer or that deal's shop.
- A deal pays out at most once; settled deals reject every action.
- Money is never stuck: a silent shop is beaten by the delivery deadline, a
  silent buyer by the inspection window.
- Only the stored buyer can confirm or dispute; only the stored shop can mark
  delivery or cancel. Identity comes from the deal, never from arguments.
- The referee can only touch disputed deals, and only split them between those
  two parties.

### Run it

Requires Rust, the `wasm32v1-none` target and the
[Stellar CLI](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup).

```sh
cd contract
cargo test                 # 34 tests
stellar contract build     # → target/wasm32v1-none/release/bidazk_escrow.wasm
```

Deploy and CLI walkthrough: [`contract/README.md`](contract/README.md).

## The web app

Next.js (App Router), exported as a static site. There is no backend: the
contract is the backend, and the browser talks to it through Stellar RPC.

```sh
cd web
pnpm install
pnpm dev                   # http://localhost:3000/demo
```

Where things live:

| Path | What |
|---|---|
| `web/lib/escrow/types.ts` | The `EscrowService` interface every page uses |
| `web/lib/escrow/stellar.ts` | The Stellar implementation of it |
| `web/lib/escrow/demo-wallets.ts` | Throwaway testnet wallets for the demo |
| `web/lib/escrow/config.ts` | Network, contract id, token |
| `web/app/demo/` | The two-phone demo |
| `web/app/how-it-works/`, `web/app/pitch/` | Explainer pages |

## Try the demo with two phones

1. Phone A opens <https://bidazk.xyz/demo>, taps **Create test wallets**, then
   **I'm selling**. A QR code appears.
2. Phone B scans it, taps **Create test wallets**, opens a product and taps
   **Accept bid & pay**. The money moves into the contract.
3. Phone A sees the order arrive, marks it delivered.
4. Phone B confirms (shop is paid) or disputes (the referee splits it).
5. Under **Try to cheat**, each side can attempt to break a rule. The contract
   refuses, and the page says which rule stopped it.

Every action links to its transaction on stellar.expert.

## Naira

Prices are shown in naira. Testnet cannot hold naira, so the demo locks free
test XLM at a fixed demo rate (₦1,000 = 1 test XLM, not a market price). The
contract takes its token as a constructor argument, so production points the
same code at a naira token. NGNC, a naira-pegged anchor asset, is already on
Stellar mainnet:
[ledger](https://stellar.expert/explorer/public/asset/NGNC-GASBV6W7GGED66MXEVC7YZHTWWYMSVYEY35USF2HJZBLABLYIFQGXZY6),
[issuer config](https://ngnc.online/.well-known/stellar.toml).

## Status

Testnet only. The contract has not been audited. The demo uses throwaway keys
generated in the browser; see [`DECISIONS.md`](DECISIONS.md) for what changes
before real money.
