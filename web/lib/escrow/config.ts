/* Testnet deployment of the escrow contract in ../../../contract.

   EVERYTHING HERE IS TESTNET. Testnet coins have no value and the network is
   periodically reset, so a reset means redeploying and updating these ids. */

export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const FRIENDBOT_URL = "https://friendbot.stellar.org";
export const EXPLORER_URL = "https://stellar.expert/explorer/testnet";

/* The web demo's own contract instance. The CLI demo uses a separate
   instance with a private arbiter key. */
export const ESCROW_CONTRACT_ID =
  "CCTJT2ETAK42HFZDCGJTSMEGX3D2OOX2XAAHLWUQAOPHHMCP5ANAGY2X";

/* Native XLM's Stellar Asset Contract. Production settles in USDC. */
export const TOKEN_CONTRACT_ID =
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
export const TOKEN_SYMBOL = "XLM";
export const TOKEN_DECIMALS = 7;

/* The one shop every demo purchase goes to. Only its public address ships;
   the presenter's browser imports the secret once through a private link
   (see demo-wallets.ts), so nobody else can act as the shop. */
export const STELLAR_SHOP_ADDRESS =
  "GDOLSJVRTSXBSX2RLTAVRQAVJ6TESZ5HSQEPIKHG72O3UF6BB4AHV5R2";

/* PUBLIC ON PURPOSE. This testnet key is the arbiter of the demo contract
   above and nothing else, so visitors can play the referee role. Anyone can
   read it from the bundle; the worst they can do is settle demo disputes
   with worthless coins. Production's arbiter is a Bidazk-held key and never
   ships to a browser. */
export const DEMO_ARBITER_SECRET = "SB777HV2MJ42LUBHKIIES6YBVULQZ4AW25GNMITUQ5CQSW4RZPZEUQWD";
