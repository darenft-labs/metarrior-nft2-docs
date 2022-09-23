import { BigNumber, ethers, utils } from 'ethers';
import { FormatTypes, ParamType, Result } from 'ethers/lib/utils';
import { getInfos } from './blockchain';

import {
  separateJsonSchema,
  convertJsonSchemaToParamType,
  encodeDataFromJsonSchema,
  getPredictedMetadataAddress,
  encodeDataKey,
} from './utils';

const main = async () => {
  const { signer, managerFixture, templateFixture, factoryFixture, helper } =
    getInfos();
  const nftAddr = '0xd3524648ec627fb28216ebd2424ccbecafb6f9c9';
  const tokenId = '1';
  const providerKey = signer.address;
  const gameValue = {
    level: ethers.BigNumber.from(10).toString(),
    star: ethers.BigNumber.from(200).toString(),
    title: 'demo',
    xyz: [1, 2, 3],
  } as any;

  const schema = {
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
  };

  const schemas = separateJsonSchema(schema) as any;

  const predictedMetadataAddr = await getPredictedMetadataAddress(
    nftAddr,
    tokenId,
    helper,
    templateFixture,
    factoryFixture,
  );

  const dataKeys = schemas.map((e: any) => {
    return encodeDataKey(providerKey, e.key);
  });

  const dataValues = schemas.map((e: any) =>
    encodeDataFromJsonSchema(e, {
      [e.key]: gameValue[e.key],
    }),
  );

  console.log('predictedMetadataAddr', predictedMetadataAddr);
  console.log('dataKeys', dataKeys);
  console.log('dataValues', dataValues);

  const calls = [
    {
      target: predictedMetadataAddr,
      data: templateFixture.interface.encodeFunctionData(
        'setData(bytes32[],bytes[])',
        [dataKeys, dataValues],
      ),
    },
  ];

  const METADATA_UPDATE_CHANNEL = 3;

  const nonces = await Promise.all(
    calls.map(async (c) =>
      (
        (await managerFixture.getNonce(
          signer.address,
          METADATA_UPDATE_CHANNEL,
        )) as BigNumber
      ).toString(),
    ),
  );

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

  console.log(calls, '\n');
  console.log(nonces, '\n');
  console.log(signatures, '\n');
};

main();
