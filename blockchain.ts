import { ethers, Wallet } from 'ethers';

import ManagerFixtureABI from './abis/manager-fixture.abi.json';
import MetadataFactoryABI from './abis//metadata-factory.abi.json';
import MetadataTemplateABI from './abis/metadata-template.abi.json';
import MetadataFactoryHelperABI from './abis/metadata-factory-helper.json';

interface Map {
  [key: string]: string | undefined;
}
export const RPC_URLS = () => {
  return {
    97: 'https://data-seed-prebsc-1-s1.binance.org:8545',
  } as Map;
};

export const getProvider = (chainId: number) => {
  return new ethers.providers.JsonRpcProvider(RPC_URLS()[chainId]);
};

// Need to complete here
const MAIN_PRIVATE_KEY = '';

export const getSigner = (chainId: number) => {
  const signer = new Wallet(`0x${MAIN_PRIVATE_KEY}`, getProvider(chainId));

  return signer;
};

export const getInfos = () => {
  const chainId = 97;
  const managerFixtureAddr = '0x4265c3fC37973ee042F3A9849d99B32C71964CBC';
  const templateFixtureAddr = '0x2e031Cc5a1E684C9Cd1B8c6A5c34c2B698F0D2F6';
  const factoryFixtureAddr = '0xBEe93f0411dcCF50047E44698486DA43d94174Be';
  const helperAddr = '0xc93C78d31A6C4D76590346634CDc63e61E92be4b';

  const signer = getSigner(chainId);

  const managerFixture = new ethers.Contract(
    managerFixtureAddr,
    ManagerFixtureABI,
    signer,
  );

  const factoryFixture = new ethers.Contract(
    factoryFixtureAddr,
    MetadataFactoryABI,
    signer,
  );

  const templateFixture = new ethers.Contract(
    templateFixtureAddr,
    MetadataTemplateABI,
    signer,
  );

  const helper = new ethers.Contract(
    helperAddr,
    MetadataFactoryHelperABI,
    signer,
  );

  return {
    signer,
    managerFixture,
    templateFixture,
    factoryFixture,
    helper,
  };
};
