## Installation

```bash
$ yarn
```

## Running the app

```bash
# run encode-decode example
$ yarn start encode-decode.ts

```

```bash
# run generating payload example
$ yarn start generating-payload.ts

```

## Basic flows (WILL BE UPDATED)

To support dare-services Backend API, Metarrior must generate 3 components, including: `calls`, `nonce`, `signatures`

`signature` is the data signed by Metarrior wallet account.

First, we have metadata schema from token id `1` from contract 721 `0xd3524648ec627fb28216ebd2424ccbecafb6f9c9`

```js
  {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    title: '',
    description: '',
    properties: {
      level: { type: 'string', title: '', description: '', properties: {} },
      star: { type: 'string', title: '', description: '', properties: {} },
      title: { type: 'string', title: '', description: '', properties: {} },
      xyz: {
        type: 'array',
        title: '',
        description: '',
        items: { type: 'number', title: '', description: '', properties: {} },
      },
    },
    required: [],
  }
```

Along with the data

```js
  {
    level: ethers.BigNumber.from(10).toString(),
    star: ethers.BigNumber.from(200).toString(),
    title: 'demo',
    xyz: [1, 2, 3],
  }
```

Next, we encode each key-value from the above data into each bytes32-bytes via

```js
const dataKeys = schemas.map((e: any) => {
  return encodeDataKey(providerKey, e.key);
});

const dataValues = schemas.map((e: any) =>
  encodeDataFromJsonSchema(e, {
    [e.key]: gameValue[e.key],
  }),
);
```

Finally, generating payload and sign it!

```js
const calls = [
  {
    target: predictedMetadataAddr,
    data: templateFixture.interface.encodeFunctionData(
      'setData(bytes32[],bytes[])',
      [dataKeys, dataValues],
    ),
  },
];
```

The nonces are for separating channels in smartcontract, avoiding spam requests

```js
const signatures = await Promise.all(
  nonces.map(async (nonce, idx) =>
    signer._signTypedData(
      {
        name: 'MetadataRelay',
        version: '0.0.1',
        chainId: (await managerFixture.provider.getNetwork()).chainId,
        verifyingContract: managerFixture.address,
      },
      {
        RelayHash: [
          { name: 'nonce', type: 'uint256' },
          { name: 'target', type: 'address' },
          { name: 'data', type: 'bytes' },
        ],
      },
      {
        nonce,
        target: calls[idx].target,
        data: calls[idx].data,
      },
    ),
  ),
);
```

## API Flows

- Step 1: Creating Dare SSO account:

```
https://sso-stg.dareplay.io/login
```

We assume that you already had Dare Account from SSO service, if not, you have to sign up then ask Dare team to approve the account

- Step 2: Asking DNFT team to have API key for dare protocol services

- Step 3: Using API key to call api to get access token

```
curl -X 'POST' \
  'https://protocol-stg.dareplay.io/auth/api-key/${API_KEY}' \
  -H 'accept: */*' \
  -d ''
```

- Step 4: Provide NFT contract address to Dare team to support some events such as `Transfer`
- Step 5: Using access token to import NFTs (these apis are just temporarily, will be considered in near future)

```
curl -X 'POST' \
  'https://protocol-stg.dareplay.io/nfts/import-nfts' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer ${access_token}' \
  -H 'Content-Type: application/json' \
  -d '{
  "tokenAddress": "${nft_contract_address}",
  "tokens": [
    {
      "tokenId": "${token_id}",
      "ownerAddress": "${current_owner_of_token_id}"
    }
  ]
}'
```

- Step 6: Using access token to call api to add schema and webhook url

`schema` is metadata of nft result from game's backend
`webhook` is endpoint of webhook from game server, it should be something like this:

```
curl -X 'POST' \
  '${webhook}' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "key1": value1,
  "key2": value2,
  "eventType": "Some event string"
}'
```

When updating metadata, `eventType` will be `UPDATE_METADATA`

```
curl -X 'POST' \
  'https://protocol-stg.dareplay.io/providers/update-nft-schema' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer ${access_token}' \
  -H 'Content-Type: application/json' \
  -d '{
  "schema": {},
  "tokenAddress": "${nft_contract_address}",
  "webhook": "{webhook_url}"
}'
```

- Step 7: Using access token to call api to get signed payload

`metadata` object is the result from `generating-payload.ts` example
`tokenData` is the result of metadata of nft from game's backend, for ex:

```js
  {
    level: '0x123',
    star: '0x234',
    title: 'demo',
    xyz: [1, 2, 3],
  }
```

```
curl -X 'POST' \
  'https://protocol-stg.dareplay.io/protocols/update-metadata-nft' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer ${access_token}' \
  -H 'Content-Type: application/json' \
  -d '{
  "tokenId": "string",
  "nftContractAddress": "string",
  "metadata": {
    "calls": [
      {}
    ],
    "nonces": [
      "string"
    ],
    "signatures": [
      {}
    ]
  },
  "tokenData": {}
}'
```

- Step 7.5: Calling from web3 client

Keymanager address: `0x4265c3fC37973ee042F3A9849d99B32C71964CBC`

Calling function via

```
{
    "inputs": [
      {
        "internalType": "bytes",
        "name": "rootSignature",
        "type": "bytes"
      },
      {
        "internalType": "bytes[]",
        "name": "signatures",
        "type": "bytes[]"
      },
      {
        "internalType": "uint256[]",
        "name": "nonces",
        "type": "uint256[]"
      },
      {
        "components": [
          {
            "internalType": "address",
            "name": "target",
            "type": "address"
          },
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          }
        ],
        "internalType": "struct IAggregatable.Call[]",
        "name": "calls",
        "type": "tuple[]"
      }
    ],
    "name": "aggregateRelayCall",
    "stateMutability": "nonpayable",
    "type": "function"
  }
```

- Step 8: Using api to get nft token detail with metadata

```
curl -X 'GET' \
  'https://protocol-stg.dareplay.io/nfts/${nft_contract_address}/id/${token_id}' \
  -H 'accept: */*'
```
