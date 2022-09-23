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
