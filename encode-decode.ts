import { ethers, utils } from 'ethers';
import { FormatTypes, ParamType, Result } from 'ethers/lib/utils';

import {
  separateJsonSchema,
  convertJsonSchemaToParamType,
  encodeDataFromJsonSchema,
} from './utils';

const main = () => {
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
  const dataValues = schemas.map((e: any) =>
    encodeDataFromJsonSchema(e, {
      [e.key]: gameValue[e.key],
    }),
  );

  console.log(JSON.stringify(schemas[3]), '\n');
  console.log(dataValues[3], '\n');

  const decodeDataFromString = (jsonSchema: any, data: string) => {
    const components = convertJsonSchemaToParamType(jsonSchema.properties);

    const DATA_STRUCT = ParamType.fromObject({
      components: components,
      name: 'calls',
      type: 'tuple',
    });

    const formated = DATA_STRUCT.format(FormatTypes.full);
    console.log(formated, '\n');

    const TYPE_HASH = utils.keccak256(utils.toUtf8Bytes(formated));

    const abi = ethers.utils.defaultAbiCoder;

    const DATA_VALUE = abi.decode(['bytes32', DATA_STRUCT], data);

    return DATA_VALUE;
  };

  const fourthSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    title: '',
    description: '',
    properties: {
      xyz: {
        type: 'array',
        title: '',
        description: '',
        items: { type: 'number', title: '', description: '', properties: {} },
      },
    },
    required: [],
    key: 'xyz',
  };

  // abi: tuple(uint256[] xyz) calls

  const fourthVal =
    '0xe8f62ca397142a8ee931b3c96be26fd0c037b6ce19cc2b12433f99fe0b649251000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000003';

  const decodedValue = decodeDataFromString(fourthSchema, fourthVal);

  console.log(decodedValue, '\n');

  console.log(`decodedValue['calls']['xyz']\n`, decodedValue['calls']['xyz']);

  const decodedValueObj = [
    '0xe8f62ca397142a8ee931b3c96be26fd0c037b6ce19cc2b12433f99fe0b649251',
    [
      [
        { type: 'BigNumber', hex: '0x01' },
        { type: 'BigNumber', hex: '0x02' },
        { type: 'BigNumber', hex: '0x03' },
      ],
    ],
  ];
};

main();
